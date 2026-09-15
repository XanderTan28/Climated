interface WeatherIconProps {
  kind: string
}

export function WeatherIcon({ kind }: WeatherIconProps) {
  if (kind === 'night') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M32 8a16 16 0 1 0 8 26A18 18 0 0 1 32 8Z" /></svg>
  }
  if (kind === 'rain' || kind === 'drizzle') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 29h23a8 8 0 0 0 .4-16A12 12 0 0 0 14 16a6.5 6.5 0 0 0-1 13Z" /><path className="rain-icon" d="m16 34-2 5m10-5-2 5m10-5-2 5" /></svg>
  }
  if (kind === 'clear') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="8" /><path d="M24 5v6m0 26v6M5 24h6m26 0h6M10.5 10.5l4.2 4.2m18.6 18.6 4.2 4.2m0-27-4.2 4.2M14.7 33.3l-4.2 4.2" /></svg>
  }
  return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M12 30h25a8 8 0 0 0-1-16 12 12 0 0 0-23-1 8.5 8.5 0 0 0-1 17Z" /></svg>
}
