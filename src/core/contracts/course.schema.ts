import { z } from 'zod'

/**
 * Le parcours dit comment mesurer ce que la grille demande de mesurer.
 * La `config` d'un jeu et la `rule` d'un critère restent opaques au moteur :
 * le schéma du jeu concerné les valide, le moteur ne les interprète jamais.
 */

/**
 * `measured` : le jeu qui produit le critère lit un résultat sur l'axe visé.
 * `inferred` : il lit un jugement, ou vise un axe qui n'est pas le sujet de
 * son groupe — un même critère peut donc être l'un pour un axe et l'autre
 * pour un autre, d'où le champ porté par le mapping et non par le critère.
 */
export const mappingEvidenceSchema = z.enum(['measured', 'inferred'])

export const criterionMappingSchema = z.object({
  dimension: z.string().min(1),
  weight: z.number().positive(),
  evidence: mappingEvidenceSchema.default('measured'),
})

export const criterionRuleSchema = z
  .object({
    type: z.string().min(1),
  })
  .catchall(z.unknown())

export const criterionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  rule: criterionRuleSchema,
  mapping: z.array(criterionMappingSchema).min(1),
})

export const gameSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  label: z.string().min(1),
  config: z.record(z.string(), z.unknown()),
  criteria: z.array(criterionSchema).min(1),
})

export const groupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  order: z.number().int().positive(),
  games: z.array(gameSchema).min(1),
})

export const courseSchema = z.object({
  version: z.string().min(1),
  groups: z.array(groupSchema).min(1),
})

export type MappingEvidence = z.infer<typeof mappingEvidenceSchema>
export type CriterionMapping = z.infer<typeof criterionMappingSchema>
export type CriterionRule = z.infer<typeof criterionRuleSchema>
export type Criterion = z.infer<typeof criterionSchema>
export type Game = z.infer<typeof gameSchema>
export type Group = z.infer<typeof groupSchema>
export type Course = z.infer<typeof courseSchema>
