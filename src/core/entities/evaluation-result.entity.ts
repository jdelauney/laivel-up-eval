import type { CriterionMapping, Game, Group } from '../contracts/course.schema'
import type {
  CriterionAttribution,
  CriterionResult,
} from '../ports/game-evaluator.interface'
import type { DimensionScore } from '../ports/scoring-strategy.interface'

/**
 * L'agrégation critère → jeu → groupe, et le lien conservé à chaque échelon.
 * Le verdict doit s'expliquer : on remonte d'un score de dimension jusqu'aux
 * critères qui l'ont produit, sans jamais recalculer à la lecture.
 */

export type CriterionOutcome = {
  criterionId: string
  gameId: string
  question: string
  satisfied: boolean
  mapping: readonly CriterionMapping[]
  /** Ce qui a produit le verdict, porté tel quel depuis le résultat du jeu. */
  attributions?: readonly CriterionAttribution[]
}

export type GameOutcome = {
  gameId: string
  label: string
  score: number
  criteria: readonly CriterionOutcome[]
}

export type GroupOutcome = {
  groupId: string
  label: string
  score: number
  games: readonly GameOutcome[]
}

const average = (values: readonly number[]): number =>
  values.length === 0
    ? 0
    : values.reduce((sum, value) => sum + value, 0) / values.length

/**
 * Un critère du parcours sans résultat est une incohérence, pas un critère
 * raté : le refuser ici évite un score faussement bas, silencieux.
 */
export const buildGameOutcome = (
  game: Game,
  results: readonly CriterionResult[],
): GameOutcome => {
  const criteria = game.criteria.map((criterion) => {
    const result = results.find(
      (candidate) => candidate.criterionId === criterion.id,
    )
    if (result === undefined) {
      throw new Error(
        `le critère « ${criterion.id} » du jeu « ${game.id} » n'a pas été évalué`,
      )
    }
    return {
      criterionId: criterion.id,
      gameId: game.id,
      question: criterion.question,
      satisfied: result.satisfied,
      mapping: criterion.mapping,
      attributions: result.attributions,
    }
  })

  const satisfied = criteria.filter((criterion) => criterion.satisfied).length

  return {
    gameId: game.id,
    label: game.label,
    score: criteria.length === 0 ? 0 : satisfied / criteria.length,
    criteria,
  }
}

export const buildGroupOutcome = (
  group: Group,
  games: readonly GameOutcome[],
): GroupOutcome => ({
  groupId: group.id,
  label: group.label,
  score: average(games.map((game) => game.score)),
  games,
})

export class EvaluationResult {
  readonly groups: readonly GroupOutcome[]
  readonly dimensions: readonly DimensionScore[]

  constructor(
    groups: readonly GroupOutcome[],
    dimensions: readonly DimensionScore[],
  ) {
    this.groups = groups
    this.dimensions = dimensions
  }

  allCriteria(): readonly CriterionOutcome[] {
    return this.groups.flatMap((group) =>
      group.games.flatMap((game) => game.criteria),
    )
  }

  dimension(dimensionId: string): DimensionScore | undefined {
    return this.dimensions.find(
      (dimension) => dimension.dimensionId === dimensionId,
    )
  }
}
