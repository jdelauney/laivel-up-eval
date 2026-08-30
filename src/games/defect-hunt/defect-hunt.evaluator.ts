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

/**
 * Le score net de la revue — un point par ligne fautive marquée, un de moins
 * par ligne saine marquée — contre son seuil, borne incluse.
 *
 * C'est cette règle qui remplace le comptage séparé des faux positifs : le
 * barème les fait déjà payer un par un, et un second critère qui les
 * recompterait les punirait deux fois pour la même marque.
 */
const netScoreAtLeast = (netScore: number, rule: CriterionRule): boolean => {
  const { threshold } = countRuleSchema.parse(rule)
  return netScore >= threshold
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

    /**
     * Les quatre lectures que les règles consomment, assemblées une fois.
     * Elles voyagent groupées plutôt qu'en quatre arguments de plus : la
     * limite du projet est de cinq paramètres, et une signature qui s'allonge
     * à chaque règle ajoutée est le signal qu'il fallait un objet.
     */
    const verdictInputs: VerdictInputs = {
      config: parsedConfig,
      netScore: reading.netScore,
      foundRatio: reading.foundRatio,
      kindsFound: foundKinds(reading),
      elapsedSeconds: trace.elapsedSeconds,
    }

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(criterion.rule, verdictInputs),
    }))
  }

  private applyRule(rule: CriterionRule, inputs: VerdictInputs): boolean {
    switch (rule.type) {
      case 'net-score-at-least':
        return netScoreAtLeast(inputs.netScore, rule)
      case 'found-ratio-at-least':
        return foundRatioAtLeast(inputs.foundRatio, rule)
      case 'kinds-found-including':
        return kindsFoundIncluding(inputs.kindsFound, rule)
      case 'within-time-budget':
        return withinTimeBudget(inputs.config, inputs.elapsedSeconds)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}

/** Tout ce qu'une règle peut lire, et rien de plus. */
type VerdictInputs = {
  config: DefectHuntConfig
  netScore: number
  foundRatio: number
  kindsFound: ReadonlySet<string>
  elapsedSeconds: number
}
