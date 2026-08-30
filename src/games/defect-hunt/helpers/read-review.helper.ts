import type { DefectHuntAnswer } from '../schema/answer.schema'
import type {
  Defect,
  DefectHuntConfig,
  DefectKind,
} from '../schema/config.schema'

/**
 * Une seule implémentation de ce que vaut une revue, partagée par l'écran et
 * par le scoring : deux implémentations auraient divergé au premier
 * ajustement de barème.
 *
 * Aucune horloge, aucun aléa, aucun accès extérieur : la fonction ne dépend
 * que de ses arguments. La durée arrive par la trace, elle n'est jamais
 * mesurée ici.
 */

export type Reading = {
  found: readonly Defect[]
  missed: readonly Defect[]
  falsePositiveLines: readonly number[]
  foundRatio: number
}

export const readReview = (
  config: DefectHuntConfig,
  trace: DefectHuntAnswer,
): Reading => {
  const markedLines = new Set(trace.markedLines)
  const defectLines = new Set(config.defects.map((defect) => defect.line))

  // `found` et `missed` conservent l'ordre déclaré des défauts, pas l'ordre
  // des marques : deux revues aux mêmes lignes rendent exactement la même
  // lecture.
  const found = config.defects.filter((defect) => markedLines.has(defect.line))
  const missed = config.defects.filter(
    (defect) => !markedLines.has(defect.line),
  )

  const falsePositiveLines = trace.markedLines.filter(
    (line) => !defectLines.has(line),
  )

  // Le schéma garantit au moins trois défauts : le dénominateur n'est jamais
  // nul, il n'y a donc pas de branche morte à garder pour ce cas.
  const foundRatio = found.length / config.defects.length

  return { found, missed, falsePositiveLines, foundRatio }
}

/** L'ensemble des natures trouvées, matière du critère de nature exigée. */
export const foundKinds = (reading: Reading): ReadonlySet<DefectKind> =>
  new Set(reading.found.map((defect) => defect.kind))
