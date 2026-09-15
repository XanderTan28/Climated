import { useMemo, useRef, useState } from 'react'
import { fetchClimateProfile } from '../api/climateApi'
import { getExperience } from '../api/climateModel'
import { inferClimateFamily, resolveCityVisualProfile } from '../api/cityVisual'
import { activities, dayVariants } from '../api/experience'
import { fetchUrbanMetrics } from '../api/urban'
import { CitySearch } from '../components/CitySearch'
import { ControlPanel } from '../components/ControlPanel'
import { WeatherScene } from '../components/WeatherScene'
import type { ActivityId, CitySearchResult, CityVisualProfile, MonthlyClimate } from '../types/climate'

type LoadStatus = 'empty' | 'loading' | 'ready' | 'error'

export function CityExperiencePage() {
  const [monthIndex, setMonthIndex] = useState(6)
  const [hour, setHour] = useState(19.5)
  const [activity, setActivity] = useState<ActivityId>('cycling')
  const [variantIndex, setVariantIndex] = useState(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [selectedCity, setSelectedCity] = useState<CitySearchResult | null>(null)
  const [climateData, setClimateData] = useState<MonthlyClimate[] | null>(null)
  const [visualProfile, setVisualProfile] = useState<CityVisualProfile | null>(null)
  const [status, setStatus] = useState<LoadStatus>('empty')
  const [notice, setNotice] = useState('')
  const requestRef = useRef(0)

  const climate = climateData?.[monthIndex] ?? null
  const variant = dayVariants[variantIndex]
  const experience = useMemo(() => climate ? getExperience(climate, hour, activity, variant) : null, [climate, hour, activity, variant])
  const activityLabel = activities.find((item) => item.id === activity)?.label ?? activity

  const selectCity = async (city: CitySearchResult) => {
    const requestId = ++requestRef.current
    setSelectedCity(city)
    setSearchOpen(false)
    setStatus('loading')
    setNotice('Reading urban form and five years of climate...')
    setClimateData(null)
    setVisualProfile(null)
    const urbanRequest = fetchUrbanMetrics(city)
      .then((value) => ({ status: 'fulfilled' as const, value }))
      .catch((reason: unknown) => ({ status: 'rejected' as const, reason }))
    let loadedClimate: MonthlyClimate[]
    try {
      loadedClimate = await fetchClimateProfile(city)
    } catch (error) {
      if (requestId !== requestRef.current) return
      setStatus('error')
      const reason = error instanceof Error ? error.message : 'Unknown network error'
      setNotice(`Climate data could not be loaded (${reason}). Search again or retry this city.`)
      return
    }
    if (requestId !== requestRef.current) return
    const climateFamily = inferClimateFamily(loadedClimate)
    setClimateData(loadedClimate)
    setVisualProfile(resolveCityVisualProfile({ city, climateFamily, urbanMetrics: null }))
    setMonthIndex(6)
    setVariantIndex(0)
    setStatus('ready')
    setNotice('Climate ready. Reading urban form in the background...')

    const urbanResult = await urbanRequest
    if (requestId !== requestRef.current) return
    if (urbanResult.status === 'fulfilled') {
      setVisualProfile(resolveCityVisualProfile({ city, climateFamily, urbanMetrics: urbanResult.value }))
      setNotice('')
    } else {
      const reason = urbanResult.reason instanceof Error ? urbanResult.reason.message : 'Unknown network error'
      setNotice(`Urban form is unavailable (${reason}); the background remains intentionally unclassified.`)
    }
  }

  const chooseRandomDay = () => {
    let next = variantIndex
    while (next === variantIndex) next = Math.floor(Math.random() * dayVariants.length)
    setVariantIndex(next)
    setHour([8, 12.5, 17.5, 21][Math.floor(Math.random() * 4)])
  }

  const cityLabel = selectedCity ? `${selectedCity.name}, ${selectedCity.countryCode}` : 'Search any city'
  const ready = status === 'ready' && selectedCity && climateData && climate && experience && visualProfile

  return <main className="dashboard-page" id="top">
    <nav className="top-nav">
      <a className="brand" href="#top" aria-label="Climated home"><span className="brand-mark">C</span><span>climated</span></a>
      <div className="nav-status"><button className="city-search-trigger" onClick={() => setSearchOpen(true)} aria-label="Search city"><span>{cityLabel}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg></button></div>
    </nav>
    <CitySearch open={searchOpen} onClose={() => setSearchOpen(false)} onSelect={selectCity} />
    {ready ? <section className="experience-shell" id="experience">
      <WeatherScene climate={climate} experience={experience} hour={hour} activityLabel={activityLabel} visualProfile={visualProfile} cityName={selectedCity.name} />
      <ControlPanel cityName={selectedCity.name} climateData={climateData} climate={climate} monthIndex={monthIndex} hour={hour} activity={activity} variant={variant} score={experience.score} verdict={experience.verdict} onMonthChange={(index) => { setMonthIndex(index); setVariantIndex(0) }} onHourChange={setHour} onActivityChange={setActivity} onRandomDay={chooseRandomDay} />
    </section> : <section className="city-start-state">
      <div className="start-sky"><div className="start-sun" /><div className="start-horizon" /></div>
      <div className="start-copy"><span className="eyebrow">CITY CLIMATE, MADE TANGIBLE</span><h1>{status === 'loading' ? `Building ${selectedCity?.name}...` : status === 'error' ? 'The data connection paused.' : 'Start with a city.'}</h1><p>{status === 'loading' || status === 'error' ? notice : 'Search a city to generate a data-driven urban background and explore its standardized climate.'}</p>{status !== 'loading' && <button onClick={() => selectedCity && status === 'error' ? selectCity(selectedCity) : setSearchOpen(true)}>{status === 'error' ? 'Try again' : 'Search cities'}<span>→</span></button>}{status === 'loading' && <div className="loading-rule"><i /></div>}</div>
    </section>}
    <footer className="data-sources">
      {ready && notice && <span className="data-notice" role="status" title={notice}>{notice.startsWith('Climate ready') ? 'City scenery is loading…' : 'City scenery is temporarily unavailable.'}</span>}
      <span>Climate: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></span>
      <span>Urban form: <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></span>
    </footer>
  </main>
}
