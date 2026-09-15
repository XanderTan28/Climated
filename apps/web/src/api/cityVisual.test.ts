import { describe, expect, it } from 'vitest'
import { classifyUrbanForm, resolveCityVisualProfile } from './cityVisual'
import type { CitySearchResult, UrbanMetrics } from '../types/climate'

const city: CitySearchResult = { id: 1, name: 'Example City', countryCode: 'EX', country: 'Example', latitude: 40, longitude: -73, timezone: 'UTC' }
const metrics: UrbanMetrics = { sampleRadiusMeters: 700, buildingCount: 400, buildingsPerKm2: 260, levelCoverage: .5, meanLevels: 5, p75Levels: 6, highRiseRatio: .03, skylineTowerCount: 0, detachedRatio: .05, attachedRatio: .1 }

describe('data-driven city visual classification', () => {
  it('distinguishes high-rise, dense low-rise, and suburban samples', () => {
    expect(classifyUrbanForm({ ...metrics, p75Levels: 18, highRiseRatio: .3 })).toBe('high-rise-core')
    expect(classifyUrbanForm({ ...metrics, buildingsPerKm2: 650, meanLevels: 3, p75Levels: 4, attachedRatio: .35 })).toBe('dense-low-rise')
    expect(classifyUrbanForm({ ...metrics, buildingsPerKm2: 100, meanLevels: 2, p75Levels: 2, detachedRatio: .6 })).toBe('suburban')
  })

  it('recognizes high-rise evidence with sparse height tagging', () => {
    expect(classifyUrbanForm({ ...metrics, buildingCount: 426, buildingsPerKm2: 670, levelCoverage: .038, meanLevels: 9, p75Levels: 5, highRiseRatio: .188 })).toBe('high-rise-core')
    expect(classifyUrbanForm({ ...metrics, levelCoverage: .02, meanLevels: 3, p75Levels: 4, highRiseRatio: .04, skylineTowerCount: 180 })).toBe('high-rise-core')
    expect(classifyUrbanForm({ ...metrics, buildingCount: 16, buildingsPerKm2: 25, levelCoverage: .06, meanLevels: 1, p75Levels: 1, highRiseRatio: 0, skylineTowerCount: 208 })).toBe('high-rise-core')
  })

  it('separates ordinary urban and suburban morphology before density fallback', () => {
    expect(classifyUrbanForm({ ...metrics, buildingsPerKm2: 1180, levelCoverage: .34, meanLevels: 5.2, p75Levels: 6, attachedRatio: .05 })).toBe('mid-rise-urban')
    expect(classifyUrbanForm({ ...metrics, buildingsPerKm2: 1900, levelCoverage: .02, meanLevels: 6, p75Levels: 6, detachedRatio: .57 })).toBe('suburban')
    expect(classifyUrbanForm({ ...metrics, buildingsPerKm2: 300, levelCoverage: 0, meanLevels: null, p75Levels: null })).toBe('suburban')
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
