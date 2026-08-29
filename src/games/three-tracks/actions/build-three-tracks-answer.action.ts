import { replayTrace } from '../helpers/run-simulation.helper'
import {
  parseThreeTracksTrace,
  type ThreeTracksAnswer,
} from '../schema/answer.schema'
import type { ThreeTracksConfig } from '../schema/config.schema'

/**
 * Construit la trace conforme au contrat du jeu, hors de React : testable
 * sans composant, sur le modèle de `buildCheckpointsAnswer`.
 *
 * `playedTurns` porte, pour chaque tour clos et dans l'ordre où il a été clos,
 * l'attention posée par identifiant de chantier. La trace qui en sort suit
 * toujours l'ordre des chantiers déclarés dans la configuration, jamais celui
 * dans lequel le joueur a posé ses pastilles : deux parties aux mêmes
 * allocations produisent donc toujours exactement la même trace.
 */
export const buildThreeTracksAnswer = (
  config: ThreeTracksConfig,
  playedTurns: readonly Readonly<Record<string, number>>[],
): ThreeTracksAnswer => {
  const turns = playedTurns.map((allocationByTrack, index) => ({
    turnNumber: index + 1,
    allocations: config.tracks.map((track) => ({
      trackId: track.id,
      attention: allocationByTrack[track.id] ?? 0,
    })),
  }))

  /**
   * Le journal (mergés, perdus, vivants par tour) vient de la simulation
   * rejouée, jamais d'un calcul refait ici : une seule implémentation de
   * l'avancée, celle de la phase 1.
   */
  const state = replayTrace(config, turns)

  return parseThreeTracksTrace(
    {
      turns,
      mergedTrackIds: state.tracks
        .filter((track) => track.status === 'merged')
        .map((track) => track.id),
      lostTrackIds: state.tracks
        .filter((track) => track.status === 'lost')
        .map((track) => track.id),
      liveTracksPerTurn: state.liveTracksPerTurn,
    },
    config,
  )
}
