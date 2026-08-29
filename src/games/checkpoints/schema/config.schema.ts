import { z } from 'zod'

/**
 * Ce qu'un auteur de parcours écrit pour ce jeu, et rien de plus : six étapes
 * ordonnées, la sortie de l'IA à trancher pour chacune, le prix des trois
 * réponses possibles, et le budget de départ.
 *
 * Les coûts, le budget et les facteurs vivent ici plutôt que dans le code :
 * aucun test ne peut dire si un barème rend le jeu trivial ou arbitraire, donc
 * le régler doit se faire en jouant, sans toucher une ligne de TypeScript.
 */

export const CHOICES = ['laisser-passer', 'corriger', 're-cadrer'] as const

export const choiceSchema = z.enum(CHOICES)

/**
 * Un défaut n'est pas un piège aléatoire : il est déclaré sur l'étape qui le
 * sème, il éclate à une étape nommée, et son surcoût est le prix de sa
 * correction à la source multiplié par son facteur. Deux parties aux mêmes
 * choix rendent donc exactement le même verdict.
 */
export const defectSchema = z.object({
  id: z.string().min(1),
  burstsAt: z.string().min(1),
  factor: z.number().min(1),
})

export const stageOutputSchema = z.object({
  prose: z.string().min(1),
  code: z.string().min(1).optional(),
})

export const stageCostsSchema = z.object({
  'laisser-passer': z.number().min(0),
  corriger: z.number().min(0),
  're-cadrer': z.number().min(0),
})

export const stageSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  output: stageOutputSchema,
  costs: stageCostsSchema,
  defect: defectSchema.optional(),
})

const baseConfigSchema = z.object({
  budget: z.number(),
  stages: z.array(stageSchema).min(1),
})

/**
 * Un défaut qui éclaterait à une étape inconnue, ou déjà franchie quand il est
 * semé, ne coûterait jamais rien : la partie se jouerait sans que personne ne
 * s'en aperçoive. On refuse au chargement plutôt qu'au verdict.
 */
export const checkpointsConfigSchema = baseConfigSchema.superRefine(
  (config, context) => {
    config.stages.forEach((stage, index) => {
      if (stage.defect === undefined) return

      const burstIndex = config.stages.findIndex(
        (candidate) => candidate.id === stage.defect?.burstsAt,
      )
      if (burstIndex > index) return

      context.addIssue({
        code: 'custom',
        path: ['stages', index, 'defect', 'burstsAt'],
        message:
          burstIndex === -1
            ? `l'étape « ${stage.defect.burstsAt} » où le défaut éclate n'existe pas`
            : `le défaut de l'étape « ${stage.id} » éclaterait avant d'avoir été semé`,
      })
    })
  },
)

export type Choice = z.infer<typeof choiceSchema>
export type Defect = z.infer<typeof defectSchema>
export type Stage = z.infer<typeof stageSchema>
export type CheckpointsConfig = z.infer<typeof checkpointsConfigSchema>
