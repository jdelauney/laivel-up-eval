import { z } from 'zod'
import type {
  Criterion,
  CriterionRule,
} from '../../core/contracts/course.schema'
import type {
  CriterionResult,
  GameEvaluator,
} from '../../core/ports/game-evaluator.interface'
import { readPlacements } from './helpers/read-placements.helper'
import { parsePracticeMapTrace } from './schema/answer.schema'
import { practiceMapConfigSchema } from './schema/config.schema'

/**
 * Le point de contact public avec le port `GameEvaluator`, d'où sa place à
 * la racine du dossier du jeu et non sous `actions/`.
 *
 * Il interprète des règles déclaratives : déplacer un seuil se fait dans le
 * parcours, pas ici. Aucun accès au store, aucun effet de bord, aucune
 * connaissance des autres jeux — la « cohérence avec le reste du parcours »
 * se mesure ici même, sur des relations d'ordre déclarées dans la
 * configuration de ce seul jeu.
 */

const GAME_TYPE = 'practice-map'

const placementsInZoneAtLeastSchema = z.object({ threshold: z.number() })
const highRigorZoneHitSchema = z.object({})
const orderingsHeldAtLeastSchema = z.object({ threshold: z.number() })

class UnknownRuleError extends Error {
  constructor(ruleType: string) {
    super(`la règle « ${ruleType} » n'est pas connue du jeu ${GAME_TYPE}`)
    this.name = 'UnknownRuleError'
  }
}

/**
 * Le nombre de pratiques dont le placement tombe dans sa propre zone
 * attendue atteint au moins `threshold`. Lit la position **absolue**, rien
 * d'autre : une lecture juste mais décalée en bloc — toutes les pratiques
 * trop basses en rigueur — manque ce critère alors qu'elle tient les
 * relations d'ordre (`orderings-held-at-least`).
 */
const placementsInZoneAtLeast = (
  inZoneCount: number,
  rule: CriterionRule,
): boolean => {
  const { threshold } = placementsInZoneAtLeastSchema.parse(rule)
  return inZoneCount >= threshold
}

/**
 * Vrai quand au moins une pratique **dont la zone attendue est en haute
 * rigueur** y est effectivement posée.
 *
 * Volontairement plus strict que « une pratique quelconque posée en haut » :
 * ce dernier se tient d'un seul glissement de jeton, sans lire une ligne, et
 * l'épique nomme précisément cette classe de triche comme à bloquer. La
 * règle ne lit `highRigorHit` qu'après qu'il ait été calculé contre **la**
 * zone de la pratique posée, jamais contre une case générique du plan.
 */
const highRigorZoneHit = (
  highRigorHit: boolean,
  rule: CriterionRule,
): boolean => {
  highRigorZoneHitSchema.parse(rule)
  return highRigorHit
}

/**
 * Le nombre de relations d'ordre tenues atteint au moins `threshold`. Lit la
 * position **relative**, jamais les zones : distinct de
 * `placements-in-zone-at-least` par construction — un joueur qui touche
 * quelques zones au hasard peut inverser deux pratiques voisines, et un
 * joueur décalé en bloc tient les relations sans toucher aucune zone.
 */
const orderingsHeldAtLeast = (
  heldOrderingCount: number,
  rule: CriterionRule,
): boolean => {
  const { threshold } = orderingsHeldAtLeastSchema.parse(rule)
  return heldOrderingCount >= threshold
}

export class PracticeMapEvaluator implements GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    const parsedConfig = practiceMapConfigSchema.parse(config)
    const trace = parsePracticeMapTrace(answer, parsedConfig)

    // Les placements sont lus une seule fois : les trois règles lisent la
    // même lecture, jamais un recalcul propre à chacune.
    const reading = readPlacements(parsedConfig, trace)

    const verdictInputs: VerdictInputs = {
      inZoneCount: reading.inZoneCount,
      highRigorHit: reading.highRigorHit,
      heldOrderingCount: reading.heldOrderingCount,
    }

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(criterion.rule, verdictInputs),
    }))
  }

  private applyRule(rule: CriterionRule, inputs: VerdictInputs): boolean {
    switch (rule.type) {
      case 'placements-in-zone-at-least':
        return placementsInZoneAtLeast(inputs.inZoneCount, rule)
      case 'high-rigor-zone-hit':
        return highRigorZoneHit(inputs.highRigorHit, rule)
      case 'orderings-held-at-least':
        return orderingsHeldAtLeast(inputs.heldOrderingCount, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}

/** Tout ce qu'une règle peut lire, et rien de plus. */
type VerdictInputs = {
  inZoneCount: number
  highRigorHit: boolean
  heldOrderingCount: number
}
