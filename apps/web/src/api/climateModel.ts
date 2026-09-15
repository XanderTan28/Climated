import type { ActivityId, DayVariant, ExperienceState, MonthlyClimate, WeatherKind } from '../types/climate'

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))

export function formatHour(hour: number) {
  const wholeHour = Math.floor(hour)
  const minutes = Math.round((hour - wholeHour) * 60)
  return `${String(wholeHour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function getExperience(
  climate: MonthlyClimate,
  hour: number,
  activity: ActivityId,
  variant: DayVariant,
): ExperienceState {
  const daylight = hour >= climate.sunrise && hour <= climate.sunset
  const dawn = clamp((hour - climate.sunrise + 0.5) / 1.1, 0, 1)
  const dusk = clamp((climate.sunset - hour + 0.5) / 1.1, 0, 1)
  const lightLevel = Math.min(dawn, dusk)
  const dailyCurve = Math.sin(((hour - 9) / 24) * Math.PI * 2)
  const temperature = climate.averageTemperature + dailyCurve * 2.25 + variant.temperatureDelta
  const rainProbability = clamp(climate.rainProbability + variant.rainDelta)
  const windSpeed = Math.max(3, climate.windSpeed + variant.windDelta)
  const cloudCover = clamp(climate.cloudCover + variant.cloudDelta)
  const windChill = windSpeed > 18 && temperature < 14 ? (windSpeed - 18) * 0.09 : 0
  const apparentTemperature = temperature - windChill - (rainProbability > 65 ? 0.8 : 0)

  let weather: WeatherKind = 'clear'
  if (variant.id === 'windy') weather = 'windy'
  else if (rainProbability >= 70) weather = 'rain'
  else if (rainProbability >= 50) weather = 'drizzle'
  else if (cloudCover >= 58) weather = 'cloudy'

  const rainSensitivity: Record<ActivityId, number> = { walking: 0.10, cycling: 0.18, exercise: 0.08, stationary: 0.23, waiting: 0.18, driving: 0.03 }
  const windSensitivity: Record<ActivityId, number> = { walking: 0.25, cycling: 0.75, exercise: 0.35, stationary: 0.65, waiting: 0.45, driving: 0.05 }
  let score = climate.activityScores[activity]
  score -= variant.rainDelta * rainSensitivity[activity]
  score -= variant.windDelta * windSensitivity[activity]
  score += Math.max(0, -variant.cloudDelta) * 0.08
  if (!daylight) {
    const darknessPenalty: Record<ActivityId, number> = { walking: 4, cycling: 4, exercise: 4, stationary: 9, waiting: 6, driving: 1 }
    score -= darknessPenalty[activity]
  }
  score = Math.round(clamp(score))

  const verdict = score >= 80 ? 'Excellent window' : score >= 65 ? 'Comfortable outside' : score >= 45 ? 'A little weather friction' : 'Plan around the weather'

  return {
    temperature: Math.round(temperature * 10) / 10,
    apparentTemperature: Math.round(apparentTemperature * 10) / 10,
    rainProbability,
    windSpeed,
    cloudCover,
    lightLevel,
    weather,
    score,
    verdict,
  }
}
