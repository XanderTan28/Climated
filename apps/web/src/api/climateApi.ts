import type { ActivityId, CitySearchResult, MonthlyClimate } from '../types/climate'
import { fetchWithTimeout } from './http'

interface ArchiveResponse {
  hourly?: {
    time: string[]
    temperature_2m: Array<number | null>
    apparent_temperature: Array<number | null>
    precipitation: Array<number | null>
    cloud_cover: Array<number | null>
    wind_speed_10m: Array<number | null>
    relative_humidity_2m: Array<number | null>
  }
  daily?: {
    time: string[]
    sunrise: string[]
    sunset: string[]
    daylight_duration: Array<number | null>
    temperature_2m_min: Array<number | null>
    temperature_2m_max: Array<number | null>
    precipitation_sum: Array<number | null>
  }
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value))
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0
const valid = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value)

function decimalHour(value: string) {
  const match = value.match(/T(\d{2}):(\d{2})/)
  return match ? Number(match[1]) + Number(match[2]) / 60 : 0
}

function activityScores(temperature: number, rain: number, wind: number, daylight: number): Record<ActivityId, number> {
  const thermalPenalty = Math.abs(temperature - 19) * 2.05
  const base = 96 - thermalPenalty - rain * 0.17 - Math.max(0, wind - 12) * 0.48 + Math.min(5, daylight * 0.22)
  return {
    walking: Math.round(clamp(base)),
    cycling: Math.round(clamp(base - Math.max(0, wind - 8) * 0.75 + 2)),
    exercise: Math.round(clamp(base - Math.max(0, temperature - 17) * 1.15 + (temperature < 12 ? 4 : 0))),
    stationary: Math.round(clamp(base - rain * 0.11 - Math.max(0, wind - 7) * 0.65)),
    waiting: Math.round(clamp(base - rain * 0.08 - Math.max(0, wind - 9) * 0.42)),
    driving: Math.round(clamp(96 - rain * 0.08 - Math.max(0, wind - 25) * 0.25)),
  }
}

function summaryFor(temperature: number, rain: number, wind: number, daylight: number) {
  if (temperature <= 4) return 'Cold conditions shape most outdoor moments.'
  if (temperature >= 27) return 'Warm conditions make shade and timing important.'
  if (rain >= 50) return 'Frequent precipitation adds friction to outdoor plans.'
  if (wind >= 22) return 'Wind is a noticeable part of the outdoor experience.'
  if (daylight >= 15) return 'Long daylight creates a broad outdoor window.'
  return 'Generally moderate conditions for everyday outdoor life.'
}

export function normalizeClimate(data: ArchiveResponse): MonthlyClimate[] {
  if (!data.hourly?.time?.length || !data.daily?.time?.length) throw new Error('Climate API returned incomplete data')
  return monthNames.map((month, monthIndex) => {
    const hourlyIndices = data.hourly!.time.map((time, index) => ({ month: Number(time.slice(5, 7)) - 1, index })).filter((item) => item.month === monthIndex).map((item) => item.index)
    const dailyIndices = data.daily!.time.map((time, index) => ({ month: Number(time.slice(5, 7)) - 1, index })).filter((item) => item.month === monthIndex).map((item) => item.index)
    const hourlyValues = (key: keyof Omit<NonNullable<ArchiveResponse['hourly']>, 'time'>) => hourlyIndices.map((index) => data.hourly![key][index]).filter(valid)
    const dailyValues = (key: keyof Omit<NonNullable<ArchiveResponse['daily']>, 'time' | 'sunrise' | 'sunset'>) => dailyIndices.map((index) => data.daily![key][index]).filter(valid)
    const temperature = average(hourlyValues('temperature_2m'))
    const wind = average(hourlyValues('wind_speed_10m'))
    const rain = dailyValues('precipitation_sum').length ? dailyValues('precipitation_sum').filter((value) => value >= 0.1).length / dailyValues('precipitation_sum').length * 100 : 0
    const daylight = average(dailyValues('daylight_duration')) / 3600
    return {
      month,
      shortMonth: shortMonths[monthIndex],
      averageTemperature: temperature,
      lowTemperature: average(dailyValues('temperature_2m_min')),
      highTemperature: average(dailyValues('temperature_2m_max')),
      rainProbability: rain,
      windSpeed: wind,
      cloudCover: average(hourlyValues('cloud_cover')),
      humidity: average(hourlyValues('relative_humidity_2m')),
      sunrise: average(dailyIndices.map((index) => decimalHour(data.daily!.sunrise[index])).filter(valid)),
      sunset: average(dailyIndices.map((index) => decimalHour(data.daily!.sunset[index])).filter(valid)),
      daylightHours: daylight,
      summary: summaryFor(temperature, rain, wind, daylight),
      activityScores: activityScores(temperature, rain, wind, daylight),
    }
  })
}

export async function fetchClimateProfile(city: CitySearchResult, signal?: AbortSignal): Promise<MonthlyClimate[]> {
  const ranges = [
    { start: '2021-01-01', end: '2025-12-31' },
    { start: '2023-01-01', end: '2025-12-31' },
  ]
  let lastError: unknown
  for (const range of ranges) {
    try {
      const params = new URLSearchParams({
        latitude: String(city.latitude), longitude: String(city.longitude), start_date: range.start, end_date: range.end, timezone: 'auto',
        hourly: 'temperature_2m,cloud_cover,wind_speed_10m,relative_humidity_2m',
        daily: 'sunrise,sunset,daylight_duration,temperature_2m_min,temperature_2m_max,precipitation_sum',
      })
      const response = await fetchWithTimeout(`https://archive-api.open-meteo.com/v1/archive?${params}`, signal, 20000)
      if (!response.ok) {
        const detail = await response.text().catch(() => '')
        throw new Error(`Climate API ${response.status}${detail ? `: ${detail.slice(0, 140)}` : ''}`)
      }
      return normalizeClimate(await response.json() as ArchiveResponse)
    } catch (error) {
      if (signal?.aborted) throw error
      lastError = error
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Climate data is unavailable')
}
