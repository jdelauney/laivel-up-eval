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
    mapping: [{ dimension: 'verification', weight: 1, evidence: 'measured' }],
  },
  {
    id: 'c2',
    question: 'Aucune proposition non attendue n’est-elle retenue ?',
    rule: { type: 'no-unexpected-selected' },
    mapping: [
      { dimension: 'pilotage-contexte', weight: 1, evidence: 'measured' },
    ],
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

    expect(results.map((result) => result.satisfied)).toEqual([true, true])
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

  it('names each expected proposition by its config text, never by its id, held when selected', () => {
    const [c1] = evaluator.evaluate({ selected: ['p1'] }, config, criteria)

    expect(c1.attributions).toEqual([
      { label: 'Vérifiable', held: true },
      { label: 'Vérifiable aussi', held: false },
    ])
  })

  it('holds the unexpected proposition entry when it was correctly left out, on the absence pattern', () => {
    const [, c2] = evaluator.evaluate(
      { selected: ['p1', 'p3'] },
      config,
      criteria,
    )

    expect(c2.attributions).toEqual([{ label: 'Faux', held: true }])
  })

  it('misses the unexpected proposition entry when it was wrongly selected', () => {
    const [, c2] = evaluator.evaluate(
      { selected: ['p1', 'p2', 'p3'] },
      config,
      criteria,
    )

    expect(c2.attributions).toEqual([{ label: 'Faux', held: false }])
  })

  it('renders the same attributions on two evaluations of the same answer', () => {
    const answer = { selected: ['p1'] }

    expect(
      evaluator.evaluate(answer, config, criteria).map((r) => r.attributions),
    ).toEqual(
      evaluator.evaluate(answer, config, criteria).map((r) => r.attributions),
    )
  })
})
