import { z } from 'zod'
import type { PracticeMapConfig } from './config.schema'

/**
 * Ce que le joueur a posé, et rien de plus : une coordonnée par pratique.
 *
 * Aucun champ dérivé n'entre dans la trace : `inZone`, la tenue des
 * relations d'ordre et le compte de haute rigueur se recalculent tous depuis
 * `intensity`, `rigor` et la configuration, dans
 * `read-placements.helper.ts`.
 */

export const placementSchema = z.object({
  practiceId: z.string().min(1),
  intensity: z.number().min(0).max(1),
  rigor: z.number().min(0).max(1),
})

/** Un seul refus de schéma : une pratique posée plusieurs fois dans la trace. */
export const practiceMapAnswerSchema = z
  .object({
    placements: z.array(placementSchema).min(1),
  })
  .superRefine((answer, context) => {
    answer.placements.forEach((placement, index) => {
      const firstIndex = answer.placements.findIndex(
        (candidate) => candidate.practiceId === placement.practiceId,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['placements', index, 'practiceId'],
        message: `la pratique « ${placement.practiceId} » est posée plusieurs fois dans la trace`,
      })
    })
  })

export type Placement = z.infer<typeof placementSchema>
export type PracticeMapAnswer = z.infer<typeof practiceMapAnswerSchema>

/**
 * Une pratique de la configuration n'est couverte par aucun placement.
 * L'écran ne laisse jamais soumettre une réserve non vide, donc une trace
 * qui en porte une est forgée.
 */
export class IncompletePlacementError extends Error {
  readonly practiceId: string

  constructor(practiceId: string) {
    super(
      `la trace du jeu practice-map ne couvre pas la pratique « ${practiceId} »`,
    )
    this.name = 'IncompletePlacementError'
    this.practiceId = practiceId
  }
}

/** Un placement vise une pratique absente de la configuration. */
export class UnknownPracticeError extends Error {
  readonly practiceId: string

  constructor(practiceId: string) {
    super(
      `un placement vise la pratique « ${practiceId} », absente de la configuration`,
    )
    this.name = 'UnknownPracticeError'
    this.practiceId = practiceId
  }
}

/**
 * Le schéma seul ignore quelles pratiques la partie comptait : la couverture
 * se vérifie contre la configuration, pratique par pratique, puis chaque
 * référence de la trace se vérifie contre le même lot.
 */
export const parsePracticeMapTrace = (
  answer: unknown,
  config: PracticeMapConfig,
): PracticeMapAnswer => {
  const trace = practiceMapAnswerSchema.parse(answer)

  config.practices.forEach((practice) => {
    const placed = trace.placements.some(
      (placement) => placement.practiceId === practice.id,
    )
    if (!placed) throw new IncompletePlacementError(practice.id)
  })

  trace.placements.forEach((placement) => {
    const known = config.practices.some(
      (practice) => practice.id === placement.practiceId,
    )
    if (!known) throw new UnknownPracticeError(placement.practiceId)
  })

  return trace
}
