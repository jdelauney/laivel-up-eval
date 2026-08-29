import { z } from 'zod'

/**
 * L'état de session persisté est une frontière comme les autres : il sort du
 * navigateur, donc il entre par un contrat.
 *
 * Sans ce schéma, un stockage lisible mais structurellement faux — un objet
 * sans `submissions`, par exemple — traversait le cast et faisait lever la
 * restauration au clic sur « Reprendre ».
 */

export const criterionResultSchema = z.object({
  criterionId: z.string().min(1),
  satisfied: z.boolean(),
})

export const submissionSchema = z.object({
  gameId: z.string().min(1),
  /** Opaque au moteur : seul le schéma du jeu concerné sait la lire. */
  answer: z.unknown(),
  results: z.array(criterionResultSchema),
  submittedAt: z.string().min(1),
})

export const sessionSnapshotSchema = z.object({
  playerName: z.string(),
  groupIndex: z.number().int().min(0),
  gameIndex: z.number().int().min(0),
  submissions: z.array(submissionSchema),
})

export type Submission = z.infer<typeof submissionSchema>
export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>
