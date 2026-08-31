import {
  type AmbiguityScanAnswer,
  parseAmbiguityScanTrace,
} from '../schema/answer.schema'
import type { AmbiguityScanConfig } from '../schema/config.schema'

/**
 * Construit la trace conforme au contrat du jeu, hors de React : testable
 * sans composant, sur le modèle de `buildPracticeMapAnswer`.
 *
 * La trace qui en sort suit toujours l'ordre des segments déclarés dans la
 * configuration, jamais celui dans lequel le joueur les a signalés : deux
 * parties aux mêmes gestes produisent donc toujours exactement la même
 * trace. Le passage par un `Set` élimine aussi tout doublon par
 * construction — un même identifiant signalé deux fois côté écran ne
 * franchit jamais cette fonction plus d'une fois.
 */
export const buildAmbiguityScanAnswer = (
  config: AmbiguityScanConfig,
  flaggedIds: readonly string[],
): AmbiguityScanAnswer => {
  const flagged = new Set(flaggedIds)
  const ordered = config.segments
    .filter((segment) => flagged.has(segment.id))
    .map((segment) => segment.id)

  return parseAmbiguityScanTrace({ flaggedIds: ordered }, config)
}
