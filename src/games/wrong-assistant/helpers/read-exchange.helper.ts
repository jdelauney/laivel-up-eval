import type { WrongAssistantAnswer } from '../schema/answer.schema'
import type { ReplyStance, WrongAssistantConfig } from '../schema/config.schema'

/**
 * Une seule lecture de ce que vaut un fil joué, partagée par l'écran et par
 * le scoring : deux implémentations auraient divergé au premier ajustement
 * de règle, sur le modèle de `read-rounds.helper.ts` et `read-flags.helper.ts`.
 *
 * Aucune horloge, aucun aléa, aucun accès extérieur, et **aucun seuil de
 * critère** : les seuils sont déclarés dans le parcours et lus par les
 * règles de l'évaluateur, jamais ici.
 */

const CORRECTIVE_STANCES: ReadonlySet<ReplyStance> = new Set([
  'verify',
  'reformulate',
])

export type StepReading = {
  nodeId: string
  replyId: string
  stance: ReplyStance
  // Le nœud où ce pas a été joué portait une affirmation fausse.
  flawed: boolean
  // Le nœud est défectueux ET la réponse choisie n'est pas `accept` — le tour a été repéré.
  caught: boolean
  // La réponse choisie vérifie ou reformule.
  corrective: boolean
  // Le nœud où ce pas a été joué constate un dommage.
  consequence: boolean
}

export type Reading = {
  steps: readonly StepReading[]
  flawedNodesMet: number
  flawedNodesCaught: number
  // Vrai quand tous les nœuds défectueux rencontrés ont été repérés — vrai
  // aussi, vacuité assumée, quand aucun n'a été rencontré. C'est la règle
  // `flaws-caught-before-accepting` de l'évaluateur, pas cette lecture, qui
  // ferme ce cas dégénéré en exigeant `flawedNodesMet > 0`.
  allFlawsCaughtBeforeAccepting: boolean
  correctiveRepliesCount: number
  consequencesHit: number
}

export const readExchange = (
  config: WrongAssistantConfig,
  trace: WrongAssistantAnswer,
): Reading => {
  const nodesById = new Map(config.nodes.map((node) => [node.id, node]))

  const steps: readonly StepReading[] = trace.steps.map((step) => {
    // `parseWrongAssistantTrace` garantit que chaque pas vise un nœud et une
    // réponse existants : les deux `find`/`get` ci-dessous rendent donc
    // toujours une valeur.
    const node = nodesById.get(step.nodeId)
    if (node === undefined) {
      throw new Error(`le nœud « ${step.nodeId} » n'a pas de pas à lire`)
    }
    const reply = node.replies.find(
      (candidate) => candidate.id === step.replyId,
    )
    if (reply === undefined) {
      throw new Error(
        `la réponse « ${step.replyId} » du nœud « ${step.nodeId} » n'a pas de pas à lire`,
      )
    }

    return {
      nodeId: node.id,
      replyId: reply.id,
      stance: reply.stance,
      flawed: node.flawed,
      caught: node.flawed && reply.stance !== 'accept',
      corrective: CORRECTIVE_STANCES.has(reply.stance),
      consequence: node.consequence !== undefined,
    }
  })

  const flawedNodesMet = steps.filter((step) => step.flawed).length
  const flawedNodesCaught = steps.filter((step) => step.caught).length

  return {
    steps,
    flawedNodesMet,
    flawedNodesCaught,
    allFlawsCaughtBeforeAccepting: flawedNodesCaught === flawedNodesMet,
    correctiveRepliesCount: steps.filter((step) => step.corrective).length,
    consequencesHit: steps.filter((step) => step.consequence).length,
  }
}
