import { describe, expect, it } from 'vitest'
import { confidenceBetConfigSchema } from '@/games/confidence-bet/schema/config.schema'

const snippet = (id: string, nature: 'sound' | 'flawed' | 'undecidable') => ({
  id,
  label: id,
  language: 'ts',
  code: `const ${id} = 1`,
  nature,
  reveal: `révélation ${id}`,
})

const validConfig = () => ({
  statement: 'Consigne de test.',
  stakes: [10, 30, 50, 70, 90],
  neutralStake: 50,
  startingCapital: 100,
  snippets: [
    snippet('s1', 'sound'),
    snippet('s2', 'sound'),
    snippet('f1', 'flawed'),
    snippet('f2', 'flawed'),
    snippet('u1', 'undecidable'),
    snippet('u2', 'undecidable'),
  ],
})

const firstIssue = (config: unknown) => {
  const result = confidenceBetConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues[0]
}

describe('confidence-bet config schema', () => {
  it('accepts a six snippet config, two per nature', () => {
    const parsed = confidenceBetConfigSchema.parse(validConfig())

    expect(parsed.snippets).toHaveLength(6)
  })

  it('rejects a config without a statement, naming the field', () => {
    const config: Record<string, unknown> = validConfig()
    delete config.statement

    expect(firstIssue(config).path).toEqual(['statement'])
  })

  it('rejects two snippets sharing the same id, naming the field', () => {
    const config = validConfig()
    config.snippets[1] = snippet('s1', 'sound')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['snippets', 1, 'id'])
    expect(issue.message).toContain('s1')
  })

  it('rejects a scale of fewer than three values', () => {
    const config = validConfig()
    config.stakes = [40, 60]

    expect(firstIssue(config).path).toContain('stakes')
  })

  it('rejects a scale that does not contain the neutral stake', () => {
    const config = validConfig()
    config.neutralStake = 55

    expect(firstIssue(config).path).toEqual(['neutralStake'])
  })

  it('rejects a scale without a mirror around the neutral stake', () => {
    const config = validConfig()
    config.stakes = [10, 30, 50, 70]

    expect(firstIssue(config).path).toContain('stakes')
  })

  it('rejects a corpus missing the sound nature, naming the field', () => {
    const config = validConfig()
    config.snippets = config.snippets.filter(
      (entry) => entry.nature !== 'sound',
    )

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['snippets'])
    expect(issue.message).toContain('sound')
  })

  it('rejects a corpus missing the flawed nature, naming the field', () => {
    const config = validConfig()
    config.snippets = config.snippets.filter(
      (entry) => entry.nature !== 'flawed',
    )

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['snippets'])
    expect(issue.message).toContain('flawed')
  })

  it('rejects a corpus missing the undecidable nature, naming the field', () => {
    const config = validConfig()
    config.snippets = config.snippets.filter(
      (entry) => entry.nature !== 'undecidable',
    )

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['snippets'])
    expect(issue.message).toContain('undecidable')
  })

  it('keeps the settings declared by the author, never a constant', () => {
    const config = validConfig()
    config.startingCapital = 250

    const parsed = confidenceBetConfigSchema.parse(config)
    expect(parsed.startingCapital).toBe(250)
  })
})
