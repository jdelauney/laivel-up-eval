import type { MappingEvidence } from '../contracts/course.schema'
import type { Dimension } from '../contracts/grid.schema'
import type { CriterionOutcome } from '../entities/evaluation-result.entity'

/**
 * Le passage des critères aux dimensions de la grille. Les scores sont
 * normalisés dans [0,1], donc les seuils de la grille restent comparables même
 * si on ajoute ou retire des jeux en cours de journée.
 *
 * `measurement` distingue trois cas qu'un booléen ne peut pas porter :
 * une dimension qu'aucun critère ne vise (`unmeasured`, elle ne vaut pas
 * zéro, elle n'a pas été mesurée), une dimension dont au moins un critère
 * lit un résultat direct (`measured`), et une dimension dont tous les
 * critères ne lisent qu'un jugement indirect (`inferred`).
 */

export type MeasurementStatus = 'measured' | 'inferred' | 'unmeasured'

export type DimensionContribution = {
  criterionId: string
  gameId: string
  weight: number
  satisfied: boolean
  evidence: MappingEvidence
}

export type DimensionScore = {
  dimensionId: string
  label: string
  score: number
  /** Le mot de la grille pour ce score, quand la dimension porte une échelle. */
  band: string | undefined
  measurement: MeasurementStatus
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
