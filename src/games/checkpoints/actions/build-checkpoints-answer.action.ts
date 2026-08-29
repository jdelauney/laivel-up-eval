import { replayTrace } from '../helpers/run-simulation.helper'
import {
  type CheckpointsAnswer,
  parseCheckpointsTrace,
} from '../schema/answer.schema'
import type { CheckpointsConfig, Choice } from '../schema/config.schema'

/**
 * Construit la trace conforme au contrat du jeu. Testable sans composant :
 * c'est tout l'intérêt de la séparer du hook.
 *
 * Les coûts viennent de la simulation, jamais d'un calcul refait ici, et
 * l'ordre des étapes est celui de la configuration : une même partie produit
 * donc toujours exactement la même trace.
 */
export const buildCheckpointsAnswer = (
  config: CheckpointsConfig,
  choices: readonly Choice[],
): CheckpointsAnswer => {
  const state = replayTrace(
    config,
    choices.map((choice) => ({ choice })),
  )

  return parseCheckpointsTrace(
    {
      decisions: state.decisions,
      remainingBudget: state.budget,
      remainingDefects: state.pendingDefects.map((defect) => defect.id),
    },
    config.stages,
  )
}
