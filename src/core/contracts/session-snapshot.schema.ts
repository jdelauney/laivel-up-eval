import { z } from 'zod'
import { repositorySlugSchema } from './repository-slug.schema'

/**
 * L'état de session persisté est une frontière comme les autres : il sort du
 * navigateur, donc il entre par un contrat.
 *
 * Sans ce schéma, un stockage lisible mais structurellement faux — un objet
 * sans `submissions`, par exemple — traversait le cast et faisait lever la
 * restauration au clic sur « Reprendre ».
 */

export const criterionAttributionSchema = z.object({
  label: z.string().min(1),
  held: z.boolean(),
})

export const criterionResultSchema = z.object({
  criterionId: z.string().min(1),
  satisfied: z.boolean(),
  /**
   * Optionnel pour la même raison que `repository` : un critère réellement
   * binaire n'en porte pas, et une partie enregistrée avant ce champ n'en
   * porte pas non plus. Sans lui, un instantané reprend le verdict mais perd
   * le détail — plus pauvre après un rechargement qu'avant.
   */
  attributions: z.array(criterionAttributionSchema).readonly().optional(),
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
  /**
   * Optionnel, et pas par hésitation de modélisation : une partie enregistrée
   * avant l'arrivée de ce champ n'en porte pas. Le rendre requis ferait échouer
   * la lecture de son instantané, et la façade ignore silencieusement un
   * instantané hors contrat — toutes ces parties disparaîtraient.
   */
  repository: repositorySlugSchema.optional(),
  groupIndex: z.number().int().min(0),
  gameIndex: z.number().int().min(0),
  submissions: z.array(submissionSchema),
})

export type Submission = z.infer<typeof submissionSchema>
export type SessionSnapshot = z.infer<typeof sessionSnapshotSchema>
