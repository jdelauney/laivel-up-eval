import { describe, expect, it } from 'vitest'
import { buildThreeTracksAnswer } from '@/games/three-tracks/actions/build-three-tracks-answer.action'
import {
  type ThreeTracksConfig,
  threeTracksConfigSchema,
} from '@/games/three-tracks/schema/config.schema'

const tracks = [
  { id: 'migration', label: 'La migration', brief: 'brief', work: 4 },
  { id: 'panier', label: 'Le panier', brief: 'brief', work: 5 },
  { id: 'api', label: "L'API publique", brief: 'brief', work: 5 },
  { id: 'accueil', label: "La page d'accueil", brief: 'brief', work: 6 },
]

const baseConfig: ThreeTracksConfig = threeTracksConfigSchema.parse({
  statement: 'Consigne de test.',
  turns: 4,
  attentionPerTurn: 3,
  maxPerTrack: 2,
  driftAfter: 2,
  diesAfter: 4,
  tracks,
})

/** Un plafond large qui ne dérive ni ne meurt sur quatre tours, pour isoler le comportement testé du reste de la simulation. */
const noDriftConfig: ThreeTracksConfig = threeTracksConfigSchema.parse({
  ...baseConfig,
  driftAfter: 10,
  diesAfter: 20,
})

describe('build three tracks answer', () => {
  it('follows the config order for allocations, never the order clicked', () => {
    const answer = buildThreeTracksAnswer(noDriftConfig, [
      { accueil: 1, migration: 2 },
      { panier: 2, api: 1 },
      {},
      {},
    ])

    expect(
      answer.turns[0].allocations.map((allocation) => allocation.trackId),
    ).toEqual(noDriftConfig.tracks.map((track) => track.id))
  })

  it('numbers the turns from one, in the order played', () => {
    const answer = buildThreeTracksAnswer(noDriftConfig, [{}, {}, {}, {}])

    expect(answer.turns.map((turn) => turn.turnNumber)).toEqual([1, 2, 3, 4])
  })

  it('takes the merged and live counts from the simulation, not a recomputation', () => {
    const answer = buildThreeTracksAnswer(noDriftConfig, [
      { migration: 2 },
      { migration: 2 },
      {},
      {},
    ])

    expect(answer.mergedTrackIds).toEqual(['migration'])
    expect(answer.lostTrackIds).toEqual([])
    expect(answer.liveTracksPerTurn).toEqual([4, 4, 4, 4])
  })

  it('carries a neglected track through drift and into loss', () => {
    const answer = buildThreeTracksAnswer(baseConfig, [{}, {}, {}, {}])

    expect(answer.lostTrackIds).toEqual(tracks.map((track) => track.id))
    expect(answer.liveTracksPerTurn).toEqual([4, 4, 4, 0])
  })

  it('produces a trace that covers every turn of the config', () => {
    const answer = buildThreeTracksAnswer(noDriftConfig, [
      { migration: 2, panier: 1 },
      { migration: 2, api: 1 },
      { panier: 1 },
      { api: 1 },
    ])

    expect(answer.turns).toHaveLength(noDriftConfig.turns)
  })
})
