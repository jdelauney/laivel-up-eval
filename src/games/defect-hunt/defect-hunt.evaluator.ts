import { z } from 'zod'
import type {
  Criterion,
  CriterionRule,
} from '../../core/contracts/course.schema'
import type {
  CriterionResult,
  GameEvaluator,
} from '../../core/ports/game-evaluator.interface'
import { foundKinds, readReview } from './helpers/read-review.helper'
import { parseDefectHuntTrace } from './schema/answer.schema'
import {
  type DefectHuntConfig,
  defectHuntConfigSchema,
} from './schema/config.schema'

/**
 * Le point de contact public avec le port `GameEvaluator`, d'où sa place à la
 * racine du dossier du jeu et non sous `actions/`.
 *
 * Il interprète des règles déclaratives : déplacer un seuil se fait dans le
 * parcours, pas ici. Aucun accès au store, aucun effet de bord, aucune
 * connaissance des autres jeux.
 */

const GAME_TYPE = 'defect-hunt'

const ratioRuleSchema = z.object({ threshold: z.number() })
const countRuleSchema = z.object({ threshold: z.number() })
const kindsRuleSchema = z.object({ kinds: z.array(z.string()) })

class UnknownRuleError extends Error {
  constructor(ruleType: string) {
    super(`la règle « ${ruleType} » n'est pas connue du jeu ${GAME_TYPE}`)
    this.name = 'UnknownRuleError'
  }
}

/** La story dit « au moins 80 % » : atteindre le seuil suffit, borne incluse. */
const foundRatioAtLeast = (ratio: number, rule: CriterionRule): boolean => {
  const { threshold } = ratioRuleSchema.parse(rule)
  return ratio >= threshold
}

/** « Au plus N marques posées à côté » : en poser exactement N tient encore. */
const falsePositivesAtMost = (count: number, rule: CriterionRule): boolean => {
  const { threshold } = countRuleSchema.parse(rule)
  return count <= threshold
}

/**
 * Satisfait quand CHAQUE nature listée figure parmi les natures trouvées : un
 * `every`, jamais un `some`, la règle nomme un ensemble d'exigences, pas un
 * choix.
 */
const kindsFoundIncluding = (
  found: ReadonlySet<string>,
  rule: CriterionRule,
): boolean => {
  const { kinds } = kindsRuleSchema.parse(rule)
  return kinds.every((kind) => found.has(kind))
}

/**
 * Sans seuil propre : elle lit `timeLimitSeconds` de la configuration. Un
 * seuil séparé dans la règle permettrait qu'un écran montre trois minutes
 * pendant qu'un critère en note deux, et le jeu mentirait au joueur — le
 * budget affiché et le budget noté sont le même nombre, lu une seule fois.
 */
const withinTimeBudget = (
  config: DefectHuntConfig,
  elapsedSeconds: number,
): boolean => elapsedSeconds <= config.timeLimitSeconds

export class DefectHuntEvaluator implements GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    const parsedConfig = defectHuntConfigSchema.parse(config)
    const trace = parseDefectHuntTrace(answer, parsedConfig)

    /**
     * La revue est lue une seule fois : les quatre règles lisent la même
     * lecture, jamais un recalcul propre à chacune.
     */
    const reading = readReview(parsedConfig, trace)
    const kindsFound = foundKinds(reading)

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(
        criterion.rule,
        parsedConfig,
        reading.foundRatio,
        reading.falsePositiveLines.length,
        kindsFound,
        trace.elapsedSeconds,
      ),
    }))
  }

  private applyRule(
    rule: CriterionRule,
    config: DefectHuntConfig,
    foundRatio: number,
    falsePositiveCount: number,
    kindsFound: ReadonlySet<string>,
    elapsedSeconds: number,
  ): boolean {
    switch (rule.type) {
      case 'found-ratio-at-least':
        return foundRatioAtLeast(foundRatio, rule)
      case 'false-positives-at-most':
        return falsePositivesAtMost(falsePositiveCount, rule)
      case 'kinds-found-including':
        return kindsFoundIncluding(kindsFound, rule)
      case 'within-time-budget':
        return withinTimeBudget(config, elapsedSeconds)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}
