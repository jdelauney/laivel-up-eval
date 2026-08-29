import { z } from 'zod'

/**
 * Le banc d'essai du contrat de plugin, pas un jeu du brief. Le minimum pour
 * qu'un critère ait prise : un énoncé, et des propositions dont on sait
 * lesquelles sont attendues.
 */

export const propositionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  expected: z.boolean(),
})

export const testBenchConfigSchema = z.object({
  statement: z.string().min(1),
  propositions: z.array(propositionSchema).min(1),
})

export type Proposition = z.infer<typeof propositionSchema>
export type TestBenchConfig = z.infer<typeof testBenchConfigSchema>
