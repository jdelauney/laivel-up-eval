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
    question:
      "La part de pratiques bien classées sur l'ensemble du lot atteint-elle le seuil ?",
    rule: { type: 'correct-share-at-least', threshold: 0.75 },
    mapping: [{ dimension: 'verification', weight: 2, evidence: 'measured' }],
  },
  {
    id: 'c2',
    question:
      "Le lot a-t-il été trié en entier avant la fin du temps imparti, avec un classement qui dépasse ce qu'un seul geste répété aurait obtenu ?",
    rule: { type: 'sorting-completed-beyond-blind-floor' },
    mapping: [{ dimension: 'verification', weight: 1, evidence: 'measured' }],
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

  it('misses both criteria for a fast but wrong sort, all eight items flipped: 0/8 sits well under the blind floor of 4/8', () => {
    const verdict = verdictFor({
      verdicts: config.items.map((entry) => ({
        itemId: entry.id,
        kept: !entry.keep,
      })),
      elapsedSeconds: 1,
    })

    expect(verdict.c1).toBe(false)
    expect(verdict.c2).toBe(false)
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

  /**
   * Constat 1 de la revue du 31/08 : avant le correctif, `c2` ne lisait que
   * `completedInTime` et « tout garder » — le geste unique répété, aucune
   * carte lue — le tenait en douze gestes. Ce lot est équilibré 4/4 :
   * garder tout obtient exactement `4/8 = 0.5`, le plancher du geste
   * unique. `0.5` n'est pas strictement au-dessus de lui-même : le critère
   * doit rester manqué malgré un tri complet et dans le budget.
   */
  it('misses c2 for the blind single-gesture profile — keeping everything — even complete and within budget', () => {
    const verdict = verdictFor({
      verdicts: config.items.map((entry) => ({ itemId: entry.id, kept: true })),
      elapsedSeconds: 1,
    })

    expect(verdict.c1).toBe(false)
    expect(verdict.c2).toBe(false)
  })

  it('misses c2 for the blind single-gesture profile — tossing everything — the mirror case', () => {
    const verdict = verdictFor({
      verdicts: config.items.map((entry) => ({
        itemId: entry.id,
        kept: false,
      })),
      elapsedSeconds: 1,
    })

    expect(verdict.c1).toBe(false)
    expect(verdict.c2).toBe(false)
  })

  it('satisfies c2 for one correct verdict beyond the blind floor (5/8 > 4/8), complete and in time', () => {
    const verdict = verdictFor({
      verdicts: fullCorrectAnswer.verdicts.map((entry, index) =>
        index < 3 ? { ...entry, kept: !entry.kept } : entry,
      ),
      elapsedSeconds: 1,
    })

    // 5 justes sur 8 : au-dessus du plancher (4/8), sous le seuil de c1 (0.75).
    expect(verdict.c1).toBe(false)
    expect(verdict.c2).toBe(true)
  })

  it('rejects an unknown rule type', () => {
    expect(() =>
      evaluator.evaluate(fullCorrectAnswer, config, [
        {
          id: 'cx',
          question: '?',
          rule: { type: 'introuvable' },
          mapping: [
            { dimension: 'verification', weight: 1, evidence: 'measured' },
          ],
        },
      ]),
    ).toThrow()
  })

  /**
   * Constat 9 de la revue du 31/08 : un seuil déclaré dans le parcours qui
   * ne dépasse pas le plancher du geste unique répété rendrait ce dernier
   * gagnant sans qu'aucun test unitaire ne rougisse. Ce lot est équilibré
   * 4/4, plancher `0.5` : un seuil de `0.5` ou moins doit faire échouer le
   * chargement, pas silencieusement laisser passer « tout garder ».
   */
  it('throws when the declared threshold of correct-share-at-least does not exceed the blind floor of this lot', () => {
    expect(() =>
      evaluator.evaluate(fullCorrectAnswer, config, [
        {
          id: 'c1',
          question: '?',
          rule: { type: 'correct-share-at-least', threshold: 0.5 },
          mapping: [
            { dimension: 'verification', weight: 2, evidence: 'measured' },
          ],
        },
      ]),
    ).toThrow(/plancher du geste unique/)
  })

  it('rejects a correct-share-at-least threshold outside [0, 1] at the rule schema itself', () => {
    expect(() =>
      evaluator.evaluate(fullCorrectAnswer, config, [
        {
          id: 'c1',
          question: '?',
          rule: { type: 'correct-share-at-least', threshold: 1.5 },
          mapping: [
            { dimension: 'verification', weight: 2, evidence: 'measured' },
          ],
        },
      ]),
    ).toThrow()
  })
})
