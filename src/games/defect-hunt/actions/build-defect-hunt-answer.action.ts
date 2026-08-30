import {
  type DefectHuntAnswer,
  parseDefectHuntTrace,
} from '../schema/answer.schema'
import type { DefectHuntConfig } from '../schema/config.schema'

/**
 * Construit la trace conforme au contrat du jeu, hors de React : testable
 * sans composant, sur le modèle de `buildConfidenceBetAnswer`.
 *
 * Les lignes sortent triées croissant, jamais dans l'ordre où le joueur les a
 * cliquées : deux revues qui marquent les mêmes lignes produisent alors
 * exactement la même trace, quel que soit l'ordre des clics.
 *
 * L'action ne dédoublonne pas : un doublon serait un bug de l'écran, et c'est
 * au refus de `parseDefectHuntTrace` de le dire, pas à un nettoyage silencieux
 * ici.
 */
export const buildDefectHuntAnswer = (
  config: DefectHuntConfig,
  markedLines: readonly number[],
  elapsedSeconds: number,
): DefectHuntAnswer => {
  const sortedLines = [...markedLines].sort((a, b) => a - b)

  return parseDefectHuntTrace(
    { markedLines: sortedLines, elapsedSeconds },
    config,
  )
}
