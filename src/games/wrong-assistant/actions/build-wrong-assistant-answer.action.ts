import {
  parseWrongAssistantTrace,
  type Step,
  type WrongAssistantAnswer,
} from '../schema/answer.schema'
import type { WrongAssistantConfig } from '../schema/config.schema'

/**
 * Construit la trace conforme au contrat du jeu, hors de React : testable
 * sans composant, sur le modèle de `buildLieDetectorAnswer`.
 *
 * `playedSteps` porte les pas déjà joués, dans l'ordre où le joueur les a
 * traversés — un fil unique, irréversible, jamais réordonné : contrairement
 * à `lie-detector` (des manches indépendantes, reclassées dans l'ordre de la
 * configuration), l'ordre de jeu ICI **est** l'ordre du chaînage, il n'y a
 * rien à réordonner.
 *
 * Un pas hors contrat — un nœud ou une réponse inconnus, un chaînage rompu —
 * est refusé ici même, en repassant par `parseWrongAssistantTrace` : ce que
 * l'écran produit se vérifie contre le même contrat que ce que l'évaluateur
 * consomme.
 */
export const buildWrongAssistantAnswer = (
  config: WrongAssistantConfig,
  playedSteps: readonly Step[],
): WrongAssistantAnswer =>
  parseWrongAssistantTrace({ steps: playedSteps }, config)
