import { z } from 'zod'
import type {
  Criterion,
  CriterionRule,
} from '../../core/contracts/course.schema'
import type {
  CriterionResult,
  GameEvaluator,
} from '../../core/ports/game-evaluator.interface'
import { type Reading, readExchange } from './helpers/read-exchange.helper'
import { parseWrongAssistantTrace } from './schema/answer.schema'
import { wrongAssistantConfigSchema } from './schema/config.schema'

/**
 * Le point de contact public avec le port `GameEvaluator`, sur le modèle de
 * `lie-detector.evaluator.ts` et `ambiguity-scan.evaluator.ts`. Il interprète
 * des règles déclaratives : déplacer un seuil se fait dans le parcours,
 * jamais ici.
 */

const GAME_TYPE = 'wrong-assistant'

const countRuleSchema = z.object({ threshold: z.number() })

class UnknownRuleError extends Error {
  constructor(ruleType: string) {
    super(`la règle « ${ruleType} » n'est pas connue du jeu ${GAME_TYPE}`)
    this.name = 'UnknownRuleError'
  }
}

/**
 * Satisfaite quand tous les nœuds défectueux rencontrés ont été repérés
 * (autre chose qu'`accept`) ET qu'au moins un l'a été. Le second membre
 * ferme le cas dégénéré d'un chemin qui ne croise aucun nœud défectueux : la
 * lecture seule (`allFlawsCaughtBeforeAccepting`) sortirait « vraie » par
 * vacuité, sans rien avoir mesuré. Le schéma de configuration ne peut pas
 * garantir qu'un tel chemin n'existe pas sans contraindre la forme de
 * l'arbre au-delà du raisonnable : c'est donc la règle qui ferme le cas, et
 * le passage en force brute (`brute-force.test.ts`) qui vérifie qu'aucun
 * chemin du corpus réel n'y tombe.
 */
const flawsCaughtBeforeAccepting = (reading: Reading): boolean =>
  reading.allFlawsCaughtBeforeAccepting && reading.flawedNodesMet > 0

/**
 * Le nombre de réponses correctives (`verify` ou `reformulate`) atteint au
 * moins `threshold`. Distincte de `flaws-caught-before-accepting` : un
 * joueur qui refuse tout (`challenge`) sans jamais vérifier ni reformuler
 * tient la première règle — il a repéré chaque erreur — et manque celle-ci,
 * qui lit ce qu'il en a fait ensuite.
 */
const correctiveRepliesAtLeast = (
  reading: Reading,
  rule: CriterionRule,
): boolean => {
  const { threshold } = countRuleSchema.parse(rule)
  return reading.correctiveRepliesCount >= threshold
}

export class WrongAssistantEvaluator implements GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    const parsedConfig = wrongAssistantConfigSchema.parse(config)
    const trace = parseWrongAssistantTrace(answer, parsedConfig)

    // Le fil est lu une seule fois : les deux règles lisent la même lecture,
    // jamais un recalcul propre à chacune.
    const reading = readExchange(parsedConfig, trace)

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(criterion.rule, reading),
    }))
  }

  private applyRule(rule: CriterionRule, reading: Reading): boolean {
    switch (rule.type) {
      case 'flaws-caught-before-accepting':
        return flawsCaughtBeforeAccepting(reading)
      case 'corrective-replies-at-least':
        return correctiveRepliesAtLeast(reading, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}
