import { z } from 'zod'
import type {
  Criterion,
  CriterionRule,
} from '../../core/contracts/course.schema'
import type {
  CriterionResult,
  GameEvaluator,
} from '../../core/ports/game-evaluator.interface'
import { median } from './helpers/median.helper'
import { replayTrace } from './helpers/run-simulation.helper'
import { parseThreeTracksTrace } from './schema/answer.schema'
import { threeTracksConfigSchema } from './schema/config.schema'

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

/**
 * Deux paliers de poids deux, plutôt qu'un seul critère à trois graduations :
 * un critère est un booléen, il ne peut pas porter le cran « zéro, un, ou trois
 * chantiers » de la source à lui seul.
 */
const mergedAtLeast = (mergedCount: number, rule: CriterionRule): boolean => {
  const { threshold } = mergedAtLeastRuleSchema.parse(rule)
  return mergedCount >= threshold
}

/**
 * Le garde-fou : celui qui ouvre quatre chantiers et en laisse mourir trois ne
 * doit satisfaire aucun critère de continuité, quel que soit le nombre de
 * mergés qu'il affiche par ailleurs.
 */
const noAbandonedTrack = (lostCount: number): boolean => lostCount === 0

const medianLiveTracksAtLeast = (
  liveTracksPerTurn: readonly number[],
  rule: CriterionRule,
): boolean => {
  const { threshold } = medianLiveTracksAtLeastRuleSchema.parse(rule)
  return median(liveTracksPerTurn) >= threshold
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
    const mergedCount = tracks.filter(
      (track) => track.status === 'merged',
    ).length
    const lostCount = tracks.filter((track) => track.status === 'lost').length

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(
        criterion.rule,
        mergedCount,
        lostCount,
        liveTracksPerTurn,
      ),
    }))
  }

  private applyRule(
    rule: CriterionRule,
    mergedCount: number,
    lostCount: number,
    liveTracksPerTurn: readonly number[],
  ): boolean {
    switch (rule.type) {
      case 'merged-at-least':
        return mergedAtLeast(mergedCount, rule)
      case 'no-abandoned-track':
        return noAbandonedTrack(lostCount)
      case 'median-live-tracks-at-least':
        return medianLiveTracksAtLeast(liveTracksPerTurn, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}
