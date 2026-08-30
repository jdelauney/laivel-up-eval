import { z } from 'zod'
import type {
  Criterion,
  CriterionRule,
} from '../../core/contracts/course.schema'
import type {
  CriterionResult,
  GameEvaluator,
} from '../../core/ports/game-evaluator.interface'
import {
  readSituations,
  type SituationReading,
} from './helpers/read-situations.helper'
import { parseHintBudgetTrace } from './schema/answer.schema'
import { hintBudgetConfigSchema } from './schema/config.schema'

/**
 * Le point de contact public avec le port `GameEvaluator`, d'où sa place à
 * la racine du dossier du jeu et non sous `actions/`.
 *
 * Il interprète des règles déclaratives : déplacer un seuil se fait dans le
 * parcours, pas ici. Aucun accès au store, aucun effet de bord, aucune
 * connaissance des autres jeux.
 */

const GAME_TYPE = 'hint-budget'

const frugalRuleSchema = z.object({
  share: z.number().positive(),
  threshold: z.number(),
})
const groundedRuleSchema = z.object({ threshold: z.number() })

class UnknownRuleError extends Error {
  constructor(ruleType: string) {
    super(`la règle « ${ruleType} » n'est pas connue du jeu ${GAME_TYPE}`)
    this.name = 'UnknownRuleError'
  }
}

/**
 * Le nombre de situations résolues en achetant strictement moins que
 * `share` de leurs indices atteint au moins `threshold`.
 *
 * L'inégalité est **stricte** : la story dit « moins de la moitié », pas
 * « au plus la moitié ». Les deux membres — résolue ET frugale — sont
 * exigés : sans le premier, un joueur qui n'achète rien et se trompe
 * partout serait le plus frugal du parcours.
 */
const frugalSolvesAtLeast = (
  situations: readonly SituationReading[],
  rule: CriterionRule,
): boolean => {
  const { share, threshold } = frugalRuleSchema.parse(rule)
  const frugalSolves = situations.filter(
    (situation) =>
      situation.solved && situation.hintsBought < situation.hintsTotal * share,
  ).length
  return frugalSolves >= threshold
}

/**
 * Le compte de situations cadrées d'entrée ET fondées atteint au moins
 * `threshold`. Le compte vient de `Reading.groundedFramingCount`, qui
 * n'agrège que `framedAndGrounded` : cadrer d'entrée sans fonder, ou fonder
 * après un achat, ne contribue pas.
 */
const groundedFramingsAtLeast = (
  groundedFramingCount: number,
  rule: CriterionRule,
): boolean => {
  const { threshold } = groundedRuleSchema.parse(rule)
  return groundedFramingCount >= threshold
}

export class HintBudgetEvaluator implements GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    const parsedConfig = hintBudgetConfigSchema.parse(config)
    const trace = parseHintBudgetTrace(answer, parsedConfig)

    // Les situations sont lues une seule fois : les deux règles lisent la
    // même lecture, jamais un recalcul propre à chacune.
    const reading = readSituations(parsedConfig, trace)

    const verdictInputs: VerdictInputs = {
      situations: reading.situations,
      groundedFramingCount: reading.groundedFramingCount,
    }

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(criterion.rule, verdictInputs),
    }))
  }

  private applyRule(rule: CriterionRule, inputs: VerdictInputs): boolean {
    switch (rule.type) {
      case 'frugal-solves-at-least':
        return frugalSolvesAtLeast(inputs.situations, rule)
      case 'grounded-framings-at-least':
        return groundedFramingsAtLeast(inputs.groundedFramingCount, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}

/** Tout ce qu'une règle peut lire, et rien de plus. */
type VerdictInputs = {
  situations: readonly SituationReading[]
  groundedFramingCount: number
}
