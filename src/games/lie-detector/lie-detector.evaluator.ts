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
import { type RoundReading, readRounds } from './helpers/read-rounds.helper'
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
const stabilityRuleSchema = z.object({ minOpportunities: z.number() })

class UnknownRuleError extends Error {
  constructor(ruleType: string) {
    super(`la règle « ${ruleType} » n'est pas connue du jeu ${GAME_TYPE}`)
    this.name = 'UnknownRuleError'
  }
}

/** Le verdict d'une règle, et le détail attribuable qui l'explique. */
type RuleVerdict = {
  satisfied: boolean
  attributions?: readonly CriterionAttribution[]
}

/**
 * Le texte de l'affirmation menteuse de chaque manche, résolu une seule fois
 * depuis la config — jamais un `roundId` ou un `claimId` brut ne doit
 * atteindre une attribution. Le schéma de configuration garantit exactement
 * une affirmation `lying` par manche, sur le même invariant que
 * `read-rounds.helper.ts`.
 */
const liarTextByRoundId = (
  config: LieDetectorConfig,
): ReadonlyMap<string, string> =>
  new Map(
    config.rounds.map((round) => [
      round.id,
      round.claims.find((claim) => claim.lying)?.text ?? '',
    ]),
  )

const resolveLiarText = (
  liarTexts: ReadonlyMap<string, string>,
  roundId: string,
): string => {
  const text = liarTexts.get(roundId)
  if (text === undefined) {
    throw new Error(`la manche « ${roundId} » n'a pas d'affirmation à nommer`)
  }
  return text
}

/**
 * Le nombre de manches démasquées à la désignation finale, borne incluse.
 *
 * Chaque manche nomme son affirmation menteuse, tenue quand la première
 * désignation l'a visée — le verdict que la règle rend au joueur.
 */
const liesUnmaskedAtLeast = (
  rounds: readonly RoundReading[],
  liarTexts: ReadonlyMap<string, string>,
  unmaskedCount: number,
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = countRuleSchema.parse(rule)
  return {
    satisfied: unmaskedCount >= threshold,
    attributions: rounds.map((round) => ({
      label: resolveLiarText(liarTexts, round.roundId),
      held: round.unmasked,
    })),
  }
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
 *
 * `minOpportunities: 2` est la valeur maximale sûre sur le corpus actuel de
 * `config/course.json`. Raison structurelle, pas empirique : `r2` porte
 * l'unique objection fondée du corpus, donc y désigner juste ne crée aucune
 * occasion (la première désignation vise déjà la cible de l'objection).
 * Un joueur à trois bonnes premières désignations sur quatre a donc au pire
 * deux occasions hors `r2` — le plancher de 2 tombe exactement sur ce sol.
 * À 3, des lecteurs légitimes échoueraient faute de matière, pas faute de
 * tenue. Toucher au corpus (déplacer l'objection fondée, ajouter une
 * manche) invalide ce calcul et doit le refaire avant de relever le seuil.
 *
 * Le détail ne porte que sur les manches qui offraient une occasion : les
 * autres n'ont rien à dire de la stabilité que ce critère mesure. Tenu
 * quand l'occasion n'a pas été lâchée.
 */
const heldChancesAtLeast = (
  rounds: readonly RoundReading[],
  liarTexts: ReadonlyMap<string, string>,
  opportunityCount: number,
  capitulationCount: number,
  rule: CriterionRule,
): RuleVerdict => {
  const { minOpportunities } = stabilityRuleSchema.parse(rule)
  return {
    satisfied: opportunityCount >= minOpportunities && capitulationCount === 0,
    attributions: rounds
      .filter((round) => round.opportunity)
      .map((round) => ({
        label: resolveLiarText(liarTexts, round.roundId),
        held: !round.capitulated,
      })),
  }
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
    const liarTexts = liarTextByRoundId(parsedConfig)

    const verdictInputs: VerdictInputs = {
      rounds: reading.rounds,
      liarTexts,
      unmaskedCount: reading.unmaskedCount,
      opportunityCount: reading.opportunityCount,
      capitulationCount: reading.capitulationCount,
    }

    return criteria.map((criterion) => {
      const verdict = this.applyRule(criterion.rule, verdictInputs)
      return {
        criterionId: criterion.id,
        satisfied: verdict.satisfied,
        attributions: verdict.attributions,
      }
    })
  }

  private applyRule(rule: CriterionRule, inputs: VerdictInputs): RuleVerdict {
    switch (rule.type) {
      case 'lies-unmasked-at-least':
        return liesUnmaskedAtLeast(
          inputs.rounds,
          inputs.liarTexts,
          inputs.unmaskedCount,
          rule,
        )
      case 'held-chances-at-least':
        return heldChancesAtLeast(
          inputs.rounds,
          inputs.liarTexts,
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
  rounds: readonly RoundReading[]
  liarTexts: ReadonlyMap<string, string>
  unmaskedCount: number
  opportunityCount: number
  capitulationCount: number
}
