import type { ActivityId, DayVariant } from '../types/climate'

export const activities: Array<{ id: ActivityId; label: string; description: string; icon: ActivityId }> = [
  { id: 'walking', label: 'Walking', description: 'Everyday movement', icon: 'walking' },
  { id: 'cycling', label: 'Cycling', description: 'Exposed to headwind', icon: 'cycling' },
  { id: 'exercise', label: 'Exercise', description: 'High physical effort', icon: 'exercise' },
  { id: 'stationary', label: 'Stationary outdoor', description: 'A longer outdoor stay', icon: 'stationary' },
  { id: 'waiting', label: 'Waiting / commuting', description: 'Low activity, less shelter', icon: 'waiting' },
  { id: 'driving', label: 'Driving', description: 'Brief, sheltered exposure', icon: 'driving' },
]

export const dayVariants: DayVariant[] = [
  { id: 'typical', label: 'A typical day', description: 'A representative mix for this month', temperatureDelta: 0, rainDelta: 0, windDelta: 0, cloudDelta: 0 },
  { id: 'bright', label: 'A brighter day', description: 'Clearer and slightly warmer than average', temperatureDelta: 2.2, rainDelta: -18, windDelta: -2, cloudDelta: -24 },
  { id: 'wet', label: 'A wetter day', description: 'A rainier variation within the month', temperatureDelta: -1.2, rainDelta: 26, windDelta: 3, cloudDelta: 22 },
  { id: 'windy', label: 'A windier day', description: 'More exposed and brisk than average', temperatureDelta: -0.8, rainDelta: 5, windDelta: 12, cloudDelta: 8 },
]
