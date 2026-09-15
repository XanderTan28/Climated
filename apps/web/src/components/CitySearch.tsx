import { useEffect, useState } from 'react'
import { searchCities } from '../api/cities'
import type { CitySearchResult } from '../types/climate'

interface CitySearchProps { open: boolean; onClose: () => void; onSelect: (city: CitySearchResult) => void }

export function CitySearch({ open, onClose, onSelect }: CitySearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<CitySearchResult[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  useEffect(() => {
    if (!open || query.trim().length < 2) { setResults([]); setStatus('idle'); return }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setStatus('loading')
      try { setResults(await searchCities(query, controller.signal)); setStatus('ready') }
      catch { if (!controller.signal.aborted) setStatus('error') }
    }, 280)
    return () => { window.clearTimeout(timer); controller.abort() }
  }, [open, query])

  if (!open) return null
  return (
    <div className="city-search-layer" role="dialog" aria-modal="true" aria-label="Search for a city" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <div className="city-search-card">
        <div className="city-search-input">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>
          <input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Escape') onClose() }} placeholder="Search a city — Amsterdam, New York…" aria-label="City name" />
          <button onClick={onClose} aria-label="Close city search">Esc</button>
        </div>
        <div className="city-search-results" aria-live="polite">
          {status === 'idle' && <p className="search-hint">Type at least two letters. Results come directly from the city API.</p>}
          {status === 'loading' && <p className="search-hint">Searching cities…</p>}
          {status === 'error' && <p className="search-error">City search is temporarily unavailable. Please try again.</p>}
          {status === 'ready' && !results.length && <p className="search-hint">No matching city found.</p>}
          {results.map((city) => <button key={city.id} className="city-result" onClick={() => onSelect(city)}><span><strong>{city.name}, {city.countryCode}</strong><small>{[city.admin1, city.country].filter(Boolean).join(' · ')}</small></span>{city.population && <em>{new Intl.NumberFormat('en', { notation: 'compact' }).format(city.population)} people</em>}</button>)}
        </div>
        <div className="search-source">City lookup by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a></div>
      </div>
    </div>
  )
}
