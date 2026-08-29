import { describe, expect, it } from 'vitest'
import { buildCheckpointsAnswer } from '@/games/checkpoints/actions/build-checkpoints-answer.action'
import { IncompleteTraceError } from '@/games/checkpoints/schema/answer.schema'
import {
  type CheckpointsConfig,
  type Choice,
  checkpointsConfigSchema,
} from '@/games/checkpoints/schema/config.schema'

type TestDefect = { id: string; burstsAt: string; factor: number }

const stage = (id: string, corriger: number, defect?: TestDefect) => ({
  id,
  label: id,
  output: { prose: `sortie de l'IA pour ${id}` },
  costs: { 'laisser-passer': 0, corriger, 're-cadrer': corriger + 1 },
  defect,
})

const config: CheckpointsConfig = checkpointsConfigSchema.parse({
  budget: 10,
  stages: [
    stage('cadrage', 2, { id: 'ambiguite', burstsAt: 'revue', factor: 3 }),
    stage('plan', 2, { id: 'pan-non-couvert', burstsAt: 'tests', factor: 3 }),
    stage('generation', 3),
    stage('revue', 4),
    stage('tests', 5),
    stage('merge', 6),
  ],
})

const LET_IT_RIDE: Choice[] = Array.from({ length: 6 }, () => 'laisser-passer')

describe('build checkpoints answer', () => {
  it('follows the config order, never the order the player clicked in', () => {
    const answer = buildCheckpointsAnswer(config, LET_IT_RIDE)

    expect(answer.decisions.map((decision) => decision.stageId)).toEqual(
      config.stages.map((entry) => entry.id),
    )
  })

  it('takes the costs from the simulation instead of recomputing them', () => {
    const answer = buildCheckpointsAnswer(config, [
      'corriger',
      're-cadrer',
      ...LET_IT_RIDE.slice(2),
    ])

    expect(answer.decisions[0].cost).toBe(config.stages[0].costs.corriger)
    expect(answer.decisions[1].cost).toBe(config.stages[1].costs['re-cadrer'])
  })

  it('carries the remaining budget, surcharges included', () => {
    const answer = buildCheckpointsAnswer(config, LET_IT_RIDE)

    expect(answer.remainingBudget).toBe(-2)
    expect(answer.decisions.every((decision) => decision.cost === 0)).toBe(true)
  })

  it('carries the defects still in the deliverable at the merge', () => {
    const shipped = buildCheckpointsAnswer(config, LET_IT_RIDE)
    const clean = buildCheckpointsAnswer(config, [
      'corriger',
      'corriger',
      ...LET_IT_RIDE.slice(2),
    ])

    expect(shipped.remainingDefects).toEqual(['ambiguite', 'pan-non-couvert'])
    expect(clean.remainingDefects).toEqual([])
    expect(clean.remainingBudget).toBe(6)
  })

  it('refuses to build a trace that does not cover every stage', () => {
    expect(() =>
      buildCheckpointsAnswer(config, LET_IT_RIDE.slice(0, 5)),
    ).toThrow(IncompleteTraceError)
  })
})
