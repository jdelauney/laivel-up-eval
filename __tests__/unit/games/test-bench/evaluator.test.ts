import { describe, expect, it } from 'vitest'
import type { Criterion } from '../../../../src/core/contracts/course.schema'
import { TestBenchEvaluator } from '../../../../src/games/test-bench/test-bench.evaluator'

const config = {
  statement: 'Retenez ce qui est vérifiable.',
  propositions: [
    { id: 'p1', text: 'Vérifiable', expected: true },
    { id: 'p2', text: 'Faux', expected: false },
    { id: 'p3', text: 'Vérifiable aussi', expected: true },
  ],
}

const criteria: Criterion[] = [
  {
    id: 'c1',
    question: 'Toutes les propositions attendues sont-elles retenues ?',
    rule: { type: 'all-expected-selected' },
    mapping: [{ dimension: 'verification', weight: 1 }],
  },
  {
    id: 'c2',
    question: 'Aucune proposition non attendue n’est-elle retenue ?',
    rule: { type: 'no-unexpected-selected' },
    mapping: [{ dimension: 'pilotage-contexte', weight: 1 }],
  },
]

const evaluator = new TestBenchEvaluator()

describe('test bench evaluator', () => {
  it('satisfies both criteria on a perfect answer', () => {
    const results = evaluator.evaluate(
      { selected: ['p1', 'p3'] },
      config,
      criteria,
    )

    expect(results).toEqual([
      { criterionId: 'c1', satisfied: true },
      { criterionId: 'c2', satisfied: true },
    ])
  })

  it('fails the completeness criterion when an expected proposition is missing', () => {
    const results = evaluator.evaluate({ selected: ['p1'] }, config, criteria)

    expect(results[0].satisfied).toBe(false)
    expect(results[1].satisfied).toBe(true)
  })

  it('fails the precision criterion when an unexpected proposition is selected', () => {
    const results = evaluator.evaluate(
      { selected: ['p1', 'p2', 'p3'] },
      config,
      criteria,
    )

    expect(results[0].satisfied).toBe(true)
    expect(results[1].satisfied).toBe(false)
  })

  it('returns one result per criterion, in the order the course declares them', () => {
    const results = evaluator.evaluate({ selected: [] }, config, criteria)

    expect(results.map((result) => result.criterionId)).toEqual(['c1', 'c2'])
  })

  it('produces the same results on two runs of the same answer', () => {
    const answer = { selected: ['p1'] }

    expect(evaluator.evaluate(answer, config, criteria)).toEqual(
      evaluator.evaluate(answer, config, criteria),
    )
  })

  it('rejects an answer that does not match the game contract', () => {
    expect(() =>
      evaluator.evaluate({ selected: 'p1' }, config, criteria),
    ).toThrow()
  })

  it('rejects a rule it does not know, naming it', () => {
    const unknownRule: Criterion[] = [
      { ...criteria[0], rule: { type: 'invented-rule' } },
    ]

    expect(() =>
      evaluator.evaluate({ selected: [] }, config, unknownRule),
    ).toThrow('invented-rule')
  })
})
