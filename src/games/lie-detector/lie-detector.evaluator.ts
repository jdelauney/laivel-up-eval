import { z } from 'zod'
import type {
  Criterion,
  CriterionRule,
} from '../../core/contracts/course.schema'
import type {
  CriterionResult,
  GameEvaluator,
} from '../../core/ports/game-evaluator.interface'
import { readRounds } from './helpers/read-rounds.helper'
import { parseLieDetectorTrace } from './schema/answer.schema'
import {
  type LieDetectorConfig,
  lieDetectorConfigSchema,
} from './schema/config.schema'

/**
 * Le point de contact public avec le port `GameEvaluator`, d'où sa place à
 * la racine du dossier du jeu et non sous `actions/`.
 *
 * Il interprète des règles déclaratives : déplacer un seuil se fait dans le
 * parcours, pas ici. Aucun accès au store, aucun effet de bord, aucune
 * connaissance des autres jeux.
 */

const GAME_TYPE = 'lie-detector'

const countRuleSchema = z.object({ threshold: z.number() })

class UnknownRuleError extends Error {
  constructor(ruleType: string) {
    super(`la règle « ${ruleType} » n'est pas connue du jeu ${GAME_TYPE}`)
    this.name = 'UnknownRuleError'
  }
}

/** Le nombre de manches démasquées à la désignation finale, borne incluse. */
const liesUnmaskedAtLeast = (
  unmaskedCount: number,
  rule: CriterionRule,
): boolean => {
  const { threshold } = countRuleSchema.parse(rule)
  return unmaskedCount >= threshold
}

/**
 * Satisfaite quand au moins une manche a réellement contredit le joueur
 * ET qu'aucune n'a vu sa désignation juste abandonnée. Sans seuil : la
 * règle ne tolère aucune capitulation, et son nom le dit.
 *
 * Le refus de la vacuité tient au premier membre : un joueur que
 * l'assistant n'a jamais contredit n'a rien démontré, sur le même principe
 * que `kinds-found-including` chez `defect-hunt`, où un critère sans
 * matière ressort manqué plutôt que satisfait par défaut.
 */
const noCapitulation = (
  contradictedCount: number,
  capitulationCount: number,
): boolean => contradictedCount > 0 && capitulationCount === 0

export class LieDetectorEvaluator implements GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    const parsedConfig = lieDetectorConfigSchema.parse(config)
    const trace = parseLieDetectorTrace(answer, parsedConfig)

    // Les manches sont lues une seule fois : les deux règles lisent la même
    // lecture, jamais un recalcul propre à chacune.
    const reading = readRounds(parsedConfig, trace)

    const verdictInputs: VerdictInputs = {
      config: parsedConfig,
      unmaskedCount: reading.unmaskedCount,
      contradictedCount: reading.contradictedCount,
      capitulationCount: reading.capitulationCount,
    }

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(criterion.rule, verdictInputs),
    }))
  }

  private applyRule(rule: CriterionRule, inputs: VerdictInputs): boolean {
    switch (rule.type) {
      case 'lies-unmasked-at-least':
        return liesUnmaskedAtLeast(inputs.unmaskedCount, rule)
      case 'no-capitulation':
        return noCapitulation(
          inputs.contradictedCount,
          inputs.capitulationCount,
        )
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}

/** Tout ce qu'une règle peut lire, et rien de plus. */
type VerdictInputs = {
  config: LieDetectorConfig
  unmaskedCount: number
  contradictedCount: number
  capitulationCount: number
}
