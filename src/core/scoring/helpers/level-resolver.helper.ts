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
 *
 * Deux règles, **une seule** qu'on soit classé ou non :
 * 1. **La direction se lit sur la borne qui a cédé** (`ConditionGap.violated`),
 *    jamais sur la simple présence de `min` : le schéma autorise une
 *    condition à porter les deux bornes, et seule celle qui a effectivement
 *    cédé dit s'il faut monter ou descendre.
 * 2. **La cible du plan est toujours le niveau le plus bas, strictement
 *    au-dessus de la position courante, qu'aucune borne `max` dépassée
 *    n'exclut** — le premier cran atteignable en montant. Un profil classé
 *    comme un profil non classé (sa position : « avant le premier niveau »)
 *    suivent la même règle : viser un niveau intermédiaire dont une borne
 *    `max` est déjà dépassée reviendrait à demander de régresser, que le
 *    joueur tienne déjà un niveau ou non. `nextLevel` et `blocking` pointent
 *    cette cible ; `unranked` reste les conditions non tenues du niveau le
 *    **plus bas** — la raison pour laquelle aucun niveau n'est annonçable —
 *    et n'est jamais le même contenu que `blocking` dès qu'une cible existe.
 *    **Sans cible atteignable**, `nextLevel` est absent, `blocking` est vide
 *    et `noNextLevelReason` porte la raison : aucun repli sur le niveau le
 *    plus bas, qui redemanderait de régresser.
 */

export type ConditionGap = {
  condition: LevelCondition
  dimension: DimensionScore | undefined
  /** L'écart à la borne violée. Absent quand l'axe n'a pas été mesuré. */
  gap: number | undefined
  /** La borne qui a cédé. Absente quand l'axe n'a pas été mesuré. */
  violated: 'min' | 'max' | undefined
}

export type LevelVerdict = {
  /** Absent quand même le niveau le plus bas ne tient pas. */
  level: Level | undefined
  /** Ce qui empêche d'annoncer un niveau. Absent dès qu'un niveau est atteint. */
  unranked: readonly ConditionGap[] | undefined
  satisfiedConditions: readonly LevelCondition[]
  /**
   * Les conditions de la cible qui ne tiennent pas, la plus bloquante en
   * tête. L'axe qui plafonne, à l'écran, est la tête de ce tableau — lue sur
   * `plan[0]`, pas sur un champ dédié. Vide quand `nextLevel` est absent.
   */
  blocking: readonly ConditionGap[]
  /** Ce que le niveau atteint dit pour monter. Absent quand aucun n'est atteint. */
  hint: string | undefined
  /** La cible du plan de progression. Absente sans cible atteignable. */
  nextLevel: Level | undefined
  /**
   * Pourquoi `nextLevel` est absent — absent tant que `nextLevel` existe.
   * `'summit'` : rien n'existe au-dessus de la position courante dans
   * l'ordre de la grille, le sommet du référentiel est atteint. `'unreachable'` :
   * un niveau existe au-dessus, mais chacun viole une borne `max` déjà
   * dépassée — la grille n'en propose aucun sans redemander de régresser.
   * Les deux raisons ne se confondent pas à l'écran.
   */
  noNextLevelReason: 'summit' | 'unreachable' | undefined
}

type ConditionEvaluation = {
  dimension: DimensionScore | undefined
  holds: boolean
  gap: number | undefined
  violated: 'min' | 'max' | undefined
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
    return { dimension, holds: false, gap: undefined, violated: undefined }
  }
  if (condition.min !== undefined && dimension.score < condition.min) {
    return {
      dimension,
      holds: false,
      gap: condition.min - dimension.score,
      violated: 'min',
    }
  }
  if (condition.max !== undefined && dimension.score > condition.max) {
    return {
      dimension,
      holds: false,
      gap: dimension.score - condition.max,
      violated: 'max',
    }
  }
  return { dimension, holds: true, gap: undefined, violated: undefined }
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
      violated: evaluation.violated,
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

/**
 * Le niveau visé par le plan de progression : le premier niveau, en ordre
 * croissant, strictement au-dessus de `position`, dont aucune condition
 * `max` n'est violée — le premier cran atteignable en montant. Une borne
 * `max` violée dit que le profil est déjà au-dessus : viser ce niveau
 * reviendrait à demander de régresser. Une borne `min` violée n'écarte rien,
 * elle se comble en avançant.
 *
 * `position` est l'index (dans `byOrder`) du niveau déjà atteint, ou `-1`
 * pour un profil non classé — sa position est « avant le premier niveau »,
 * donc tous les niveaux de la grille sont candidats. Une seule fonction, une
 * seule règle pour les deux profils : aucun repli sur le niveau le plus bas
 * quand rien n'est atteignable.
 */
const resolveClimbTarget = (
  byOrder: readonly Level[],
  position: number,
  dimensions: readonly DimensionScore[],
): Level | undefined =>
  byOrder
    .slice(position + 1)
    .find(
      (level) =>
        !unmetConditionGaps(level, dimensions).some(
          (gap) => gap.violated === 'max',
        ),
    )

/**
 * Pourquoi `resolveClimbTarget` n'a rien retenu. `'summit'` quand aucun
 * niveau n'existe au-dessus de `position` dans l'ordre de la grille ;
 * `'unreachable'` quand un niveau existe au-dessus mais que chacun viole une
 * borne `max` déjà dépassée.
 */
const resolveNoNextLevelReason = (
  byOrder: readonly Level[],
  position: number,
): 'summit' | 'unreachable' =>
  position >= byOrder.length - 1 ? 'summit' : 'unreachable'

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
    const unranked = sortByBlockingOrder(
      unmetConditionGaps(lowest, dimensions),
      grid,
    )
    const target = resolveClimbTarget(byOrder, -1, dimensions)
    const blocking =
      target === undefined
        ? []
        : sortByBlockingOrder(unmetConditionGaps(target, dimensions), grid)
    return {
      level: undefined,
      unranked,
      satisfiedConditions: [],
      blocking,
      hint: undefined,
      nextLevel: target,
      noNextLevelReason:
        target === undefined
          ? resolveNoNextLevelReason(byOrder, -1)
          : undefined,
    }
  }

  const position = byOrder.findIndex((level) => level.id === reached.id)
  const target = resolveClimbTarget(byOrder, position, dimensions)
  const blocking =
    target === undefined
      ? []
      : sortByBlockingOrder(unmetConditionGaps(target, dimensions), grid)

  return {
    level: reached,
    unranked: undefined,
    satisfiedConditions: reached.conditions.filter((condition) =>
      holds(condition, dimensions),
    ),
    blocking,
    hint: reached.nextLevelHint,
    nextLevel: target,
    noNextLevelReason:
      target === undefined
        ? resolveNoNextLevelReason(byOrder, position)
        : undefined,
  }
}
