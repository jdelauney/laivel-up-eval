import { describe, expect, it } from 'vitest'
import {
  applyChoice,
  initialState,
  isFinished,
  replayTrace,
  type SimulationState,
} from '@/games/checkpoints/helpers/run-simulation.helper'
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

/** Le barème du parcours, pour que les comptes du plan soient vérifiés ici. */
const buildConfig = (budget = 10): CheckpointsConfig =>
  checkpointsConfigSchema.parse({
    budget,
    stages: [
      stage('cadrage', 2, { id: 'ambiguite', burstsAt: 'revue', factor: 3 }),
      stage('plan', 2, { id: 'pan-non-couvert', burstsAt: 'tests', factor: 3 }),
      stage('generation', 3),
      stage('revue', 4),
      stage('tests', 5),
      stage('merge', 6),
    ],
  })

const play = (
  config: CheckpointsConfig,
  choices: readonly Choice[],
): SimulationState =>
  choices.reduce<SimulationState>(
    (state, choice) => applyChoice(config, state, choice),
    initialState(config),
  )

const LET_IT_RIDE: Choice[] = Array.from({ length: 6 }, () => 'laisser-passer')

const withChoiceAt = (index: number, choice: Choice): Choice[] => {
  const choices = [...LET_IT_RIDE]
  choices[index] = choice
  return choices
}

describe('checkpoints simulation', () => {
  it('records one decision per stage, with the choice and its cost', () => {
    const state = play(buildConfig(), withChoiceAt(1, 'corriger'))

    expect(state.decisions).toHaveLength(6)
    expect(state.decisions[1]).toEqual({
      stageId: 'plan',
      choice: 'corriger',
      cost: 2,
    })
    expect(isFinished(buildConfig(), state)).toBe(true)
  })

  it('charges a defect left through at its bursting stage, multiplied', () => {
    const state = play(buildConfig(), LET_IT_RIDE)

    expect(state.bursts).toEqual([
      { defectId: 'ambiguite', stageId: 'revue', cost: 6 },
      { defectId: 'pan-non-couvert', stageId: 'tests', cost: 6 },
    ])
    expect(state.budget).toBe(-2)
  })

  it('charges a defect fixed at its source once, without multiplying it', () => {
    const state = play(buildConfig(), withChoiceAt(0, 'corriger'))

    expect(state.bursts.map((burst) => burst.defectId)).toEqual([
      'pan-non-couvert',
    ])
    expect(state.decisions[0].cost).toBe(2)
    expect(state.budget).toBe(10 - 2 - 6)
  })

  it('lets a reframing clear the defects inherited from earlier stages', () => {
    const state = play(buildConfig(), withChoiceAt(1, 're-cadrer'))

    expect(state.bursts).toEqual([])
    expect(state.budget).toBe(10 - 3)
  })

  it('leaves the deliverable clean when nothing is left pending at merge', () => {
    const state = play(buildConfig(), withChoiceAt(1, 're-cadrer'))

    expect(state.pendingDefects).toEqual([])
  })

  it('never stops the game on an exhausted budget: the overshoot is traced', () => {
    const everythingFixed: Choice[] = Array.from(
      { length: 6 },
      () => 'corriger',
    )
    const state = play(buildConfig(), everythingFixed)

    expect(state.decisions).toHaveLength(6)
    expect(state.budget).toBe(-12)
  })

  it('produces identical traces on two runs of the same choices', () => {
    const choices = withChoiceAt(0, 'corriger')

    expect(play(buildConfig(), choices)).toEqual(play(buildConfig(), choices))
  })

  it('takes its starting budget from the config, never from a constant', () => {
    const choices = withChoiceAt(0, 'corriger')

    expect(play(buildConfig(4), choices).budget).toBe(
      play(buildConfig(10), choices).budget - 6,
    )
  })

  it('replays a whole trace into the state the step by step game reached', () => {
    const config = buildConfig()
    const stepByStep = play(config, withChoiceAt(3, 're-cadrer'))

    expect(replayTrace(config, stepByStep.decisions)).toEqual(stepByStep)
  })

  it('ignores the costs written in a trace and takes them from the config', () => {
    const config = buildConfig()
    const forged = play(config, withChoiceAt(0, 'corriger')).decisions.map(
      (decision) => ({ ...decision, cost: 99 }),
    )

    expect(replayTrace(config, forged).budget).toBe(10 - 2 - 6)
  })

  it('refuses a seventh choice once the six stages are decided', () => {
    const config = buildConfig()
    const state = play(config, LET_IT_RIDE)

    expect(() => applyChoice(config, state, 'corriger')).toThrow()
  })
})
