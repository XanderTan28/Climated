import { describe, expect, it } from 'vitest'
import { normalizeClimate } from './climateApi'

describe('climate normalization', () => {
  it('maps API time series into twelve display months', () => {
    const time = Array.from({ length: 12 }, (_, index) => `2024-${String(index + 1).padStart(2, '0')}-15T12:00`)
    const dailyTime = time.map((value) => value.slice(0, 10))
    const data = normalizeClimate({
      hourly: { time, temperature_2m: time.map((_, i) => i + 5), apparent_temperature: time.map(() => 5), precipitation: time.map(() => 0), cloud_cover: time.map(() => 40), wind_speed_10m: time.map(() => 12), relative_humidity_2m: time.map(() => 70) },
      daily: { time: dailyTime, sunrise: dailyTime.map((date) => `${date}T07:30`), sunset: dailyTime.map((date) => `${date}T18:00`), daylight_duration: dailyTime.map(() => 37800), temperature_2m_min: dailyTime.map(() => 2), temperature_2m_max: dailyTime.map(() => 12), precipitation_sum: dailyTime.map((_, i) => i % 2) },
    })
    expect(data).toHaveLength(12)
    expect(data[0].month).toBe('January')
    expect(data[0].sunrise).toBe(7.5)
    expect(data[11].averageTemperature).toBe(16)
  })
})
