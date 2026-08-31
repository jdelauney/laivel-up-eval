import { useMemo, useRef, useState } from 'react'
import { buildWrongAssistantAnswer } from '../actions/build-wrong-assistant-answer.action'
import type { Step } from '../schema/answer.schema'
import { wrongAssistantConfigSchema } from '../schema/config.schema'

/** Les deux temps du fil : la conversation en cours, la révélation une fois le scénario clos. */
export type WrongAssistantPhase = 'talking' | 'revealed'

/** Une réponse possible telle que l'écran la lit : jamais sa `stance`, sur laquelle rien ne se classe. */
export type ReplyView = { id: string; text: string }

/** Un tour déjà joué : ce que l'assistant a dit, et ce que le joueur a répondu. */
export type PlayedTurn = {
  nodeId: string
  assistantMessage: string
  chosenReplyText: string
}

/** Un tour défectueux, une fois la révélation atteinte : ce qui clochait, jamais si le joueur l'avait repéré. */
export type FlawRevelation = { nodeId: string; message: string; flaw: string }

/**
 * Le cycle de vie React d'un fil de dialogue, et rien d'autre : ce qui est
 * jugé se recalcule depuis l'arbre dans `read-exchange.helper.ts`, partagé
 * avec l'évaluateur, jamais recalculé ici.
 *
 * Le verrou d'un pas tient par l'**absence de chemin**, jamais par une garde
 * décorative : `reply` avance le fil d'un nœud vers le suivant que désigne
 * `nextId` de la réponse choisie ; quand cette réponse n'en porte aucun, le
 * scénario se clôt sur la révélation. La trace part au même geste — `reply`
 * appelle `onLock` avant de basculer sur `'revealed'`, jamais après : un
 * rechargement pendant la lecture de la révélation retrouve le jeu déjà
 * soumis, jamais rejouable dans son état d'avant.
 * `aidd_docs/backlog/defects/la-revelation-precede-le-verrou-donc-un-rechargement-la-rejoue.md`.
 * `advance()` ne fait plus que passer au jeu suivant, une fois la révélation
 * lue. Deux `useRef` d'appel unique protègent chacun des deux gestes contre
 * un double appel.
 *
 * Le hook n'expose **jamais** `flawed`, `flaw`, `consequence` ni `stance`
 * avant l'heure : `currentTurn` ne porte que le texte du tour et de ses
 * réponses, `revelations` ne se construit qu'en phase `'revealed'`, et ne
 * porte que les tours défectueux **rencontrés sur ce fil** — deux joueurs
 * empruntant des branches différentes ne voient jamais la même révélation.
 */
export const useWrongAssistant = (
  config: unknown,
  onLock: (answer: unknown) => void,
  onAdvance: () => void,
) => {
  // La config ne change pas en cours de partie : la valider à chaque rendu
  // était du travail jeté.
  const parsed = useMemo(
    () => wrongAssistantConfigSchema.parse(config),
    [config],
  )
  const nodesById = useMemo(
    () => new Map(parsed.nodes.map((node) => [node.id, node])),
    [parsed],
  )

  const [currentNodeId, setCurrentNodeId] = useState(parsed.rootId)
  const [steps, setSteps] = useState<readonly Step[]>([])
  const [phase, setPhase] = useState<WrongAssistantPhase>('talking')
  const lockedRef = useRef(false)
  const advancedRef = useRef(false)

  const currentNode =
    phase === 'talking' ? nodesById.get(currentNodeId) : undefined

  /**
   * Pose la réponse choisie sur le nœud courant, avance vers `nextId` s'il
   * existe, clôt et soumet sinon. Ne fait plus rien une fois `'revealed'` —
   * un choix est irréversible, le fil ne revient jamais en arrière.
   */
  const reply = (replyId: string): void => {
    if (currentNode === undefined) return
    const chosen = currentNode.replies.find(
      (candidate) => candidate.id === replyId,
    )
    if (chosen === undefined) return

    const finishedStep: Step = { nodeId: currentNode.id, replyId: chosen.id }
    const nextSteps = [...steps, finishedStep]
    setSteps(nextSteps)

    if (chosen.nextId === undefined) {
      if (!lockedRef.current) {
        lockedRef.current = true
        onLock(buildWrongAssistantAnswer(parsed, nextSteps))
      }
      setPhase('revealed')
      return
    }

    setCurrentNodeId(chosen.nextId)
  }

  /** Passe au jeu suivant, une seule fois — le geste qui suit la lecture de la révélation. */
  const advance = (): void => {
    if (phase !== 'revealed') return
    if (advancedRef.current) return
    advancedRef.current = true

    onAdvance()
  }

  // Le fil déjà joué, dans l'ordre où il s'est déroulé — jamais le prochain
  // tour avant qu'il soit atteint.
  const thread: readonly PlayedTurn[] = steps.map((step) => {
    // Chaque pas provient d'un nœud et d'une réponse validés à la pose :
    // les deux `find`/`get` rendent donc toujours une valeur ici.
    const node = nodesById.get(step.nodeId)
    const chosenReply = node?.replies.find(
      (candidate) => candidate.id === step.replyId,
    )
    return {
      nodeId: step.nodeId,
      assistantMessage: node?.message ?? '',
      chosenReplyText: chosenReply?.text ?? '',
    }
  })

  const currentReplies: readonly ReplyView[] | undefined =
    currentNode === undefined
      ? undefined
      : currentNode.replies.map((reply) => ({ id: reply.id, text: reply.text }))

  const revelations: readonly FlawRevelation[] | undefined =
    phase !== 'revealed'
      ? undefined
      : steps
          .filter((step) => nodesById.get(step.nodeId)?.flawed === true)
          .map((step) => {
            const node = nodesById.get(step.nodeId)
            // Garanti par `wrongAssistantConfigSchema` : un nœud défectueux
            // porte toujours un `flaw`.
            return {
              nodeId: step.nodeId,
              message: node?.message ?? '',
              flaw: node?.flaw ?? '',
            }
          })

  return {
    statement: parsed.statement,
    thread,
    currentMessage: currentNode?.message,
    currentReplies,
    phase,
    reply,
    advance,
    revelations,
  }
}
