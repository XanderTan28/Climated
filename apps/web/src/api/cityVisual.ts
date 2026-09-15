import type { CityArchetype, CityVisualInput, CityVisualProfile, ClimateFamily, MonthlyClimate, UrbanMetrics } from '../types/climate'

const climatePalettes: Record<ClimateFamily, string[]> = {
  temperate: ['#a47762', '#c6a58b', '#768b89', '#d4bfa4', '#8c7166'],
  tropical: ['#afbc9e', '#d8b48e', '#7d9d8c', '#e0ceb0', '#9aa58b'],
  dry: ['#c8a879', '#e1c79d', '#b78e6f', '#e5d5b8', '#baac94'],
  boreal: ['#82999a', '#a2acaa', '#c6bbaa', '#6f8287', '#c19d82'],
}

const archetypeRules: Record<CityArchetype, Pick<CityVisualProfile, 'buildingCount' | 'heightScale' | 'density' | 'roofMix' | 'windowShape'>> = {
  'high-rise-core': { buildingCount: 15, heightScale: 1.75, density: 0.88, roofMix: ['flat'], windowShape: 'wide' },
  'dense-low-rise': { buildingCount: 18, heightScale: 0.68, density: 0.92, roofMix: ['flat', 'pitched'], windowShape: 'vertical' },
  'mid-rise-urban': { buildingCount: 14, heightScale: 1.05, density: 0.72, roofMix: ['flat', 'pitched'], windowShape: 'square' },
  suburban: { buildingCount: 8, heightScale: 0.46, density: 0.32, roofMix: ['pitched'], windowShape: 'square' },
  unclassified: { buildingCount: 11, heightScale: 0.85, density: 0.55, roofMix: ['flat', 'pitched'], windowShape: 'square' },
}

function hashCity(value: string) {
  return [...value].reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 17) >>> 0
}

export function resolveCityVisualProfile(input: CityVisualInput): CityVisualProfile {
  const archetype = classifyUrbanForm(input.urbanMetrics)
  const rules = archetypeRules[archetype]
  const climateGreenery: Record<ClimateFamily, number> = { temperate: 0.48, tropical: 0.76, dry: 0.14, boreal: 0.36 }
  const densityGreeneryPenalty = rules.density * 0.22
  return {
    ...input,
    archetype,
    seed: hashCity(`${input.city.id}:${input.city.name}:${input.city.countryCode}`),
    greenery: Math.max(0.08, climateGreenery[input.climateFamily] - densityGreeneryPenalty),
    palette: archetype === 'high-rise-core'
      ? ['#647e84', '#8ea1a2', '#a6b4ad', '#526c76', '#b5b8a5']
      : climatePalettes[input.climateFamily],
    ...rules,
  }
}

export function classifyUrbanForm(metrics: UrbanMetrics | null): CityArchetype {
  if (!metrics) return 'unclassified'
  if (metrics.skylineTowerCount >= 150) return 'high-rise-core'
  if (metrics.buildingCount < 20) return 'unclassified'
  const levelSampleCount = Math.round(metrics.levelCoverage * metrics.buildingCount)
  const levelsReliable = levelSampleCount >= 8
  const localHighRise = levelsReliable && (
    (metrics.p75Levels ?? 0) >= 8
    || metrics.highRiseRatio >= 0.1
    || (metrics.meanLevels ?? 0) >= 8
  )
  if (localHighRise) return 'high-rise-core'

  const strongDetachedPattern = metrics.detachedRatio >= 0.35
  const sparsePattern = metrics.buildingsPerKm2 < 160 && metrics.attachedRatio < 0.2
  const lightlyMappedLowDensityPattern = metrics.buildingsPerKm2 < 360 && metrics.levelCoverage < 0.06 && metrics.attachedRatio < 0.2
  if (strongDetachedPattern || sparsePattern || lightlyMappedLowDensityPattern) return 'suburban'

  const meanLevels = metrics.meanLevels ?? 0
  const denseLowRisePattern = metrics.buildingsPerKm2 >= 1_500 || metrics.buildingsPerKm2 >= 900 && (
    metrics.attachedRatio >= 0.3 || metrics.levelCoverage < 0.08 || meanLevels < 4
  )
  const compactLowRisePattern = metrics.buildingsPerKm2 >= 420 && (
    metrics.attachedRatio >= 0.18 || !levelsReliable || meanLevels < 4
  )
  if (denseLowRisePattern || compactLowRisePattern) return 'dense-low-rise'
  if (levelsReliable && meanLevels >= 4) return 'mid-rise-urban'
  if (metrics.buildingsPerKm2 < 360) return 'suburban'
  return 'mid-rise-urban'
}

export function inferClimateFamily(data: MonthlyClimate[]): ClimateFamily {
  const annualMean = data.reduce((sum, month) => sum + month.averageTemperature, 0) / Math.max(data.length, 1)
  const coldest = Math.min(...data.map((month) => month.averageTemperature))
  const annualRainSignal = data.reduce((sum, month) => sum + month.rainProbability, 0) / Math.max(data.length, 1)
  if (annualMean >= 22 && coldest >= 18) return 'tropical'
  if (annualRainSignal < 20) return 'dry'
  if (coldest < -5) return 'boreal'
  return 'temperate'
}
