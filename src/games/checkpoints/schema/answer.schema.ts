import { z } from 'zod'
import { choiceSchema, type Stage } from './config.schema'

/**
 * La trace du déroulé est la réponse. Le contrat de plugin n'expose qu'une
 * soumission par jeu : un jeu à état garde donc sa partie chez lui et rend
 * l'historique de ses gestes, que l'évaluateur rejoue.
 *
 * Le coût porté par une décision est celui du choix du joueur, jamais les
 * surcoûts des défauts qui éclatent : le journal de l'écran et cette trace
 * disent la même chose.
 */

export const decisionSchema = z.object({
  stageId: z.string().min(1),
  choice: choiceSchema,
  cost: z.number().min(0),
})

export const checkpointsAnswerSchema = z.object({
  decisions: z.array(decisionSchema).min(1),
  remainingBudget: z.number(),
  remainingDefects: z.array(z.string().min(1)),
})

export type Decision = z.infer<typeof decisionSchema>
export type CheckpointsAnswer = z.infer<typeof checkpointsAnswerSchema>

export class IncompleteTraceError extends Error {
  readonly missingStageId: string

  constructor(missingStageId: string) {
    super(
      `la trace du jeu checkpoints ne tranche pas l'étape « ${missingStageId} »`,
    )
    this.name = 'IncompleteTraceError'
    this.missingStageId = missingStageId
  }
}

/**
 * Le schéma seul ne sait pas combien d'étapes la partie comptait : la
 * complétude se vérifie contre la configuration, une étape à la fois et dans
 * l'ordre déclaré. Une trace à trous rendrait des critères manqués par défaut,
 * ce qui noterait un bug comme s'il était une pratique.
 */
export const parseCheckpointsTrace = (
  answer: unknown,
  stages: readonly Stage[],
): CheckpointsAnswer => {
  const trace = checkpointsAnswerSchema.parse(answer)

  stages.forEach((stage, index) => {
    if (trace.decisions[index]?.stageId === stage.id) return
    throw new IncompleteTraceError(stage.id)
  })

  return trace
}
