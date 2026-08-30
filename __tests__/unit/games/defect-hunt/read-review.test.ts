import { describe, expect, it } from 'vitest'
import {
  foundKinds,
  readReview,
} from '@/games/defect-hunt/helpers/read-review.helper'
import {
  type DefectHuntConfig,
  defectHuntConfigSchema,
} from '@/games/defect-hunt/schema/config.schema'

type Kind =
  | 'security'
  | 'logic'
  | 'hallucinated-dependency'
  | 'contract'
  | 'resource'

const CODE = Array.from(
  { length: 10 },
  (_, index) => `const line${index + 1} = ${index + 1}`,
).join('\n')

const defect = (id: string, line: number, kind: Kind) => ({
  id,
  line,
  kind,
  reveal: `révélation ${id}`,
})

const config: DefectHuntConfig = defectHuntConfigSchema.parse({
  statement: 'Consigne de test.',
  snippet: { label: 'Extrait', language: 'ts', code: CODE },
  timeLimitSeconds: 180,
  defects: [
    defect('d1', 2, 'security'),
    defect('d2', 4, 'logic'),
    defect('d3', 6, 'hallucinated-dependency'),
    defect('d4', 8, 'contract'),
    defect('d5', 10, 'resource'),
  ],
})

const trace = (markedLines: number[]) => ({ markedLines, elapsedSeconds: 90 })

describe('read review', () => {
  it('reads a partial review: four found, one missed, one false positive, ratio four fifths', () => {
    const reading = readReview(config, trace([2, 4, 6, 8, 1]))

    expect(reading.found.map((entry) => entry.id)).toEqual([
      'd1',
      'd2',
      'd3',
      'd4',
    ])
    expect(reading.missed.map((entry) => entry.id)).toEqual(['d5'])
    expect(reading.falsePositiveLines).toEqual([1])
    expect(reading.foundRatio).toBe(0.8)
  })

  it('reads an empty review: nothing found, everything missed, no false positive, null ratio', () => {
    const reading = readReview(config, trace([]))

    expect(reading.found).toEqual([])
    expect(reading.missed).toHaveLength(5)
    expect(reading.falsePositiveLines).toEqual([])
    expect(reading.foundRatio).toBe(0)
  })

  it('reads a saturated review: everything found, one false positive per healthy line', () => {
    const allLines = Array.from({ length: 10 }, (_, index) => index + 1)
    const reading = readReview(config, trace(allLines))

    expect(reading.found).toHaveLength(5)
    expect(reading.foundRatio).toBe(1)
    expect(reading.falsePositiveLines).toHaveLength(5)
  })

  it('renders the exact same reading, defects in declared order, for two reviews marking the same lines in a different order', () => {
    const first = readReview(config, trace([8, 2, 6]))
    const second = readReview(config, trace([2, 6, 8]))

    expect(first).toEqual(second)
    expect(first.found.map((entry) => entry.id)).toEqual(['d1', 'd3', 'd4'])
  })

  it('exposes the natures found, and only those', () => {
    const reading = readReview(config, trace([2, 6]))

    expect(foundKinds(reading)).toEqual(
      new Set(['security', 'hallucinated-dependency']),
    )
  })
})
