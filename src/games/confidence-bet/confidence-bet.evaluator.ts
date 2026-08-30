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
  calibration,
  meanStakeOn,
  replayBets,
  stakesOn,
} from './helpers/run-simulation.helper'
import { parseConfidenceBetTrace } from './schema/answer.schema'
import { confidenceBetConfigSchema } from './schema/config.schema'

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

/**
 * La story dit « sous 50 % », jamais « au plus » : se poser exactement sur
 * le seuil, c'est ne pas avoir tranché. La comparaison reste donc stricte.
 */
const meanStakeOnFlawedBelow = (mean: number, rule: CriterionRule): boolean => {
  const { threshold } = meanStakeRuleSchema.parse(rule)
  return mean < threshold
}

/** Miroir du critère défectueux : « au-dessus de 70 % », strictement. */
const meanStakeOnSoundAbove = (mean: number, rule: CriterionRule): boolean => {
  const { threshold } = meanStakeRuleSchema.parse(rule)
  return mean > threshold
}

/** Borne incluse, comme les bornes de la grille : atteindre le seuil suffit. */
const calibrationAtLeast = (value: number, rule: CriterionRule): boolean => {
  const { threshold } = calibrationRuleSchema.parse(rule)
  return value >= threshold
}

/**
 * Le garde-fou porte sur `chaque` mise, jamais sur une moyenne : une moyenne
 * laisserait compenser une mise extrême par une mise timorée, alors que ce
 * qui est mesuré est de ne jamais s'engager sur ce qu'on ne peut pas
 * établir.
 */
const stakeWithinBandOnUndecidable = (
  stakes: readonly number[],
  rule: CriterionRule,
): boolean => {
  const { from, to } = bandRuleSchema.parse(rule)
  return stakes.every((stake) => stake >= from && stake <= to)
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

    const meanFlawed = meanStakeOn(state, 'flawed')
    const meanSound = meanStakeOn(state, 'sound')
    const calibrationValue = calibration(parsedConfig, state)
    const undecidableStakes = stakesOn(state, 'undecidable')

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(
        criterion.rule,
        meanFlawed,
        meanSound,
        calibrationValue,
        undecidableStakes,
      ),
    }))
  }

  private applyRule(
    rule: CriterionRule,
    meanFlawed: number,
    meanSound: number,
    calibrationValue: number,
    undecidableStakes: readonly number[],
  ): boolean {
    switch (rule.type) {
      case 'mean-stake-on-flawed-below':
        return meanStakeOnFlawedBelow(meanFlawed, rule)
      case 'mean-stake-on-sound-above':
        return meanStakeOnSoundAbove(meanSound, rule)
      case 'calibration-at-least':
        return calibrationAtLeast(calibrationValue, rule)
      case 'stake-within-band-on-undecidable':
        return stakeWithinBandOnUndecidable(undecidableStakes, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}
