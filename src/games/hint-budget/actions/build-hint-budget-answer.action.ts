import {
  type Attempt,
  type HintBudgetAnswer,
  IncompleteTraceError,
  parseHintBudgetTrace,
} from '../schema/answer.schema'
import type { HintBudgetConfig } from '../schema/config.schema'

/**
 * Construit la trace conforme au contrat du jeu, hors de React : testable
 * sans composant, sur le modèle de `buildLieDetectorAnswer`.
 *
 * `playedAttempts` porte les tentatives closes, dans l'ordre où le joueur
 * les a jouées. La trace qui en sort suit toujours l'ordre des situations
 * déclarées dans la configuration, jamais celui du jeu : deux parties aux
 * mêmes gestes produisent donc toujours exactement la même trace.
 *
 * Une tentative manquante — une situation omise — est refusée ici même, en
 * repassant par `parseHintBudgetTrace` : ce que l'écran produit se vérifie
 * contre le même contrat que ce que l'évaluateur consomme.
 */
export const buildHintBudgetAnswer = (
  config: HintBudgetConfig,
  playedAttempts: readonly Attempt[],
): HintBudgetAnswer => {
  const attemptBySituationId = new Map(
    playedAttempts.map((attempt) => [attempt.situationId, attempt]),
  )

  const attempts = config.situations.map((situation) => {
    const attempt = attemptBySituationId.get(situation.id)
    if (attempt === undefined) throw new IncompleteTraceError(situation.id)
    return attempt
  })

  return parseHintBudgetTrace({ attempts }, config)
}
