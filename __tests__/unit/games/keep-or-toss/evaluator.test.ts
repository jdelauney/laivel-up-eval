import { describe, expect, it } from 'vitest'
import type { Criterion } from '@/core/contracts/course.schema'
import { KeepOrTossEvaluator } from '@/games/keep-or-toss/keep-or-toss.evaluator'

const item = (id: string, keep: boolean) => ({
  id,
  label: `Libellé de ${id}.`,
  keep,
  reason: `Pourquoi ${id}.`,
})

const config = {
  statement: 'Consigne de test.',
  durationSeconds: 10,
  items: [
    item('p1', true),
    item('p2', false),
    item('p3', true),
    item('p4', false),
    item('p5', true),
    item('p6', false),
    item('p7', true),
    item('p8', false),
  ],
}

const criteria: Criterion[] = [
  {
    id: 'c1',
    question: 'Le taux de bon classement dépasse-t-il le seuil ?',
    rule: { type: 'correct-share-at-least', threshold: 0.75 },
    mapping: [{ dimension: 'verification', weight: 2 }],
  },
  {
    id: 'c2',
    question: 'Le tri a-t-il été bouclé dans le temps imparti ?',
    rule: { type: 'sorting-completed-in-time' },
    mapping: [{ dimension: 'verification', weight: 1 }],
  },
]

const fullCorrectAnswer = {
  verdicts: config.items.map((entry) => ({
    itemId: entry.id,
    kept: entry.keep,
  })),
  elapsedSeconds: 10,
}

const evaluator = new KeepOrTossEvaluator()

const verdictFor = (answer: unknown) =>
  evaluator
    .evaluate(answer, config, criteria)
    .reduce<Record<string, boolean>>((acc, entry) => {
      acc[entry.criterionId] = entry.satisfied
      return acc
    }, {})

describe('keep-or-toss evaluator', () => {
  it('satisfies both criteria for a perfect sort, completed within the budget', () => {
    const verdict = verdictFor(fullCorrectAnswer)

    expect(verdict.c1).toBe(true)
    expect(verdict.c2).toBe(true)
  })

  it('misses c2 alone for a perfect sort submitted past the time budget', () => {
    const verdict = verdictFor({ ...fullCorrectAnswer, elapsedSeconds: 11 })

    expect(verdict.c1).toBe(true)
    expect(verdict.c2).toBe(false)
  })

  it('misses c1 alone for a fast but wrong sort, all eight items flipped', () => {
    const verdict = verdictFor({
      verdicts: config.items.map((entry) => ({
        itemId: entry.id,
        kept: !entry.keep,
      })),
      elapsedSeconds: 1,
    })

    expect(verdict.c1).toBe(false)
    expect(verdict.c2).toBe(true)
  })

  it('misses both criteria for an unfinished, otherwise perfect, sort', () => {
    const verdict = verdictFor({
      verdicts: fullCorrectAnswer.verdicts.slice(0, 5),
      elapsedSeconds: 3,
    })

    // 5/8 = 0.625 < 0.75
    expect(verdict.c1).toBe(false)
    expect(verdict.c2).toBe(false)
  })

  it('rejects an unknown rule type', () => {
    expect(() =>
      evaluator.evaluate(fullCorrectAnswer, config, [
        {
          id: 'cx',
          question: '?',
          rule: { type: 'introuvable' },
          mapping: [{ dimension: 'verification', weight: 1 }],
        },
      ]),
    ).toThrow()
  })
})
