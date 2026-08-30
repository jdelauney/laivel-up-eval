import { describe, expect, it } from 'vitest'
import type { Criterion } from '@/core/contracts/course.schema'
import { DefectHuntEvaluator } from '@/games/defect-hunt/defect-hunt.evaluator'
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

/** Cinq défauts, un budget de cent quatre-vingts secondes. */
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

const criteria: Criterion[] = [
  {
    id: 'c1',
    question: 'Au moins 80 % des défauts ont-ils été trouvés ?',
    rule: { type: 'found-ratio-at-least', threshold: 0.8 },
    mapping: [{ dimension: 'verification', weight: 2 }],
  },
  {
    id: 'c2',
    question: 'Les marques posées à côté sont-elles restées sous leur seuil ?',
    rule: { type: 'false-positives-at-most', threshold: 2 },
    mapping: [{ dimension: 'verification', weight: 2 }],
  },
  {
    id: 'c3',
    question: 'La dépendance hallucinée a-t-elle été trouvée ?',
    rule: { type: 'kinds-found-including', kinds: ['hallucinated-dependency'] },
    mapping: [{ dimension: 'verification', weight: 2 }],
  },
  {
    id: 'c4',
    question: 'La revue a-t-elle été rendue dans le temps imparti ?',
    rule: { type: 'within-time-budget' },
    mapping: [{ dimension: 'verification', weight: 1 }],
  },
]

const trace = (markedLines: number[], elapsedSeconds: number) => ({
  markedLines,
  elapsedSeconds,
})

const evaluator = new DefectHuntEvaluator()

const verdictOf = (
  markedLines: number[],
  elapsedSeconds: number,
  rules: readonly Criterion[] = criteria,
): boolean[] =>
  evaluator
    .evaluate(trace(markedLines, elapsedSeconds), config, rules)
    .map((result) => result.satisfied)

describe('defect-hunt evaluator', () => {
  it('satisfies the four criteria on four defects out of five, one false positive, rendered in time', () => {
    expect(verdictOf([2, 4, 6, 8, 1], 100)).toEqual([true, true, true, true])
  })

  it('returns one result per criterion, in the order the course declares them', () => {
    const results = evaluator.evaluate(
      trace([2, 4, 6, 8, 1], 100),
      config,
      criteria,
    )

    expect(results.map((result) => result.criterionId)).toEqual([
      'c1',
      'c2',
      'c3',
      'c4',
    ])
  })

  it('satisfies the ratio criterion exactly on its threshold, four out of five', () => {
    const [ratio] = verdictOf([2, 4, 6, 8], 100)
    expect(ratio).toBe(true)
  })

  it('satisfies the false positives criterion exactly on its threshold', () => {
    // Deux marques posées à côté, sur les dix lignes de l'extrait : le seuil
    // vaut exactement deux et doit encore tenir.
    const [, falsePositives] = verdictOf([2, 4, 6, 8, 1, 3], 100)
    expect(falsePositives).toBe(true)
  })

  it('misses the nature criterion when every visible defect is found without the hallucinated dependency', () => {
    const [ratio, , kinds] = verdictOf([2, 4, 8, 10], 100)
    expect(ratio).toBe(true)
    expect(kinds).toBe(false)
  })

  it('satisfies the time criterion exactly at the budget', () => {
    const [, , , time] = verdictOf([2, 4, 6, 8, 1], 180)
    expect(time).toBe(true)
  })

  it('misses only the time criterion one second beyond the budget, the other three unchanged', () => {
    expect(verdictOf([2, 4, 6, 8, 1], 181)).toEqual([true, true, true, false])
  })

  it('satisfies the ratio but misses the false positives criterion when every line is marked', () => {
    const allLines = Array.from({ length: 10 }, (_, index) => index + 1)
    const [ratio, falsePositives] = verdictOf(allLines, 100)

    expect(ratio).toBe(true)
    expect(falsePositives).toBe(false)
  })

  it('renders the same verdict regardless of the mark order', () => {
    expect(verdictOf([8, 2, 6, 4, 1], 100)).toEqual(
      verdictOf([1, 2, 4, 6, 8], 100),
    )
  })

  it('rejects a rule it does not know, naming the rule and the game', () => {
    const unknown: Criterion[] = [
      { ...criteria[0], rule: { type: 'invented-rule' } },
    ]

    expect(() => evaluator.evaluate(trace([2], 10), config, unknown)).toThrow(
      'invented-rule',
    )
    expect(() => evaluator.evaluate(trace([2], 10), config, unknown)).toThrow(
      'defect-hunt',
    )
  })

  it('ignores no seuil of its own for the time budget: it always reads the configuration', () => {
    const looserConfig = defectHuntConfigSchema.parse({
      ...config,
      timeLimitSeconds: 60,
    })

    const results = evaluator.evaluate(
      trace([2, 4, 6, 8, 1], 90),
      looserConfig,
      [criteria[3]],
    )

    expect(results[0].satisfied).toBe(false)
  })
})
