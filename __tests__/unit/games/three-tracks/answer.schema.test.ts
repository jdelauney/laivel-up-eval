import { describe, expect, it } from 'vitest'
import {
  IncompleteTraceError,
  parseThreeTracksTrace,
  TrackAttentionExceededError,
  TurnAttentionExceededError,
  threeTracksAnswerSchema,
  UnknownTrackError,
} from '@/games/three-tracks/schema/answer.schema'
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

const config: ThreeTracksConfig = threeTracksConfigSchema.parse({
  turns: 3,
  attentionPerTurn: 3,
  maxPerTrack: 2,
  driftAfter: 1,
  diesAfter: 2,
  tracks: [track('a', 10), track('b', 10)],
})

const completeTrace = () => ({
  turns: [
    { turnNumber: 1, allocations: [{ trackId: 'a', attention: 2 }] },
    { turnNumber: 2, allocations: [{ trackId: 'b', attention: 2 }] },
    { turnNumber: 3, allocations: [{ trackId: 'a', attention: 1 }] },
  ],
  mergedTrackIds: [],
  lostTrackIds: [],
  liveTracksPerTurn: [2, 2, 2],
})

describe('three-tracks answer schema', () => {
  it('carries the journal of merges, losses and live counts', () => {
    const trace = threeTracksAnswerSchema.parse({
      ...completeTrace(),
      mergedTrackIds: ['a'],
      lostTrackIds: ['b'],
    })

    expect(trace.mergedTrackIds).toEqual(['a'])
    expect(trace.lostTrackIds).toEqual(['b'])
  })

  it('accepts a trace covering every turn of the config, in order', () => {
    expect(parseThreeTracksTrace(completeTrace(), config).turns).toHaveLength(3)
  })

  it('rejects a trace missing a turn, naming the missing turn', () => {
    const trace = completeTrace()
    trace.turns.splice(1, 1)

    expect(() => parseThreeTracksTrace(trace, config)).toThrow(
      IncompleteTraceError,
    )
    expect(() => parseThreeTracksTrace(trace, config)).toThrow('2')
  })

  it('rejects a trace whose turns do not follow the config order', () => {
    const trace = completeTrace()
    trace.turns.reverse()

    expect(() => parseThreeTracksTrace(trace, config)).toThrow(
      IncompleteTraceError,
    )
  })

  it('rejects an allocation aiming at a track the config does not declare', () => {
    const trace = completeTrace()
    trace.turns[0].allocations = [{ trackId: 'ghost', attention: 1 }]

    expect(() => parseThreeTracksTrace(trace, config)).toThrow(
      UnknownTrackError,
    )
  })

  it('rejects an allocation above the per track cap, naming the faulty turn', () => {
    const trace = completeTrace()
    trace.turns[1].allocations = [{ trackId: 'b', attention: 3 }]

    const call = () => parseThreeTracksTrace(trace, config)
    expect(call).toThrow(TrackAttentionExceededError)
    expect(call).toThrow('2')
  })

  it('rejects two allocations of the same turn that together exceed the per track cap', () => {
    const trace = completeTrace()
    trace.turns[1].allocations = [
      { trackId: 'b', attention: 2 },
      { trackId: 'b', attention: 1 },
    ]

    const call = () => parseThreeTracksTrace(trace, config)
    expect(call).toThrow(TrackAttentionExceededError)
    expect(call).toThrow('2')
  })

  it('rejects a turn whose allocations exceed the attention available', () => {
    const trace = completeTrace()
    trace.turns[2].allocations = [
      { trackId: 'a', attention: 2 },
      { trackId: 'b', attention: 2 },
    ]

    const call = () => parseThreeTracksTrace(trace, config)
    expect(call).toThrow(TurnAttentionExceededError)
    expect(call).toThrow('3')
  })
})
