import { z } from 'zod'

/**
 * Ce qu'un auteur de parcours écrit pour ce jeu, et rien de plus : la
 * consigne affichée au joueur, l'échelle discrète des mises et sa valeur
 * neutre, le capital de départ, et le corpus d'extraits à juger.
 *
 * Le corpus et le barème vivent ici plutôt que dans le code : aucun test ne
 * peut dire si un corpus rend la partie triviale — seul jouer, en éditant le
 * JSON, le dit.
 */

export const snippetNatureSchema = z.enum(['sound', 'flawed', 'undecidable'])

export const snippetSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  language: z.string().min(1),
  code: z.string().min(1),
  nature: snippetNatureSchema,
  reveal: z.string().min(1),
})

const baseConfigSchema = z.object({
  // Même nom que les autres jeux : deux jeux ne nomment pas différemment la
  // même chose.
  statement: z.string().min(1),
  stakes: z.array(z.number()).min(3),
  neutralStake: z.number(),
  startingCapital: z.number(),
  snippets: z.array(snippetSchema).min(3),
})

const ALL_NATURES = snippetNatureSchema.options

/**
 * Quatre refus au chargement, plutôt qu'au verdict :
 * - deux extraits de même identifiant s'écraseraient silencieusement au
 *   rejeu ;
 * - une échelle qui ne contient pas la mise neutre interdit au joueur
 *   d'exprimer le doute ;
 * - une échelle qui n'est pas symétrique autour de la mise neutre rendrait la
 *   mise haute et la mise basse inégalement payantes ;
 * - le dernier refus est le plus important : un corpus sans l'une des trois
 *   natures rend un critère satisfait par vacuité, et le jeu noterait sans
 *   rien mesurer.
 */
export const confidenceBetConfigSchema = baseConfigSchema.superRefine(
  (config, context) => {
    config.snippets.forEach((snippet, index) => {
      const firstIndex = config.snippets.findIndex(
        (candidate) => candidate.id === snippet.id,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['snippets', index, 'id'],
        message: `l'extrait « ${snippet.id} » est déclaré plusieurs fois`,
      })
    })

    if (!config.stakes.includes(config.neutralStake)) {
      context.addIssue({
        code: 'custom',
        path: ['neutralStake'],
        message: "la mise neutre n'appartient pas à l'échelle déclarée",
      })
    }

    const declaredStakes = new Set(config.stakes)
    config.stakes.forEach((stake, index) => {
      const mirror = 2 * config.neutralStake - stake
      if (declaredStakes.has(mirror)) return

      context.addIssue({
        code: 'custom',
        path: ['stakes', index],
        message: `la mise « ${stake} » n'a pas de miroir autour de la mise neutre`,
      })
    })

    ALL_NATURES.forEach((nature) => {
      if (config.snippets.some((snippet) => snippet.nature === nature)) return

      context.addIssue({
        code: 'custom',
        path: ['snippets'],
        message: `le corpus ne porte aucun extrait « ${nature} »`,
      })
    })
  },
)

export type SnippetNature = z.infer<typeof snippetNatureSchema>
export type Snippet = z.infer<typeof snippetSchema>
export type ConfidenceBetConfig = z.infer<typeof confidenceBetConfigSchema>
