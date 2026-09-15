import { activities } from '../api/experience'
import { formatHour } from '../api/climateModel'
import type { ActivityId, DayVariant, MonthlyClimate } from '../types/climate'
import { ActivityIcon } from './ActivityIcon'

interface ControlPanelProps {
  cityName: string
  climateData: MonthlyClimate[]
  climate: MonthlyClimate
  monthIndex: number
  hour: number
  activity: ActivityId
  variant: DayVariant
  score: number
  verdict: string
  onMonthChange: (index: number) => void
  onHourChange: (hour: number) => void
  onActivityChange: (activity: ActivityId) => void
  onRandomDay: () => void
}

function MonthSparkline({ data, selectedMonth, onSelect }: { data: MonthlyClimate[]; selectedMonth: number; onSelect: (index: number) => void }) {
  const temperatures = data.map((item) => item.averageTemperature)
  const minimum = Math.min(...temperatures)
  const range = Math.max(1, Math.max(...temperatures) - minimum)
  const step = 400 / 11
  const points = data.map((item, index) => ({ x: index * step, y: 50 - ((item.averageTemperature - minimum) / range) * 36 }))
  const path = points.map((point, index) => `${index ? 'L' : 'M'} ${point.x} ${point.y}`).join(' ')
  const selectedPoint = points[selectedMonth]
  const select = (element: SVGSVGElement, clientX: number) => {
    const bounds = element.getBoundingClientRect()
    onSelect(Math.max(0, Math.min(11, Math.round(((clientX - bounds.left) / bounds.width) * 11))))
  }

  return (
    <svg
      className="month-sparkline"
      viewBox="0 0 400 76"
      preserveAspectRatio="none"
      role="slider"
      tabIndex={0}
      aria-label="Month"
      aria-valuemin={0}
      aria-valuemax={11}
      aria-valuenow={selectedMonth}
      aria-valuetext={data[selectedMonth].month}
      onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); select(event.currentTarget, event.clientX) }}
      onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) select(event.currentTarget, event.clientX) }}
      onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') onSelect(Math.max(0, selectedMonth - 1))
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') onSelect(Math.min(11, selectedMonth + 1))
        if (event.key === 'Home') onSelect(0)
        if (event.key === 'End') onSelect(11)
      }}
    >
      <path d={`${path} L 400 57 L 0 57 Z`} className="spark-area" />
      <path d={path} className="spark-hit-area" />
      <path d={path} className="spark-line" />
      {points.map((point, index) => (
        <g key={data[index].month} className="spark-point" aria-hidden="true">
          <circle cx={point.x} cy={point.y} r="2.2" />
          <text x={point.x} y="73" textAnchor="middle">{index % 2 === 0 ? data[index].shortMonth : ''}</text>
        </g>
      ))}
      <line className="spark-guide" x1={selectedPoint.x} y1={selectedPoint.y + 8} x2={selectedPoint.x} y2="59" />
      <g className="spark-handle" aria-hidden="true" transform={`translate(${selectedPoint.x} ${selectedPoint.y})`}>
        <circle className="handle-halo" r="9" />
        <circle className="handle-core" r="5" />
        <text className="handle-value" textAnchor="middle" y="-10">
          {Math.round(data[selectedMonth].averageTemperature)}<tspan className="handle-degree">°</tspan>
        </text>
      </g>
    </svg>
  )
}

function TimeOfDaySlider({ hour, climate, onChange }: { hour: number; climate: MonthlyClimate; onChange: (hour: number) => void }) {
  const progress = (hour - 6) / 17
  // Match the marker to the quadratic horizon path: M0 50 Q166 8 332 50.
  const orbitTop = ((50 - 168 * progress * (1 - progress)) / 66) * 100
  const isNight = hour < climate.sunrise || hour > climate.sunset
  return (
    <div className="time-slider">
      <div className="time-orbit" aria-hidden="true">
        <svg viewBox="0 0 332 66" preserveAspectRatio="none">
          <path className="orbit-land" d="M0 50 Q166 8 332 50 L332 59 Q166 30 0 59 Z" />
          <path className="orbit-haze" d="M0 50 Q166 8 332 50" />
        </svg>
        <i className={`time-celestial ${isNight ? 'is-moon' : 'is-sun'}`} style={{ left: `${progress * 100}%`, top: `${orbitTop}%` }} />
      </div>
      <input id="hour" aria-label="Time of day" type="range" min="6" max="23" step="0.5" value={hour} onChange={(event) => onChange(Number(event.target.value))} />
      <div className="range-ends"><span>06:00</span><span>NOON</span><span>23:00</span></div>
    </div>
  )
}

export function ControlPanel({ cityName, climateData, climate, monthIndex, hour, activity, variant, score, verdict, onMonthChange, onHourChange, onActivityChange, onRandomDay }: ControlPanelProps) {
  return (
    <aside className="control-panel" aria-label="Climate controls">
      <div className="control-heading"><span className="eyebrow">SHAPE THE MOMENT</span><h2>Explore {cityName}</h2></div>
      <section className="control-group month-control panel-section">
        <div className="control-label"><span>Month</span><strong>{climate.month}</strong></div>
        <MonthSparkline data={climateData} selectedMonth={monthIndex} onSelect={onMonthChange} />
      </section>
      <section className="control-group time-control panel-section">
        <div className="control-label"><label htmlFor="hour">Time of day</label><strong>{formatHour(hour)}</strong></div>
        <TimeOfDaySlider hour={hour} climate={climate} onChange={onHourChange} />
      </section>
      <section className="control-group activity-group panel-section">
        <div className="control-label"><span>What are you doing?</span><small>Choose an exposure type</small></div>
        <div className="activity-grid">
          {activities.map((item) => <button key={item.id} className={activity === item.id ? 'is-active' : ''} onClick={() => onActivityChange(item.id)} aria-pressed={activity === item.id} aria-label={item.label}><ActivityIcon name={item.icon} /><span className="activity-copy"><strong>{item.label}</strong><small>{item.description}</small></span></button>)}
        </div>
        <div className="inline-score" aria-live="polite"><div><span>Current comfort</span><strong>{score}<small>/100</small></strong></div><p>{verdict}</p></div>
      </section>
      <div className="random-experience panel-section">
        <div className="day-variant" aria-live="polite"><span>{variant.label}</span><p>{variant.description}</p></div>
        <button className="random-button" onClick={onRandomDay}><span className="dice">✦</span>Random day<span className="arrow">→</span></button>
      </div>
    </aside>
  )
}
