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
import {
  foundKinds,
  type Reading,
  readReview,
} from './helpers/read-review.helper'
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

/** Le verdict d'une règle, et le détail attribuable qui l'explique. */
type RuleVerdict = {
  satisfied: boolean
  attributions?: readonly CriterionAttribution[]
}

/**
 * Le libellé destiné au joueur d'un défaut : sa ligne, la seule référence
 * que le joueur ait jamais vue à l'écran — `DefectReveal` l'affiche déjà
 * sous cette forme à la révélation. Jamais l'`id` déclaratif du défaut.
 */
const defectLabel = (line: number): string => `Ligne ${line}`

/**
 * Un geste par défaut déclaré, nommé par sa ligne : tenu quand il a été
 * marqué. Partagée par les règles qui portent sur l'ensemble des défauts,
 * ou sur le sous-ensemble qu'une règle nomme.
 */
const buildDefectAttributions = (
  defects: Reading['found'],
  foundLines: ReadonlySet<number>,
): readonly CriterionAttribution[] =>
  defects.map((defect) => ({
    label: defectLabel(defect.line),
    held: foundLines.has(defect.line),
  }))

/**
 * Le score net de la revue mêle deux gestes : un défaut marqué pèse pour,
 * une ligne saine marquée pèse contre. Les deux sont nommés — jamais la
 * seule moitié positive — puisque c'est leur différence qui produit le
 * score que la règle juge.
 */
const buildNetScoreAttributions = (
  config: DefectHuntConfig,
  reading: Reading,
): readonly CriterionAttribution[] => {
  const foundLines = new Set(reading.found.map((defect) => defect.line))
  return [
    ...buildDefectAttributions(config.defects, foundLines),
    ...reading.falsePositiveLines.map((line) => ({
      label: defectLabel(line),
      held: false,
    })),
  ]
}

/**
 * Le score net de la revue — un point par ligne fautive marquée, un de moins
 * par ligne saine marquée — contre son seuil, borne incluse.
 *
 * C'est cette règle qui remplace le comptage séparé des faux positifs : le
 * barème les fait déjà payer un par un, et un second critère qui les
 * recompterait les punirait deux fois pour la même marque.
 */
const netScoreAtLeast = (
  config: DefectHuntConfig,
  reading: Reading,
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = countRuleSchema.parse(rule)
  return {
    satisfied: reading.netScore >= threshold,
    attributions: buildNetScoreAttributions(config, reading),
  }
}

/** La story dit « au moins 80 % » : atteindre le seuil suffit, borne incluse. */
const foundRatioAtLeast = (
  config: DefectHuntConfig,
  reading: Reading,
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = ratioRuleSchema.parse(rule)
  const foundLines = new Set(reading.found.map((defect) => defect.line))
  return {
    satisfied: reading.foundRatio >= threshold,
    attributions: buildDefectAttributions(config.defects, foundLines),
  }
}

/**
 * Satisfait quand CHAQUE nature listée figure parmi les natures trouvées : un
 * `every`, jamais un `some`, la règle nomme un ensemble d'exigences, pas un
 * choix.
 *
 * Le détail ne porte que sur les défauts des natures visées par la règle —
 * lister tout le corpus noierait la seule nature qui compte ici.
 */
const kindsFoundIncluding = (
  config: DefectHuntConfig,
  reading: Reading,
  found: ReadonlySet<string>,
  rule: CriterionRule,
): RuleVerdict => {
  const { kinds } = kindsRuleSchema.parse(rule)
  const foundLines = new Set(reading.found.map((defect) => defect.line))
  const targeted = config.defects.filter((defect) =>
    kinds.includes(defect.kind),
  )
  return {
    satisfied: kinds.every((kind) => found.has(kind)),
    attributions: buildDefectAttributions(targeted, foundLines),
  }
}

/**
 * Sans seuil propre : elle lit `timeLimitSeconds` de la configuration. Un
 * seuil séparé dans la règle permettrait qu'un écran montre trois minutes
 * pendant qu'un critère en note deux, et le jeu mentirait au joueur — le
 * budget affiché et le budget noté sont le même nombre, lu une seule fois.
 *
 * Sans détail : le verdict tient sur une seule mesure — la durée écoulée
 * contre le budget — sans qu'aucune ligne du corpus ne l'explique
 * individuellement. Rien à attribuer qu'un geste unique du chronomètre.
 */
const withinTimeBudget = (
  config: DefectHuntConfig,
  elapsedSeconds: number,
): RuleVerdict => ({
  satisfied: elapsedSeconds <= config.timeLimitSeconds,
})

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
      reading,
      kindsFound: foundKinds(reading),
      elapsedSeconds: trace.elapsedSeconds,
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
      case 'net-score-at-least':
        return netScoreAtLeast(inputs.config, inputs.reading, rule)
      case 'found-ratio-at-least':
        return foundRatioAtLeast(inputs.config, inputs.reading, rule)
      case 'kinds-found-including':
        return kindsFoundIncluding(
          inputs.config,
          inputs.reading,
          inputs.kindsFound,
          rule,
        )
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
  reading: Reading
  kindsFound: ReadonlySet<string>
  elapsedSeconds: number
}
