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
import { median } from './helpers/median.helper'
import { replayTrace, type TrackState } from './helpers/run-simulation.helper'
import { parseThreeTracksTrace } from './schema/answer.schema'
import {
  type ThreeTracksConfig,
  threeTracksConfigSchema,
} from './schema/config.schema'

/**
 * Le point de contact public avec le port `GameEvaluator`, d'où sa place à la
 * racine du dossier du jeu et non sous `actions/`.
 *
 * Il interprète des règles déclaratives : déplacer un palier se fait dans le
 * parcours, pas ici. Aucun accès au store, aucun effet de bord, aucune
 * connaissance des autres jeux.
 */

const GAME_TYPE = 'three-tracks'

const mergedAtLeastRuleSchema = z.object({
  threshold: z.number().int().min(0),
})
const medianLiveTracksAtLeastRuleSchema = z.object({
  threshold: z.number().min(0),
})

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
 * Le libellé destiné au joueur de chaque chantier, résolu une seule fois
 * depuis la config — jamais un `trackId` brut ne doit atteindre une
 * attribution.
 */
const trackLabels = (config: ThreeTracksConfig): ReadonlyMap<string, string> =>
  new Map(config.tracks.map((track) => [track.id, track.label]))

const resolveTrackLabel = (
  labels: ReadonlyMap<string, string>,
  trackId: string,
): string => {
  const label = labels.get(trackId)
  if (label === undefined) {
    throw new Error(`le chantier « ${trackId} » n'a pas de libellé déclaré`)
  }
  return label
}

/**
 * Un geste par chantier, nommé par son libellé et son sort : tenu selon
 * `holds`. Partagée par les deux règles portées par le statut final d'un
 * chantier — mergé ou non abandonné — jamais par la médiane, qui porte sur
 * les tours, pas sur les chantiers.
 */
const buildTrackAttributions = (
  tracks: readonly TrackState[],
  labels: ReadonlyMap<string, string>,
  holds: (track: TrackState) => boolean,
): readonly CriterionAttribution[] =>
  tracks.map((track) => ({
    label: resolveTrackLabel(labels, track.id),
    held: holds(track),
  }))

/**
 * Deux paliers de poids deux, plutôt qu'un seul critère à trois graduations :
 * un critère est un booléen, il ne peut pas porter le cran « zéro, un, ou trois
 * chantiers » de la source à lui seul.
 *
 * Chaque chantier est nommé, tenu quand il a été mené jusqu'au merge.
 */
const mergedAtLeast = (
  tracks: readonly TrackState[],
  labels: ReadonlyMap<string, string>,
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = mergedAtLeastRuleSchema.parse(rule)
  const mergedCount = tracks.filter((track) => track.status === 'merged').length
  return {
    satisfied: mergedCount >= threshold,
    attributions: buildTrackAttributions(
      tracks,
      labels,
      (track) => track.status === 'merged',
    ),
  }
}

/**
 * Le garde-fou : celui qui ouvre quatre chantiers et en laisse mourir trois ne
 * doit satisfaire aucun critère de continuité, quel que soit le nombre de
 * mergés qu'il affiche par ailleurs.
 *
 * Le critère mesure une absence — n'avoir laissé mourir aucun chantier —
 * donc l'entrée tenue est celle qui n'a pas été abandonnée.
 */
const noAbandonedTrack = (
  tracks: readonly TrackState[],
  labels: ReadonlyMap<string, string>,
): RuleVerdict => {
  const lostCount = tracks.filter((track) => track.status === 'lost').length
  return {
    satisfied: lostCount === 0,
    attributions: buildTrackAttributions(
      tracks,
      labels,
      (track) => track.status !== 'lost',
    ),
  }
}

/**
 * Sans détail : le verdict tient sur une statistique agrégée — la médiane du
 * relevé de vivants par tour — qu'aucun chantier pris seul n'explique. Un
 * chantier a un sort nommé (mergé, perdu) qui s'attribue directement ; un
 * tour n'a pas d'équivalent aussi direct, sa contribution à une médiane ne
 * se lit qu'en bloc avec tous les autres.
 */
const medianLiveTracksAtLeast = (
  liveTracksPerTurn: readonly number[],
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = medianLiveTracksAtLeastRuleSchema.parse(rule)
  return { satisfied: median(liveTracksPerTurn) >= threshold }
}

export class ThreeTracksEvaluator implements GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    const parsedConfig = threeTracksConfigSchema.parse(config)
    const trace = parseThreeTracksTrace(answer, parsedConfig)

    /**
     * Le verdict se lit sur la partie rejouée depuis les seules allocations,
     * jamais sur le journal écrit dans la trace : une seule implémentation de
     * l'avancée, celle de la phase 1.
     */
    const { tracks, liveTracksPerTurn } = replayTrace(
      parsedConfig,
      trace.turns.map((turn) => ({ allocations: turn.allocations })),
    )
    const labels = trackLabels(parsedConfig)

    return criteria.map((criterion) => {
      const verdict = this.applyRule(
        criterion.rule,
        tracks,
        labels,
        liveTracksPerTurn,
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
    tracks: readonly TrackState[],
    labels: ReadonlyMap<string, string>,
    liveTracksPerTurn: readonly number[],
  ): RuleVerdict {
    switch (rule.type) {
      case 'merged-at-least':
        return mergedAtLeast(tracks, labels, rule)
      case 'no-abandoned-track':
        return noAbandonedTrack(tracks, labels)
      case 'median-live-tracks-at-least':
        return medianLiveTracksAtLeast(liveTracksPerTurn, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}
