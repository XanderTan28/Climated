import { describe, expect, it } from 'vitest'
import { classifyUrbanForm, resolveCityVisualProfile } from './cityVisual'
import type { CitySearchResult, UrbanMetrics } from '../types/climate'

const city: CitySearchResult = { id: 1, name: 'Example City', countryCode: 'EX', country: 'Example', latitude: 40, longitude: -73, timezone: 'UTC' }
const metrics: UrbanMetrics = { sampleRadiusMeters: 700, buildingCount: 400, buildingsPerKm2: 260, levelCoverage: .5, meanLevels: 5, p75Levels: 6, highRiseRatio: .03, detachedRatio: .05, attachedRatio: .1 }

describe('data-driven city visual classification', () => {
  it('distinguishes high-rise, dense low-rise, and suburban samples', () => {
    expect(classifyUrbanForm({ ...metrics, p75Levels: 18, highRiseRatio: .3 })).toBe('high-rise-core')
    expect(classifyUrbanForm({ ...metrics, buildingsPerKm2: 650, meanLevels: 3, p75Levels: 4, attachedRatio: .35 })).toBe('dense-low-rise')
    expect(classifyUrbanForm({ ...metrics, buildingsPerKm2: 100, meanLevels: 2, p75Levels: 2, detachedRatio: .6 })).toBe('suburban')
  })

  it('does not classify by city name', () => {
    const first = resolveCityVisualProfile({ city, climateFamily: 'temperate', urbanMetrics: metrics })
    const renamed = resolveCityVisualProfile({ city: { ...city, id: 2, name: 'New York' }, climateFamily: 'temperate', urbanMetrics: metrics })
    expect(first.archetype).toBe(renamed.archetype)
    expect(first.seed).not.toBe(renamed.seed)
  })

  it('marks missing or tiny samples as unclassified', () => {
    expect(classifyUrbanForm(null)).toBe('unclassified')
    expect(classifyUrbanForm({ ...metrics, buildingCount: 12 })).toBe('unclassified')
  })
})
