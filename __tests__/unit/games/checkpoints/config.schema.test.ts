import { describe, expect, it } from 'vitest'
import { checkpointsConfigSchema } from '@/games/checkpoints/schema/config.schema'

type TestDefect = { id: string; burstsAt: string; factor: number }

const stage = (id: string, corriger: number, defect?: TestDefect) => ({
  id,
  label: id,
  output: { prose: `sortie de l'IA pour ${id}` },
  costs: { 'laisser-passer': 0, corriger, 're-cadrer': corriger + 1 },
  defect,
})

const validConfig = () => ({
  budget: 10,
  stages: [
    stage('cadrage', 2, { id: 'ambiguite', burstsAt: 'revue', factor: 3 }),
    stage('plan', 2),
    stage('generation', 3),
    stage('revue', 4),
    stage('tests', 5),
    stage('merge', 6),
  ],
})

const firstIssue = (config: unknown) => {
  const result = checkpointsConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues[0]
}

describe('checkpoints config schema', () => {
  it('accepts a six stage config', () => {
    const parsed = checkpointsConfigSchema.parse(validConfig())

    expect(parsed.stages.map((entry) => entry.id)).toEqual([
      'cadrage',
      'plan',
      'generation',
      'revue',
      'tests',
      'merge',
    ])
  })

  it('rejects a config without a single stage, naming the field', () => {
    const issue = firstIssue({ budget: 10, stages: [] })

    expect(issue.path).toContain('stages')
  })

  it('rejects a negative cost, naming the field', () => {
    const config = validConfig()
    config.stages[2].costs.corriger = -1

    expect(firstIssue(config).path).toContain('costs')
  })

  it('rejects a defect factor below one', () => {
    const config = validConfig()
    config.stages[0].defect = {
      id: 'ambiguite',
      burstsAt: 'revue',
      factor: 0.5,
    }

    expect(firstIssue(config).path).toContain('factor')
  })

  it('rejects a defect bursting at a stage that does not exist', () => {
    const config = validConfig()
    config.stages[0].defect = {
      id: 'ambiguite',
      burstsAt: 'recette',
      factor: 3,
    }

    expect(firstIssue(config).message).toContain('recette')
  })

  it('rejects a defect bursting before the stage that sows it', () => {
    const config = validConfig()
    config.stages[3].defect = { id: 'tardif', burstsAt: 'plan', factor: 3 }

    expect(firstIssue(config).message).toContain('revue')
  })

  it('keeps the starting budget declared by the author, never a constant', () => {
    const config = validConfig()
    config.budget = 42

    expect(checkpointsConfigSchema.parse(config).budget).toBe(42)
  })
})
