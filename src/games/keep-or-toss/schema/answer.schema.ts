import { z } from 'zod'
import type { KeepOrTossConfig } from './config.schema'

/**
 * Ce que le joueur a rendu : un verdict par item trié, et la durée que le
 * tri a prise. Un tri inachevé est une trace valide — c'est le sujet même
 * du jeu — donc `verdicts` **n'exige pas** la couverture de tous les items.
 *
 * Aucun journal des gestes : l'ordre dans lequel les cartes ont été triées
 * ne compte pour aucune règle, seul le verdict final par item compte.
 */

export const keepOrTossVerdictSchema = z.object({
  itemId: z.string().min(1),
  kept: z.boolean(),
})

export const keepOrTossAnswerSchema = z
  .object({
    verdicts: z.array(keepOrTossVerdictSchema),
    elapsedSeconds: z.number().finite().min(0),
  })
  .superRefine((answer, context) => {
    answer.verdicts.forEach((verdict, index) => {
      const firstIndex = answer.verdicts.findIndex(
        (candidate) => candidate.itemId === verdict.itemId,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['verdicts', index, 'itemId'],
        message: `l'item « ${verdict.itemId} » porte deux verdicts`,
      })
    })
  })

export type KeepOrTossAnswer = z.infer<typeof keepOrTossAnswerSchema>

/** Un verdict de la trace vise un item absent de la configuration. */
export class UnknownItemError extends Error {
  readonly itemId: string

  constructor(itemId: string) {
    super(`la trace vise l'item « ${itemId} », absent de la configuration`)
    this.name = 'UnknownItemError'
    this.itemId = itemId
  }
}

/**
 * Le schéma seul ignore quel lot la partie proposait : chaque référence de
 * la trace se vérifie contre la configuration, sur le modèle de
 * `parseFlowOrderTrace`. Contrairement à `flow-order`, aucune couverture
 * complète n'est exigée dans l'autre sens — un tri inachevé reste une
 * trace recevable.
 */
export const parseKeepOrTossTrace = (
  answer: unknown,
  config: KeepOrTossConfig,
): KeepOrTossAnswer => {
  const trace = keepOrTossAnswerSchema.parse(answer)
  const knownIds = new Set(config.items.map((item) => item.id))

  trace.verdicts.forEach((verdict) => {
    if (!knownIds.has(verdict.itemId))
      throw new UnknownItemError(verdict.itemId)
  })

  return trace
}
