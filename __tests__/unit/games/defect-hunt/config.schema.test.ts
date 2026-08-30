import { describe, expect, it } from 'vitest'
import { defectHuntConfigSchema } from '@/games/defect-hunt/schema/config.schema'

type Kind =
  | 'security'
  | 'logic'
  | 'hallucinated-dependency'
  | 'contract'
  | 'resource'

const CODE = Array.from(
  { length: 10 },
  (_, index) => `const line${index + 1} = ${index + 1}`,
).join('\n')

const defect = (id: string, line: number, kind: Kind) => ({
  id,
  line,
  kind,
  reveal: `révélation ${id}`,
})

const validConfig = () => ({
  statement: 'Consigne de test.',
  snippet: { label: 'Extrait', language: 'ts', code: CODE },
  timeLimitSeconds: 180,
  defects: [
    defect('d1', 2, 'security' as Kind),
    defect('d2', 4, 'logic' as Kind),
    defect('d3', 6, 'hallucinated-dependency' as Kind),
    defect('d4', 8, 'contract' as Kind),
    defect('d5', 10, 'resource' as Kind),
  ],
})

const firstIssue = (config: unknown) => {
  const result = defectHuntConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues[0]
}

describe('defect-hunt config schema', () => {
  it('accepts a ten line snippet with five defects on five distinct lines', () => {
    const parsed = defectHuntConfigSchema.parse(validConfig())

    expect(parsed.defects).toHaveLength(5)
  })

  it('rejects a config without a statement, naming the field', () => {
    const config: Record<string, unknown> = validConfig()
    delete config.statement

    expect(firstIssue(config).path).toEqual(['statement'])
  })

  it('rejects two defects sharing the same id, naming the field', () => {
    const config = validConfig()
    config.defects[1] = defect('d1', 4, 'logic')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['defects', 1, 'id'])
    expect(issue.message).toContain('d1')
  })

  it('rejects two defects declared on the same line, naming the line', () => {
    const config = validConfig()
    config.defects[1] = defect('d2', 2, 'logic')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['defects', 1, 'line'])
    expect(issue.message).toContain('2')
  })

  it('rejects a defect declared beyond the last line of the snippet', () => {
    const config = validConfig()
    config.defects[0] = defect('d1', 99, 'security')

    expect(firstIssue(config).path).toEqual(['defects', 0, 'line'])
  })

  it('rejects a defect declared on an empty line', () => {
    const config = validConfig()
    config.snippet.code = 'const only = 1\n\nconst third = 3'
    config.defects = [
      defect('d1', 2, 'security'),
      defect('d2', 1, 'logic'),
      defect('d3', 3, 'hallucinated-dependency'),
    ]

    expect(firstIssue(config).path).toEqual(['defects', 0, 'line'])
  })

  it('rejects a corpus missing the security nature, naming the missing nature', () => {
    const config = validConfig()
    config.defects = config.defects.filter((entry) => entry.kind !== 'security')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['defects'])
    expect(issue.message).toContain('security')
  })

  it('rejects a corpus missing the logic nature, naming the missing nature', () => {
    const config = validConfig()
    config.defects = config.defects.filter((entry) => entry.kind !== 'logic')

    expect(firstIssue(config).message).toContain('logic')
  })

  it('rejects a corpus missing the hallucinated dependency nature, naming the missing nature', () => {
    const config = validConfig()
    config.defects = config.defects.filter(
      (entry) => entry.kind !== 'hallucinated-dependency',
    )

    expect(firstIssue(config).message).toContain('hallucinated-dependency')
  })

  it('derives the announced defect count from defects.length, never a separate field', () => {
    const parsed = defectHuntConfigSchema.parse(validConfig())

    expect(parsed).not.toHaveProperty('defectCount')
    expect(parsed.defects.length).toBe(5)
  })

  it('keeps the settings declared by the author, never a constant', () => {
    const config = validConfig()
    config.timeLimitSeconds = 240

    const parsed = defectHuntConfigSchema.parse(config)
    expect(parsed.timeLimitSeconds).toBe(240)
  })
})
