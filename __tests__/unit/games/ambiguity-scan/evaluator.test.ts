import { describe, expect, it } from 'vitest'
import type { Criterion } from '@/core/contracts/course.schema'
import { AmbiguityScanEvaluator } from '@/games/ambiguity-scan/ambiguity-scan.evaluator'
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

/** Quatre segments ambigus (s3..s6), cinq clairs, sur le modèle du corpus réel de `g6-2`. */
const config: AmbiguityScanConfig = ambiguityScanConfigSchema.parse({
  statement: 'Consigne de test.',
  promptTitle: 'Titre du prompt',
  segments: [
    segment('s1', false),
    segment('s2', false),
    segment('s3', true),
    segment('s4', true),
    segment('s5', true),
    segment('s6', true),
    segment('s7', false),
    segment('s8', false),
    segment('s9', false),
  ],
})

const criteria: Criterion[] = [
  {
    id: 'c1',
    question:
      'Une fois retranchés les segments clairs signalés à tort, la part des segments ambigus repérés reste-t-elle suffisante ?',
    rule: { type: 'ambiguity-net-share-at-least', threshold: 0.5 },
    mapping: [{ dimension: 'pilotage-contexte', weight: 2 }],
  },
  {
    id: 'c2',
    question: 'Les segments clairs ont-ils été laissés tranquilles ?',
    rule: { type: 'clear-segments-spared-at-least', threshold: 0.8 },
    mapping: [{ dimension: 'pilotage-contexte', weight: 1 }],
  },
]

const evaluator = new AmbiguityScanEvaluator()

const verdictOf = (
  flaggedIds: string[],
  rules: readonly Criterion[] = criteria,
): boolean[] =>
  evaluator.evaluate({ flaggedIds }, config, rules).map((r) => r.satisfied)

describe('ambiguity-scan evaluator', () => {
  it('satisfies both criteria for the perfect trace, the four ambiguous segments alone', () => {
    expect(verdictOf(['s3', 's4', 's5', 's6'])).toEqual([true, true])
  })

  it('misses both criteria when every segment is flagged', () => {
    const [c1, c2] = verdictOf([
      's1',
      's2',
      's3',
      's4',
      's5',
      's6',
      's7',
      's8',
      's9',
    ])
    expect(c1).toBe(false)
    expect(c2).toBe(false)
  })

  it('misses c1 but satisfies c2 when nothing is flagged: no ambiguity found, but every clear segment trivially spared', () => {
    expect(verdictOf([])).toEqual([false, true])
  })

  it('satisfies c1 but misses c2 when all four ambiguous segments are found alongside two clear ones', () => {
    // netHits = 4 - 2 = 2 sur 4 → 0.5, tient tout juste le seuil de c1 ;
    // (5 - 2) / 5 = 0.6, sous le seuil de 0.8 de c2.
    const [c1, c2] = verdictOf(['s3', 's4', 's5', 's6', 's1', 's2'])
    expect(c1).toBe(true)
    expect(c2).toBe(false)
  })

  it('satisfies c2 but misses c1 when only clear segments are spared and no ambiguous one is found', () => {
    expect(verdictOf(['s1'])).toEqual([false, true])
  })

  it('reads the threshold from the rule: two runs of the same trace with two thresholds render two verdicts', () => {
    const lenient: Criterion = {
      ...criteria[0],
      rule: { type: 'ambiguity-net-share-at-least', threshold: 0.25 },
    }
    const strict: Criterion = {
      ...criteria[0],
      rule: { type: 'ambiguity-net-share-at-least', threshold: 0.9 },
    }

    const [lenientResult] = verdictOf(['s3'], [lenient])
    const [strictResult] = verdictOf(['s3'], [strict])

    expect(lenientResult).toBe(true)
    expect(strictResult).toBe(false)
  })

  it('rejects a c1 threshold of zero: on a minimal corpus, flagging everything would net exactly zero and satisfy it', () => {
    const zeroThreshold: Criterion = {
      ...criteria[0],
      rule: { type: 'ambiguity-net-share-at-least', threshold: 0 },
    }
    expect(() => verdictOf(['s3'], [zeroThreshold])).toThrow()
  })

  it('rejects a c1 threshold outside ]0, 1]', () => {
    const negative: Criterion = {
      ...criteria[0],
      rule: { type: 'ambiguity-net-share-at-least', threshold: -0.1 },
    }
    const tooHigh: Criterion = {
      ...criteria[0],
      rule: { type: 'ambiguity-net-share-at-least', threshold: 1.1 },
    }
    expect(() => verdictOf(['s3'], [negative])).toThrow()
    expect(() => verdictOf(['s3'], [tooHigh])).toThrow()
  })

  it('rejects a c2 threshold outside [0, 1]', () => {
    const negative: Criterion = {
      ...criteria[1],
      rule: { type: 'clear-segments-spared-at-least', threshold: -0.01 },
    }
    const tooHigh: Criterion = {
      ...criteria[1],
      rule: { type: 'clear-segments-spared-at-least', threshold: 1.01 },
    }
    expect(() => verdictOf(['s3'], [negative])).toThrow()
    expect(() => verdictOf(['s3'], [tooHigh])).toThrow()
  })

  it('rejects a rule it does not know, naming the rule and the game', () => {
    const unknown: Criterion[] = [
      { ...criteria[0], rule: { type: 'invented-rule' } },
    ]

    expect(() => verdictOf(['s3'], unknown)).toThrow('invented-rule')
    expect(() => verdictOf(['s3'], unknown)).toThrow('ambiguity-scan')
  })

  it('renders the same verdict on two evaluations of the same trace', () => {
    expect(verdictOf(['s3', 's4'])).toEqual(verdictOf(['s3', 's4']))
  })
})
