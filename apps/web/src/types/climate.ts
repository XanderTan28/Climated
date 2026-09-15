export type ActivityId = 'walking' | 'cycling' | 'exercise' | 'stationary' | 'waiting' | 'driving'

export type WeatherKind = 'clear' | 'cloudy' | 'drizzle' | 'rain' | 'windy'

export interface MonthlyClimate {
  month: string
  shortMonth: string
  averageTemperature: number
  lowTemperature: number
  highTemperature: number
  rainProbability: number
  windSpeed: number
  cloudCover: number
  humidity: number
  sunrise: number
  sunset: number
  daylightHours: number
  summary: string
  activityScores: Record<ActivityId, number>
}

export interface DayVariant {
  id: string
  label: string
  description: string
  temperatureDelta: number
  rainDelta: number
  windDelta: number
  cloudDelta: number
}

export interface ExperienceState {
  temperature: number
  apparentTemperature: number
  rainProbability: number
  windSpeed: number
  cloudCover: number
  lightLevel: number
  weather: WeatherKind
  score: number
  verdict: string
}

export type ClimateFamily = 'temperate' | 'tropical' | 'dry' | 'boreal'
export type CityArchetype = 'high-rise-core' | 'dense-low-rise' | 'mid-rise-urban' | 'suburban' | 'unclassified'

export interface CitySearchResult {
  id: number
  name: string
  countryCode: string
  country: string
  admin1?: string
  latitude: number
  longitude: number
  elevation?: number
  population?: number
  timezone: string
}

export interface UrbanMetrics {
  sampleRadiusMeters: number
  buildingCount: number
  buildingsPerKm2: number
  levelCoverage: number
  meanLevels: number | null
  p75Levels: number | null
  highRiseRatio: number
  skylineTowerCount: number
  detachedRatio: number
  attachedRatio: number
}

export interface CityVisualInput {
  city: CitySearchResult
  climateFamily: ClimateFamily
  urbanMetrics: UrbanMetrics | null
}

export interface CityVisualProfile {
  city: CitySearchResult
  climateFamily: ClimateFamily
  urbanMetrics: UrbanMetrics | null
  archetype: CityArchetype
  seed: number
  buildingCount: number
  heightScale: number
  density: number
  greenery: number
  palette: string[]
  roofMix: Array<'flat' | 'pitched'>
  windowShape: 'vertical' | 'square' | 'wide'
}
