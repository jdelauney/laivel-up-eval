import {
  IncompletePlacementError,
  type PracticeMapAnswer,
  parsePracticeMapTrace,
} from '../schema/answer.schema'
import type { PracticeMapConfig } from '../schema/config.schema'

/** Une coordonnée posée par le joueur, avant qu'elle ne devienne une trace. */
export type PlacementInput = {
  practiceId: string
  intensity: number
  rigor: number
}

/**
 * Construit la trace conforme au contrat du jeu, hors de React : testable
 * sans composant, sur le modèle de `buildHintBudgetAnswer`.
 *
 * La trace qui en sort suit toujours l'ordre des pratiques déclarées dans la
 * configuration, jamais celui dans lequel le joueur les a posées : deux
 * parties aux mêmes gestes produisent donc toujours exactement la même
 * trace.
 *
 * Une pratique manquante est refusée ici même, en repassant par
 * `parsePracticeMapTrace` : ce que l'écran produit se vérifie contre le
 * même contrat que ce que l'évaluateur consomme.
 */
export const buildPracticeMapAnswer = (
  config: PracticeMapConfig,
  placements: readonly PlacementInput[],
): PracticeMapAnswer => {
  const placementByPracticeId = new Map(
    placements.map((placement) => [placement.practiceId, placement]),
  )

  const ordered = config.practices.map((practice) => {
    const placement = placementByPracticeId.get(practice.id)
    if (placement === undefined) throw new IncompletePlacementError(practice.id)
    return placement
  })

  return parsePracticeMapTrace({ placements: ordered }, config)
}
