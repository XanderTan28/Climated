import type { CitySearchResult, UrbanMetrics } from '../types/climate'
import { fetchWithTimeout } from './http'

interface OverpassElement { tags?: Record<string, string> }
interface OverpassResponse { elements?: OverpassElement[] }

const SAMPLE_RADIUS_METERS = 450
const endpoints = [
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://overpass-api.de/api/interpreter',
]

function parseLevels(tags: Record<string, string>) {
  const explicit = Number.parseFloat(tags['building:levels'])
  if (Number.isFinite(explicit) && explicit > 0 && explicit < 200) return explicit
  const height = Number.parseFloat(tags.height)
  if (Number.isFinite(height) && height > 2 && height < 700) return height / 3.2
  return null
}

export function summarizeUrbanSample(elements: OverpassElement[], sampleRadiusMeters = SAMPLE_RADIUS_METERS): UrbanMetrics {
  const buildings = elements.filter((element) => element.tags?.building && element.tags.building !== 'no')
  const levels = buildings.map((item) => parseLevels(item.tags ?? {})).filter((value): value is number => value !== null).sort((a, b) => a - b)
  const buildingTypes = buildings.map((item) => item.tags?.building ?? '')
  const detached = new Set(['house', 'detached', 'semidetached_house', 'bungalow'])
  const attached = new Set(['terrace', 'apartments', 'residential'])
  const areaKm2 = Math.PI * (sampleRadiusMeters / 1000) ** 2
  const total = buildings.length
  return {
    sampleRadiusMeters,
    buildingCount: total,
    buildingsPerKm2: total / areaKm2,
    levelCoverage: total ? levels.length / total : 0,
    meanLevels: levels.length ? levels.reduce((sum, value) => sum + value, 0) / levels.length : null,
    p75Levels: levels.length ? levels[Math.max(0, Math.ceil(levels.length * 0.75) - 1)] : null,
    highRiseRatio: levels.length ? levels.filter((value) => value >= 10).length / levels.length : 0,
    detachedRatio: total ? buildingTypes.filter((value) => detached.has(value)).length / total : 0,
    attachedRatio: total ? buildingTypes.filter((value) => attached.has(value)).length / total : 0,
  }
}

export async function fetchUrbanMetrics(city: CitySearchResult, signal?: AbortSignal): Promise<UrbanMetrics> {
  const query = `[out:json][timeout:18];way(around:${SAMPLE_RADIUS_METERS},${city.latitude},${city.longitude})["building"];out tags qt;`
  const body = new URLSearchParams({ data: query }).toString()
  let lastError: unknown
  for (const endpoint of endpoints) {
    try {
      const response = await fetchWithTimeout(endpoint, signal, 22000, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body,
      })
      if (!response.ok) throw new Error(`Urban form request failed (${response.status})`)
      const data = await response.json() as OverpassResponse
      return summarizeUrbanSample(data.elements ?? [])
    } catch (error) {
      if (signal?.aborted) throw error
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Urban form data is unavailable')
}
