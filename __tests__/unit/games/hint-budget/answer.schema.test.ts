import { describe, expect, it } from 'vitest'
import {
  ForgedFramingError,
  IncompleteTraceError,
  parseHintBudgetTrace,
  UnknownCauseError,
  UnknownFramingError,
  UnknownHintError,
  UnknownSituationError,
} from '@/games/hint-budget/schema/answer.schema'
import {
  type HintBudgetConfig,
  hintBudgetConfigSchema,
} from '@/games/hint-budget/schema/config.schema'

const framing = (id: string, established: boolean) => ({
  id,
  text: `Lecture ${id}.`,
  established,
})

const hint = (id: string, cost: number, eliminates: string[] = []) => ({
  id,
  label: `Indice ${id}.`,
  cost,
  text: `Texte de l'indice ${id}.`,
  eliminates,
})

const cause = (id: string, actual: boolean, ruledOutByReport = false) => ({
  id,
  text: `Cause ${id}.`,
  actual,
  verification: `Vérification ${id}.`,
  ruledOutByReport,
})

/**
 * Quatre indices, pas trois : le chemin frugal du contrat de config exige de
 * ramener le champ à une cause avec au plus `floor(hints.length / 2)`
 * indices, et à trois causes / trois indices ce plafond ne laisse aucune
 * marge (voir `config.schema.ts`). `h1` et `h2` écartent chacun une cause
 * non réelle ; leur combinaison ramène le champ à la seule cause réelle.
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
    hint(`${id}-h1`, 5, [`${id}-c1`]),
    hint(`${id}-h2`, 10, [`${id}-c4`]),
    hint(`${id}-h3`, 15, [`${id}-c4`]),
    hint(`${id}-h4`, 20, [`${id}-c4`]),
  ],
  causes: [
    cause(`${id}-c1`, false),
    cause(`${id}-c2`, true),
    cause(`${id}-c3`, false),
    cause(`${id}-c4`, false, true),
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

describe('hint-budget answer schema', () => {
  it('accepts a complete trace, one attempt per situation', () => {
    const trace = parseHintBudgetTrace(
      { attempts: [attempt('s1'), attempt('s2'), attempt('s3')] },
      config,
    )

    expect(trace.attempts).toHaveLength(3)
  })

  it('rejects a trace omitting a situation, naming the missing situation', () => {
    const call = () =>
      parseHintBudgetTrace({ attempts: [attempt('s1'), attempt('s2')] }, config)

    expect(call).toThrow(IncompleteTraceError)
    expect(call).toThrow('s3')
  })

  it('rejects an attempt aiming at a situation absent from the configuration, naming the situation', () => {
    const call = () =>
      parseHintBudgetTrace(
        {
          attempts: [
            attempt('s1'),
            attempt('s2'),
            attempt('s3'),
            attempt('s9'),
          ],
        },
        config,
      )

    expect(call).toThrow(UnknownSituationError)
    expect(call).toThrow('s9')
  })

  it('rejects an attempt cutting a cause absent from its situation, naming the cause and the situation', () => {
    const call = () =>
      parseHintBudgetTrace(
        {
          attempts: [
            attempt('s1', { cutCauseId: 'introuvable' }),
            attempt('s2'),
            attempt('s3'),
          ],
        },
        config,
      )

    expect(call).toThrow(UnknownCauseError)
    expect(call).toThrow('introuvable')
    expect(call).toThrow('s1')
  })

  it('rejects an attempt buying a hint absent from its situation, naming the hint and the situation', () => {
    const call = () =>
      parseHintBudgetTrace(
        {
          attempts: [
            attempt('s1', { boughtHintIds: ['introuvable'] }),
            attempt('s2'),
            attempt('s3'),
          ],
        },
        config,
      )

    expect(call).toThrow(UnknownHintError)
    expect(call).toThrow('introuvable')
    expect(call).toThrow('s1')
  })

  it('rejects a framing retaining a reading absent from its situation, naming the reading and the situation', () => {
    const call = () =>
      parseHintBudgetTrace(
        {
          attempts: [
            attempt('s1', {
              framing: { retainedIds: ['introuvable'], afterHints: 0 },
            }),
            attempt('s2'),
            attempt('s3'),
          ],
        },
        config,
      )

    expect(call).toThrow(UnknownFramingError)
    expect(call).toThrow('introuvable')
    expect(call).toThrow('s1')
  })

  it('rejects a framing whose afterHints exceeds the hints actually bought, naming the situation', () => {
    const call = () =>
      parseHintBudgetTrace(
        {
          attempts: [
            attempt('s1', {
              framing: { retainedIds: [], afterHints: 2 },
              boughtHintIds: ['s1-h1'],
            }),
            attempt('s2'),
            attempt('s3'),
          ],
        },
        config,
      )

    expect(call).toThrow(ForgedFramingError)
    expect(call).toThrow('s1')
  })

  it('rejects a trace covering the same situation twice', () => {
    const call = () =>
      parseHintBudgetTrace(
        {
          attempts: [
            attempt('s1'),
            attempt('s1'),
            attempt('s2'),
            attempt('s3'),
          ],
        },
        config,
      )

    expect(call).toThrow()
  })

  it('rejects a trace buying the same hint twice within the same situation', () => {
    const call = () =>
      parseHintBudgetTrace(
        {
          attempts: [
            attempt('s1', { boughtHintIds: ['s1-h1', 's1-h1'] }),
            attempt('s2'),
            attempt('s3'),
          ],
        },
        config,
      )

    expect(call).toThrow()
  })

  it('rejects a trace retaining the same framing reading twice within the same attempt', () => {
    const call = () =>
      parseHintBudgetTrace(
        {
          attempts: [
            attempt('s1', {
              framing: { retainedIds: ['s1-f1', 's1-f1'], afterHints: 0 },
            }),
            attempt('s2'),
            attempt('s3'),
          ],
        },
        config,
      )

    expect(call).toThrow()
  })
})
