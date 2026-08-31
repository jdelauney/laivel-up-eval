import type { KeepOrTossAnswer } from '../schema/answer.schema'
import type { KeepOrTossConfig } from '../schema/config.schema'

/**
 * Une seule lecture de ce que vaut un tri joué, partagée par l'écran et par
 * le scoring, sur le modèle de `read-order.helper.ts` et
 * `read-review.helper.ts`.
 *
 * Aucune horloge, aucun aléa, aucun accès extérieur, et aucun seuil de
 * critère : le seuil de `correctShare` est déclaré dans le parcours et lu
 * par la règle de l'évaluateur, jamais ici.
 */

export type SortingReading = {
  total: number
  sortedCount: number
  correctCount: number
  unsortedCount: number
  /**
   * Le dénominateur est le **total**, jamais le nombre trié : un élément
   * non trié compte comme manqué, jamais comme neutre. Diviser par le
   * nombre trié récompenserait l'abandon précoce — trier trois cartes
   * justes et s'arrêter donnerait 100 %.
   */
  correctShare: number
  /** Le lot entier trié, dans le temps imparti — pas seulement le temps tenu. */
  completedInTime: boolean
}

export const readSorting = (
  config: KeepOrTossConfig,
  trace: KeepOrTossAnswer,
): SortingReading => {
  const total = config.items.length
  const expectedById = new Map(config.items.map((item) => [item.id, item.keep]))

  const sortedCount = trace.verdicts.length
  const correctCount = trace.verdicts.filter(
    (verdict) => expectedById.get(verdict.itemId) === verdict.kept,
  ).length
  const unsortedCount = total - sortedCount

  return {
    total,
    sortedCount,
    correctCount,
    unsortedCount,
    correctShare: correctCount / total,
    completedInTime:
      sortedCount === total && trace.elapsedSeconds <= config.durationSeconds,
  }
}
