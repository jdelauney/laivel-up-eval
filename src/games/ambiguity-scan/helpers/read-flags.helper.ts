import type { AmbiguityScanAnswer } from '../schema/answer.schema'
import type { AmbiguityScanConfig } from '../schema/config.schema'

/**
 * Une seule lecture de ce que vaut un signalement, partagée par l'écran et
 * par le scoring : deux implémentations auraient divergé au premier
 * ajustement de règle, sur le modèle de `read-placements.helper.ts`.
 *
 * Aucune horloge, aucun aléa, aucun accès extérieur, et **aucun seuil de
 * critère** : les seuils sont déclarés dans le parcours et lus par les
 * règles de l'évaluateur, jamais ici.
 */

export type FlagsReading = {
  ambiguousCount: number
  clearCount: number
  // Segments ambigus effectivement signalés.
  hitCount: number
  // Segments clairs signalés par erreur.
  falsePositiveCount: number
  // Couverture nette : un faux positif annule un vrai signalement,
  // exactement le compte qui rend « tout signaler » perdant.
  netHits: number
}

export const readFlags = (
  config: AmbiguityScanConfig,
  trace: AmbiguityScanAnswer,
): FlagsReading => {
  const flagged = new Set(trace.flaggedIds)

  const ambiguousCount = config.segments.filter(
    (segment) => segment.ambiguous,
  ).length
  const clearCount = config.segments.length - ambiguousCount

  const hitCount = config.segments.filter(
    (segment) => segment.ambiguous && flagged.has(segment.id),
  ).length
  const falsePositiveCount = config.segments.filter(
    (segment) => !segment.ambiguous && flagged.has(segment.id),
  ).length

  return {
    ambiguousCount,
    clearCount,
    hitCount,
    falsePositiveCount,
    netHits: hitCount - falsePositiveCount,
  }
}
