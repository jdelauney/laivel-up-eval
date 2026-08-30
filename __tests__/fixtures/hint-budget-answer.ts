import { buildHintBudgetAnswer } from '@/games/hint-budget/actions/build-hint-budget-answer.action'
import { hintBudgetConfigSchema } from '@/games/hint-budget/schema/config.schema'

/**
 * Une trace `hint-budget` conforme, minimale : aucun cadrage, aucun achat,
 * la première cause de chaque situation tranchée. Sert aux parcours qui
 * traversent tout le référentiel sans mesurer `pilotage-contexte` —
 * `checkpoints-run`, `three-tracks-run` — où seule une réponse valide
 * importe, jamais une bonne réponse. Sur le modèle de
 * `defaultLieDetectorAnswer`.
 */
export const defaultHintBudgetAnswer = (config: unknown): unknown => {
  const parsed = hintBudgetConfigSchema.parse(config)
  return buildHintBudgetAnswer(
    parsed,
    parsed.situations.map((situation) => ({
      situationId: situation.id,
      framing: null,
      boughtHintIds: [],
      cutCauseId: situation.causes[0].id,
    })),
  )
}
