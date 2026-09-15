interface ActivityIconProps {
  name: string
}

export function ActivityIcon({ name }: ActivityIconProps) {
  if (name === 'cycling') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="17" r="3.4" /><circle cx="18" cy="17" r="3.4" /><path d="m6 17 4-8 4 8m-6-4h8l-2-5h3M9 6h3" /></svg>
  }
  if (name === 'exercise') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="14" cy="4" r="1.6" /><path d="m12 8 3 2 3 1m-6-3-2 5-3 2m5-2 3 3-1 5m-2-8-2 4-4 3" /></svg>
  }
  if (name === 'stationary') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16v4H4Zm2 4v6m12-6v6M6 7h12v3M3 17h18" /></svg>
  }
  if (name === 'waiting') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 10a7 7 0 0 1 14 0H5Zm7 0v8c0 3 4 3 4 0M7 21h10M8 5l-2-2m10 2 2-2" /></svg>
  }
  if (name === 'driving') {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 15 2-6h12l2 6v4h-2v-2H6v2H4v-4Zm2 0h12M8 9l1-3h6l1 3" /><circle cx="7.5" cy="14" r="1" /><circle cx="16.5" cy="14" r="1" /></svg>
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="4" r="1.7" /><path d="m10 8 4 2 2 4m-6-6-2 6-3 3m7-3-1 7m1-7 4 4" /></svg>
}
