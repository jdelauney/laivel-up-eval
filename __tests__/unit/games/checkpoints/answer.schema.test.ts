import { describe, expect, it } from 'vitest'
import {
  checkpointsAnswerSchema,
  IncompleteTraceError,
  parseCheckpointsTrace,
} from '@/games/checkpoints/schema/answer.schema'
import {
  checkpointsConfigSchema,
  type Stage,
} from '@/games/checkpoints/schema/config.schema'

const stages: readonly Stage[] = checkpointsConfigSchema.parse({
  budget: 10,
  stages: ['cadrage', 'plan', 'generation'].map((id) => ({
    id,
    label: id,
    output: { prose: `sortie de l'IA pour ${id}` },
    costs: { 'laisser-passer': 0, corriger: 2, 're-cadrer': 3 },
  })),
}).stages

const completeTrace = () => ({
  decisions: [
    { stageId: 'cadrage', choice: 'corriger', cost: 2 },
    { stageId: 'plan', choice: 'laisser-passer', cost: 0 },
    { stageId: 'generation', choice: 'laisser-passer', cost: 0 },
  ],
  remainingBudget: 8,
  remainingDefects: [],
})

describe('checkpoints answer schema', () => {
  it('carries the remaining budget and the defects still in the deliverable', () => {
    const trace = checkpointsAnswerSchema.parse({
      ...completeTrace(),
      remainingBudget: -2,
      remainingDefects: ['ambiguite'],
    })

    expect(trace.remainingBudget).toBe(-2)
    expect(trace.remainingDefects).toEqual(['ambiguite'])
  })

  it('rejects a choice that is not one of the three answers', () => {
    const trace = completeTrace()
    trace.decisions[1].choice = 'annuler'

    expect(() => checkpointsAnswerSchema.parse(trace)).toThrow()
  })

  it('accepts a trace covering every stage of the config, in order', () => {
    expect(
      parseCheckpointsTrace(completeTrace(), stages).decisions,
    ).toHaveLength(3)
  })

  it('rejects a trace missing a stage, naming the stage', () => {
    const trace = completeTrace()
    trace.decisions.splice(1, 1)

    expect(() => parseCheckpointsTrace(trace, stages)).toThrow(
      IncompleteTraceError,
    )
    expect(() => parseCheckpointsTrace(trace, stages)).toThrow('plan')
  })

  it('rejects a trace whose stages do not follow the config order', () => {
    const trace = completeTrace()
    trace.decisions.reverse()

    expect(() => parseCheckpointsTrace(trace, stages)).toThrow(
      IncompleteTraceError,
    )
  })
})
