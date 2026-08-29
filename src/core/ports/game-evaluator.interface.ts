import type { Criterion } from '../contracts/course.schema'

/**
 * Le contrat que chaque jeu remplit. Le moteur ne connaît jamais le détail d'un
 * jeu : il lui passe la réponse du joueur, la config déclarée dans le parcours
 * et les critères à appliquer, et reçoit un verdict binaire par critère.
 */

export type CriterionResult = {
  criterionId: string
  satisfied: boolean
}

export interface GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[]
}
