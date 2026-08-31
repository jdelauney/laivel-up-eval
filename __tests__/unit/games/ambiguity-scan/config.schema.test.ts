import { describe, expect, it } from 'vitest'
import { ambiguityScanConfigSchema } from '@/games/ambiguity-scan/schema/config.schema'

const segment = (
  id: string,
  ambiguous: boolean,
  overrides: Partial<{ text: string; reading: string }> = {},
) => ({
  id,
  text: overrides.text ?? `Texte de ${id}.`,
  ambiguous,
  ...(ambiguous ? { reading: overrides.reading ?? `Lecture de ${id}.` } : {}),
})

/**
 * Six segments, trois ambigus (`s3`, `s4`, `s5`), trois clairs — le
 * minimum qui satisfait chaque refus du contrat à la fois :
 * `ambiguousCount === MIN_AMBIGUOUS_SEGMENTS` et `clearCount === ambiguousCount`.
 */
const validConfig = () => ({
  statement: 'Consigne de test.',
  promptTitle: 'Titre du prompt',
  segments: [
    segment('s1', false),
    segment('s2', false),
    segment('s3', true),
    segment('s4', true),
    segment('s5', true),
    segment('s6', false),
  ],
})

const firstIssue = (config: unknown) => {
  const result = ambiguityScanConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues[0]
}

describe('ambiguity-scan config schema', () => {
  it('accepts six segments, three ambiguous and three clear', () => {
    const parsed = ambiguityScanConfigSchema.parse(validConfig())

    expect(parsed.segments).toHaveLength(6)
    expect(parsed.segments.filter((entry) => entry.ambiguous)).toHaveLength(3)
  })

  it('rejects fewer than six segments in total', () => {
    const config = validConfig()
    config.segments = config.segments.slice(0, 5)

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['segments'])
  })

  it('rejects two segments sharing the same id, naming it', () => {
    const config = validConfig()
    config.segments[1] = segment('s1', false)

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['segments', 1, 'id'])
    expect(issue.message).toContain('s1')
  })

  it('rejects an ambiguous segment with no reading, naming it', () => {
    const config = validConfig()
    config.segments[2] = { id: 's3', text: 'Texte de s3.', ambiguous: true }

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['segments', 2, 'reading'])
    expect(issue.message).toContain('s3')
  })

  it('rejects a clear segment carrying a reading, naming it', () => {
    const config = validConfig()
    config.segments[0] = {
      id: 's1',
      text: 'Texte de s1.',
      ambiguous: false,
      reading: 'Une lecture qui ne devrait pas être là.',
    }

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['segments', 0, 'reading'])
    expect(issue.message).toContain('s1')
  })

  it('rejects fewer than three ambiguous segments', () => {
    const config = validConfig()
    // s5 devient clair : deux segments ambigus seulement (s3, s4), quatre
    // clairs — la répartition clearCount >= ambiguousCount reste tenue,
    // seul le plancher de trois ambigus est visé isolément.
    config.segments[4] = segment('s5', false)

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['segments'])
    expect(issue.message).toContain('ambigu')
  })

  it('rejects fewer clear segments than ambiguous ones', () => {
    const config = validConfig()
    // s1 et s2 deviennent ambigus, en plus de s3, s4, s5 : cinq segments
    // ambigus pour un seul clair (s6). Le plancher de trois ambigus reste
    // tenu, seule la répartition clearCount >= ambiguousCount est visée.
    config.segments[0] = segment('s1', true)
    config.segments[1] = segment('s2', true)

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['segments'])
    expect(issue.message).toContain('clair')
  })
})
