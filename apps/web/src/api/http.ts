export async function fetchWithTimeout(url: string, signal?: AbortSignal, timeoutMs = 15000, init: RequestInit = {}) {
  const controller = new AbortController()
  const forwardAbort = () => controller.abort(signal?.reason)
  signal?.addEventListener('abort', forwardAbort, { once: true })
  const timer = window.setTimeout(() => controller.abort(new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds`)), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } catch (error) {
    if (controller.signal.aborted && !signal?.aborted) throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds`)
    throw error
  } finally {
    window.clearTimeout(timer)
    signal?.removeEventListener('abort', forwardAbort)
  }
}
