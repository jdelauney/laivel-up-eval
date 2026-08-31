import type { KeepOrTossAnswer } from '../schema/answer.schema'
import type { KeepOrTossConfig } from '../schema/config.schema'

/**
 * Une seule lecture de ce que vaut un tri joué, partagée par l'écran et par
 * le scoring, sur le modèle de `read-order.helper.ts` et
 * `read-review.helper.ts`.
 *
 * Aucune horloge, aucun aléa, aucun accès extérieur, et aucun seuil
 * *déclaré* : le seuil de `correctShare` reste écrit dans le parcours et lu
 * par la règle de l'évaluateur, jamais ici. `maxSingleGestureShare` n'est
 * pas de la même nature — ce n'est pas un seuil qu'un auteur choisit, c'est
 * une propriété du corpus qui se calcule, au même titre que `correctShare`.
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
  /**
   * La part que le geste unique répété — « tout garder » ou « tout jeter »,
   * quel que soit le plus représenté des deux — obtient mécaniquement sur
   * **ce** lot, sans lire une seule carte : `max(garder, jeter) / total`.
   *
   * Calculé depuis le corpus déclaré, jamais écrit à la main : un plancher
   * écrit en dur pourrait diverger du corpus réel sans qu'aucun test ne le
   * remarque — exactement la faute que la revue du 31/08 a nommée sur
   * `flow-order` (un seuil déclaré à côté du corpus qu'il est censé
   * contraindre) et qui touchait aussi `c2` ici : un lot qui bascule vers un
   * déséquilibre plus fort déplace ce plancher tout seul, sans qu'une ligne
   * de code ne change.
   */
  maxSingleGestureShare: number
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

  const keepCount = config.items.filter((item) => item.keep).length
  const tossCount = total - keepCount

  return {
    total,
    sortedCount,
    correctCount,
    unsortedCount,
    correctShare: correctCount / total,
    completedInTime:
      sortedCount === total && trace.elapsedSeconds <= config.durationSeconds,
    maxSingleGestureShare: Math.max(keepCount, tossCount) / total,
  }
}
