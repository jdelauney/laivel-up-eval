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
  readSituations,
  type SituationReading,
} from './helpers/read-situations.helper'
import type { Attempt, HintBudgetAnswer } from './schema/answer.schema'
import { parseHintBudgetTrace } from './schema/answer.schema'
import {
  type HintBudgetConfig,
  hintBudgetConfigSchema,
} from './schema/config.schema'

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

/** Le verdict d'une règle, et le détail attribuable qui l'explique. */
type RuleVerdict = {
  satisfied: boolean
  attributions?: readonly CriterionAttribution[]
}

/**
 * Le libellé destiné au joueur de chaque situation, résolu une seule fois
 * depuis la config — jamais un `situationId` brut ne doit atteindre une
 * attribution.
 */
const situationSymptoms = (
  config: HintBudgetConfig,
): ReadonlyMap<string, string> =>
  new Map(
    config.situations.map((situation) => [situation.id, situation.symptom]),
  )

const resolveSituationSymptom = (
  symptoms: ReadonlyMap<string, string>,
  situationId: string,
): string => {
  const symptom = symptoms.get(situationId)
  if (symptom === undefined) {
    throw new Error(
      `la situation « ${situationId} » n'a pas de symptôme déclaré`,
    )
  }
  return symptom
}

/**
 * Les libellés des indices achetés sur une situation, dans l'ordre d'achat —
 * ce sur quoi chaque indice porte, jamais son contenu, exactement ce que la
 * config rend visible avant l'achat.
 */
const boughtHintLabels = (
  config: HintBudgetConfig,
  attemptBySituationId: ReadonlyMap<string, Attempt>,
  situationId: string,
): readonly string[] => {
  const situation = config.situations.find((entry) => entry.id === situationId)
  const attempt = attemptBySituationId.get(situationId)
  if (situation === undefined || attempt === undefined) {
    throw new Error(`la situation « ${situationId} » n'a pas d'indices à lire`)
  }

  const hintLabelById = new Map(
    situation.hints.map((hint) => [hint.id, hint.label]),
  )
  return attempt.boughtHintIds.map((hintId) => {
    const label = hintLabelById.get(hintId)
    if (label === undefined) {
      throw new Error(`l'indice « ${hintId} » n'a pas de libellé déclaré`)
    }
    return label
  })
}

/**
 * Un geste par situation, nommée par son symptôme : tenu selon `holds`.
 * Partagée par les deux règles qui ne portent que sur une seule dimension —
 * l'ordre pour l'une, le fondement pour l'autre — sans mélanger les indices
 * achetés, qui ne les concernent pas.
 */
const buildSituationAttributions = (
  situations: readonly SituationReading[],
  symptoms: ReadonlyMap<string, string>,
  holds: (situation: SituationReading) => boolean,
): readonly CriterionAttribution[] =>
  situations.map((situation) => ({
    label: resolveSituationSymptom(symptoms, situation.situationId),
    held: holds(situation),
  }))

/**
 * Le nombre de situations résolues en achetant strictement moins que
 * `share` de leurs indices atteint au moins `threshold`.
 *
 * L'inégalité est **stricte** : la story dit « moins de la moitié », pas
 * « au plus la moitié ». Les deux membres — résolue ET frugale — sont
 * exigés : sans le premier, un joueur qui n'achète rien et se trompe
 * partout serait le plus frugal du parcours.
 */
const isFrugalSolve = (situation: SituationReading, share: number): boolean =>
  situation.solved && situation.hintsBought < situation.hintsTotal * share

/**
 * Nomme chaque situation ET les indices qu'elle y a achetés — ce que la
 * frugalité mesure conjointement, contrairement à l'ordre ou au fondement du
 * cadrage, qui ne portent que sur une seule dimension chacun.
 */
const buildFrugalAttributions = (
  config: HintBudgetConfig,
  attemptBySituationId: ReadonlyMap<string, Attempt>,
  situations: readonly SituationReading[],
  symptoms: ReadonlyMap<string, string>,
  share: number,
): readonly CriterionAttribution[] =>
  situations.map((situation) => {
    const symptom = resolveSituationSymptom(symptoms, situation.situationId)
    const hintLabels = boughtHintLabels(
      config,
      attemptBySituationId,
      situation.situationId,
    )
    const label =
      hintLabels.length === 0
        ? `${symptom} — aucun indice acheté`
        : `${symptom} — indice(s) acheté(s) : ${hintLabels.join(', ')}`

    return { label, held: isFrugalSolve(situation, share) }
  })

const frugalSolvesAtLeast = (
  config: HintBudgetConfig,
  attemptBySituationId: ReadonlyMap<string, Attempt>,
  situations: readonly SituationReading[],
  symptoms: ReadonlyMap<string, string>,
  rule: CriterionRule,
): RuleVerdict => {
  const { share, threshold } = frugalRuleSchema.parse(rule)
  const frugalSolves = situations.filter((situation) =>
    isFrugalSolve(situation, share),
  ).length
  return {
    satisfied: frugalSolves >= threshold,
    attributions: buildFrugalAttributions(
      config,
      attemptBySituationId,
      situations,
      symptoms,
      share,
    ),
  }
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
  situations: readonly SituationReading[],
  symptoms: ReadonlyMap<string, string>,
  framedFirstCount: number,
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = framedFirstRuleSchema.parse(rule)
  return {
    satisfied: framedFirstCount >= threshold,
    attributions: buildSituationAttributions(
      situations,
      symptoms,
      (situation) => situation.framedFirst,
    ),
  }
}

/**
 * Le compte de situations dont le cadrage est **fondé** — il retient
 * exactement l'ensemble des lectures établies, ni plus ni moins — atteint au
 * moins `threshold`, sans égard à l'ordre où il a été posé. Ne lit que
 * `SituationReading.framingGrounded`. `g2-1-c3`.
 */
const groundedFramingsAtLeast = (
  situations: readonly SituationReading[],
  symptoms: ReadonlyMap<string, string>,
  groundedFramingCount: number,
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = groundedRuleSchema.parse(rule)
  return {
    satisfied: groundedFramingCount >= threshold,
    attributions: buildSituationAttributions(
      situations,
      symptoms,
      (situation) => situation.framingGrounded,
    ),
  }
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
    const symptoms = situationSymptoms(parsedConfig)
    const attemptBySituationId = attemptsBySituationId(trace)

    const verdictInputs: VerdictInputs = {
      config: parsedConfig,
      attemptBySituationId,
      situations: reading.situations,
      symptoms,
      framedFirstCount: reading.framedFirstCount,
      groundedFramingCount: reading.groundedFramingCount,
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
      case 'frugal-solves-at-least':
        return frugalSolvesAtLeast(
          inputs.config,
          inputs.attemptBySituationId,
          inputs.situations,
          inputs.symptoms,
          rule,
        )
      case 'framed-first-at-least':
        return framedFirstAtLeast(
          inputs.situations,
          inputs.symptoms,
          inputs.framedFirstCount,
          rule,
        )
      case 'grounded-framings-at-least':
        return groundedFramingsAtLeast(
          inputs.situations,
          inputs.symptoms,
          inputs.groundedFramingCount,
          rule,
        )
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}

const attemptsBySituationId = (
  trace: HintBudgetAnswer,
): ReadonlyMap<string, Attempt> =>
  new Map(trace.attempts.map((attempt) => [attempt.situationId, attempt]))

/** Tout ce qu'une règle peut lire, et rien de plus. */
type VerdictInputs = {
  config: HintBudgetConfig
  attemptBySituationId: ReadonlyMap<string, Attempt>
  situations: readonly SituationReading[]
  symptoms: ReadonlyMap<string, string>
  framedFirstCount: number
  groundedFramingCount: number
}
