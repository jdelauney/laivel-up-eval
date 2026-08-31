import { describe, expect, it } from 'vitest'
import { readFlags } from '@/games/ambiguity-scan/helpers/read-flags.helper'
import {
  type AmbiguityScanConfig,
  ambiguityScanConfigSchema,
} from '@/games/ambiguity-scan/schema/config.schema'

const segment = (id: string, ambiguous: boolean) => ({
  id,
  text: `Texte de ${id}.`,
  ambiguous,
  ...(ambiguous ? { reading: `Lecture de ${id}.` } : {}),
})

/** Trois segments ambigus (s3, s4, s5), trois clairs (s1, s2, s6). */
const config: AmbiguityScanConfig = ambiguityScanConfigSchema.parse({
  statement: 'Consigne de test.',
  promptTitle: 'Titre du prompt',
  segments: [
    segment('s1', false),
    segment('s2', false),
    segment('s3', true),
    segment('s4', true),
    segment('s5', true),
    segment('s6', false),
  ],
})

describe('read flags', () => {
  it('reads ambiguousCount and clearCount from the configuration alone', () => {
    const reading = readFlags(config, { flaggedIds: [] })

    expect(reading.ambiguousCount).toBe(3)
    expect(reading.clearCount).toBe(3)
  })

  it('counts a flagged ambiguous segment as a hit, not a false positive', () => {
    const reading = readFlags(config, { flaggedIds: ['s3'] })

    expect(reading.hitCount).toBe(1)
    expect(reading.falsePositiveCount).toBe(0)
    expect(reading.netHits).toBe(1)
  })

  it('counts a flagged clear segment as a false positive, not a hit', () => {
    const reading = readFlags(config, { flaggedIds: ['s1'] })

    expect(reading.hitCount).toBe(0)
    expect(reading.falsePositiveCount).toBe(1)
    expect(reading.netHits).toBe(-1)
  })

  it('nets a false positive against a hit, rather than counting them apart', () => {
    const reading = readFlags(config, { flaggedIds: ['s3', 's1'] })

    expect(reading.netHits).toBe(0)
  })

  it('renders netHits at most zero when every segment is flagged', () => {
    const reading = readFlags(config, {
      flaggedIds: ['s1', 's2', 's3', 's4', 's5', 's6'],
    })

    expect(reading.hitCount).toBe(3)
    expect(reading.falsePositiveCount).toBe(3)
    expect(reading.netHits).toBeLessThanOrEqual(0)
  })

  it('renders every count at zero for an empty trace', () => {
    const reading = readFlags(config, { flaggedIds: [] })

    expect(reading.hitCount).toBe(0)
    expect(reading.falsePositiveCount).toBe(0)
    expect(reading.netHits).toBe(0)
  })

  it('reads the perfect trace, the ambiguous segments alone, as full net coverage and no false positive', () => {
    const reading = readFlags(config, { flaggedIds: ['s3', 's4', 's5'] })

    expect(reading.netHits).toBe(3)
    expect(reading.falsePositiveCount).toBe(0)
  })
})
