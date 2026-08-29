import { z } from 'zod'
import { repositoryInputSchema } from '@/core/contracts/repository-slug.schema'

/**
 * Le pseudo et le dépôt, et rien d'autre. Aucune clé API ici : l'assistant IA
 * est hors périmètre du socle. Ces informations sont déclaratives, elles
 * n'entrent dans aucun calcul de score.
 *
 * La forme du dépôt n'est pas redéclarée ici : elle vient du contrat du
 * domaine, qui est aussi celui de l'instantané persisté. Une seconde
 * définition dériverait de la première au premier ajustement.
 *
 * Attention à l'asymétrie du champ dépôt : **l'entrée** est ce que le joueur
 * tape, **la sortie** est le slug normalisé ou `undefined`. TanStack Form ne
 * passe que l'entrée à sa soumission ; c'est à l'écran de repasser la valeur
 * dans ce schéma pour obtenir le slug.
 *
 * Les messages sont lus par le joueur, ils restent en français.
 */
export const onboardingFormSchema = z.object({
  playerName: z
    .string()
    .trim()
    .min(2, 'Le pseudo doit faire au moins 2 caractères')
    .max(40, 'Le pseudo ne peut pas dépasser 40 caractères'),
  repository: repositoryInputSchema,
})

export type OnboardingForm = z.infer<typeof onboardingFormSchema>
export type OnboardingFormInput = z.input<typeof onboardingFormSchema>
