import { z } from 'zod'

/** Les propositions retenues par le joueur, rien de plus. */
export const testBenchAnswerSchema = z.object({
  selected: z.array(z.string().min(1)),
})

export type TestBenchAnswer = z.infer<typeof testBenchAnswerSchema>
