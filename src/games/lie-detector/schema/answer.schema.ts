import { z } from 'zod'
import type { LieDetectorConfig } from './config.schema'

/**
 * La suite des désignations est la réponse : par manche, la première
 * désignation et la dernière, et rien d'autre.
 *
 * Aucun champ dérivé n'entre dans la trace : démasquée, contredite et
 * capitulation se recalculent depuis ces trois identifiants et la
 * configuration, dans `read-rounds.helper.ts`. Un champ dérivé de plus ne
 * serait qu'une surface à forger.
 */

const pickSchema = z.object({
  roundId: z.string().min(1),
  firstPickId: z.string().min(1),
  finalPickId: z.string().min(1),
})

/**
 * Une manche qui se répète dans la trace est un défaut de la trace elle-même,
 * indépendant de toute configuration : le refus se pose donc ici, au niveau
 * du schéma, sur le modèle des doublons d'`id` de `config.schema.ts`.
 */
export const lieDetectorAnswerSchema = z
  .object({
    picks: z.array(pickSchema).min(1),
  })
  .superRefine((answer, context) => {
    answer.picks.forEach((pick, index) => {
      const firstIndex = answer.picks.findIndex(
        (candidate) => candidate.roundId === pick.roundId,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['picks', index, 'roundId'],
        message: `la manche « ${pick.roundId} » est désignée plusieurs fois dans la trace`,
      })
    })
  })

export type Pick = z.infer<typeof pickSchema>
export type LieDetectorAnswer = z.infer<typeof lieDetectorAnswerSchema>

/**
 * Une manche de la configuration n'est couverte par aucune désignation de la
 * trace. Contrairement à la revue vide de `defect-hunt`, une manche sans
 * désignation n'est pas recevable ici : désigner est le geste même du jeu,
 * l'écran ne laisse jamais passer une manche sans désignation, donc une
 * trace qui en porte une est forgée.
 */
export class IncompleteTraceError extends Error {
  readonly roundId: string

  constructor(roundId: string) {
    super(`la trace du jeu lie-detector ne couvre pas la manche « ${roundId} »`)
    this.name = 'IncompleteTraceError'
    this.roundId = roundId
  }
}

/** Une désignation vise une manche absente de la configuration. */
export class UnknownRoundError extends Error {
  readonly roundId: string

  constructor(roundId: string) {
    super(
      `une désignation vise la manche « ${roundId} », absente de la configuration`,
    )
    this.name = 'UnknownRoundError'
    this.roundId = roundId
  }
}

/**
 * Une désignation vise une affirmation absente de sa manche. Porte
 * l'identifiant fautif ET la manche : le même identifiant d'affirmation
 * pourrait exister ailleurs, dans une autre manche, sans lever d'ambiguïté.
 */
export class UnknownClaimError extends Error {
  readonly claimId: string
  readonly roundId: string

  constructor(claimId: string, roundId: string) {
    super(
      `une désignation vise l'affirmation « ${claimId} », absente de la manche « ${roundId} »`,
    )
    this.name = 'UnknownClaimError'
    this.claimId = claimId
    this.roundId = roundId
  }
}

/**
 * Le schéma seul ignore quelles manches la partie comptait : la couverture
 * se vérifie contre la configuration, manche par manche.
 */
export const parseLieDetectorTrace = (
  answer: unknown,
  config: LieDetectorConfig,
): LieDetectorAnswer => {
  const trace = lieDetectorAnswerSchema.parse(answer)

  config.rounds.forEach((round) => {
    const pick = trace.picks.find((entry) => entry.roundId === round.id)
    if (pick === undefined) throw new IncompleteTraceError(round.id)
  })

  trace.picks.forEach((pick) => {
    const round = config.rounds.find((entry) => entry.id === pick.roundId)
    if (round === undefined) throw new UnknownRoundError(pick.roundId)

    const knownClaimIds = new Set(round.claims.map((claim) => claim.id))
    if (!knownClaimIds.has(pick.firstPickId)) {
      throw new UnknownClaimError(pick.firstPickId, round.id)
    }
    if (!knownClaimIds.has(pick.finalPickId)) {
      throw new UnknownClaimError(pick.finalPickId, round.id)
    }
  })

  return trace
}
