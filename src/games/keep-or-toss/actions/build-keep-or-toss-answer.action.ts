import {
  type KeepOrTossAnswer,
  parseKeepOrTossTrace,
} from '../schema/answer.schema'
import type { KeepOrTossConfig } from '../schema/config.schema'

/**
 * Construit la trace conforme au contrat du jeu, hors de React : testable
 * sans composant, sur le modèle de `buildDefectHuntAnswer`.
 *
 * Les verdicts sortent dans l'ordre déclaré de la configuration, jamais
 * dans l'ordre où le joueur a trié les cartes : deux parties qui posent les
 * mêmes verdicts produisent alors exactement la même trace. Un item non
 * trié n'apparaît simplement pas — `verdictsById` ne le porte pas.
 */
export const buildKeepOrTossAnswer = (
  config: KeepOrTossConfig,
  verdictsById: ReadonlyMap<string, boolean>,
  elapsedSeconds: number,
): KeepOrTossAnswer => {
  const verdicts = config.items
    .filter((item) => verdictsById.has(item.id))
    .map((item) => ({
      itemId: item.id,
      kept: verdictsById.get(item.id) as boolean,
    }))

  return parseKeepOrTossTrace({ verdicts, elapsedSeconds }, config)
}
