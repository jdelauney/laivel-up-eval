import type {
  Dimension,
  DimensionBand,
  Grid,
} from '../../contracts/grid.schema'
import type { MeasurementStatus } from '../../ports/scoring-strategy.interface'
import { bandFor } from './dimension-band.helper'
import type { ConditionGap } from './level-resolver.helper'

/**
 * Le plan de progression : une étape par axe qui bloque le cran suivant,
 * dans l'ordre où `level-resolver.helper.ts` les a classées — le plafond en
 * tête. Rien n'est rédigé ici : l'action et la preuve sont lues sur la bande
 * de la grille que la condition vise, jamais composées à partir de
 * fragments codés en dur. Une bande sans `action` rend une étape sans
 * action, l'écran le dit.
 *
 * Pur : aucune horloge, aucun aléa, aucun accès réseau. Deux appels sur le
 * même plafond rendent le même plan.
 */

export type PlanStep = {
  dimensionId: string
  label: string
  measurement: MeasurementStatus
  /** Le cran visé et le seuil à franchir. Absent quand l'axe n'a pas d'échelle. */
  target: { label: string; from: number } | undefined
  /** Le geste, lu sur la bande visée. Absent quand la grille n'en porte pas. */
  action: string | undefined
  /** La preuve, lue sur la bande visée. Absente quand la grille n'en porte pas. */
  proof: string | undefined
  /** La valeur observée. Absente quand l'axe n'a pas été mesuré. */
  observed: number | undefined
  /** La borne exigée par la condition qui bloque. */
  required: number
  /**
   * Le cran actuel de l'axe, dans les mots de la grille — résolu par
   * `bandFor`. Absent quand l'axe est `unmeasured` ou n'a pas d'échelle.
   */
  observedBand: string | undefined
}

const requireBound = (
  value: number | undefined,
  dimensionId: string,
  bound: 'min' | 'max',
): number => {
  if (value === undefined) {
    throw new Error(
      `la condition sur « ${dimensionId} » ne porte pas de borne ${bound}`,
    )
  }
  return value
}

/**
 * La borne posée par la condition qui bloque, lue sur la borne qui a
 * effectivement cédé (`gap.violated`) — jamais sur la simple présence de
 * `min`, qu'une condition à deux bornes rendrait ambiguë. Sans axe mesuré,
 * aucune borne n'a cédé : on retombe sur celle que la condition déclare,
 * `min` d'abord. Le schéma garantit qu'une condition porte au moins l'une
 * des deux ; l'absence des deux est une incohérence de câblage, pas un cas
 * produit.
 */
const requiredBound = (gap: ConditionGap): number => {
  if (gap.violated === 'max')
    return requireBound(gap.condition.max, gap.condition.dimension, 'max')
  if (gap.violated === 'min')
    return requireBound(gap.condition.min, gap.condition.dimension, 'min')
  if (gap.condition.min !== undefined) return gap.condition.min
  if (gap.condition.max !== undefined) return gap.condition.max
  throw new Error(
    `la condition sur « ${gap.condition.dimension} » ne porte ni min ni max`,
  )
}

const bandAtOrAbove = (scale: readonly DimensionBand[], min: number) =>
  scale.find((band) => band.from >= min)

const bandAtOrBelow = (scale: readonly DimensionBand[], max: number) =>
  [...scale].reverse().find((band) => band.from <= max)

/**
 * La bande visée par la condition, sur l'échelle brute de la grille — jamais
 * recalculée depuis un libellé. La direction se lit sur la borne qui a cédé
 * (`gap.violated`) : borne `min` violée, la bande la plus basse qui la
 * franchit ; borne `max` violée, la bande la plus haute qui n'y échappe pas.
 * Sans axe mesuré, aucune borne n'a cédé : on retombe sur celle que la
 * condition déclare.
 */
const resolveTargetBand = (
  gridDimension: Dimension | undefined,
  gap: ConditionGap,
): DimensionBand | undefined => {
  const scale = gridDimension?.scale
  if (scale === undefined) return undefined

  if (gap.violated === 'max' && gap.condition.max !== undefined) {
    return bandAtOrBelow(scale, gap.condition.max)
  }
  if (gap.violated === 'min' && gap.condition.min !== undefined) {
    return bandAtOrAbove(scale, gap.condition.min)
  }
  if (gap.condition.min !== undefined) {
    return bandAtOrAbove(scale, gap.condition.min)
  }
  if (gap.condition.max !== undefined) {
    return bandAtOrBelow(scale, gap.condition.max)
  }
  return undefined
}

const resolveObservedBand = (
  gridDimension: Dimension | undefined,
  gap: ConditionGap,
  measurement: MeasurementStatus,
): string | undefined => {
  if (measurement === 'unmeasured') return undefined
  if (gridDimension === undefined || gap.dimension === undefined) {
    return undefined
  }
  return bandFor(gridDimension, gap.dimension.score)
}

const buildStep = (grid: Grid, gap: ConditionGap): PlanStep => {
  const gridDimension = grid.dimensions.find(
    (candidate) => candidate.id === gap.condition.dimension,
  )
  const target = resolveTargetBand(gridDimension, gap)
  const measurement = gap.dimension?.measurement ?? 'unmeasured'

  return {
    dimensionId: gap.condition.dimension,
    label:
      gap.dimension?.label ?? gridDimension?.label ?? gap.condition.dimension,
    measurement,
    target:
      target === undefined
        ? undefined
        : { label: target.label, from: target.from },
    action: target?.action,
    proof: target?.proof,
    observed: measurement === 'unmeasured' ? undefined : gap.dimension?.score,
    required: requiredBound(gap),
    observedBand: resolveObservedBand(gridDimension, gap, measurement),
  }
}

export const planProgression = (
  grid: Grid,
  blocking: readonly ConditionGap[],
): PlanStep[] => blocking.map((gap) => buildStep(grid, gap))
