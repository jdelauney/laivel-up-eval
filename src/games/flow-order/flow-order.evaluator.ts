import { z } from 'zod'
import type {
  Criterion,
  CriterionRule,
} from '../../core/contracts/course.schema'
import type {
  CriterionResult,
  GameEvaluator,
} from '../../core/ports/game-evaluator.interface'
import { readOrder } from './helpers/read-order.helper'
import { parseFlowOrderTrace } from './schema/answer.schema'
import { flowOrderConfigSchema } from './schema/config.schema'

/**
 * Le point de contact public avec le port `GameEvaluator`, sur le modèle de
 * `practice-map.evaluator.ts` et `ambiguity-scan.evaluator.ts`. Il
 * interprète des règles déclaratives : déplacer un seuil se fait dans le
 * parcours, pas ici.
 */

const GAME_TYPE = 'flow-order'

const orderExactSchema = z.object({})
const orderWithinDisplacementSchema = z.object({ maxDisplacement: z.number() })

class UnknownRuleError extends Error {
  constructor(ruleType: string) {
    super(`la règle « ${ruleType} » n'est pas connue du jeu ${GAME_TYPE}`)
    this.name = 'UnknownRuleError'
  }
}

/** « La frise est-elle dans l'ordre exact ? » Lit `exact`, rien d'autre. */
const orderExact = (exact: boolean, rule: CriterionRule): boolean => {
  orderExactSchema.parse(rule)
  return exact
}

/**
 * « Chaque étape est-elle à sa place, à une position près ? » Lit le
 * déplacement maximal par étape, jamais une distance globale — voir
 * `read-order.helper.ts`. Distinct de `order-exact` par construction : un
 * ordre exact vaut les deux (`c1` implique `c2`, assumé), un ordre presque
 * juste vaut celui-ci seul, un ordre approximatif n'en vaut aucun.
 */
const orderWithinDisplacement = (
  maxDisplacement: number,
  rule: CriterionRule,
): boolean => {
  const { maxDisplacement: threshold } =
    orderWithinDisplacementSchema.parse(rule)
  return maxDisplacement <= threshold
}

export class FlowOrderEvaluator implements GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    const parsedConfig = flowOrderConfigSchema.parse(config)
    const trace = parseFlowOrderTrace(answer, parsedConfig)

    // La frise est lue une seule fois : les deux règles lisent la même
    // lecture, jamais un recalcul propre à chacune.
    const reading = readOrder(parsedConfig, trace)

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(criterion.rule, reading),
    }))
  }

  private applyRule(
    rule: CriterionRule,
    reading: { exact: boolean; maxDisplacement: number },
  ): boolean {
    switch (rule.type) {
      case 'order-exact':
        return orderExact(reading.exact, rule)
      case 'order-within-displacement':
        return orderWithinDisplacement(reading.maxDisplacement, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}
