import type { Dimension } from '../contracts/grid.schema'
import type { CriterionOutcome } from '../entities/evaluation-result.entity'
import type {
  DimensionContribution,
  DimensionScore,
  MeasurementStatus,
  ScoringStrategy,
} from '../ports/scoring-strategy.interface'
import { bandFor } from './helpers/dimension-band.helper'

/**
 * Un critère satisfait apporte son poids de mapping à chaque dimension qu'il
 * vise. Score = contributions obtenues / contributions possibles.
 *
 * Aucune horloge, aucun aléa, aucun accès réseau : deux exécutions sur les
 * mêmes entrées rendent le même résultat, c'est la condition du mode rejeu.
 */

/**
 * Le statut ne dépend jamais de `satisfied` : il dit comment la valeur a été
 * obtenue, pas ce qu'elle vaut. Une seule contribution mesurée suffit à
 * qualifier l'axe de mesuré, même noyée parmi des contributions inférées.
 */
const resolveMeasurement = (
  contributions: readonly DimensionContribution[],
): MeasurementStatus => {
  if (contributions.length === 0) return 'unmeasured'
  const hasDirectMeasurement = contributions.some(
    (contribution) => contribution.evidence === 'measured',
  )
  return hasDirectMeasurement ? 'measured' : 'inferred'
}

export class WeightedMappingStrategy implements ScoringStrategy {
  score(
    criteria: readonly CriterionOutcome[],
    dimensions: readonly Dimension[],
  ): DimensionScore[] {
    return dimensions.map((dimension) => {
      const contributions: DimensionContribution[] = []

      for (const criterion of criteria) {
        for (const mapping of criterion.mapping) {
          if (mapping.dimension !== dimension.id) continue
          contributions.push({
            criterionId: criterion.criterionId,
            gameId: criterion.gameId,
            weight: mapping.weight,
            satisfied: criterion.satisfied,
            evidence: mapping.evidence,
          })
        }
      }

      const possible = contributions.reduce(
        (sum, contribution) => sum + contribution.weight,
        0,
      )
      const earned = contributions
        .filter((contribution) => contribution.satisfied)
        .reduce((sum, contribution) => sum + contribution.weight, 0)

      const score = possible === 0 ? 0 : earned / possible

      return {
        dimensionId: dimension.id,
        label: dimension.label,
        score,
        band: possible === 0 ? undefined : bandFor(dimension, score),
        measurement: resolveMeasurement(contributions),
        earned,
        possible,
        contributions,
      }
    })
  }
}
