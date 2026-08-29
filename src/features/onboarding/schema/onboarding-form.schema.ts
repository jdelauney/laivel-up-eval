import { z } from 'zod'

/**
 * Le pseudo, et rien d'autre. Aucune clé API ici : l'assistant IA est hors
 * périmètre du socle. Ces informations sont déclaratives, elles n'entrent
 * dans aucun calcul de score.
 *
 * Les messages sont lus par le joueur, ils restent en français.
 */
export const onboardingFormSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(2, 'Le pseudo doit faire au moins 2 caractères')
    .max(40, 'Le pseudo ne peut pas dépasser 40 caractères'),
})

export type OnboardingForm = z.infer<typeof onboardingFormSchema>
