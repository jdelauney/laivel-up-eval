import { z } from 'zod'

/**
 * Ce qu'un auteur de parcours écrit pour ce jeu : la consigne, le titre du
 * prompt affiché, et les segments qui le composent. Aucun seuil ici : le
 * seuil de chaque critère est porté par la règle du parcours, jamais par
 * cette configuration — déplacer un seuil ne touche jamais ce fichier.
 *
 * `reading` — la seconde lecture d'un segment ambigu — n'est montrée qu'à
 * la révélation. Le refus au chargement en fait un champ **présent
 * uniquement sur un segment ambigu** : sa seule présence sur un segment
 * clair serait une fuite si l'écran la lisait par erreur avant l'heure,
 * exactement le raisonnement qui porte `marker` dans `practice-map`.
 */

const segmentSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  ambiguous: z.boolean(),
  // Présent uniquement sur un segment ambigu — refus porté plus bas.
  reading: z.string().min(1).optional(),
})

/**
 * Au moins trois segments ambigus : en dessous, un seul faux positif
 * suffirait à faire basculer `netHits` au négatif, et le critère ne
 * mesurerait plus la lecture que le hasard d'un seul coup.
 */
const MIN_AMBIGUOUS_SEGMENTS = 3
/** Au moins six segments au total : la marge minimale pour lire un prompt réaliste, ni un extrait, ni une liste de puces. */
const MIN_TOTAL_SEGMENTS = 6

const baseConfigSchema = z.object({
  statement: z.string().min(1),
  promptTitle: z.string().min(1),
  segments: z.array(segmentSchema).min(MIN_TOTAL_SEGMENTS),
})

/**
 * Refus au chargement, chacun fermant une fuite mécanique plutôt que de
 * compter sur une relecture du corpus :
 * - identifiants uniques : deux segments de même `id` s'écraseraient
 *   silencieusement à la lecture de la trace ;
 * - `reading` obligatoire sur un segment ambigu — sans elle la révélation
 *   n'a rien à montrer — et **interdit** sur un segment clair ;
 * - **au moins trois segments ambigus et au moins autant de segments clairs
 *   que d'ambigus** (`clearCount >= ambiguousCount`). Combiné à la règle
 *   `ambiguity-net-share-at-least` (`netHits / ambiguousCount`), c'est ce
 *   refus qui rend « tout surligner » mécaniquement perdant : signaler les
 *   `clearCount` segments clairs en plus des `ambiguousCount` ambigus rend
 *   `netHits = ambiguousCount - clearCount <= 0`, donc une part nette
 *   jamais positive, quel que soit le seuil retenu par le parcours.
 */
export const ambiguityScanConfigSchema = baseConfigSchema.superRefine(
  (config, context) => {
    config.segments.forEach((segment, index) => {
      const firstIndex = config.segments.findIndex(
        (candidate) => candidate.id === segment.id,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['segments', index, 'id'],
        message: `le segment « ${segment.id} » est déclaré plusieurs fois`,
      })
    })

    config.segments.forEach((segment, index) => {
      if (segment.ambiguous && segment.reading === undefined) {
        context.addIssue({
          code: 'custom',
          path: ['segments', index, 'reading'],
          message: `le segment ambigu « ${segment.id} » n'a pas de seconde lecture`,
        })
      }
      if (!segment.ambiguous && segment.reading !== undefined) {
        context.addIssue({
          code: 'custom',
          path: ['segments', index, 'reading'],
          message: `le segment clair « ${segment.id} » porte une seconde lecture, réservée aux segments ambigus`,
        })
      }
    })

    const ambiguousCount = config.segments.filter(
      (segment) => segment.ambiguous,
    ).length
    const clearCount = config.segments.length - ambiguousCount

    if (ambiguousCount < MIN_AMBIGUOUS_SEGMENTS) {
      context.addIssue({
        code: 'custom',
        path: ['segments'],
        message: `${ambiguousCount} segment(s) ambigu(s) déclaré(s), au moins ${MIN_AMBIGUOUS_SEGMENTS} requis`,
      })
    }

    if (clearCount < ambiguousCount) {
      context.addIssue({
        code: 'custom',
        path: ['segments'],
        message: `${clearCount} segment(s) clair(s) pour ${ambiguousCount} ambigu(s) : au moins autant de clairs que d'ambigus est requis`,
      })
    }
  },
)

export type Segment = z.infer<typeof segmentSchema>
export type AmbiguityScanConfig = z.infer<typeof ambiguityScanConfigSchema>
