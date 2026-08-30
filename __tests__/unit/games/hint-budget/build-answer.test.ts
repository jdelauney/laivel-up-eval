import { describe, expect, it } from 'vitest'
import { buildHintBudgetAnswer } from '@/games/hint-budget/actions/build-hint-budget-answer.action'
import { IncompleteTraceError } from '@/games/hint-budget/schema/answer.schema'
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
  hints: [hint(`${id}-h1`, 5), hint(`${id}-h2`, 10), hint(`${id}-h3`, 15)],
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

const attempt = (situationId: string) => ({
  situationId,
  framing: null,
  boughtHintIds: [],
  cutCauseId: `${situationId}-c2`,
})

describe('build hint-budget answer', () => {
  it('orders the trace on the configuration, not on the order the situations were played', () => {
    const answer = buildHintBudgetAnswer(config, [
      attempt('s3'),
      attempt('s1'),
      attempt('s2'),
    ])

    expect(answer.attempts.map((entry) => entry.situationId)).toEqual([
      's1',
      's2',
      's3',
    ])
  })

  it('rejects a played situation missing from the attempts, naming the situation', () => {
    const call = () =>
      buildHintBudgetAnswer(config, [attempt('s1'), attempt('s2')])

    expect(call).toThrow(IncompleteTraceError)
    expect(call).toThrow('s3')
  })

  it('rejects an attempt cutting a cause absent from its situation', () => {
    const call = () =>
      buildHintBudgetAnswer(config, [
        { ...attempt('s1'), cutCauseId: 'introuvable' },
        attempt('s2'),
        attempt('s3'),
      ])

    expect(call).toThrow()
  })

  it('produces the identical trace for two games played in a different order', () => {
    const first = buildHintBudgetAnswer(config, [
      attempt('s1'),
      attempt('s2'),
      attempt('s3'),
    ])
    const second = buildHintBudgetAnswer(config, [
      attempt('s3'),
      attempt('s2'),
      attempt('s1'),
    ])

    expect(second).toEqual(first)
  })
})
