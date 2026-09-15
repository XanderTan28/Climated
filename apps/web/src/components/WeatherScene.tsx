import { formatHour } from '../api/climateModel'
import type { CityVisualProfile, ExperienceState, MonthlyClimate } from '../types/climate'
import { ProceduralCity } from './ProceduralCity'
import { WeatherIcon } from './WeatherIcon'

interface WeatherSceneProps {
  climate: MonthlyClimate
  experience: ExperienceState
  hour: number
  activityLabel: string
  visualProfile: CityVisualProfile
  cityName: string
}

export function WeatherScene({ climate, experience, hour, activityLabel, visualProfile, cityName }: WeatherSceneProps) {
  const isNight = experience.lightLevel < .18
  const isDusk = !isNight && (experience.lightLevel < .8 || Math.abs(hour - climate.sunset) < 1.5)
  const light = isNight ? 'night' : isDusk ? 'dusk' : 'day'
  return (
    <section className={`weather-scene light-${light} weather-${experience.weather}`} aria-label={`${cityName} city scene`}>
      <div className="scene-sky" aria-hidden="true">
        {isNight && <div className="stars" />}
        <div className={`celestial ${isNight ? 'moon' : 'sun'}`} />
        <svg className="sky-clouds" viewBox="0 0 1000 360" preserveAspectRatio="none" style={{ opacity: .18 + experience.cloudCover / 145 }}>
          <g className="sky-cloud">
            <rect x="520" y="74" width="255" height="22" rx="11" />
            <circle cx="586" cy="75" r="23" />
            <circle cx="636" cy="67" r="31" />
            <circle cx="700" cy="79" r="18" />
          </g>
          <g className="sky-cloud sky-cloud-small">
            <rect x="745" y="158" width="245" height="16" rx="8" />
            <circle cx="805" cy="158" r="17" />
            <circle cx="844" cy="153" r="23" />
            <circle cx="900" cy="160" r="14" />
          </g>
        </svg>
      </div>
      <div className="scene-heading">
        <span className="eyebrow">A FEEL FOR THE CITY</span>
        <h1>{cityName}<span>.</span></h1>
        <p className="scene-moment">{climate.month} · {formatHour(hour)} <span>/</span> {activityLabel}</p>
        <div className="scene-reading">
          <span className="temperature">{Math.round(experience.temperature)}°</span>
          <div className="reading-copy"><WeatherIcon kind={isNight && experience.weather === 'clear' ? 'night' : experience.weather} /><strong>{experience.verdict}</strong><p>{climate.summary}</p></div>
        </div>
      </div>
      <ProceduralCity profile={visualProfile} isNight={isNight} />
      {(experience.weather === 'rain' || experience.weather === 'drizzle') && <div className="rain-field" aria-hidden="true">{Array.from({ length: 22 }, (_, i) => <i key={i} style={{ left: `${i * 4.7}%`, animationDelay: `${-i * .13}s` }} />)}</div>}
      <div className="scene-stats" aria-label="Current climate details">
        <div><span>FEELS LIKE</span><strong>{Math.round(experience.apparentTemperature)}°</strong></div>
        <div><span>RAIN CHANCE</span><strong>{Math.round(experience.rainProbability)}<small>%</small></strong></div>
        <div><span>WIND</span><strong>{Math.round(experience.windSpeed)} <small>km/h</small></strong></div>
        <div><span>DAYLIGHT</span><strong>{climate.daylightHours.toFixed(1)} <small>hrs</small></strong></div>
      </div>
    </section>
  )
}
