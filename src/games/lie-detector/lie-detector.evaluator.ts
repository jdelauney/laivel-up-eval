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
import { lieDetectorConfigSchema } from './schema/config.schema'

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
const stabilityRuleSchema = z.object({ minOpportunities: z.number() })

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
 * Satisfaite quand le joueur a tenu au moins `minOpportunities` occasions
 * réelles de capituler ET qu'il n'en a saisi aucune, le seuil lu dans la
 * règle — sur le modèle de `lies-unmasked-at-least`.
 *
 * Une occasion (`RoundReading.opportunity`) est une manche contredite ET
 * dont la première désignation visait déjà la menteuse : c'est le seul cas
 * où l'aplomb de l'assistant s'exerce contre une lecture juste, donc le
 * seul où tenir démontre quelque chose.
 *
 * Correction du 30/08, après revue (F1) : la première écriture comptait les
 * manches CONTREDITES (`contradictedCount`), pas les occasions. Or être
 * contredit ne suppose que d'avoir désigné autre chose que la cible de
 * l'objection — ce qu'un joueur qui se trompe partout fait dans toutes les
 * manches. Un tel joueur était donc contredit quatre fois sur quatre, ne
 * pouvait capituler nulle part faute d'avoir jamais eu raison, et
 * décrochait le critère sans avoir lu une ligne. `opportunityCount` exige
 * en plus la désignation initiale juste, ce que la contradiction seule ne
 * garantit pas.
 *
 * Second arbitrage du 30/08, après le challenge : le seuil était à une
 * seule occasion. Passé en force brute sur les 256 parties possibles d'un
 * joueur qui désigne au hasard et ne bouge jamais, une seule occasion
 * suffisait dans 57,8 % des cas — une formalité, pas une épreuve.
 * `minOpportunities: 2` fait tomber ce taux à 15,6 %, tout en laissant un
 * lecteur qui démasque trois manches sur quatre satisfaire le critère sans
 * marge acrobatique.
 *
 * Renommée le 30/08, après revue (nit de convention) : son nom d'origine,
 * qui ne portait que la négation de la capitulation, ne laissait rien
 * deviner du paramètre qu'elle porte — seule règle paramétrée du parcours
 * dans ce cas sur dix-huit. `held-chances-at-least` suit la même convention
 * que ses treize sœurs (`*-at-least`, `*-below`, `*-above`, `*-before`,
 * `*-after`, `*-including`) : le seuil se lit dans le nom. La règle ne
 * tolère toujours aucune capitulation, elle exige seulement assez
 * d'occasions tenues pour que la tenue démontre quelque chose.
 *
 * Le refus de la vacuité tient toujours au premier membre : un joueur sous
 * le seuil d'occasions n'a pas assez démontré, sur le même principe que
 * `kinds-found-including` chez `defect-hunt`, où un critère sans matière
 * ressort manqué plutôt que satisfait par défaut.
 */
const heldChancesAtLeast = (
  opportunityCount: number,
  capitulationCount: number,
  rule: CriterionRule,
): boolean => {
  const { minOpportunities } = stabilityRuleSchema.parse(rule)
  return opportunityCount >= minOpportunities && capitulationCount === 0
}

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
      unmaskedCount: reading.unmaskedCount,
      opportunityCount: reading.opportunityCount,
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
      case 'held-chances-at-least':
        return heldChancesAtLeast(
          inputs.opportunityCount,
          inputs.capitulationCount,
          rule,
        )
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}

/** Tout ce qu'une règle peut lire, et rien de plus. */
type VerdictInputs = {
  unmaskedCount: number
  opportunityCount: number
  capitulationCount: number
}
