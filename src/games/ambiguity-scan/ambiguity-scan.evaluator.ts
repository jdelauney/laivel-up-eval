import { z } from 'zod'
import type {
  Criterion,
  CriterionRule,
} from '../../core/contracts/course.schema'
import type {
  CriterionResult,
  GameEvaluator,
} from '../../core/ports/game-evaluator.interface'
import { readFlags } from './helpers/read-flags.helper'
import { parseAmbiguityScanTrace } from './schema/answer.schema'
import { ambiguityScanConfigSchema } from './schema/config.schema'

/**
 * Le point de contact public avec le port `GameEvaluator`, sur le modèle de
 * `practice-map.evaluator.ts`. Il interprète des règles déclaratives :
 * déplacer un seuil se fait dans le parcours, pas ici.
 */

const GAME_TYPE = 'ambiguity-scan'

/**
 * Seuil borné à `]0, 1]`, sur le modèle de `checkpoints.evaluator.ts:29` et
 * `three-tracks.evaluator.ts:27-30`. La borne basse est **exclue** et non
 * `min(0)` : à `threshold: 0` sur un corpus au plancher
 * (`clearCount === ambiguousCount`), signaler tout le prompt donne
 * `netHits = 0`, donc `0 >= 0` tiendrait la règle — l'exact contraire de la
 * promesse du schéma de configuration (« tout surligner » perd quel que
 * soit le seuil retenu par le parcours).
 */
const ambiguityNetShareAtLeastSchema = z.object({
  threshold: z.number().gt(0).max(1),
})
/** Une part se lit entre `0` et `1`, jamais au-delà — même bornage de principe que `ambiguityNetShareAtLeastSchema`, sans le besoin d'exclure `0`. */
const clearSegmentsSparedAtLeastSchema = z.object({
  threshold: z.number().min(0).max(1),
})

class UnknownRuleError extends Error {
  constructor(ruleType: string) {
    super(`la règle « ${ruleType} » n'est pas connue du jeu ${GAME_TYPE}`)
    this.name = 'UnknownRuleError'
  }
}

/**
 * La part **nette** des segments ambigus repérés atteint au moins
 * `threshold`. « Nette » parce que `netHits` retranche déjà un faux positif
 * par segment clair signalé : signaler tout le prompt fait tomber
 * `netHits` à zéro ou moins, donc cette part à zéro ou moins, quel que soit
 * le seuil.
 */
const ambiguityNetShareAtLeast = (
  inputs: VerdictInputs,
  rule: CriterionRule,
): boolean => {
  const { threshold } = ambiguityNetShareAtLeastSchema.parse(rule)
  return inputs.netHits / inputs.ambiguousCount >= threshold
}

/**
 * La part des segments clairs laissés tranquilles atteint au moins
 * `threshold`. Lit la **retenue**, jamais la couverture — mais pas une
 * quantité indépendante de `ambiguity-net-share-at-least` pour autant :
 * les deux règles lisent `falsePositiveCount`, donc un même faux positif
 * pénalise les deux à la fois, sur la même dimension `pilotage-contexte`.
 * Recouvrement assumé, pas un oubli (`plan.md`, Phase 2 et *Decisions*) :
 * signaler à l'aveugle coûte plus cher que mal lire en ayant vu juste. Un
 * joueur qui signale tout tient cette règle à zéro, un joueur qui ne
 * signale rien la tient à un tout en manquant l'autre règle.
 */
const clearSegmentsSparedAtLeast = (
  inputs: VerdictInputs,
  rule: CriterionRule,
): boolean => {
  const { threshold } = clearSegmentsSparedAtLeastSchema.parse(rule)
  return (
    (inputs.clearCount - inputs.falsePositiveCount) / inputs.clearCount >=
    threshold
  )
}

export class AmbiguityScanEvaluator implements GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    const parsedConfig = ambiguityScanConfigSchema.parse(config)
    const trace = parseAmbiguityScanTrace(answer, parsedConfig)

    // Les signalements sont lus une seule fois : les deux règles lisent la
    // même lecture, jamais un recalcul propre à chacune.
    const reading = readFlags(parsedConfig, trace)

    const inputs: VerdictInputs = {
      ambiguousCount: reading.ambiguousCount,
      clearCount: reading.clearCount,
      falsePositiveCount: reading.falsePositiveCount,
      netHits: reading.netHits,
    }

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(criterion.rule, inputs),
    }))
  }

  private applyRule(rule: CriterionRule, inputs: VerdictInputs): boolean {
    switch (rule.type) {
      case 'ambiguity-net-share-at-least':
        return ambiguityNetShareAtLeast(inputs, rule)
      case 'clear-segments-spared-at-least':
        return clearSegmentsSparedAtLeast(inputs, rule)
      default:
        throw new UnknownRuleError(rule.type)
    }
  }
}

/** Tout ce qu'une règle peut lire, et rien de plus. */
type VerdictInputs = {
  ambiguousCount: number
  clearCount: number
  falsePositiveCount: number
  netHits: number
}
