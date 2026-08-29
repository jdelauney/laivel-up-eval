import { z } from 'zod'

/**
 * Ce qu'un auteur de parcours écrit pour ce jeu, et rien de plus : la
 * consigne affichée au joueur, le nombre de tours, le budget d'attention
 * disponible à chaque tour, le plafond posable sur un seul chantier, les
 * seuils de dérive et de mort, et la liste des chantiers ouverts au départ.
 *
 * Les seuils, le budget d'attention et le travail de chaque chantier vivent ici
 * plutôt que dans le code : aucun test ne peut dire si un barème rend la partie
 * triviale ou impossible, donc le régler doit se faire en jouant, sans toucher
 * une ligne de TypeScript.
 *
 * La consigne énonce le cadre du jeu — tours, unités par tour, plafond par
 * chantier, sort d'un chantier délaissé — jamais ce qui est noté : ni les
 * seuils de dérive et de mort, ni le fait que les merges, la médiane ou
 * l'abandon comptent. `DESIGN.md`, « Un jeu ne dit jamais ce qu'il note. »
 */

export const trackSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  brief: z.string().min(1),
  work: z.number().positive(),
})

const baseConfigSchema = z.object({
  // Même nom que `test-bench` : deux jeux ne nomment pas différemment la même
  // chose. Requis, pour qu'un jeu ne puisse plus se publier muet une seconde
  // fois — c'est le défaut qui a motivé ce champ.
  statement: z.string().min(1),
  turns: z.number().int().positive(),
  attentionPerTurn: z.number().positive(),
  maxPerTrack: z.number().positive(),
  driftAfter: z.number().int().positive(),
  diesAfter: z.number().int().positive(),
  tracks: z.array(trackSchema).min(2),
})

/**
 * Trois refus au chargement, plutôt qu'au verdict :
 * - deux chantiers de même identifiant s'écraseraient silencieusement au rejeu ;
 * - un plafond par chantier supérieur à l'attention disponible ne pourrait
 *   jamais être atteint, ce qui rendrait le réglage muet ;
 * - une mort qui ne suit pas la dérive est le refus qui compte le plus : sans
 *   lui, la dérive ne serait jamais visible avant la mort, et la story tombe
 *   sans qu'aucun test ne le voie.
 */
export const threeTracksConfigSchema = baseConfigSchema.superRefine(
  (config, context) => {
    config.tracks.forEach((track, index) => {
      const firstIndex = config.tracks.findIndex(
        (candidate) => candidate.id === track.id,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['tracks', index, 'id'],
        message: `le chantier « ${track.id} » est déclaré plusieurs fois`,
      })
    })

    if (config.maxPerTrack > config.attentionPerTurn) {
      context.addIssue({
        code: 'custom',
        path: ['maxPerTrack'],
        message:
          "le plafond par chantier dépasse l'attention disponible à chaque tour",
      })
    }

    if (config.diesAfter <= config.driftAfter) {
      context.addIssue({
        code: 'custom',
        path: ['diesAfter'],
        message:
          'le seuil de mort doit être strictement supérieur au seuil de dérive, sinon la dérive ne se voit jamais',
      })
    }
  },
)

export type Track = z.infer<typeof trackSchema>
export type ThreeTracksConfig = z.infer<typeof threeTracksConfigSchema>
