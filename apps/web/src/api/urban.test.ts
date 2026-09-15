import { describe, expect, it } from 'vitest'
import { summarizeUrbanSample } from './urban'

describe('urban sample normalization', () => {
  it('derives auditable metrics from OSM tags', () => {
    const sample = summarizeUrbanSample([
      { tags: { building: 'apartments', 'building:levels': '12' } },
      { tags: { building: 'detached', 'building:levels': '2' } },
      { tags: { building: 'terrace', height: '9.6' } },
      { tags: { building: 'no' } },
    ], 700)
    expect(sample.buildingCount).toBe(3)
    expect(sample.levelCoverage).toBe(1)
    expect(sample.highRiseRatio).toBeCloseTo(1 / 3)
    expect(sample.detachedRatio).toBeCloseTo(1 / 3)
    expect(sample.attachedRatio).toBeCloseTo(2 / 3)
  })
})
