import { describe, expect, it } from 'vitest'
import type { Criterion } from '@/core/contracts/course.schema'
import { HintBudgetEvaluator } from '@/games/hint-budget/hint-budget.evaluator'
import {
  type HintBudgetConfig,
  hintBudgetConfigSchema,
} from '@/games/hint-budget/schema/config.schema'

const framing = (id: string, established: boolean) => ({
  id,
  text: `Lecture ${id}.`,
  established,
})

const hint = (id: string, cost: number) => ({
  id,
  label: `Indice ${id}.`,
  cost,
  text: `Texte de l'indice ${id}.`,
})

const cause = (id: string, actual: boolean) => ({
  id,
  text: `Cause ${id}.`,
  actual,
  verification: `Vérification ${id}.`,
})

/**
 * Cinq indices `5 · 10 · 15 · 20 · 25`, cinq lectures dont deux établies
 * (`f1`, `f2`), une cause réelle (`c2`) : sur le modèle du corpus réel.
 */
const situation = (id: string) => ({
  id,
  symptom: `Symptôme ${id}.`,
  report: [`Fait 1 de ${id}.`, `Fait 2 de ${id}.`],
  framings: [
    framing(`${id}-f1`, true),
    framing(`${id}-f2`, true),
    framing(`${id}-f3`, false),
    framing(`${id}-f4`, false),
    framing(`${id}-f5`, false),
  ],
  hints: [
    hint(`${id}-h1`, 5),
    hint(`${id}-h2`, 10),
    hint(`${id}-h3`, 15),
    hint(`${id}-h4`, 20),
    hint(`${id}-h5`, 25),
  ],
  causes: [
    cause(`${id}-c1`, false),
    cause(`${id}-c2`, true),
    cause(`${id}-c3`, false),
  ],
})

const config: HintBudgetConfig = hintBudgetConfigSchema.parse({
  statement: 'Consigne de test.',
  wrongCutPenalty: 40,
  blindCutSurcharge: 30,
  situations: [situation('s1'), situation('s2'), situation('s3')],
})

const attempt = (
  situationId: string,
  overrides: Partial<{
    framing: { retainedIds: string[]; afterHints: number } | null
    boughtHintIds: string[]
    cutCauseId: string
  }> = {},
) => ({
  situationId,
  framing: overrides.framing === undefined ? null : overrides.framing,
  boughtHintIds: overrides.boughtHintIds ?? [],
  cutCauseId: overrides.cutCauseId ?? `${situationId}-c2`,
})

const groundedFramingOf = (situationId: string, afterHints: number) => ({
  retainedIds: [`${situationId}-f1`, `${situationId}-f2`],
  afterHints,
})

/**
 * Trois critères depuis la scission du 30/08, après revue : `c2` mesurait à
 * la fois l'ordre et le fondement sous une question qui ne parlait que
 * d'ordre. `c2` ne lit plus que l'ordre, `c3` reprend le fondement seul.
 */
const criteria: Criterion[] = [
  {
    id: 'c1',
    question:
      "L'incident a-t-il été résolu en achetant moins de la moitié des indices ?",
    rule: { type: 'frugal-solves-at-least', share: 0.5, threshold: 2 },
    mapping: [{ dimension: 'pilotage-contexte', weight: 2 }],
  },
  {
    id: 'c2',
    question: 'Le contexte a-t-il été posé avant le premier indice ?',
    rule: { type: 'framed-first-at-least', threshold: 2 },
    mapping: [{ dimension: 'pilotage-contexte', weight: 1 }],
  },
  {
    id: 'c3',
    question: 'Ce contexte était-il fondé sur le rapport ?',
    rule: { type: 'grounded-framings-at-least', threshold: 2 },
    mapping: [{ dimension: 'pilotage-contexte', weight: 1 }],
  },
]

const evaluator = new HintBudgetEvaluator()

const verdictOf = (
  attempts: ReturnType<typeof attempt>[],
  rules: readonly Criterion[] = criteria,
): boolean[] =>
  evaluator
    .evaluate({ attempts }, config, rules)
    .map((result) => result.satisfied)

describe('hint-budget evaluator', () => {
  it('accepts a configuration of three situations and three declarative criteria', () => {
    expect(config.situations).toHaveLength(3)
    expect(criteria).toHaveLength(3)
    expect(() =>
      verdictOf([attempt('s1'), attempt('s2'), attempt('s3')]),
    ).not.toThrow()
  })

  it('satisfies all three criteria when two situations are solved with at most two of five hints, framed grounded and first', () => {
    expect(
      verdictOf([
        attempt('s1', {
          boughtHintIds: ['s1-h1', 's1-h2'],
          framing: groundedFramingOf('s1', 0),
        }),
        attempt('s2', {
          boughtHintIds: ['s2-h1'],
          framing: groundedFramingOf('s2', 0),
        }),
        attempt('s3', { boughtHintIds: [], cutCauseId: 's3-c1' }),
      ]),
    ).toEqual([true, true, true])
  })

  it('misses the frugality criterion when every situation is solved after buying four of five hints', () => {
    const [frugality] = verdictOf([
      attempt('s1', { boughtHintIds: ['s1-h1', 's1-h2', 's1-h3', 's1-h4'] }),
      attempt('s2', { boughtHintIds: ['s2-h1', 's2-h2', 's2-h3', 's2-h4'] }),
      attempt('s3', { boughtHintIds: ['s3-h1', 's3-h2', 's3-h3', 's3-h4'] }),
    ])

    expect(frugality).toBe(false)
  })

  it('misses the frugality criterion for a player who cuts blind and wrong everywhere: never solved, never frugal', () => {
    const [frugality] = verdictOf([
      attempt('s1', { cutCauseId: 's1-c1' }),
      attempt('s2', { cutCauseId: 's2-c1' }),
      attempt('s3', { cutCauseId: 's3-c1' }),
    ])

    expect(frugality).toBe(false)
  })

  /**
   * Un cadrage exact mais posé après le premier achat manque l'ordre (`c2`)
   * dans les trois situations, mais reste fondé (`c3`) : les deux règles
   * sont indépendantes depuis la scission du 30/08.
   */
  it('misses the order criterion but satisfies the grounding criterion when the exact framing is posted after the first purchase in every situation', () => {
    const [, orderCriterion, groundingCriterion] = verdictOf([
      attempt('s1', {
        boughtHintIds: ['s1-h1'],
        framing: groundedFramingOf('s1', 1),
      }),
      attempt('s2', {
        boughtHintIds: ['s2-h1'],
        framing: groundedFramingOf('s2', 1),
      }),
      attempt('s3', {
        boughtHintIds: ['s3-h1'],
        framing: groundedFramingOf('s3', 1),
      }),
    ])

    expect(orderCriterion).toBe(false)
    expect(groundingCriterion).toBe(true)
  })

  it('misses both the order and the grounding criteria when no framing is ever posted', () => {
    const [, orderCriterion, groundingCriterion] = verdictOf([
      attempt('s1'),
      attempt('s2'),
      attempt('s3'),
    ])

    expect(orderCriterion).toBe(false)
    expect(groundingCriterion).toBe(false)
  })

  /**
   * Un cadrage posé en premier, mais qui retient une lecture en moins que ce
   * que le rapport établit, satisfait l'ordre (`c2`) sans satisfaire le
   * fondement (`c3`) — le cas que la question affichée de `c2` masquait
   * avant la scission.
   */
  it('satisfies the order criterion but misses the grounding criterion when the framing is posted first but incomplete', () => {
    const partialFramingOf = (situationId: string) => ({
      retainedIds: [`${situationId}-f1`],
      afterHints: 0,
    })

    const [, orderCriterion, groundingCriterion] = verdictOf([
      attempt('s1', { framing: partialFramingOf('s1') }),
      attempt('s2', { framing: partialFramingOf('s2') }),
      attempt('s3', { framing: partialFramingOf('s3') }),
    ])

    expect(orderCriterion).toBe(true)
    expect(groundingCriterion).toBe(false)
  })

  /**
   * Isole la borne stricte de `frugal-solves-at-least`, sur une situation à
   * quatre indices : en acheter exactement deux, la moitié, ne doit pas
   * compter comme frugal — la story dit « moins de la moitié ».
   */
  it('does not count a situation as frugal when exactly half its hints were bought', () => {
    const fourHintSituation = {
      ...situation('s1'),
      hints: [
        hint('s1-h1', 5),
        hint('s1-h2', 10),
        hint('s1-h3', 15),
        hint('s1-h4', 20),
      ],
    }
    const halfConfig = hintBudgetConfigSchema.parse({
      statement: config.statement,
      wrongCutPenalty: config.wrongCutPenalty,
      blindCutSurcharge: config.blindCutSurcharge,
      situations: [fourHintSituation, situation('s2'), situation('s3')],
    })

    // s2 et s3 sont laissées non résolues : seule s1 doit décider du
    // verdict, isolant la borne stricte de la moitié sur le seul cas
    // d'intérêt du test.
    const [frugality] = evaluator
      .evaluate(
        {
          attempts: [
            attempt('s1', { boughtHintIds: ['s1-h1', 's1-h2'] }),
            attempt('s2', { boughtHintIds: [], cutCauseId: 's2-c1' }),
            attempt('s3', { boughtHintIds: [], cutCauseId: 's3-c1' }),
          ],
        },
        halfConfig,
        criteria,
      )
      .map((result) => result.satisfied)

    expect(frugality).toBe(false)
  })

  it('rejects a rule it does not know, naming the rule and the game', () => {
    const unknown: Criterion[] = [
      { ...criteria[0], rule: { type: 'invented-rule' } },
    ]

    const attempts = [attempt('s1'), attempt('s2'), attempt('s3')]

    expect(() => verdictOf(attempts, unknown)).toThrow('invented-rule')
    expect(() => verdictOf(attempts, unknown)).toThrow('hint-budget')
  })

  it('renders the same verdict on two evaluations of the same trace', () => {
    const attempts = [
      attempt('s1', {
        boughtHintIds: ['s1-h1'],
        framing: groundedFramingOf('s1', 0),
      }),
      attempt('s2', { boughtHintIds: ['s2-h1', 's2-h2', 's2-h3'] }),
      attempt('s3', { cutCauseId: 's3-c1' }),
    ]

    expect(verdictOf(attempts)).toEqual(verdictOf(attempts))
  })
})
