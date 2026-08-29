import type { Dimension } from '../contracts/grid.schema'
import type { CriterionOutcome } from '../entities/evaluation-result.entity'

/**
 * Le passage des critères aux dimensions de la grille. Les scores sont
 * normalisés dans [0,1], donc les seuils de la grille restent comparables même
 * si on ajoute ou retire des jeux en cours de journée.
 *
 * `measured` distingue une dimension qu'aucun critère ne vise d'une dimension
 * visée mais entièrement ratée : la première ne vaut pas zéro, elle n'a pas
 * été mesurée.
 */

export type DimensionContribution = {
  criterionId: string
  gameId: string
  weight: number
  satisfied: boolean
}

export type DimensionScore = {
  dimensionId: string
  label: string
  score: number
  /** Le mot de la grille pour ce score, quand la dimension porte une échelle. */
  band: string | undefined
  measured: boolean
  earned: number
  possible: number
  contributions: readonly DimensionContribution[]
}

export interface ScoringStrategy {
  score(
    criteria: readonly CriterionOutcome[],
    dimensions: readonly Dimension[],
  ): DimensionScore[]
}
