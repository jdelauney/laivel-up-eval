import type { Grid, Level, LevelCondition } from '@/core/contracts/grid.schema'
import type { DimensionScore } from '@/core/ports/scoring-strategy.interface'

/**
 * Le verdict. On descend les niveaux par `order` décroissant et on retient le
 * premier dont toutes les conditions tiennent.
 *
 * Décisions que les tests figent :
 * - les bornes `min` et `max` sont inclusives, un score posé exactement sur le
 *   seuil atteint le niveau ;
 * - une dimension non mesurée ne satisfait aucune condition, parce qu'un score
 *   inconnu n'est pas un score bas ;
 * - une dimension inférée satisfait une condition exactement comme une
 *   dimension mesurée : c'est une valeur obtenue indirectement, pas absente ;
 * - aucun niveau qui ne tient pas ses conditions n'est jamais annoncé par
 *   défaut. Quand même le plus bas échoue, `level` est absent et `unranked`
 *   porte la raison — jamais un repli silencieux sur le niveau le plus bas.
 */

export type ConditionGap = {
  condition: LevelCondition
  dimension: DimensionScore | undefined
  /** L'écart à la borne violée. Absent quand l'axe n'a pas été mesuré. */
  gap: number | undefined
}

export type LevelVerdict = {
  /** Absent quand même le niveau le plus bas ne tient pas. */
  level: Level | undefined
  /** Ce qui empêche d'annoncer un niveau. Absent dès qu'un niveau est atteint. */
  unranked: readonly ConditionGap[] | undefined
  satisfiedConditions: readonly LevelCondition[]
  /** Les conditions du cran suivant qui ne tiennent pas, la plus bloquante en tête. */
  blocking: readonly ConditionGap[]
  /** L'axe qui plafonne : la tête de `blocking`. Absent au sommet du référentiel. */
  capping: ConditionGap | undefined
  /** Ce que le niveau atteint dit pour monter. Absent quand aucun n'est atteint. */
  hint: string | undefined
  nextLevel: Level | undefined
}

type ConditionEvaluation = {
  dimension: DimensionScore | undefined
  holds: boolean
  gap: number | undefined
}

/**
 * Une dimension absente ou non mesurée ne prouve aucune condition, borne
 * `min` comme borne `max` : un score inconnu n'est ni haut ni bas.
 */
const evaluateCondition = (
  condition: LevelCondition,
  dimensions: readonly DimensionScore[],
): ConditionEvaluation => {
  const dimension = dimensions.find(
    (candidate) => candidate.dimensionId === condition.dimension,
  )
  if (dimension === undefined || dimension.measurement === 'unmeasured') {
    return { dimension, holds: false, gap: undefined }
  }
  if (condition.min !== undefined && dimension.score < condition.min) {
    return { dimension, holds: false, gap: condition.min - dimension.score }
  }
  if (condition.max !== undefined && dimension.score > condition.max) {
    return { dimension, holds: false, gap: dimension.score - condition.max }
  }
  return { dimension, holds: true, gap: undefined }
}

const holds = (
  condition: LevelCondition,
  dimensions: readonly DimensionScore[],
): boolean => evaluateCondition(condition, dimensions).holds

/** Les conditions d'un niveau qui ne tiennent pas, chacune avec son écart. */
const unmetConditionGaps = (
  level: Level,
  dimensions: readonly DimensionScore[],
): ConditionGap[] =>
  level.conditions
    .map((condition) => ({
      condition,
      evaluation: evaluateCondition(condition, dimensions),
    }))
    .filter(({ evaluation }) => !evaluation.holds)
    .map(({ condition, evaluation }) => ({
      condition,
      dimension: evaluation.dimension,
      gap: evaluation.gap,
    }))

/**
 * Un axe non mesuré passe devant : rien ne peut l'ouvrir. Entre deux axes
 * actionnables, celui qui manque le plus au seuil est le plus urgent. À
 * écart égal, l'ordre de déclaration de la grille tranche.
 */
const sortByBlockingOrder = (
  gaps: readonly ConditionGap[],
  grid: Grid,
): ConditionGap[] => {
  const dimensionOrder = grid.dimensions.map((dimension) => dimension.id)
  const rank = (gap: ConditionGap) =>
    dimensionOrder.indexOf(gap.condition.dimension)

  return [...gaps].sort((a, b) => {
    if (a.gap === undefined && b.gap === undefined) return rank(a) - rank(b)
    if (a.gap === undefined) return -1
    if (b.gap === undefined) return 1
    if (a.gap !== b.gap) return b.gap - a.gap
    return rank(a) - rank(b)
  })
}

export const resolveLevel = (
  grid: Grid,
  dimensions: readonly DimensionScore[],
): LevelVerdict => {
  const byOrder = [...grid.levels].sort((a, b) => a.order - b.order)
  const descending = [...byOrder].reverse()
  const lowest = byOrder[0]

  const reached = descending.find((level) =>
    level.conditions.every((condition) => holds(condition, dimensions)),
  )

  if (reached === undefined) {
    const gaps = sortByBlockingOrder(
      unmetConditionGaps(lowest, dimensions),
      grid,
    )
    return {
      level: undefined,
      unranked: gaps,
      satisfiedConditions: [],
      blocking: gaps,
      capping: gaps[0],
      hint: undefined,
      nextLevel: lowest,
    }
  }

  const position = byOrder.findIndex((level) => level.id === reached.id)
  const nextLevel = byOrder[position + 1]
  const blocking =
    nextLevel === undefined
      ? []
      : sortByBlockingOrder(unmetConditionGaps(nextLevel, dimensions), grid)

  return {
    level: reached,
    unranked: undefined,
    satisfiedConditions: reached.conditions.filter((condition) =>
      holds(condition, dimensions),
    ),
    blocking,
    capping: blocking[0],
    hint: reached.nextLevelHint,
    nextLevel,
  }
}
