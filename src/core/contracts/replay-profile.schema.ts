import { z } from 'zod'

/**
 * Un profil de rejeu est un jeu de réponses pré-enregistrées et le niveau qu'on
 * en attend. Il traverse le même pipeline que le jeu interactif, ce qui en fait
 * le harnais du critère « ça tombe juste ».
 */

export const replayAnswerSchema = z.object({
  gameId: z.string().min(1),
  answer: z.record(z.string(), z.unknown()),
})

export const replayProfileSchema = z.object({
  id: z.string().min(1),
  meta: z.object({
    label: z.string().min(1),
    expectedLevel: z.string().min(1),
    /** La lecture complémentaire attendue, quand une signature est câblée. */
    expectedSignature: z.string().min(1).optional(),
  }),
  answers: z.array(replayAnswerSchema).min(1),
})

export type ReplayAnswer = z.infer<typeof replayAnswerSchema>
export type ReplayProfile = z.infer<typeof replayProfileSchema>
