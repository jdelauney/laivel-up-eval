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
  type BetResult,
  calibration,
  meanStakeOn,
  replayBets,
  stakesOn,
} from './helpers/run-simulation.helper'
import { parseConfidenceBetTrace } from './schema/answer.schema'
import {
  type ConfidenceBetConfig,
  confidenceBetConfigSchema,
} from './schema/config.schema'

/**
 * Le point de contact public avec le port `GameEvaluator`, d'où sa place à
 * la racine du dossier du jeu et non sous `actions/`.
 *
 * Il interprète des règles déclaratives : déplacer un seuil se fait dans le
 * parcours, pas ici. Aucun accès au store, aucun effet de bord, aucune
 * connaissance des autres jeux.
 */

const GAME_TYPE = 'confidence-bet'

const meanStakeRuleSchema = z.object({ threshold: z.number() })
const calibrationRuleSchema = z.object({ threshold: z.number() })
const bandRuleSchema = z.object({ from: z.number(), to: z.number() })

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
 * Le libellé destiné au joueur de chaque extrait, résolu une seule fois
 * depuis la config — jamais un `snippetId` brut ne doit atteindre une
 * attribution.
 */
const snippetLabels = (
  config: ConfidenceBetConfig,
): ReadonlyMap<string, string> =>
  new Map(config.snippets.map((snippet) => [snippet.id, snippet.label]))

const resolveSnippetLabel = (
  labels: ReadonlyMap<string, string>,
  snippetId: string,
): string => {
  const label = labels.get(snippetId)
  if (label === undefined) {
    throw new Error(`l'extrait « ${snippetId} » n'a pas de libellé déclaré`)
  }
  return label
}

/**
 * Un geste par mise, filtrée sur la nature qui intéresse la règle, tenu
 * quand `holds` en dit oui. Partagée par les quatre règles : chacune ne
 * diffère que par le filtre et le sens qui vaut « tenu ».
 */
const buildBetAttributions = (
  results: readonly BetResult[],
  labels: ReadonlyMap<string, string>,
  matches: (result: BetResult) => boolean,
  holds: (result: BetResult) => boolean,
): readonly CriterionAttribution[] =>
  results.filter(matches).map((result) => ({
    label: resolveSnippetLabel(labels, result.snippetId),
    held: holds(result),
  }))

/**
 * La story dit « sous 50 % », jamais « au plus » : se poser exactement sur
 * le seuil, c'est ne pas avoir tranché. La comparaison reste donc stricte.
 *
 * Chaque mise sur un extrait défectueux est tenue quand elle reste sous la
 * mise neutre : c'est ce qui tire la moyenne vers le bas, indépendamment du
 * seuil de la règle qui ne juge que la moyenne obtenue.
 */
const meanStakeOnFlawedBelow = (
  config: ConfidenceBetConfig,
  results: readonly BetResult[],
  labels: ReadonlyMap<string, string>,
  mean: number,
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = meanStakeRuleSchema.parse(rule)
  return {
    satisfied: mean < threshold,
    attributions: buildBetAttributions(
      results,
      labels,
      (result) => result.nature === 'flawed',
      (result) => result.stake < config.neutralStake,
    ),
  }
}

/** Miroir du critère défectueux : « au-dessus de 70 % », strictement. */
const meanStakeOnSoundAbove = (
  config: ConfidenceBetConfig,
  results: readonly BetResult[],
  labels: ReadonlyMap<string, string>,
  mean: number,
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = meanStakeRuleSchema.parse(rule)
  return {
    satisfied: mean > threshold,
    attributions: buildBetAttributions(
      results,
      labels,
      (result) => result.nature === 'sound',
      (result) => result.stake > config.neutralStake,
    ),
  }
}

/**
 * Borne incluse, comme les bornes de la grille : atteindre le seuil suffit.
 *
 * Chaque mise tranchable (saine ou défectueuse) est tenue quand son
 * mouvement de capital est positif : c'est la discrimination que la
 * calibration agrège.
 */
const calibrationAtLeast = (
  results: readonly BetResult[],
  labels: ReadonlyMap<string, string>,
  value: number,
  rule: CriterionRule,
): RuleVerdict => {
  const { threshold } = calibrationRuleSchema.parse(rule)
  return {
    satisfied: value >= threshold,
    attributions: buildBetAttributions(
      results,
      labels,
      (result) => result.nature !== 'undecidable',
      (result) => result.delta > 0,
    ),
  }
}

/**
 * Le garde-fou porte sur `chaque` mise, jamais sur une moyenne : une moyenne
 * laisserait compenser une mise extrême par une mise timorée, alors que ce
 * qui est mesuré est de ne jamais s'engager sur ce qu'on ne peut pas
 * établir. L'entrée tenue est celle restée dans la bande : le critère mesure
 * une retenue, donc la retenue est ce qui se tient.
 */
const stakeWithinBandOnUndecidable = (
  results: readonly BetResult[],
  labels: ReadonlyMap<string, string>,
  stakes: readonly number[],
  rule: CriterionRule,
): RuleVerdict => {
  const { from, to } = bandRuleSchema.parse(rule)
  return {
    satisfied: stakes.every((stake) => stake >= from && stake <= to),
    attributions: buildBetAttributions(
      results,
      labels,
      (result) => result.nature === 'undecidable',
      (result) => result.stake >= from && result.stake <= to,
    ),
  }
}

export class ConfidenceBetEvaluator implements GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    const parsedConfig = confidenceBetConfigSchema.parse(config)
    const trace = parseConfidenceBetTrace(answer, parsedConfig)

    /**
     * Le verdict se lit sur la partie rejouée depuis les seules mises,
     * jamais sur le journal écrit dans la trace : une seule implémentation
     * du mouvement de capital, celle de la phase 1.
     */
    const state = replayBets(parsedConfig, trace.bets)
    const labels = snippetLabels(parsedConfig)

    const meanFlawed = meanStakeOn(state, 'flawed')
    const meanSound = meanStakeOn(state, 'sound')
    const calibrationValue = calibration(parsedConfig, state)
    const undecidableStakes = stakesOn(state, 'undecidable')

    return criteria.map((criterion) => {
      const verdict = this.applyRule(
        criterion.rule,
        parsedConfig,
        state.results,
        labels,
        meanFlawed,
        meanSound,
        calibrationValue,
        undecidableStakes,
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
    config: ConfidenceBetConfig,
    results: readonly BetResult[],
    labels: ReadonlyMap<string, string>,
    meanFlawed: number,
    meanSound: number,
    calibrationValue: number,
    undecidableStakes: readonly number[],
  ): RuleVerdict {
    switch (rule.type) {
      case 'mean-stake-on-flawed-below':
        return meanStakeOnFlawedBelow(config, results, labels, meanFlawed, rule)
      case 'mean-stake-on-sound-above':
        return meanStakeOnSoundAbove(config, results, labels, meanSound, rule)
      case 'calibration-at-least':
        return calibrationAtLeast(results, labels, calibrationValue, rule)
      case 'stake-within-band-on-undecidable':
        return stakeWithinBandOnUndecidable(
          results,
          labels,
          undecidableStakes,
          rule,
        )
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}
