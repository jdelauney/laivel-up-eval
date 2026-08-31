import { describe, expect, it } from 'vitest'
import type { Criterion } from '@/core/contracts/course.schema'
import { FlowOrderEvaluator } from '@/games/flow-order/flow-order.evaluator'
import {
  type FlowOrderConfig,
  flowOrderConfigSchema,
} from '@/games/flow-order/schema/config.schema'

const step = (id: string, rank: number) => ({
  id,
  label: `Libellé de ${id}.`,
  rank,
  note: `Ce qu'apporte ${id}.`,
})

/** Sept étapes, rangs 1..7, sur le modèle du corpus réel de `g5-2`. */
const config: FlowOrderConfig = flowOrderConfigSchema.parse({
  statement: 'Consigne de test.',
  steps: [
    step('s1', 1),
    step('s2', 2),
    step('s3', 3),
    step('s4', 4),
    step('s5', 5),
    step('s6', 6),
    step('s7', 7),
  ],
  initialOrder: ['s3', 's1', 's6', 's2', 's7', 's5', 's4'],
})

const criteria: Criterion[] = [
  {
    id: 'c1',
    question: "La frise est-elle dans l'ordre exact ?",
    rule: { type: 'order-exact' },
    mapping: [{ dimension: 'pilotage-contexte', weight: 2 }],
  },
  {
    id: 'c2',
    question: 'Chaque étape est-elle à sa place, à une position près ?',
    rule: { type: 'order-within-displacement', maxDisplacement: 1 },
    mapping: [{ dimension: 'pilotage-contexte', weight: 1 }],
  },
]

const evaluator = new FlowOrderEvaluator()

const verdictOf = (
  orderedIds: string[],
  rules: readonly Criterion[] = criteria,
): boolean[] =>
  evaluator.evaluate({ orderedIds }, config, rules).map((r) => r.satisfied)

describe('flow-order evaluator', () => {
  it('satisfies both criteria for the exact order', () => {
    expect(verdictOf(['s1', 's2', 's3', 's4', 's5', 's6', 's7'])).toEqual([
      true,
      true,
    ])
  })

  it('satisfies c2 but misses c1 for a swap of two neighbouring steps', () => {
    const [c1, c2] = verdictOf(['s2', 's1', 's3', 's4', 's5', 's6', 's7'])
    expect(c1).toBe(false)
    expect(c2).toBe(true)
  })

  it('misses both criteria for the end-to-end reversal', () => {
    const [c1, c2] = verdictOf(['s7', 's6', 's5', 's4', 's3', 's2', 's1'])
    expect(c1).toBe(false)
    expect(c2).toBe(false)
  })

  it('misses both criteria for the initialOrder written by the corpus', () => {
    const [c1, c2] = verdictOf([...config.initialOrder])
    expect(c1).toBe(false)
    expect(c2).toBe(false)
  })

  it('reads the tolerance from the rule: two runs of the same trace with two thresholds render two verdicts', () => {
    const lenient: Criterion = {
      ...criteria[1],
      rule: { type: 'order-within-displacement', maxDisplacement: 5 },
    }
    const strict: Criterion = {
      ...criteria[1],
      rule: { type: 'order-within-displacement', maxDisplacement: 0 },
    }

    const swapped = ['s2', 's1', 's3', 's4', 's5', 's6', 's7']
    const [lenientResult] = verdictOf(swapped, [lenient])
    const [strictResult] = verdictOf(swapped, [strict])

    expect(lenientResult).toBe(true)
    expect(strictResult).toBe(false)
  })

  it('rejects a rule it does not know, naming the rule and the game', () => {
    const unknown: Criterion[] = [
      { ...criteria[0], rule: { type: 'invented-rule' } },
    ]

    expect(() =>
      verdictOf(['s1', 's2', 's3', 's4', 's5', 's6', 's7'], unknown),
    ).toThrow('invented-rule')
    expect(() =>
      verdictOf(['s1', 's2', 's3', 's4', 's5', 's6', 's7'], unknown),
    ).toThrow('flow-order')
  })

  it('renders the same verdict on two evaluations of the same trace', () => {
    const trace = ['s3', 's1', 's2', 's4', 's5', 's6', 's7']
    expect(verdictOf(trace)).toEqual(verdictOf(trace))
  })
})
