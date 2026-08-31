import {
  type FlowOrderAnswer,
  parseFlowOrderTrace,
} from '../schema/answer.schema'
import type { FlowOrderConfig } from '../schema/config.schema'

/**
 * Construit la trace conforme au contrat du jeu, hors de React : testable
 * sans composant, sur le modèle de `buildPracticeMapAnswer`.
 *
 * Contrairement à `buildAmbiguityScanAnswer`, cette fonction ne réordonne
 * **rien** : l'ordre joué est la donnée elle-même, jamais recomposé dans
 * l'ordre de la configuration. `orderedIds` traverse telle quelle jusqu'au
 * contrat, qui la vérifie complète et sans doublon.
 */
export const buildFlowOrderAnswer = (
  config: FlowOrderConfig,
  orderedIds: readonly string[],
): FlowOrderAnswer => parseFlowOrderTrace({ orderedIds }, config)
