import { z } from 'zod'
import { snippetLines } from '../helpers/snippet-lines.helper'

/**
 * Ce qu'un auteur de parcours écrit pour ce jeu, et rien de plus : la
 * consigne affichée au joueur, l'extrait à revoir, le temps imparti, et le
 * corpus des défauts qu'il porte.
 *
 * Le nombre de défauts n'est **jamais annoncé au joueur** : il n'a aucune
 * règle d'arrêt et décide lui-même quand sa revue est finie. Ce nombre ne se
 * lit qu'après le rendu, et il se DÉRIVE alors de `defects.length` — ce n'est
 * jamais un champ à part, un champ séparé pourrait mentir sur ce que le
 * corpus porte réellement.
 */

export const defectKindSchema = z.enum([
  'security',
  'logic',
  'hallucinated-dependency',
  'contract',
  'resource',
])

export const defectSchema = z.object({
  id: z.string().min(1),
  // 1-indexé sur `snippet.code` découpé aux sauts de ligne par `snippetLines`.
  line: z.number().int().min(1),
  kind: defectKindSchema,
  // La phrase montrée après le rendu, jamais avant : c'est la révélation.
  reveal: z.string().min(1),
})

export const snippetSchema = z.object({
  label: z.string().min(1),
  language: z.string().min(1),
  code: z.string().min(1),
})

const baseConfigSchema = z.object({
  // Même nom que les autres jeux : deux jeux ne nomment pas différemment la
  // même chose.
  statement: z.string().min(1),
  snippet: snippetSchema,
  timeLimitSeconds: z.number().int().positive(),
  // Trois défauts au moins : les trois natures exigées ne peuvent pas tenir
  // dans moins.
  defects: z.array(defectSchema).min(3),
})

const REQUIRED_KINDS = ['security', 'logic', 'hallucinated-dependency'] as const

/**
 * Cinq refus au chargement, plutôt qu'au verdict :
 * - deux défauts de même `id` s'écraseraient silencieusement à la lecture ;
 * - deux défauts sur la même ligne rendraient une seule marque valable pour
 *   deux trouvailles, et le ratio cesserait de décrire ce que le joueur a vu ;
 * - une `line` au-delà du nombre de lignes de l'extrait rendrait le défaut
 *   introuvable ;
 * - une `line` qui tombe sur une ligne vide ou blanche rendrait le défaut
 *   indevinable, rien n'y étant lisible ;
 * - le dernier refus est le plus important : sans lui, le critère de la
 *   dépendance hallucinée porterait sur un ensemble vide, ressortirait
 *   satisfait par vacuité, et le jeu noterait sans mesurer.
 *
 * Les deux refus de ligne passent par `snippetLines`, jamais par un `split`
 * refait sur place : schéma, écran et tests comptent les lignes de la même
 * façon.
 */
export const defectHuntConfigSchema = baseConfigSchema.superRefine(
  (config, context) => {
    const lines = snippetLines(config.snippet.code)

    config.defects.forEach((defect, index) => {
      const firstIndex = config.defects.findIndex(
        (candidate) => candidate.id === defect.id,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['defects', index, 'id'],
        message: `le défaut « ${defect.id} » est déclaré plusieurs fois`,
      })
    })

    config.defects.forEach((defect, index) => {
      const firstIndex = config.defects.findIndex(
        (candidate) => candidate.line === defect.line,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['defects', index, 'line'],
        message: `la ligne ${defect.line} porte déjà un autre défaut`,
      })
    })

    config.defects.forEach((defect, index) => {
      if (defect.line <= lines.length) return

      context.addIssue({
        code: 'custom',
        path: ['defects', index, 'line'],
        message: `la ligne ${defect.line} dépasse les ${lines.length} ligne(s) de l'extrait`,
      })
    })

    config.defects.forEach((defect, index) => {
      if (defect.line > lines.length) return
      const content = lines[defect.line - 1]
      if (content !== undefined && content.trim().length > 0) return

      context.addIssue({
        code: 'custom',
        path: ['defects', index, 'line'],
        message: `la ligne ${defect.line} est vide, aucun défaut n'y est lisible`,
      })
    })

    REQUIRED_KINDS.forEach((kind) => {
      if (config.defects.some((defect) => defect.kind === kind)) return

      context.addIssue({
        code: 'custom',
        path: ['defects'],
        message: `le corpus ne porte aucun défaut « ${kind} »`,
      })
    })
  },
)

export type DefectKind = z.infer<typeof defectKindSchema>
export type Defect = z.infer<typeof defectSchema>
export type DefectHuntConfig = z.infer<typeof defectHuntConfigSchema>
