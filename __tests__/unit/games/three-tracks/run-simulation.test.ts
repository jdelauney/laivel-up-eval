import { describe, expect, it } from 'vitest'
import {
  applyAllocations,
  GameAlreadyOverError,
  initialState,
  replayTrace,
  type SimulationState,
} from '@/games/three-tracks/helpers/run-simulation.helper'
import type { Allocation } from '@/games/three-tracks/schema/answer.schema'
import {
  type ThreeTracksConfig,
  threeTracksConfigSchema,
} from '@/games/three-tracks/schema/config.schema'

const track = (id: string, work: number) => ({
  id,
  label: id,
  brief: `chantier ${id}`,
  work,
})

/** Le barème du parcours, pour que les comptes du plan soient vérifiés ici. */
const buildConfig = (): ThreeTracksConfig =>
  threeTracksConfigSchema.parse({
    turns: 6,
    attentionPerTurn: 3,
    maxPerTrack: 2,
    driftAfter: 1,
    diesAfter: 2,
    tracks: [track('a', 4), track('b', 100), track('c', 1), track('d', 4)],
  })

const play = (
  config: ThreeTracksConfig,
  turns: readonly (readonly Allocation[])[],
): SimulationState =>
  turns.reduce<SimulationState>(
    (state, allocations) => applyAllocations(config, state, allocations),
    initialState(config),
  )

const NOTHING: Allocation[] = []

describe('three-tracks simulation', () => {
  it('opens every declared track at zero progress and zero neglect', () => {
    const state = initialState(buildConfig())

    expect(state.tracks).toEqual([
      { id: 'a', progress: 0, neglect: 0, status: 'open' },
      { id: 'b', progress: 0, neglect: 0, status: 'open' },
      { id: 'c', progress: 0, neglect: 0, status: 'open' },
      { id: 'd', progress: 0, neglect: 0, status: 'open' },
    ])
  })

  it('advances progress by the attention received', () => {
    const state = applyAllocations(buildConfig(), initialState(buildConfig()), [
      { trackId: 'a', attention: 2 },
    ])

    expect(state.tracks.find((t) => t.id === 'a')?.progress).toBe(2)
  })

  it('merges a track once its work is reached', () => {
    const state = applyAllocations(buildConfig(), initialState(buildConfig()), [
      { trackId: 'c', attention: 1 },
    ])

    expect(state.tracks.find((t) => t.id === 'c')?.status).toBe('merged')
  })

  it('drifts a neglected track before it dies, never the other way round', () => {
    const config = buildConfig()
    const afterOneTurn = play(config, [NOTHING])
    const afterTwoTurns = play(config, [NOTHING, NOTHING])

    expect(afterOneTurn.tracks.find((t) => t.id === 'b')?.status).toBe(
      'drifting',
    )
    expect(afterTwoTurns.tracks.find((t) => t.id === 'b')?.status).toBe('lost')
  })

  it('spends the first unit of attention on a drifting track recovering it, advancing no work', () => {
    const config = buildConfig()
    const state = play(config, [NOTHING, [{ trackId: 'b', attention: 1 }]])
    const b = state.tracks.find((t) => t.id === 'b')

    expect(b?.status).toBe('open')
    expect(b?.progress).toBe(0)
    expect(b?.neglect).toBe(0)
  })

  it('credits the remainder of a recovery allocation to progress', () => {
    const config = buildConfig()
    const state = play(config, [NOTHING, [{ trackId: 'b', attention: 2 }]])
    const b = state.tracks.find((t) => t.id === 'b')

    expect(b?.status).toBe('open')
    expect(b?.progress).toBe(1)
  })

  it('leaves a merged track immune to neglect until the end of the game', () => {
    const config = buildConfig()
    const state = play(config, [
      [{ trackId: 'c', attention: 1 }],
      NOTHING,
      NOTHING,
      NOTHING,
      NOTHING,
      NOTHING,
    ])

    expect(state.tracks.find((t) => t.id === 'c')?.status).toBe('merged')
  })

  it('counts merged tracks among the live tracks of a turn', () => {
    const config = buildConfig()
    const state = play(config, [[{ trackId: 'c', attention: 1 }]])

    expect(state.liveTracksPerTurn).toEqual([4])
  })

  it('drops the live count once a track is lost, keeping the others counted', () => {
    const config = buildConfig()
    const tended: Allocation[] = [
      { trackId: 'a', attention: 1 },
      { trackId: 'c', attention: 1 },
      { trackId: 'd', attention: 1 },
    ]
    /** `b` ne reçoit jamais rien : lui seul dérive puis meurt. */
    const state = play(config, [tended, tended])

    expect(state.tracks.find((t) => t.id === 'b')?.status).toBe('lost')
    expect(state.liveTracksPerTurn).toEqual([4, 3])
  })

  it('produces identical traces on two runs of the same allocations', () => {
    const config = buildConfig()
    const turns = [
      [{ trackId: 'a', attention: 2 }],
      [{ trackId: 'd', attention: 2 }],
    ]

    expect(play(config, turns)).toEqual(play(config, turns))
  })

  it('replays a whole trace into the state the step by step game reached', () => {
    const config = buildConfig()
    const allocations = [
      [{ trackId: 'a', attention: 2 }],
      [{ trackId: 'd', attention: 1 }],
    ]
    const stepByStep = play(config, allocations)

    expect(
      replayTrace(
        config,
        allocations.map((turnAllocations) => ({
          allocations: turnAllocations,
        })),
      ),
    ).toEqual(stepByStep)
  })

  it('ignores the journal written in a trace and takes the state from the allocations', () => {
    const config = buildConfig()
    const state = replayTrace(config, [
      { allocations: [{ trackId: 'c', attention: 1 }] },
    ])

    expect(state.tracks.find((t) => t.id === 'c')?.status).toBe('merged')
  })

  it('refuses a turn once every turn of the config is already played', () => {
    const config = buildConfig()
    const state = play(
      config,
      Array.from({ length: 6 }, () => NOTHING),
    )

    expect(() => applyAllocations(config, state, NOTHING)).toThrow(
      GameAlreadyOverError,
    )
  })
})
