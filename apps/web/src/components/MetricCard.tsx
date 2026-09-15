interface MetricCardProps {
  label: string
  value: string
  detail: string
  accent?: boolean
}

export function MetricCard({ label, value, detail, accent = false }: MetricCardProps) {
  return (
    <article className={`metric-card ${accent ? 'metric-card--accent' : ''}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      <span>{detail}</span>
    </article>
  )
}
