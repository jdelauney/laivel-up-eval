import type { FlowOrderAnswer } from '../schema/answer.schema'
import type { FlowOrderConfig } from '../schema/config.schema'

/**
 * Une seule lecture de ce que vaut une frise jouée, partagée par l'écran et
 * par le scoring, sur le modèle de `read-placements.helper.ts` et
 * `read-flags.helper.ts`.
 *
 * Aucune horloge, aucun aléa, aucun accès extérieur, et **aucun seuil de
 * critère** : le seuil de tolérance (`maxDisplacement`) est déclaré dans le
 * parcours et lu par la règle de l'évaluateur, jamais ici.
 */

export type OrderReading = {
  // Chaque étape tient exactement sa place attendue.
  exact: boolean
  // Le plus grand écart, en positions, tenu par une seule étape — jamais
  // une distance globale (Kendall tau, somme des écarts) : c'est ce qui
  // empêche qu'une inversion entre deux étapes voisines soit notée comme
  // une inversion de bout en bout, exigé au mot par la story.
  maxDisplacement: number
  // Le nombre d'étapes qui ne tiennent pas leur place attendue.
  displacedCount: number
}

/**
 * Lit la frise jouée contre les places attendues de la configuration, une
 * étape à la fois : `displacement` d'une étape est `|position_jouée -
 * rank_attendu|`, sa position jouée étant son index dans `orderedIds`
 * (1-indexé).
 */
export const readOrder = (
  config: FlowOrderConfig,
  trace: FlowOrderAnswer,
): OrderReading => {
  const rankById = new Map(config.steps.map((step) => [step.id, step.rank]))

  const displacements = trace.orderedIds.map((id, index) => {
    const rank = rankById.get(id)
    // `parseFlowOrderTrace` garantit qu'un identifiant de la trace référence
    // toujours une étape déclarée.
    if (rank === undefined) {
      throw new Error(`l'étape « ${id} » n'a pas de rang à lire`)
    }
    const playedPosition = index + 1
    return Math.abs(playedPosition - rank)
  })

  const maxDisplacement = displacements.reduce(
    (max, displacement) => Math.max(max, displacement),
    0,
  )
  const displacedCount = displacements.filter(
    (displacement) => displacement > 0,
  ).length

  return {
    exact: displacedCount === 0,
    maxDisplacement,
    displacedCount,
  }
}
