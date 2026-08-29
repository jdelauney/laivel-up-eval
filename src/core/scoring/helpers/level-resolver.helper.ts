import type { Grid, Level, LevelCondition } from '@/core/contracts/grid.schema'
import type { DimensionScore } from '@/core/ports/scoring-strategy.interface'

/**
 * Le verdict. On descend les niveaux par `order` décroissant et on retient le
 * premier dont toutes les conditions tiennent.
 *
 * Deux décisions que les tests figent :
 * - les bornes `min` et `max` sont inclusives, un score posé exactement sur le
 *   seuil atteint le niveau ;
 * - une dimension non mesurée ne satisfait aucune condition, parce qu'un score
 *   inconnu n'est pas un score bas.
 */

export type LevelVerdict = {
  level: Level
  satisfiedConditions: readonly LevelCondition[]
  /** Ce que ce niveau dit pour atteindre le suivant. Donnée, jamais code. */
  hint: string
  /** Le niveau au-dessus, absent quand le joueur est déjà au sommet. */
  nextLevel: Level | undefined
}

const holds = (
  condition: LevelCondition,
  dimensions: readonly DimensionScore[],
): boolean => {
  const dimension = dimensions.find(
    (candidate) => candidate.dimensionId === condition.dimension,
  )
  if (dimension === undefined || !dimension.measured) return false
  if (condition.min !== undefined && dimension.score < condition.min) {
    return false
  }
  if (condition.max !== undefined && dimension.score > condition.max) {
    return false
  }
  return true
}

export const resolveLevel = (
  grid: Grid,
  dimensions: readonly DimensionScore[],
): LevelVerdict => {
  const byOrder = [...grid.levels].sort((a, b) => a.order - b.order)
  const descending = [...byOrder].reverse()

  const reached =
    descending.find((level) =>
      level.conditions.every((condition) => holds(condition, dimensions)),
    ) ?? byOrder[0]

  const position = byOrder.findIndex((level) => level.id === reached.id)

  return {
    level: reached,
    satisfiedConditions: reached.conditions.filter((condition) =>
      holds(condition, dimensions),
    ),
    hint: reached.nextLevelHint,
    nextLevel: byOrder[position + 1],
  }
}
