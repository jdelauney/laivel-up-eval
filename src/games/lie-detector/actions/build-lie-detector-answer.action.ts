import {
  IncompleteTraceError,
  type LieDetectorAnswer,
  type Pick,
  parseLieDetectorTrace,
} from '../schema/answer.schema'
import type { LieDetectorConfig } from '../schema/config.schema'

/**
 * Construit la trace conforme au contrat du jeu, hors de React : testable
 * sans composant, sur le modèle de `buildDefectHuntAnswer`.
 *
 * `playedPicks` porte les désignations posées, dans l'ordre où le joueur les
 * a jouées. La trace qui en sort suit toujours l'ordre des manches déclarées
 * dans la configuration, jamais celui du jeu : deux parties aux mêmes
 * désignations produisent donc toujours exactement la même trace.
 *
 * Une désignation inconnue — une manche omise, ou une affirmation absente de
 * son lot — est refusée ici même, en repassant par `parseLieDetectorTrace` :
 * ce que l'écran produit se vérifie contre le même contrat que ce que
 * l'évaluateur consomme.
 */
export const buildLieDetectorAnswer = (
  config: LieDetectorConfig,
  playedPicks: readonly Pick[],
): LieDetectorAnswer => {
  const pickByRoundId = new Map(playedPicks.map((pick) => [pick.roundId, pick]))

  const picks = config.rounds.map((round) => {
    const pick = pickByRoundId.get(round.id)
    if (pick === undefined) throw new IncompleteTraceError(round.id)
    return pick
  })

  return parseLieDetectorTrace({ picks }, config)
}
