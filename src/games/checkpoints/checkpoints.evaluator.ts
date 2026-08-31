import { z } from 'zod'
import type {
  Criterion,
  CriterionRule,
} from '../../core/contracts/course.schema'
import type {
  CriterionAttribution,
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

/** Le verdict d'une règle, et le détail attribuable qui l'explique. */
type RuleVerdict = {
  satisfied: boolean
  attributions?: readonly CriterionAttribution[]
}

/**
 * Le libellé destiné au joueur de chaque étape, résolu une seule fois depuis
 * la config — jamais un `stageId` brut ne doit atteindre une attribution.
 */
const stageLabels = (config: CheckpointsConfig): ReadonlyMap<string, string> =>
  new Map(config.stages.map((stage) => [stage.id, stage.label]))

const resolveStageLabel = (
  labels: ReadonlyMap<string, string>,
  stageId: string,
): string => {
  const label = labels.get(stageId)
  if (label === undefined) {
    throw new Error(`l'étape « ${stageId} » n'a pas de libellé déclaré`)
  }
  return label
}

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

/**
 * Un geste par reprise, nommée par l'étape où elle a été posée : tenu quand
 * elle tombe avant la charnière — ce que mesure la règle, pas seulement la
 * reprise la plus lourde qui tranche le booléen, mais chacune, pour montrer
 * au joueur où ses reprises se sont situées dans le déroulé.
 */
const buildRecoveryAttributions = (
  decisions: readonly Decision[],
  labels: ReadonlyMap<string, string>,
  limit: number,
): readonly CriterionAttribution[] =>
  decisions
    .map((decision, index) => ({ decision, index }))
    .filter(({ decision }) => isRecovery(decision))
    .map(({ decision, index }) => ({
      label: resolveStageLabel(labels, decision.stageId),
      held: index < limit,
    }))

const heaviestRecoveryBefore = (
  config: CheckpointsConfig,
  decisions: readonly Decision[],
  labels: ReadonlyMap<string, string>,
  rule: CriterionRule,
): RuleVerdict => {
  const limit = stageIndexFor(config, rule)
  const heaviest = heaviestRecoveryIndex(decisions)
  return {
    satisfied: heaviest !== undefined && heaviest < limit,
    attributions: buildRecoveryAttributions(decisions, labels, limit),
  }
}

/**
 * Un geste par étape suivant la charnière, nommée par son étape : l'entrée
 * tenue est celle où le joueur a laissé passer — le critère mesure une
 * absence de reprise, donc l'absence est ce qui se tient.
 */
const buildNoRecoveryAfterAttributions = (
  decisions: readonly Decision[],
  labels: ReadonlyMap<string, string>,
  limitIndex: number,
): readonly CriterionAttribution[] =>
  decisions.slice(limitIndex + 1).map((decision) => ({
    label: resolveStageLabel(labels, decision.stageId),
    held: !isRecovery(decision),
  }))

/**
 * Un défaut qui éclate seul après la revue ne fait pas manquer le critère : on
 * mesure la reprise du joueur, pas sa malchance. Les surcoûts ne sont donc
 * jamais lus ici, seulement les choix.
 */
const noRecoveryAfter = (
  config: CheckpointsConfig,
  decisions: readonly Decision[],
  labels: ReadonlyMap<string, string>,
  rule: CriterionRule,
): RuleVerdict => {
  const limitIndex = stageIndexFor(config, rule)
  return {
    satisfied: decisions
      .slice(limitIndex + 1)
      .every((decision) => !isRecovery(decision)),
    attributions: buildNoRecoveryAfterAttributions(
      decisions,
      labels,
      limitIndex,
    ),
  }
}

/**
 * Un geste par étape, nommée par son étape : tenu quand l'IA l'a produite
 * sans reprise, ce qui compose la part du livrable qu'elle a portée seule.
 */
const buildDeliverableAttributions = (
  decisions: readonly Decision[],
  labels: ReadonlyMap<string, string>,
): readonly CriterionAttribution[] =>
  decisions.map((decision) => ({
    label: resolveStageLabel(labels, decision.stageId),
    held: !isRecovery(decision),
  }))

/**
 * Le garde-fou. Sans lui, celui qui reprend chaque étape obtient le score
 * d'intervention le plus haut, alors qu'il n'a rien délégué du tout.
 */
const aiProducedMostOfDeliverable = (
  decisions: readonly Decision[],
  labels: ReadonlyMap<string, string>,
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = thresholdRuleSchema.parse(rule)
  const untouched = decisions.filter((decision) => !isRecovery(decision)).length
  return {
    satisfied: untouched / decisions.length >= threshold,
    attributions: buildDeliverableAttributions(decisions, labels),
  }
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
    const labels = stageLabels(parsedConfig)

    return criteria.map((criterion) => {
      const verdict = this.applyRule(
        criterion.rule,
        parsedConfig,
        decisions,
        labels,
      )
      return {
        criterionId: criterion.id,
        satisfied: verdict.satisfied,
        attributions: verdict.attributions,
      }
    })
  }

  private applyRule(
    rule: CriterionRule,
    config: CheckpointsConfig,
    decisions: readonly Decision[],
    labels: ReadonlyMap<string, string>,
  ): RuleVerdict {
    switch (rule.type) {
      case 'heaviest-recovery-before':
        return heaviestRecoveryBefore(config, decisions, labels, rule)
      case 'no-recovery-after':
        return noRecoveryAfter(config, decisions, labels, rule)
      case 'ai-produced-most-of-deliverable':
        return aiProducedMostOfDeliverable(decisions, labels, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}
