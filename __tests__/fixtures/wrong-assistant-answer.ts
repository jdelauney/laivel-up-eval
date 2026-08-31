import { buildWrongAssistantAnswer } from '@/games/wrong-assistant/actions/build-wrong-assistant-answer.action'
import {
  type WrongAssistantConfig,
  wrongAssistantConfigSchema,
} from '@/games/wrong-assistant/schema/config.schema'

/**
 * Une trace `wrong-assistant` conforme, minimale : la première réponse
 * disponible à chaque nœud, jusqu'à une réponse sans `nextId`. Sert aux
 * parcours qui traversent tout le référentiel sans mesurer `resilience` —
 * `checkpoints-run`, `hint-budget-run`, `practice-map-run`,
 * `three-tracks-run` — où seule une réponse valide importe, jamais une
 * bonne réponse. Sur le modèle de `defaultLieDetectorAnswer`.
 */
export const defaultWrongAssistantAnswer = (config: unknown): unknown => {
  const parsed: WrongAssistantConfig = wrongAssistantConfigSchema.parse(config)
  const nodesById = new Map(parsed.nodes.map((node) => [node.id, node]))

  const steps: { nodeId: string; replyId: string }[] = []
  let currentNodeId: string | undefined = parsed.rootId

  while (currentNodeId !== undefined) {
    const node = nodesById.get(currentNodeId)
    if (node === undefined) break

    const reply = node.replies[0]
    steps.push({ nodeId: node.id, replyId: reply.id })
    currentNodeId = reply.nextId
  }

  return buildWrongAssistantAnswer(parsed, steps)
}
