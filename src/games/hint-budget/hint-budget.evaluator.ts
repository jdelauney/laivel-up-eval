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
const framedFirstRuleSchema = z.object({ threshold: z.number() })
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
 * Le compte de situations cadrées **d'entrée** — le cadre posé avant tout
 * achat — atteint au moins `threshold`. Ne lit que `SituationReading.framedFirst` :
 * l'ordre, rien que l'ordre. `g2-1-c2`.
 *
 * Correction du 30/08, après revue : jusque-là une seule règle
 * (`grounded-framings-at-least`) exigeait l'ordre ET le fondement à la fois,
 * sous une question affichée qui ne parlait que d'ordre. Un joueur qui posait
 * un cadrage exact en premier lieu, mais incomplet, lisait « manqué » sur un
 * critère que sa question ne laissait pas deviner. Décision produit : deux
 * règles, chacune sur une seule dimension.
 */
const framedFirstAtLeast = (
  framedFirstCount: number,
  rule: CriterionRule,
): boolean => {
  const { threshold } = framedFirstRuleSchema.parse(rule)
  return framedFirstCount >= threshold
}

/**
 * Le compte de situations dont le cadrage est **fondé** — il retient
 * exactement l'ensemble des lectures établies, ni plus ni moins — atteint au
 * moins `threshold`, sans égard à l'ordre où il a été posé. Ne lit que
 * `SituationReading.framingGrounded`. `g2-1-c3`.
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

    // Les situations sont lues une seule fois : les trois règles lisent la
    // même lecture, jamais un recalcul propre à chacune.
    const reading = readSituations(parsedConfig, trace)

    const verdictInputs: VerdictInputs = {
      situations: reading.situations,
      framedFirstCount: reading.framedFirstCount,
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
      case 'framed-first-at-least':
        return framedFirstAtLeast(inputs.framedFirstCount, rule)
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
  framedFirstCount: number
  groundedFramingCount: number
}
