import type { Criterion } from '../contracts/course.schema'

/**
 * Le contrat que chaque jeu remplit. Le moteur ne connaît jamais le détail d'un
 * jeu : il lui passe la réponse du joueur, la config déclarée dans le parcours
 * et les critères à appliquer, et reçoit un verdict binaire par critère.
 */

export type CriterionAttribution = {
  /** Le geste ou l'objet en cause, nommé pour le joueur — jamais un id. */
  label: string
  /** Vrai quand ce geste va dans le sens du critère. */
  held: boolean
}

export type CriterionResult = {
  criterionId: string
  satisfied: boolean
  /** Ce qui a produit ce verdict, quand le jeu a mieux qu'un booléen. */
  attributions?: readonly CriterionAttribution[]
}

export interface GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[]
}
