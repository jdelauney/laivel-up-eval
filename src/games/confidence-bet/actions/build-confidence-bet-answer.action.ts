import { replayBets } from '../helpers/run-simulation.helper'
import {
  type Bet,
  type ConfidenceBetAnswer,
  IncompleteTraceError,
  parseConfidenceBetTrace,
} from '../schema/answer.schema'
import type { ConfidenceBetConfig } from '../schema/config.schema'

/**
 * Construit la trace conforme au contrat du jeu, hors de React : testable
 * sans composant, sur le modèle de `buildThreeTracksAnswer`.
 *
 * `playedBets` porte les mises engagées, dans l'ordre où le joueur les a
 * posées. La trace qui en sort suit toujours l'ordre des extraits déclarés
 * dans la configuration, jamais celui du jeu : deux parties aux mêmes mises
 * produisent donc toujours exactement la même trace.
 *
 * Un extrait sans mise est un refus, jamais un repli. `three-tracks` peut
 * compléter un tour à zéro parce que ne rien poser y est un geste que le
 * joueur choisit ; ici, aucune valeur de l'échelle n'est neutre au regard du
 * verdict — la mise du milieu satisfait à elle seule le garde-fou. Combler un
 * trou reviendrait à noter une mise que personne n'a engagée.
 */
export const buildConfidenceBetAnswer = (
  config: ConfidenceBetConfig,
  playedBets: readonly Bet[],
): ConfidenceBetAnswer => {
  const stakeBySnippetId = new Map(
    playedBets.map((bet) => [bet.snippetId, bet.stake]),
  )

  const bets = config.snippets.map((snippet) => {
    const stake = stakeBySnippetId.get(snippet.id)
    if (stake === undefined) throw new IncompleteTraceError(snippet.id)

    return { snippetId: snippet.id, stake }
  })

  /**
   * Le journal — le capital final — vient de la simulation rejouée, jamais
   * d'un calcul refait ici : une seule implémentation du mouvement de
   * capital, celle de la phase 1.
   */
  const state = replayBets(config, bets)

  return parseConfidenceBetTrace({ bets, finalCapital: state.capital }, config)
}
