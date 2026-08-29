import type { Allocation, TurnTrace } from '../schema/answer.schema'
import type { ThreeTracksConfig } from '../schema/config.schema'

/**
 * L'avancée de la partie, en une seule implémentation. La même fonction fait
 * avancer le jeu à l'écran et rejoue la trace au scoring : deux implémentations
 * auraient divergé au premier ajustement de barème, et le verdict n'aurait plus
 * décrit la partie jouée.
 *
 * Aucune horloge, aucun aléa, aucun accès extérieur : la fonction ne dépend que
 * de ses arguments, et deux parties aux mêmes allocations rendent la même trace.
 */

export type TrackStatus = 'open' | 'drifting' | 'merged' | 'lost'

export type TrackState = {
  id: string
  progress: number
  neglect: number
  status: TrackStatus
}

export type SimulationState = {
  turn: number
  tracks: readonly TrackState[]
  liveTracksPerTurn: readonly number[]
}

export class GameAlreadyOverError extends Error {
  constructor() {
    super('les tours de la partie three-tracks sont déjà tous joués')
    this.name = 'GameAlreadyOverError'
  }
}

export const initialState = (config: ThreeTracksConfig): SimulationState => ({
  turn: 0,
  tracks: config.tracks.map((track) => ({
    id: track.id,
    progress: 0,
    neglect: 0,
    status: 'open',
  })),
  liveTracksPerTurn: [],
})

const attentionFor = (
  allocations: readonly Allocation[],
  trackId: string,
): number =>
  allocations
    .filter((allocation) => allocation.trackId === trackId)
    .reduce((sum, allocation) => sum + allocation.attention, 0)

/**
 * Le statut se déduit du seul compteur de négligence, sauf pour les états
 * définitifs : un chantier mergé ou perdu ne reçoit plus d'attention, ne
 * dérive plus, ne meurt plus. Dériver le statut d'une seule valeur évite deux
 * sources de vérité qui pourraient diverger.
 */
const resolveTrack = (
  config: ThreeTracksConfig,
  track: TrackState,
  work: number,
  attention: number,
): TrackState => {
  if (track.status === 'merged' || track.status === 'lost') return track

  /**
   * La reprise d'un chantier en dérive consomme une unité d'attention avant
   * tout avancement : c'est le prix de la négligence, et il tombe avant que le
   * travail ne progresse.
   */
  const recoveryCost = track.status === 'drifting' && attention > 0 ? 1 : 0
  const progress = track.progress + Math.max(attention - recoveryCost, 0)
  const neglect = attention > 0 ? 0 : track.neglect + 1

  if (progress >= work) {
    return { id: track.id, progress: work, neglect: 0, status: 'merged' }
  }

  const status: TrackStatus =
    neglect >= config.diesAfter
      ? 'lost'
      : neglect >= config.driftAfter
        ? 'drifting'
        : 'open'

  return { id: track.id, progress, neglect, status }
}

export const applyAllocations = (
  config: ThreeTracksConfig,
  state: SimulationState,
  allocations: readonly Allocation[],
): SimulationState => {
  if (state.turn >= config.turns) throw new GameAlreadyOverError()

  const tracks = state.tracks.map((track) => {
    const declared = config.tracks.find(
      (candidate) => candidate.id === track.id,
    )
    if (declared === undefined) return track
    return resolveTrack(
      config,
      track,
      declared.work,
      attentionFor(allocations, track.id),
    )
  })

  /**
   * Le relevé de vivants compte les chantiers non morts, le mergé compris :
   * compter un succès comme une extinction punirait la réussite, alors que la
   * médiane doit mesurer ce que le joueur a tenu.
   */
  const liveCount = tracks.filter((track) => track.status !== 'lost').length

  return {
    turn: state.turn + 1,
    tracks,
    liveTracksPerTurn: [...state.liveTracksPerTurn, liveCount],
  }
}

/**
 * Le rejeu ne lit que les allocations : le journal d'une trace (mergés,
 * perdus, vivants par tour) n'est jamais une source. L'évaluateur passe par
 * ici plutôt que de refaire l'avancée, et une trace dont le journal aurait été
 * forgé ne change aucun verdict.
 */
export const replayTrace = (
  config: ThreeTracksConfig,
  turns: readonly Pick<TurnTrace, 'allocations'>[],
): SimulationState =>
  turns.reduce<SimulationState>(
    (state, turn) => applyAllocations(config, state, turn.allocations),
    initialState(config),
  )
