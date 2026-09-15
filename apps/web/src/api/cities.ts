import type { CitySearchResult } from '../types/climate'
import { fetchWithTimeout } from './http'

interface GeocodingResult {
  id: number
  name: string
  latitude: number
  longitude: number
  elevation?: number
  feature_code?: string
  country_code: string
  country: string
  admin1?: string
  timezone: string
  population?: number
}

interface GeocodingResponse { results?: GeocodingResult[] }

const cityFeature = /^PPL/

export async function searchCities(query: string, signal?: AbortSignal): Promise<CitySearchResult[]> {
  const normalized = query.trim()
  if (normalized.length < 2) return []
  const params = new URLSearchParams({ name: normalized, count: '8', language: 'en', format: 'json' })
  const response = await fetchWithTimeout(`https://geocoding-api.open-meteo.com/v1/search?${params}`, signal, 10000)
  if (!response.ok) throw new Error(`City search failed (${response.status})`)
  const data = await response.json() as GeocodingResponse
  return (data.results ?? [])
    .filter((item) => !item.feature_code || cityFeature.test(item.feature_code))
    .map((item) => ({
      id: item.id,
      name: item.name,
      countryCode: item.country_code,
      country: item.country,
      admin1: item.admin1,
      latitude: item.latitude,
      longitude: item.longitude,
      elevation: item.elevation,
      population: item.population,
      timezone: item.timezone,
    }))
}
