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

// Le seuil est borné à `[0, 1]` : rien au-delà de ces bords n'a de sens pour
// une part. La borne basse qui compte réellement — au-dessus du plancher
// que le geste unique répété obtient sur *ce* lot — ne peut pas se poser
// ici : ce schéma ignore le corpus. Elle se vérifie dans
// `correctShareAtLeast`, seul endroit où le seuil déclaré et le corpus
// réel se rencontrent.
const shareRuleSchema = z.object({ threshold: z.number().min(0).max(1) })
const completedRuleSchema = z.object({})

class UnknownRuleError extends Error {
  constructor(ruleType: string) {
    super(`la règle « ${ruleType} » n'est pas connue du jeu ${GAME_TYPE}`)
    this.name = 'UnknownRuleError'
  }
}

/**
 * Un seuil de parcours qui ne dépasse pas le plancher du geste unique
 * répété rendrait ce dernier gagnant sans qu'aucun test ne rougisse — la
 * fuite mesurée par la revue du 31/08 : abaisser `threshold` de `0.75` à
 * `0.65` sur ce corpus aurait rendu « tout garder » gagnant en silence. Le
 * refus se fait à l'évaluation, seul moment où le seuil déclaré
 * (`shareRuleSchema`, qui ignore le corpus) et `maxSingleGestureShare`
 * (`readSorting`, qui ignore le seuil) se rencontrent.
 */
class ThresholdBelowBlindFloorError extends Error {
  constructor(threshold: number, maxSingleGestureShare: number) {
    super(
      `le seuil « ${threshold} » de « correct-share-at-least » ne dépasse pas le plancher du geste unique répété sur ce lot (${maxSingleGestureShare}) : un joueur qui ne lit aucune carte tiendrait le critère`,
    )
    this.name = 'ThresholdBelowBlindFloorError'
  }
}

/**
 * Lit `correctShare`, dont le dénominateur est le total du lot — un item
 * non trié y compte comme manqué, jamais comme neutre. Le seuil lui-même
 * doit dépasser `maxSingleGestureShare` : sans ce garde-fou, un seuil bas
 * rendrait le geste unique répété gagnant, silencieusement.
 */
const correctShareAtLeast = (
  reading: { correctShare: number; maxSingleGestureShare: number },
  rule: CriterionRule,
): boolean => {
  const { threshold } = shareRuleSchema.parse(rule)
  if (threshold <= reading.maxSingleGestureShare) {
    throw new ThresholdBelowBlindFloorError(
      threshold,
      reading.maxSingleGestureShare,
    )
  }
  return reading.correctShare >= threshold
}

/**
 * Lit `completedInTime` **et** compare `correctShare` au plancher que le
 * geste unique répété obtient mécaniquement sur ce lot
 * (`maxSingleGestureShare`), comparaison **stricte** : à égalité, le geste
 * unique tiendrait encore le critère.
 *
 * Avant la revue du 31/08, cette règle ne lisait que `completedInTime` :
 * « tout garder » en douze gestes bouclait le lot en quelques secondes et
 * tenait le critère, quand un lecteur honnête qui classait correctement
 * mais n'avait pas le temps de finir le manquait. Le plancher n'est **pas**
 * déclaré dans le parcours — un seuil écrit dans `course.json` peut dériver
 * d'un caractère sans qu'un test ne le remarque, exactement la faute que la
 * revue a nommée sur `flow-order` ; un plancher **calculé depuis le corpus
 * lui-même** ne le peut pas, il bouge avec le corpus qu'il contraint.
 */
const sortingCompletedBeyondBlindFloor = (
  reading: {
    completedInTime: boolean
    correctShare: number
    maxSingleGestureShare: number
  },
  rule: CriterionRule,
): boolean => {
  completedRuleSchema.parse(rule)
  return (
    reading.completedInTime &&
    reading.correctShare > reading.maxSingleGestureShare
  )
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
    reading: {
      correctShare: number
      completedInTime: boolean
      maxSingleGestureShare: number
    },
  ): boolean {
    switch (rule.type) {
      case 'correct-share-at-least':
        return correctShareAtLeast(reading, rule)
      case 'sorting-completed-beyond-blind-floor':
        return sortingCompletedBeyondBlindFloor(reading, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}
