import { z } from 'zod'
import type { AmbiguityScanConfig } from './config.schema'

/**
 * Ce que le joueur a signalé, et rien de plus : les identifiants des
 * segments retenus. Aucun champ dérivé n'entre dans la trace — le compte de
 * segments ambigus repérés et de segments clairs signalés par erreur se
 * recalcule depuis `flaggedIds` et la configuration, dans
 * `read-flags.helper.ts`.
 *
 * Pas de minimum de longueur ici : une trace vide est valide au sens du
 * contrat, sur le modèle de `testBenchAnswerSchema`. C'est l'écran qui
 * refuse de soumettre sans aucun segment signalé — un choix de jeu, pas une
 * règle de forme de la trace.
 */

export const ambiguityScanAnswerSchema = z
  .object({
    flaggedIds: z.array(z.string().min(1)),
  })
  .superRefine((answer, context) => {
    answer.flaggedIds.forEach((id, index) => {
      const firstIndex = answer.flaggedIds.indexOf(id)
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['flaggedIds', index],
        message: `le segment « ${id} » est signalé plusieurs fois dans la trace`,
      })
    })
  })

export type AmbiguityScanAnswer = z.infer<typeof ambiguityScanAnswerSchema>

/** Un signalement vise un segment absent de la configuration. */
export class UnknownSegmentError extends Error {
  readonly segmentId: string

  constructor(segmentId: string) {
    super(
      `un signalement vise le segment « ${segmentId} », absent de la configuration`,
    )
    this.name = 'UnknownSegmentError'
    this.segmentId = segmentId
  }
}

/**
 * Le schéma seul ignore quels segments la partie comptait : chaque
 * référence de la trace se vérifie contre la configuration, après le refus
 * de forme porté par le schéma.
 */
export const parseAmbiguityScanTrace = (
  answer: unknown,
  config: AmbiguityScanConfig,
): AmbiguityScanAnswer => {
  const trace = ambiguityScanAnswerSchema.parse(answer)

  trace.flaggedIds.forEach((id) => {
    const known = config.segments.some((segment) => segment.id === id)
    if (!known) throw new UnknownSegmentError(id)
  })

  return trace
}
