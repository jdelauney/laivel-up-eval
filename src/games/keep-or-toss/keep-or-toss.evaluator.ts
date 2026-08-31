import { z } from 'zod'
import type {
  Criterion,
  CriterionRule,
} from '../../core/contracts/course.schema'
import type {
  CriterionResult,
  GameEvaluator,
} from '../../core/ports/game-evaluator.interface'
import { readSorting } from './helpers/read-sorting.helper'
import { parseKeepOrTossTrace } from './schema/answer.schema'
import { keepOrTossConfigSchema } from './schema/config.schema'

/**
 * Le point de contact public avec le port `GameEvaluator`, sur le modèle de
 * `flow-order.evaluator.ts` et `defect-hunt.evaluator.ts`. Il interprète des
 * règles déclaratives : déplacer un seuil se fait dans le parcours, pas ici.
 */

const GAME_TYPE = 'keep-or-toss'

const shareRuleSchema = z.object({ threshold: z.number() })
const completedRuleSchema = z.object({})

class UnknownRuleError extends Error {
  constructor(ruleType: string) {
    super(`la règle « ${ruleType} » n'est pas connue du jeu ${GAME_TYPE}`)
    this.name = 'UnknownRuleError'
  }
}

/**
 * « Le taux de bon classement dépasse-t-il le seuil ? » Lit `correctShare`,
 * dont le dénominateur est le total du lot — un item non trié y compte
 * comme manqué, jamais comme neutre.
 */
const correctShareAtLeast = (
  correctShare: number,
  rule: CriterionRule,
): boolean => {
  const { threshold } = shareRuleSchema.parse(rule)
  return correctShare >= threshold
}

/**
 * « Le tri a-t-il été bouclé dans le temps imparti ? » Lit `completedInTime`,
 * qui exige le lot entier trié **et** la durée sous le budget — un joueur
 * qui ne trie rien et attend la fin ne l'a pas bouclé.
 */
const sortingCompletedInTime = (
  completedInTime: boolean,
  rule: CriterionRule,
): boolean => {
  completedRuleSchema.parse(rule)
  return completedInTime
}

export class KeepOrTossEvaluator implements GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    const parsedConfig = keepOrTossConfigSchema.parse(config)
    const trace = parseKeepOrTossTrace(answer, parsedConfig)

    // Le tri est lu une seule fois : les deux règles lisent la même
    // lecture, jamais un recalcul propre à chacune.
    const reading = readSorting(parsedConfig, trace)

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(criterion.rule, reading),
    }))
  }

  private applyRule(
    rule: CriterionRule,
    reading: { correctShare: number; completedInTime: boolean },
  ): boolean {
    switch (rule.type) {
      case 'correct-share-at-least':
        return correctShareAtLeast(reading.correctShare, rule)
      case 'sorting-completed-in-time':
        return sortingCompletedInTime(reading.completedInTime, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}
