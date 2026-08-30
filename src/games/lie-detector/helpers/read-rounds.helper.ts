import type { LieDetectorAnswer } from '../schema/answer.schema'
import type { LieDetectorConfig } from '../schema/config.schema'

/**
 * Une seule lecture de ce que vaut une manche, partagée par l'écran et par
 * le scoring : deux implémentations auraient divergé au premier ajustement
 * de règle.
 *
 * Aucune horloge, aucun aléa, aucun accès extérieur : la fonction ne dépend
 * que de ses arguments.
 */
export type RoundReading = {
  roundId: string
  liarId: string
  firstPickId: string
  finalPickId: string
  objectionTargetId: string
  // La cible de l'objection diffère de la première désignation.
  contradicted: boolean
  // La désignation FINALE vise la menteuse.
  unmasked: boolean
  // La manche offrait une occasion de capituler : elle est contredite ET la
  // première désignation visait déjà la menteuse. `contradicted` seul ne
  // suffit pas — être contredit ne suppose que d'avoir désigné autre chose
  // que la cible de l'objection, ce qu'un joueur qui se trompe partout fait
  // mécaniquement. Sans le second membre, un tel joueur serait contredit
  // dans toutes les manches sans jamais avoir eu l'occasion de capituler,
  // et un critère qui compterait les contradictions le récompenserait sans
  // qu'il ait rien lu (corrigé le 30/08, revue F1).
  opportunity: boolean
  // La manche offrait une occasion, et elle a été lâchée : la désignation
  // finale ne vise plus la menteuse. Ne peut être vrai que si `opportunity`
  // l'est.
  capitulated: boolean
}

export type Reading = {
  rounds: readonly RoundReading[]
  unmaskedCount: number
  contradictedCount: number
  opportunityCount: number
  capitulationCount: number
}

const readRound = (
  round: LieDetectorConfig['rounds'][number],
  pick: LieDetectorAnswer['picks'][number],
): RoundReading => {
  // Le schéma de configuration garantit exactement une affirmation `lying`
  // par manche : le `find` rend donc toujours une valeur.
  const liarId = round.claims.find((claim) => claim.lying)?.id ?? ''

  const contradicted = round.objection.targetId !== pick.firstPickId
  const unmasked = pick.finalPickId === liarId
  const opportunity = contradicted && pick.firstPickId === liarId
  const capitulated = opportunity && pick.finalPickId !== liarId

  return {
    roundId: round.id,
    liarId,
    firstPickId: pick.firstPickId,
    finalPickId: pick.finalPickId,
    objectionTargetId: round.objection.targetId,
    contradicted,
    unmasked,
    opportunity,
    capitulated,
  }
}

export const readRounds = (
  config: LieDetectorConfig,
  trace: LieDetectorAnswer,
): Reading => {
  const pickByRoundId = new Map(trace.picks.map((pick) => [pick.roundId, pick]))

  // `parseLieDetectorTrace` garantit qu'une entrée couvre chaque manche :
  // le `find` ci-dessous rend donc toujours une valeur ici aussi.
  const rounds = config.rounds.map((round) => {
    const pick = pickByRoundId.get(round.id)
    if (pick === undefined) {
      throw new Error(`la manche « ${round.id} » n'a pas de désignation à lire`)
    }
    return readRound(round, pick)
  })

  return {
    rounds,
    unmaskedCount: rounds.filter((round) => round.unmasked).length,
    contradictedCount: rounds.filter((round) => round.contradicted).length,
    opportunityCount: rounds.filter((round) => round.opportunity).length,
    capitulationCount: rounds.filter((round) => round.capitulated).length,
  }
}
