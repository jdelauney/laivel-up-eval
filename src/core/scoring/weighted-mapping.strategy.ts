import type { Dimension } from '../contracts/grid.schema'
import type { CriterionOutcome } from '../entities/evaluation-result.entity'
import type {
  DimensionContribution,
  DimensionScore,
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
        measured: possible > 0,
        earned,
        possible,
        contributions,
      }
    })
  }
}
