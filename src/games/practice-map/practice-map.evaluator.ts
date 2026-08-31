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
import { type Reading, readPlacements } from './helpers/read-placements.helper'
import { parsePracticeMapTrace } from './schema/answer.schema'
import {
  type PracticeMapConfig,
  practiceMapConfigSchema,
} from './schema/config.schema'

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

/** Le verdict d'une règle, et le détail attribuable qui l'explique. */
type RuleVerdict = {
  satisfied: boolean
  attributions: readonly CriterionAttribution[]
}

/**
 * Le libellé destiné au joueur de chaque pratique, résolu une seule fois
 * depuis la config — jamais un `practiceId` brut ne doit atteindre une
 * attribution.
 */
const practiceLabels = (
  config: PracticeMapConfig,
): ReadonlyMap<string, string> =>
  new Map(config.practices.map((practice) => [practice.id, practice.label]))

const resolvePracticeLabel = (
  labels: ReadonlyMap<string, string>,
  practiceId: string,
): string => {
  const label = labels.get(practiceId)
  if (label === undefined) {
    throw new Error(`la pratique « ${practiceId} » n'a pas de libellé déclaré`)
  }
  return label
}

/** Un geste par pratique : tenu quand son placement tombe dans sa propre zone. */
const buildPlacementAttributions = (
  reading: Reading,
  labels: ReadonlyMap<string, string>,
): readonly CriterionAttribution[] =>
  reading.placements.map((placement) => ({
    label: resolvePracticeLabel(labels, placement.practiceId),
    held: placement.inZone,
  }))

/**
 * Un geste par pratique dont la zone attendue se tient en haute rigueur —
 * les seules que ce critère juge —, tenu quand elle y a bien été posée.
 */
const buildHighRigorAttributions = (
  config: PracticeMapConfig,
  reading: Reading,
  labels: ReadonlyMap<string, string>,
): readonly CriterionAttribution[] => {
  const highRigorPracticeIds = new Set(
    config.practices
      .filter((practice) => practice.expected.rigorFrom >= config.highRigorFrom)
      .map((practice) => practice.id),
  )
  return reading.placements
    .filter((placement) => highRigorPracticeIds.has(placement.practiceId))
    .map((placement) => ({
      label: resolvePracticeLabel(labels, placement.practiceId),
      held: placement.inHighRigorZone,
    }))
}

/** Un geste par relation d'ordre, nommée par les deux pratiques qu'elle compare. */
const buildOrderingAttributions = (
  config: PracticeMapConfig,
  reading: Reading,
  labels: ReadonlyMap<string, string>,
): readonly CriterionAttribution[] => {
  const orderingById = new Map(
    config.orderings.map((ordering) => [ordering.id, ordering]),
  )
  return reading.orderings.map((orderingReading) => {
    const ordering = orderingById.get(orderingReading.orderingId)
    if (ordering === undefined) {
      throw new Error(
        `la relation « ${orderingReading.orderingId} » est absente de la configuration`,
      )
    }
    return {
      label: `${resolvePracticeLabel(labels, ordering.higherId)} se tient plus haut que ${resolvePracticeLabel(labels, ordering.lowerId)}`,
      held: orderingReading.held,
    }
  })
}

/**
 * Le nombre de pratiques dont le placement tombe dans sa propre zone
 * attendue atteint au moins `threshold`. Lit la position **absolue**, rien
 * d'autre : une lecture juste mais décalée en bloc — toutes les pratiques
 * trop basses en rigueur — manque ce critère alors qu'elle tient les
 * relations d'ordre (`orderings-held-at-least`).
 */
const placementsInZoneAtLeast = (
  reading: Reading,
  labels: ReadonlyMap<string, string>,
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = placementsInZoneAtLeastSchema.parse(rule)
  return {
    satisfied: reading.inZoneCount >= threshold,
    attributions: buildPlacementAttributions(reading, labels),
  }
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
  config: PracticeMapConfig,
  reading: Reading,
  labels: ReadonlyMap<string, string>,
  rule: CriterionRule,
): RuleVerdict => {
  highRigorZoneHitSchema.parse(rule)
  return {
    satisfied: reading.highRigorHit,
    attributions: buildHighRigorAttributions(config, reading, labels),
  }
}

/**
 * Le nombre de relations d'ordre tenues atteint au moins `threshold`. Lit la
 * position **relative**, jamais les zones : distinct de
 * `placements-in-zone-at-least` par construction — un joueur qui touche
 * quelques zones au hasard peut inverser deux pratiques voisines, et un
 * joueur décalé en bloc tient les relations sans toucher aucune zone.
 */
const orderingsHeldAtLeast = (
  config: PracticeMapConfig,
  reading: Reading,
  labels: ReadonlyMap<string, string>,
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = orderingsHeldAtLeastSchema.parse(rule)
  return {
    satisfied: reading.heldOrderingCount >= threshold,
    attributions: buildOrderingAttributions(config, reading, labels),
  }
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
    const labels = practiceLabels(parsedConfig)

    return criteria.map((criterion) => {
      const verdict = this.applyRule(
        criterion.rule,
        parsedConfig,
        reading,
        labels,
      )
      return {
        criterionId: criterion.id,
        satisfied: verdict.satisfied,
        attributions: verdict.attributions,
      }
    })
  }

  private applyRule(
    rule: CriterionRule,
    config: PracticeMapConfig,
    reading: Reading,
    labels: ReadonlyMap<string, string>,
  ): RuleVerdict {
    switch (rule.type) {
      case 'placements-in-zone-at-least':
        return placementsInZoneAtLeast(reading, labels, rule)
      case 'high-rigor-zone-hit':
        return highRigorZoneHit(config, reading, labels, rule)
      case 'orderings-held-at-least':
        return orderingsHeldAtLeast(config, reading, labels, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}
