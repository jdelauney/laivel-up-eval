import { describe, expect, it } from 'vitest'
import { hintBudgetConfigSchema } from '@/games/hint-budget/schema/config.schema'

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

const situation = (
  id: string,
  overrides: Partial<{
    framings: ReturnType<typeof framing>[]
    hints: ReturnType<typeof hint>[]
    causes: ReturnType<typeof cause>[]
  }> = {},
) => ({
  id,
  symptom: `Symptôme ${id}.`,
  report: [`Fait 1 de ${id}.`, `Fait 2 de ${id}.`],
  framings: overrides.framings ?? [
    framing(`${id}-f1`, true),
    framing(`${id}-f2`, true),
    framing(`${id}-f3`, false),
    framing(`${id}-f4`, false),
    framing(`${id}-f5`, false),
  ],
  hints: overrides.hints ?? [
    hint(`${id}-h1`, 5),
    hint(`${id}-h2`, 10),
    hint(`${id}-h3`, 15),
  ],
  causes: overrides.causes ?? [
    cause(`${id}-c1`, false),
    cause(`${id}-c2`, true),
    cause(`${id}-c3`, false),
  ],
})

const validConfig = () => ({
  statement: 'Consigne de test.',
  wrongCutPenalty: 40,
  blindCutSurcharge: 30,
  situations: [situation('s1'), situation('s2'), situation('s3')],
})

const firstIssue = (config: unknown) => {
  const result = hintBudgetConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues[0]
}

describe('hint-budget config schema', () => {
  it('accepts three situations, each with a mixed framing and one actual cause', () => {
    const parsed = hintBudgetConfigSchema.parse(validConfig())

    expect(parsed.situations).toHaveLength(3)
  })

  it('rejects two situations sharing the same id, naming the situation', () => {
    const config = validConfig()
    config.situations[1] = situation('s1')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 1, 'id'])
    expect(issue.message).toContain('s1')
  })

  it('rejects two hints sharing the same id within a situation, naming both', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      hints: [hint('s1-h1', 5), hint('s1-h1', 10), hint('s1-h3', 15)],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'hints', 1, 'id'])
    expect(issue.message).toContain('s1-h1')
    expect(issue.message).toContain('s1')
  })

  it('rejects two causes sharing the same id within a situation, naming both', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      causes: [
        cause('s1-c1', false),
        cause('s1-c1', true),
        cause('s1-c3', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'causes', 1, 'id'])
    expect(issue.message).toContain('s1-c1')
    expect(issue.message).toContain('s1')
  })

  it('rejects two framings sharing the same id within a situation, naming both', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      framings: [
        framing('s1-f1', true),
        framing('s1-f1', false),
        framing('s1-f3', false),
        framing('s1-f4', false),
        framing('s1-f5', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'framings', 1, 'id'])
    expect(issue.message).toContain('s1-f1')
    expect(issue.message).toContain('s1')
  })

  it('rejects a situation with no actual cause, naming the situation', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      causes: [
        cause('s1-c1', false),
        cause('s1-c2', false),
        cause('s1-c3', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'causes'])
    expect(issue.message).toContain('s1')
  })

  it('rejects a situation with two actual causes, naming the situation', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      causes: [
        cause('s1-c1', true),
        cause('s1-c2', true),
        cause('s1-c3', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'causes'])
    expect(issue.message).toContain('s1')
  })

  it('rejects a situation whose every framing is established, naming the situation', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      framings: [
        framing('s1-f1', true),
        framing('s1-f2', true),
        framing('s1-f3', true),
        framing('s1-f4', true),
        framing('s1-f5', true),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'framings'])
    expect(issue.message).toContain('s1')
  })

  it('rejects a situation with no established framing, naming the situation', () => {
    const config = validConfig()
    config.situations[0] = situation('s1', {
      framings: [
        framing('s1-f1', false),
        framing('s1-f2', false),
        framing('s1-f3', false),
        framing('s1-f4', false),
        framing('s1-f5', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['situations', 0, 'framings'])
    expect(issue.message).toContain('s1')
  })

  it('rejects a blind-cut surcharge that does not strictly exceed the priciest hint, naming both amounts', () => {
    const config = validConfig()
    config.blindCutSurcharge = 15

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['blindCutSurcharge'])
    expect(issue.message).toContain('15')
  })
})
