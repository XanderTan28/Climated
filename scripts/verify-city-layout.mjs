// Local visual regression smoke check. API fixtures are intercepted only in this browser.
// Requires Node 22+ and Microsoft Edge. No browser-testing dependency or city data bundle.
import { spawn } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const output = await mkdtemp(join(tmpdir(), 'climated-visual-'))
const port = 9427
const browser = spawn('C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${join(output, 'browser')}`, 'about:blank',
], { windowsHide: true, stdio: 'ignore' })
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let socket
try {
  let version
  for (let i = 0; i < 50; i++) {
    try { version = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break } catch { await pause(100) }
  }
  if (!version) throw new Error('Headless browser did not start')
  socket = new WebSocket(version.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  let sequence = 0
  const pending = new Map()
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)) }, 15000)
    pending.set(id, { resolve, reject, timer })
    socket.send(JSON.stringify({ id, method, params, sessionId }))
  })
  let cityName = 'Amsterdam', form = 'dense'
  const consoleErrors = []
  socket.onmessage = async ({ data }) => {
    const message = JSON.parse(data)
    if (message.id) {
      const entry = pending.get(message.id)
      if (entry) { clearTimeout(entry.timer); pending.delete(message.id); message.error ? entry.reject(message.error) : entry.resolve(message.result) }
    }
    if (message.method === 'Runtime.exceptionThrown') consoleErrors.push(message.params.exceptionDetails.text)
    if (message.method !== 'Fetch.requestPaused') return
    const url = message.params.request.url
    let payload
    if (url.includes('geocoding-api')) payload = { results: [{ id: 1, name: cityName, country_code: 'EX', country: 'Visual test fixture', latitude: 52, longitude: 4, timezone: 'UTC', feature_code: 'PPL' }] }
    else if (url.includes('archive-api')) {
      const time = Array.from({ length: 12 }, (_, i) => `2024-${String(i + 1).padStart(2,'0')}-15`)
      const temperatures = [4,5,8,12,16,19,21,20,17,13,8,5]
      payload = { hourly: { time: time.map(t => `${t}T12:00`), temperature_2m: temperatures, cloud_cover: time.map(() => 30), wind_speed_10m: time.map(() => 15), relative_humidity_2m: time.map(() => 70) }, daily: { time, sunrise: time.map(t => `${t}T06:00`), sunset: time.map(t => `${t}T22:00`), daylight_duration: time.map(() => 57600), temperature_2m_min: temperatures.map(t => t-4), temperature_2m_max: temperatures.map(t => t+4), precipitation_sum: time.map(() => 0) } }
    } else {
      const count = { dense: 500, high: 120, suburban: 80, mid: 180, unknown: 5 }[form]
      payload = { elements: Array.from({ length: count }, () => ({ tags: { building: form === 'suburban' ? 'detached' : 'apartments', 'building:levels': String({ dense: 3, high: 20, suburban: 2, mid: 6, unknown: 3 }[form]) } })) }
    }
    await send('Fetch.fulfillRequest', { requestId: message.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: '*' }], body: Buffer.from(JSON.stringify(payload)).toString('base64') }, message.sessionId)
  }
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true })
  const call = (method, params) => send(method, params, sessionId)
  const evaluate = async (expression) => {
    const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })
    if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
    return result.result.value
  }
  await call('Runtime.enable')
  await call('Page.enable')
  await call('Fetch.enable', { patterns: [{ urlPattern: '*geocoding-api.open-meteo.com*' }, { urlPattern: '*archive-api.open-meteo.com*' }, { urlPattern: '*overpass*' }] })
  const waitFor = async (expression) => {
    for (let i=0; i<70; i++) { if (await evaluate(expression)) return; await pause(100) }
    throw new Error(`Condition did not resolve: ${expression}`)
  }
  const capture = async (name) => {
    const { data } = await call('Page.captureScreenshot', { format: 'png' })
    await writeFile(join(output, `${name}.png`), Buffer.from(data, 'base64'))
  }
  const sizes = [[1440,900],[1366,768],[1280,720],[1024,768],[390,844]]
  const results = []
  for (const [width,height] of sizes) {
    await call('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
    await call('Page.navigate', { url: process.env.CLIMATED_PREVIEW_URL || 'http://127.0.0.1:5180/' })
    await waitFor('!!document.querySelector(".city-search-trigger")')
    await evaluate('document.querySelector(".city-search-trigger").click()')
    await waitFor('!!document.querySelector(".city-search-input input")')
    await evaluate(`(() => { const input = document.querySelector('input[aria-label="City name"]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'amsterdam'); input.dispatchEvent(new Event('input',{bubbles:true})); })()`)
    await waitFor('!!document.querySelector(".city-result")')
    await evaluate('document.querySelector(".city-result").click()')
    await waitFor('!!document.querySelector(".archetype-dense-low-rise")')
    await pause(200)
    const bounds = await evaluate(`(() => {
      const rect = s => { const r = document.querySelector(s).getBoundingClientRect(); return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height} };
      return { random:rect('.random-button'), panel:rect('.control-panel'), footer:rect('.data-sources'), scene:rect('.weather-scene'), month:rect('.month-sparkline'), time:rect('.time-orbit'), monthTrack:rect('.spark-line'), timeTrack:rect('.orbit-haze'), bodyWidth:document.documentElement.scrollWidth, bodyHeight:document.documentElement.scrollHeight };
    })()`)
    if (bounds.random.bottom > bounds.panel.bottom + 1) throw new Error(`Random day clipped at ${width}x${height}`)
    if (bounds.random.bottom > bounds.footer.top + 1) throw new Error(`Footer overlaps Random day at ${width}x${height}: ${JSON.stringify(bounds)}`)
    if (bounds.bodyWidth > width + 1) throw new Error(`Horizontal overflow at ${width}x${height}`)
    if (width > 900 && Math.abs(bounds.footer.bottom - height) > 1) throw new Error(`Footer not at viewport bottom at ${width}x${height}`)
    if (Math.abs(bounds.month.width - bounds.time.width) > 1) throw new Error(`Month and time controls have different widths at ${width}x${height}: ${bounds.month.width} vs ${bounds.time.width}`)
    if (Math.abs(bounds.month.height - bounds.time.height) > 1) throw new Error(`Month and time controls have different heights at ${width}x${height}: ${bounds.month.height} vs ${bounds.time.height}`)
    if (Math.abs(bounds.monthTrack.width - bounds.timeTrack.width) > 1) throw new Error(`Month and time drawings have different widths at ${width}x${height}: ${bounds.monthTrack.width} vs ${bounds.timeTrack.width}`)
    await capture(`dense-${width}x${height}`)
    results.push({ width,height,...bounds })
  }
  await call('Emulation.setDeviceMetricsOverride', { width:1440,height:900,deviceScaleFactor:1,mobile:false })
  for (const [nextForm, name, selector] of [['high','New York','high-rise-core'],['suburban','Garden City','suburban'],['mid','Washington D.C.','mid-rise-urban'],['unknown','Unknown sample','unclassified']]) {
    form = nextForm; cityName = name
    await evaluate('document.querySelector(".city-search-trigger").click()')
    await waitFor('!!document.querySelector(".city-result")')
    await pause(600)
    await evaluate('document.querySelector(".city-result").click()')
    await waitFor(`!!document.querySelector('.archetype-${selector}')`)
    await capture(nextForm)
    if (nextForm === 'high') {
      for (const [width, height] of [[1280,720],[1024,768],[390,844]]) {
        await call('Emulation.setDeviceMetricsOverride', { width,height,deviceScaleFactor:1,mobile:false })
        const separation = await evaluate(`document.querySelector('.city-buildings').getBoundingClientRect().top - document.querySelector('.scene-reading').getBoundingClientRect().bottom`)
        if (separation < 0) throw new Error(`City overlaps temperature at ${width}x${height}: ${separation}`)
        await capture(`high-${width}x${height}`)
      }
      await call('Emulation.setDeviceMetricsOverride', { width:1440,height:900,deviceScaleFactor:1,mobile:false })
      await evaluate(`(() => { const input = document.querySelector('#hour'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'23'); input.dispatchEvent(new Event('input',{bubbles:true})); })()`)
      await waitFor('!!document.querySelector(".light-night")')
      await capture('high-night')
      await evaluate('document.querySelector(".random-button").click()')
      await evaluate(`document.querySelector('button[aria-label="Walking"]').click()`)
      await waitFor(`document.querySelector('.scene-moment').textContent.includes('Walking')`)
    }
  }
  if (consoleErrors.length) throw new Error(consoleErrors.join('; '))
  console.log(JSON.stringify({ output, results, consoleErrors }, null, 2))
  await send('Browser.close')
} finally {
  socket?.close()
  browser.kill()
}
