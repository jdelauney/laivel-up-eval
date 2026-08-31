import { z } from 'zod'
import type { FlowOrderConfig } from './config.schema'

/**
 * Ce que le joueur a rendu, et rien de plus : l'ordre dans lequel il a
 * disposé les étapes. Contrairement à `ambiguity-scan`, l'ordre **est** la
 * donnée — cette trace ne se recompose jamais dans l'ordre de la
 * configuration, elle porte l'ordre joué tel quel.
 *
 * Le seul refus de forme, indépendant de toute configuration : un
 * identifiant répété dans la trace. Le reste — identifiant inconnu, trace
 * incomplète — se vérifie contre la configuration dans
 * `parseFlowOrderTrace`, sur le modèle de `parsePracticeMapTrace`.
 */

export const flowOrderAnswerSchema = z
  .object({
    orderedIds: z.array(z.string().min(1)),
  })
  .superRefine((answer, context) => {
    answer.orderedIds.forEach((id, index) => {
      const firstIndex = answer.orderedIds.indexOf(id)
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['orderedIds', index],
        message: `l'étape « ${id} » apparaît plusieurs fois dans la trace`,
      })
    })
  })

export type FlowOrderAnswer = z.infer<typeof flowOrderAnswerSchema>

/** Une position de la trace vise une étape absente de la configuration. */
export class UnknownStepError extends Error {
  readonly stepId: string

  constructor(stepId: string) {
    super(`la trace vise l'étape « ${stepId} », absente de la configuration`)
    this.name = 'UnknownStepError'
    this.stepId = stepId
  }
}

/**
 * Une étape de la configuration n'a aucune position dans la trace. L'écran
 * ne produit jamais une trace incomplète — la frise porte toujours une
 * permutation complète — donc une trace qui en manque une est forgée.
 */
export class IncompleteOrderError extends Error {
  readonly stepId: string

  constructor(stepId: string) {
    super(`la trace du jeu flow-order ne couvre pas l'étape « ${stepId} »`)
    this.name = 'IncompleteOrderError'
    this.stepId = stepId
  }
}

/**
 * Le schéma seul ignore quelles étapes la partie comptait : chaque référence
 * de la trace se vérifie contre la configuration, puis la couverture
 * complète se vérifie dans l'autre sens, exactement le double contrôle de
 * `parsePracticeMapTrace`.
 */
export const parseFlowOrderTrace = (
  answer: unknown,
  config: FlowOrderConfig,
): FlowOrderAnswer => {
  const trace = flowOrderAnswerSchema.parse(answer)

  trace.orderedIds.forEach((id) => {
    const known = config.steps.some((step) => step.id === id)
    if (!known) throw new UnknownStepError(id)
  })

  config.steps.forEach((step) => {
    const covered = trace.orderedIds.includes(step.id)
    if (!covered) throw new IncompleteOrderError(step.id)
  })

  return trace
}
