import { describe, expect, it } from 'vitest'
import type { Criterion } from '@/core/contracts/course.schema'
import { replayTrace } from '@/games/three-tracks/helpers/run-simulation.helper'
import type {
  Allocation,
  ThreeTracksAnswer,
} from '@/games/three-tracks/schema/answer.schema'
import {
  type ThreeTracksConfig,
  threeTracksConfigSchema,
} from '@/games/three-tracks/schema/config.schema'
import { ThreeTracksEvaluator } from '@/games/three-tracks/three-tracks.evaluator'

const track = (id: string, work: number) => ({
  id,
  label: id,
  brief: `chantier ${id}`,
  work,
})

/** Le barème du parcours : trois tours, de quoi merger ou abandonner un chantier. */
const config: ThreeTracksConfig = threeTracksConfigSchema.parse({
  turns: 3,
  attentionPerTurn: 6,
  maxPerTrack: 2,
  driftAfter: 1,
  diesAfter: 2,
  tracks: [track('a', 2), track('b', 2), track('c', 2), track('d', 2)],
})

/** Un barème plus long, dédié au piège du pic : le temps de laisser le pic retomber. */
const peakConfig: ThreeTracksConfig = threeTracksConfigSchema.parse({
  turns: 5,
  attentionPerTurn: 6,
  maxPerTrack: 2,
  driftAfter: 1,
  diesAfter: 2,
  tracks: [track('a', 20), track('b', 20), track('c', 20), track('d', 20)],
})

const criteria: Criterion[] = [
  {
    id: 'c1',
    question: 'Au moins un chantier a-t-il été mergé ?',
    rule: { type: 'merged-at-least', threshold: 1 },
    mapping: [{ dimension: 'parallele', weight: 2 }],
  },
  {
    id: 'c2',
    question: 'Au moins trois chantiers ont-ils été mergés ?',
    rule: { type: 'merged-at-least', threshold: 3 },
    mapping: [{ dimension: 'parallele', weight: 2 }],
  },
  {
    id: 'c3',
    question: "Aucun chantier n'a-t-il été abandonné ?",
    rule: { type: 'no-abandoned-track' },
    mapping: [{ dimension: 'parallele', weight: 1 }],
  },
  {
    id: 'c4',
    question: 'La médiane des chantiers vivants atteint-elle deux ?',
    rule: { type: 'median-live-tracks-at-least', threshold: 2 },
    mapping: [{ dimension: 'parallele', weight: 1 }],
  },
]

/** Trois chantiers menés au merge, le quatrième survit sans être mergé. */
const THREE_MERGED_NO_LOSS: Allocation[][] = [
  [
    { trackId: 'a', attention: 2 },
    { trackId: 'b', attention: 1 },
    { trackId: 'c', attention: 1 },
  ],
  [
    { trackId: 'b', attention: 1 },
    { trackId: 'c', attention: 1 },
    { trackId: 'd', attention: 1 },
  ],
  [],
]

/** Les mêmes deux premiers tours, mais le quatrième chantier n'est jamais repris : il meurt. */
const THREE_MERGED_ONE_LOST: Allocation[][] = [
  [
    { trackId: 'a', attention: 2 },
    { trackId: 'b', attention: 1 },
    { trackId: 'c', attention: 1 },
  ],
  [
    { trackId: 'b', attention: 1 },
    { trackId: 'c', attention: 1 },
  ],
  [],
]

/** Un seul chantier tenu jusqu'au merge, les trois autres jamais repris. */
const ONE_MERGED_THREE_ABANDONED: Allocation[][] = [
  [{ trackId: 'a', attention: 2 }],
  [],
  [],
]

/** Quatre chantiers vivants sur les deux premiers tours, un seul ensuite. */
const PEAK_THEN_ONE: Allocation[][] = [
  [
    { trackId: 'a', attention: 1 },
    { trackId: 'b', attention: 1 },
    { trackId: 'c', attention: 1 },
    { trackId: 'd', attention: 1 },
  ],
  [{ trackId: 'a', attention: 1 }],
  [{ trackId: 'a', attention: 1 }],
  [{ trackId: 'a', attention: 1 }],
  [{ trackId: 'a', attention: 1 }],
]

const traceOf = (
  turns: readonly Allocation[][],
  from: ThreeTracksConfig = config,
): ThreeTracksAnswer => {
  const state = replayTrace(
    from,
    turns.map((allocations) => ({ allocations })),
  )
  return {
    turns: turns.map((allocations, index) => ({
      turnNumber: index + 1,
      allocations,
    })),
    mergedTrackIds: state.tracks
      .filter((track) => track.status === 'merged')
      .map((track) => track.id),
    lostTrackIds: state.tracks
      .filter((track) => track.status === 'lost')
      .map((track) => track.id),
    liveTracksPerTurn: [...state.liveTracksPerTurn],
  }
}

const evaluator = new ThreeTracksEvaluator()

const verdictOf = (
  turns: readonly Allocation[][],
  rules: readonly Criterion[] = criteria,
  from: ThreeTracksConfig = config,
): boolean[] =>
  evaluator
    .evaluate(traceOf(turns, from), from, rules)
    .map((result) => result.satisfied)

describe('three-tracks evaluator', () => {
  it('satisfies the four criteria for a player who merges three tracks without losing any', () => {
    expect(verdictOf(THREE_MERGED_NO_LOSS)).toEqual([true, true, true, true])
  })

  it('returns one result per criterion, in the order the course declares them', () => {
    const results = evaluator.evaluate(
      traceOf(THREE_MERGED_NO_LOSS),
      config,
      criteria,
    )

    expect(results.map((result) => result.criterionId)).toEqual([
      'c1',
      'c2',
      'c3',
      'c4',
    ])
  })

  it('misses the guard rail criterion when a track is lost, even though three others are merged', () => {
    const [, mergedAtLeastThree, noAbandonedTrack] = verdictOf(
      THREE_MERGED_ONE_LOST,
    )

    expect(mergedAtLeastThree).toBe(true)
    expect(noAbandonedTrack).toBe(false)
  })

  it('satisfies only the one track threshold when a player opens four tracks and abandons three', () => {
    expect(verdictOf(ONE_MERGED_THREE_ABANDONED)).toEqual([
      true,
      false,
      false,
      false,
    ])
  })

  it('misses the median criterion when an early peak of four live tracks is not sustained', () => {
    const medianOnly: Criterion[] = [criteria[3]]

    expect(verdictOf(PEAK_THEN_ONE, medianOnly, peakConfig)).toEqual([false])
  })

  it('renders the same verdict when the journal written in the trace is forged', () => {
    const forged = traceOf(THREE_MERGED_NO_LOSS)
    forged.mergedTrackIds = []
    forged.lostTrackIds = ['a', 'b', 'c', 'd']
    forged.liveTracksPerTurn = [0, 0, 0]

    expect(
      evaluator.evaluate(forged, config, criteria).map((r) => r.satisfied),
    ).toEqual([true, true, true, true])
  })

  it('rejects a rule it does not know, naming the rule and the game', () => {
    const unknown: Criterion[] = [
      { ...criteria[0], rule: { type: 'invented-rule' } },
    ]

    expect(() =>
      evaluator.evaluate(traceOf(THREE_MERGED_NO_LOSS), config, unknown),
    ).toThrow('invented-rule')
    expect(() =>
      evaluator.evaluate(traceOf(THREE_MERGED_NO_LOSS), config, unknown),
    ).toThrow('three-tracks')
  })
})
