import { z } from 'zod'
import type { HintBudgetConfig } from './config.schema'

/**
 * Ce que le joueur a posé, acheté et tranché, par situation.
 *
 * Aucun champ dérivé n'entre dans la trace : résolu, frugal, cadrage fondé,
 * cadrage premier et coût se recalculent depuis ces champs et la
 * configuration, dans `read-situations.helper.ts`. `afterHints` est une
 * **position dans le déroulé** — combien d'indices étaient déjà achetés au
 * moment du dépôt — jamais un verdict : un champ dérivé de plus ne serait
 * qu'une surface à forger.
 */

export const framingEntrySchema = z.object({
  // Un cadrage qui ne retient rien reste un cadrage posé : le tableau peut
  // être vide.
  retainedIds: z.array(z.string().min(1)),
  afterHints: z.number().int().nonnegative(),
})

export const attemptSchema = z.object({
  situationId: z.string().min(1),
  // `null` veut dire : jamais posé.
  framing: framingEntrySchema.nullable(),
  // Dans l'ordre d'achat.
  boughtHintIds: z.array(z.string().min(1)),
  cutCauseId: z.string().min(1),
})

/**
 * Trois refus de schéma : des défauts de la trace elle-même, indépendants de
 * toute configuration, sur le modèle des doublons d'`id` de `lie-detector`.
 */
export const hintBudgetAnswerSchema = z
  .object({
    attempts: z.array(attemptSchema).min(1),
  })
  .superRefine((answer, context) => {
    answer.attempts.forEach((attempt, index) => {
      const firstIndex = answer.attempts.findIndex(
        (candidate) => candidate.situationId === attempt.situationId,
      )
      if (firstIndex !== index) {
        context.addIssue({
          code: 'custom',
          path: ['attempts', index, 'situationId'],
          message: `la situation « ${attempt.situationId} » est présente plusieurs fois dans la trace`,
        })
      }

      attempt.boughtHintIds.forEach((hintId, hintIndex) => {
        const firstHintIndex = attempt.boughtHintIds.indexOf(hintId)
        if (firstHintIndex === hintIndex) return

        context.addIssue({
          code: 'custom',
          path: ['attempts', index, 'boughtHintIds', hintIndex],
          message: `l'indice « ${hintId} » est acheté plusieurs fois dans la situation « ${attempt.situationId} »`,
        })
      })

      attempt.framing?.retainedIds.forEach((framingId, framingIndex) => {
        const firstFramingIndex =
          attempt.framing?.retainedIds.indexOf(framingId)
        if (firstFramingIndex === framingIndex) return

        context.addIssue({
          code: 'custom',
          path: ['attempts', index, 'framing', 'retainedIds', framingIndex],
          message: `la lecture « ${framingId} » est retenue plusieurs fois dans le cadrage de la situation « ${attempt.situationId} »`,
        })
      })
    })
  })

export type FramingEntry = z.infer<typeof framingEntrySchema>
export type Attempt = z.infer<typeof attemptSchema>
export type HintBudgetAnswer = z.infer<typeof hintBudgetAnswerSchema>

/**
 * Une situation de la configuration n'est couverte par aucune tentative de
 * la trace. Trancher est le geste qui clôt une situation : l'écran ne laisse
 * jamais passer une situation sans tranche, donc une trace qui en porte une
 * est forgée.
 */
export class IncompleteTraceError extends Error {
  readonly situationId: string

  constructor(situationId: string) {
    super(
      `la trace du jeu hint-budget ne couvre pas la situation « ${situationId} »`,
    )
    this.name = 'IncompleteTraceError'
    this.situationId = situationId
  }
}

/** Une tentative vise une situation absente de la configuration. */
export class UnknownSituationError extends Error {
  readonly situationId: string

  constructor(situationId: string) {
    super(
      `une tentative vise la situation « ${situationId} », absente de la configuration`,
    )
    this.name = 'UnknownSituationError'
    this.situationId = situationId
  }
}

/**
 * Une tentative tranche une cause absente de sa situation. Porte
 * l'identifiant fautif ET la situation : le même identifiant de cause
 * pourrait exister ailleurs, dans une autre situation, sans lever
 * d'ambiguïté.
 */
export class UnknownCauseError extends Error {
  readonly causeId: string
  readonly situationId: string

  constructor(causeId: string, situationId: string) {
    super(
      `une tentative tranche la cause « ${causeId} », absente de la situation « ${situationId} »`,
    )
    this.name = 'UnknownCauseError'
    this.causeId = causeId
    this.situationId = situationId
  }
}

/** Une tentative achète un indice absent de sa situation. */
export class UnknownHintError extends Error {
  readonly hintId: string
  readonly situationId: string

  constructor(hintId: string, situationId: string) {
    super(
      `une tentative achète l'indice « ${hintId} », absent de la situation « ${situationId} »`,
    )
    this.name = 'UnknownHintError'
    this.hintId = hintId
    this.situationId = situationId
  }
}

/** Un cadrage retient une lecture absente de sa situation. */
export class UnknownFramingError extends Error {
  readonly framingId: string
  readonly situationId: string

  constructor(framingId: string, situationId: string) {
    super(
      `un cadrage retient la lecture « ${framingId} », absente de la situation « ${situationId} »`,
    )
    this.name = 'UnknownFramingError'
    this.framingId = framingId
    this.situationId = situationId
  }
}

/**
 * `afterHints` dépasse le nombre d'indices réellement achetés : aucun
 * déroulé ne peut produire cette position, la trace est forgée.
 */
export class ForgedFramingError extends Error {
  readonly situationId: string

  constructor(situationId: string) {
    super(
      `le cadrage de la situation « ${situationId} » annonce plus d'indices achetés qu'il n'en a été acheté`,
    )
    this.name = 'ForgedFramingError'
    this.situationId = situationId
  }
}

/**
 * Le schéma seul ignore quelles situations la partie comptait : la
 * couverture se vérifie contre la configuration, situation par situation,
 * puis chaque référence de la trace se vérifie contre son propre lot.
 */
export const parseHintBudgetTrace = (
  answer: unknown,
  config: HintBudgetConfig,
): HintBudgetAnswer => {
  const trace = hintBudgetAnswerSchema.parse(answer)

  config.situations.forEach((situation) => {
    const attempt = trace.attempts.find(
      (entry) => entry.situationId === situation.id,
    )
    if (attempt === undefined) throw new IncompleteTraceError(situation.id)
  })

  trace.attempts.forEach((attempt) => {
    const situation = config.situations.find(
      (entry) => entry.id === attempt.situationId,
    )
    if (situation === undefined) {
      throw new UnknownSituationError(attempt.situationId)
    }

    const knownCauseIds = new Set(situation.causes.map((cause) => cause.id))
    if (!knownCauseIds.has(attempt.cutCauseId)) {
      throw new UnknownCauseError(attempt.cutCauseId, situation.id)
    }

    const knownHintIds = new Set(situation.hints.map((hint) => hint.id))
    attempt.boughtHintIds.forEach((hintId) => {
      if (!knownHintIds.has(hintId)) {
        throw new UnknownHintError(hintId, situation.id)
      }
    })

    if (attempt.framing !== null) {
      const knownFramingIds = new Set(
        situation.framings.map((framing) => framing.id),
      )
      attempt.framing.retainedIds.forEach((framingId) => {
        if (!knownFramingIds.has(framingId)) {
          throw new UnknownFramingError(framingId, situation.id)
        }
      })

      if (attempt.framing.afterHints > attempt.boughtHintIds.length) {
        throw new ForgedFramingError(situation.id)
      }
    }
  })

  return trace
}
