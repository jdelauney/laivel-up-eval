import { z } from 'zod'
import type {
  Criterion,
  CriterionRule,
} from '../../core/contracts/course.schema'
import type {
  CriterionResult,
  GameEvaluator,
} from '../../core/ports/game-evaluator.interface'
import { replayTrace } from './helpers/run-simulation.helper'
import { type Decision, parseCheckpointsTrace } from './schema/answer.schema'
import {
  type CheckpointsConfig,
  checkpointsConfigSchema,
} from './schema/config.schema'

/**
 * Le point de contact public avec le port `GameEvaluator`, d'où sa place à la
 * racine du dossier du jeu et non sous `actions/`.
 *
 * Il interprète des règles déclaratives : déplacer un seuil ou l'étape charnière
 * se fait dans le parcours, pas ici. Aucun accès au store, aucun effet de bord,
 * aucune connaissance des autres jeux.
 */

const GAME_TYPE = 'checkpoints'

const stageRuleSchema = z.object({ stage: z.string().min(1) })
const thresholdRuleSchema = z.object({ threshold: z.number().min(0).max(1) })

class UnknownRuleError extends Error {
  constructor(ruleType: string) {
    super(`la règle « ${ruleType} » n'est pas connue du jeu ${GAME_TYPE}`)
    this.name = 'UnknownRuleError'
  }
}

class UnknownRuleStageError extends Error {
  constructor(ruleType: string, stageId: string) {
    super(
      `la règle « ${ruleType} » du jeu ${GAME_TYPE} vise l'étape « ${stageId} », absente de la configuration`,
    )
    this.name = 'UnknownRuleStageError'
  }
}

const stageIndexFor = (
  config: CheckpointsConfig,
  rule: CriterionRule,
): number => {
  const { stage } = stageRuleSchema.parse(rule)
  const index = config.stages.findIndex((candidate) => candidate.id === stage)
  if (index === -1) throw new UnknownRuleStageError(rule.type, stage)
  return index
}

const isRecovery = (decision: Decision): boolean =>
  decision.choice !== 'laisser-passer'

/**
 * La reprise la plus lourde, à égalité de coût, est la plus précoce : cadrer
 * tôt ne doit pas être puni par une égalité. Une partie sans aucune reprise n'a
 * pas de reprise la plus lourde, et ne satisfait donc pas le critère.
 */
const heaviestRecoveryIndex = (
  decisions: readonly Decision[],
): number | undefined => {
  let heaviest: number | undefined

  decisions.forEach((decision, index) => {
    if (!isRecovery(decision)) return
    if (heaviest !== undefined && decision.cost <= decisions[heaviest].cost) {
      return
    }
    heaviest = index
  })

  return heaviest
}

const heaviestRecoveryBefore = (
  config: CheckpointsConfig,
  decisions: readonly Decision[],
  rule: CriterionRule,
): boolean => {
  const limit = stageIndexFor(config, rule)
  const heaviest = heaviestRecoveryIndex(decisions)
  return heaviest !== undefined && heaviest < limit
}

/**
 * Un défaut qui éclate seul après la revue ne fait pas manquer le critère : on
 * mesure la reprise du joueur, pas sa malchance. Les surcoûts ne sont donc
 * jamais lus ici, seulement les choix.
 */
const noRecoveryAfter = (
  config: CheckpointsConfig,
  decisions: readonly Decision[],
  rule: CriterionRule,
): boolean =>
  decisions
    .slice(stageIndexFor(config, rule) + 1)
    .every((decision) => !isRecovery(decision))

/**
 * Le garde-fou. Sans lui, celui qui reprend chaque étape obtient le score
 * d'intervention le plus haut, alors qu'il n'a rien délégué du tout.
 */
const aiProducedMostOfDeliverable = (
  decisions: readonly Decision[],
  rule: CriterionRule,
): boolean => {
  const { threshold } = thresholdRuleSchema.parse(rule)
  const untouched = decisions.filter((decision) => !isRecovery(decision)).length
  return untouched / decisions.length >= threshold
}

export class CheckpointsEvaluator implements GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    const parsedConfig = checkpointsConfigSchema.parse(config)
    const trace = parseCheckpointsTrace(answer, parsedConfig.stages)

    /**
     * Le verdict se lit sur la partie rejouée, jamais sur les coûts écrits dans
     * la trace : une seule implémentation de l'avancée, celle de la phase 1.
     */
    const { decisions } = replayTrace(parsedConfig, trace.decisions)

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(criterion.rule, parsedConfig, decisions),
    }))
  }

  private applyRule(
    rule: CriterionRule,
    config: CheckpointsConfig,
    decisions: readonly Decision[],
  ): boolean {
    switch (rule.type) {
      case 'heaviest-recovery-before':
        return heaviestRecoveryBefore(config, decisions, rule)
      case 'no-recovery-after':
        return noRecoveryAfter(config, decisions, rule)
      case 'ai-produced-most-of-deliverable':
        return aiProducedMostOfDeliverable(decisions, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}
