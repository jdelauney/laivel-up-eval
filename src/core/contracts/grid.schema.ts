import { z } from 'zod'

/**
 * Le schéma n'est pas la grille : c'est le format d'accueil de n'importe quelle
 * grille. Les conditions sont exprimées en bornes min/max par dimension, ce qui
 * absorbe aussi bien des seuils simples qu'un profil croisé du type
 * « usage intense mais vérification faible ».
 */

/**
 * Une bande de l'échelle d'une dimension : le mot que la grille emploie pour
 * une plage de score. Un axe ordinal (S / M / L / XL, « aux étapes clés »,
 * « jamais ») se transpose en [0,1] pour être comparable aux seuils, mais le
 * joueur doit lire le verdict dans le vocabulaire de la grille, pas en
 * pourcentage. `from` est le score à partir duquel la bande s'applique.
 */
export const dimensionBandSchema = z.object({
  from: z.number().min(0).max(1),
  label: z.string().min(1),
  /** Le geste qui fait entrer dans cette bande. Donnée, jamais code. */
  action: z.string().min(1).optional(),
  /** Ce qui validerait ce geste : un artefact ou un compteur observable. */
  proof: z.string().min(1).optional(),
})

/**
 * Une échelle part de 0 et monte strictement : toute valeur de [0,1] tombe
 * alors dans exactement une bande, sans cas par défaut à inventer plus loin.
 */
export const dimensionScaleSchema = z
  .array(dimensionBandSchema)
  .min(2)
  .refine((bands) => bands[0].from === 0, {
    message: "L'échelle d'une dimension doit commencer à 0",
  })
  .refine(
    (bands) =>
      bands.every(
        (band, index) => index === 0 || band.from > bands[index - 1].from,
      ),
    {
      message: "Les bandes d'une échelle doivent être strictement croissantes",
    },
  )

export const dimensionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  weight: z.number().positive(),
  scale: dimensionScaleSchema.optional(),
})

export const levelConditionSchema = z
  .object({
    dimension: z.string().min(1),
    min: z.number().min(0).max(1).optional(),
    max: z.number().min(0).max(1).optional(),
  })
  .refine(
    (condition) => condition.min !== undefined || condition.max !== undefined,
    {
      message:
        'Une condition doit porter au moins une borne min ou une borne max',
    },
  )

export const levelSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  order: z.number().int().positive(),
  conditions: z.array(levelConditionSchema).min(1),
  nextLevelHint: z.string().min(1),
})

export const gridSchema = z.object({
  version: z.string().min(1),
  title: z.string().min(1),
  dimensions: z.array(dimensionSchema).min(1),
  levels: z.array(levelSchema).min(1),
})

export type DimensionBand = z.infer<typeof dimensionBandSchema>
export type Dimension = z.infer<typeof dimensionSchema>
export type LevelCondition = z.infer<typeof levelConditionSchema>
export type Level = z.infer<typeof levelSchema>
export type Grid = z.infer<typeof gridSchema>
