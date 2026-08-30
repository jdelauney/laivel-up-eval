import { describe, expect, it } from 'vitest'
import { lieDetectorConfigSchema } from '@/games/lie-detector/schema/config.schema'

const claim = (
  id: string,
  text: string,
  lying: boolean,
  verification = `vérification ${id}`,
) => ({ id, text, lying, verification })

const round = (
  id: string,
  targetId: string,
  overrides: Partial<{
    claims: ReturnType<typeof claim>[]
    argument: string
  }> = {},
) => ({
  id,
  prompt: `Mise en situation ${id}.`,
  claims: overrides.claims ?? [
    claim(`${id}-a`, 'Affirmation A.', false),
    claim(`${id}-b`, 'Affirmation B.', true),
    claim(`${id}-c`, 'Affirmation C.', false),
    claim(`${id}-d`, 'Affirmation D.', false),
  ],
  objection: { targetId, argument: overrides.argument ?? 'Argument de test.' },
})

/**
 * Trois manches, une objection fondée (r1, pointe la menteuse b) et deux
 * creuses (r2, r3, pointent une vraie) : passe le garde-fou anti-triche.
 */
const validConfig = () => ({
  statement: 'Consigne de test.',
  rounds: [round('r1', 'r1-b'), round('r2', 'r2-a'), round('r3', 'r3-c')],
})

const firstIssue = (config: unknown) => {
  const result = lieDetectorConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues[0]
}

describe('lie-detector config schema', () => {
  it('accepts three rounds, one founded objection and two hollow', () => {
    const parsed = lieDetectorConfigSchema.parse(validConfig())

    expect(parsed.rounds).toHaveLength(3)
  })

  it('rejects two rounds sharing the same id, naming the round', () => {
    const config = validConfig()
    config.rounds[1] = round('r1', 'r1-a')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['rounds', 1, 'id'])
    expect(issue.message).toContain('r1')
  })

  it('rejects two claims sharing the same id within a round, naming both', () => {
    const config = validConfig()
    config.rounds[0] = round('r1', 'r1-b', {
      claims: [
        claim('r1-a', 'Affirmation A.', false),
        claim('r1-a', 'Affirmation A bis.', true),
        claim('r1-c', 'Affirmation C.', false),
        claim('r1-d', 'Affirmation D.', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['rounds', 0, 'claims', 1, 'id'])
    expect(issue.message).toContain('r1-a')
    expect(issue.message).toContain('r1')
  })

  it('rejects a round with no lying claim, naming the round', () => {
    const config = validConfig()
    config.rounds[0] = round('r1', 'r1-a', {
      claims: [
        claim('r1-a', 'Affirmation A.', false),
        claim('r1-b', 'Affirmation B.', false),
        claim('r1-c', 'Affirmation C.', false),
        claim('r1-d', 'Affirmation D.', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['rounds', 0, 'claims'])
    expect(issue.message).toContain('r1')
  })

  it('rejects a round with two lying claims, naming the round', () => {
    const config = validConfig()
    config.rounds[0] = round('r1', 'r1-b', {
      claims: [
        claim('r1-a', 'Affirmation A.', true),
        claim('r1-b', 'Affirmation B.', true),
        claim('r1-c', 'Affirmation C.', false),
        claim('r1-d', 'Affirmation D.', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['rounds', 0, 'claims'])
    expect(issue.message).toContain('r1')
  })

  it('rejects an objection targeting a claim absent from its round, naming the target', () => {
    const config = validConfig()
    config.rounds[0] = round('r1', 'absent-de-r1')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['rounds', 0, 'objection', 'targetId'])
    expect(issue.message).toContain('absent-de-r1')
  })

  it('rejects a corpus whose every objection is hollow, pointing only at true claims', () => {
    const config = validConfig()
    config.rounds = [
      round('r1', 'r1-a'),
      round('r2', 'r2-a'),
      round('r3', 'r3-a'),
    ]

    expect(firstIssue(config).path).toEqual(['rounds'])
  })

  it('rejects a corpus whose every objection is founded, pointing only at the liar', () => {
    const config = validConfig()
    config.rounds = [
      round('r1', 'r1-b'),
      round('r2', 'r2-b'),
      round('r3', 'r3-b'),
    ]

    expect(firstIssue(config).path).toEqual(['rounds'])
  })

  it('accepts a claim text at exactly the 135-character mobile layout budget', () => {
    const config = validConfig()
    config.rounds[0] = round('r1', 'r1-b', {
      claims: [
        claim('r1-a', 'A'.repeat(135), false),
        claim('r1-b', 'Affirmation B.', true),
        claim('r1-c', 'Affirmation C.', false),
        claim('r1-d', 'Affirmation D.', false),
      ],
    })

    const parsed = lieDetectorConfigSchema.parse(config)
    expect(parsed.rounds[0].claims[0].text).toHaveLength(135)
  })

  it('rejects a claim text past the 135-character mobile layout budget, naming the claim', () => {
    const config = validConfig()
    config.rounds[0] = round('r1', 'r1-b', {
      claims: [
        claim('r1-a', 'A'.repeat(136), false),
        claim('r1-b', 'Affirmation B.', true),
        claim('r1-c', 'Affirmation C.', false),
        claim('r1-d', 'Affirmation D.', false),
      ],
    })

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['rounds', 0, 'claims', 0, 'text'])
    expect(issue.message).toContain('r1-a')
    expect(issue.message).toContain('r1')
  })
})
