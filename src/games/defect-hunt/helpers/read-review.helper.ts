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
  netScore: number
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

  /**
   * Le score de la revue, et la monnaie du jeu : un point par ligne fautive
   * marquée, un point de moins par ligne saine marquée, rien pour une ligne
   * laissée de côté. Il peut être négatif.
   *
   * C'est ce barème, et lui seul, qui rend le nombre de défauts inutile à
   * annoncer : sans règle d'arrêt donnée, marquer au hasard se paie
   * mécaniquement, et le joueur décide lui-même quand sa revue est finie.
   * Une ligne non marquée ne vaut rien — ne pas savoir n'est jamais puni,
   * seule l'affirmation fausse l'est.
   */
  const netScore = found.length - falsePositiveLines.length

  return { found, missed, falsePositiveLines, foundRatio, netScore }
}

/** L'ensemble des natures trouvées, matière du critère de nature exigée. */
export const foundKinds = (reading: Reading): ReadonlySet<DefectKind> =>
  new Set(reading.found.map((defect) => defect.kind))
