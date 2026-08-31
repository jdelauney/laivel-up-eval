import { z } from 'zod'
import type { WrongAssistantConfig } from './config.schema'

/**
 * La suite des pas est la réponse : par pas, le nœud où le joueur se
 * trouvait et la réponse qu'il y a choisie — rien de plus. Aucun champ
 * dérivé n'entre dans la trace : ce qui est jugé se recalcule depuis l'arbre
 * dans `read-exchange.helper.ts`, sur le modèle de `lie-detector`.
 */

const stepSchema = z.object({
  nodeId: z.string().min(1),
  replyId: z.string().min(1),
})

export const wrongAssistantAnswerSchema = z.object({
  steps: z.array(stepSchema).min(1),
})

export type Step = z.infer<typeof stepSchema>
export type WrongAssistantAnswer = z.infer<typeof wrongAssistantAnswerSchema>

/** Un pas vise un nœud absent de la configuration. */
export class UnknownNodeError extends Error {
  readonly nodeId: string

  constructor(nodeId: string) {
    super(`un pas vise le nœud « ${nodeId} », absent de la configuration`)
    this.name = 'UnknownNodeError'
    this.nodeId = nodeId
  }
}

/** Un pas vise une réponse absente du nœud qu'il désigne. */
export class UnknownReplyError extends Error {
  readonly replyId: string
  readonly nodeId: string

  constructor(replyId: string, nodeId: string) {
    super(
      `un pas vise la réponse « ${replyId} », absente du nœud « ${nodeId} »`,
    )
    this.name = 'UnknownReplyError'
    this.replyId = replyId
    this.nodeId = nodeId
  }
}

/** Le premier pas de la trace ne part pas de `rootId`. */
export class WrongRootError extends Error {
  constructor(nodeId: string, rootId: string) {
    super(
      `la trace démarre au nœud « ${nodeId} », attendu à la racine « ${rootId} »`,
    )
    this.name = 'WrongRootError'
  }
}

/** Un pas ne suit pas le `nextId` de la réponse choisie au pas précédent. */
export class BrokenChainError extends Error {
  constructor(previousNodeId: string, previousReplyId: string, nodeId: string) {
    super(
      `le pas au nœud « ${nodeId} » ne suit pas la réponse « ${previousReplyId} » du nœud « ${previousNodeId} »`,
    )
    this.name = 'BrokenChainError'
  }
}

/**
 * Le schéma seul ignore la forme de l'arbre : chaque pas se vérifie contre
 * la configuration, après le refus de forme porté par le schéma.
 *
 * Quatre refus, dans l'ordre : un nœud inconnu, une réponse qui n'appartient
 * pas à son nœud, un premier pas hors de `rootId`, un chaînage rompu — chaque
 * pas doit suivre le `nextId` du pas précédent, jamais un autre nœud.
 */
export const parseWrongAssistantTrace = (
  answer: unknown,
  config: WrongAssistantConfig,
): WrongAssistantAnswer => {
  const trace = wrongAssistantAnswerSchema.parse(answer)
  const nodesById = new Map(config.nodes.map((node) => [node.id, node]))

  trace.steps.forEach((step, index) => {
    const node = nodesById.get(step.nodeId)
    if (node === undefined) throw new UnknownNodeError(step.nodeId)

    const reply = node.replies.find(
      (candidate) => candidate.id === step.replyId,
    )
    if (reply === undefined)
      throw new UnknownReplyError(step.replyId, step.nodeId)

    if (index === 0) {
      if (step.nodeId !== config.rootId) {
        throw new WrongRootError(step.nodeId, config.rootId)
      }
      return
    }

    const previous = trace.steps[index - 1]
    // Le pas précédent a déjà été validé à l'itération précédente : son nœud
    // et sa réponse existent forcément.
    const previousNode = nodesById.get(previous.nodeId)
    const previousReply = previousNode?.replies.find(
      (candidate) => candidate.id === previous.replyId,
    )

    if (previousReply?.nextId !== step.nodeId) {
      throw new BrokenChainError(previous.nodeId, previous.replyId, step.nodeId)
    }
  })

  return trace
}
