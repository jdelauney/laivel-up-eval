import type { CriterionResult } from '../ports/game-evaluator.interface'

/**
 * Chaque réponse soumise devient une commande. C'est la trace d'audit, celle
 * qui servira à l'export JSON et au payload de l'assistant IA — une seule
 * source, pas deux formats à maintenir.
 *
 * L'horodatage vient du port `Clock`, jamais d'un appel direct à `Date` : le
 * rejeu injecte une horloge figée, sinon deux exécutions du même profil
 * produiraient deux traces différentes.
 */
export class SubmitAnswerCommand {
  readonly gameId: string
  readonly answer: unknown
  readonly results: readonly CriterionResult[]
  readonly submittedAt: string

  constructor(
    gameId: string,
    answer: unknown,
    results: readonly CriterionResult[],
    submittedAt: string,
  ) {
    this.gameId = gameId
    this.answer = answer
    this.results = results
    this.submittedAt = submittedAt
  }
}
