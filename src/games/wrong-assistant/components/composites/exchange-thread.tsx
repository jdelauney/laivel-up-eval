import { useEffect, useRef } from 'react'
import type {
  PlayedTurn,
  ReplyView,
} from '../../hooks/use-wrong-assistant.hook'
import { AssistantTurn } from '../elements/assistant-turn'
import { ReplyChoice } from '../elements/reply-choice'

/**
 * Le fil de conversation, et lui seul : les tours déjà joués défilent dans
 * une zone bornée en hauteur, le tour courant s'y ajoute en bas, les
 * réponses possibles vivent dans un pied fixe **hors** de cette zone.
 *
 * Réponse propre à ce jeu à la règle commune de `DESIGN.md`, « La surface
 * d'un jeu » — « Un relevé qui s'allonge ne pousse jamais la décision
 * courante hors de l'écran » — mais une réponse différente de celle de
 * `checkpoints` : le journal de `CheckpointsGame` **replie** ses entrées les
 * plus anciennes derrière une ligne de compte, parce qu'il ne porte que des
 * coûts déjà lisibles ailleurs (la ligne de budget). Ici, le fil EST la
 * matière du jeu — le joueur doit pouvoir relire ce qu'un tour disait trois
 * échanges plus tôt pour juger le tour courant — donc rien ne se replie ni
 * ne disparaît : la zone défile, elle ne tronque jamais son contenu, et
 * c'est le pied des réponses qui reste fixe pour ne jamais suivre le fil
 * vers le bas.
 *
 * Un nouveau tour s'annonce en `aria-live="polite"` et déplace le focus sur
 * sa première réponse, sur le modèle du focus déplacé de `PracticePlane`.
 * Les boutons de réponse sont **remontés** à chaque tour (`key` par
 * identifiant de réponse, propre à chaque nœud) : `autoFocus` s'exécute donc
 * à chaque nouveau tour, pas seulement au montage de l'écran.
 */
export const ExchangeThread = ({
  turns,
  currentMessage,
  currentReplies,
  onReply,
}: {
  turns: readonly PlayedTurn[]
  currentMessage?: string
  currentReplies?: readonly ReplyView[]
  onReply: (replyId: string) => void
}) => {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Un pas ne revient jamais sur un nœud déjà traversé (fil irréversible,
  // arbre acyclique) : `nodeId` reste une clé stable et unique pour chaque
  // tour joué, jamais un index de position.
  //
  // Redéfilé à chaque tour, joué ou courant : c'est ce qui garde le dernier
  // message dans la zone visible du fil sans jamais toucher au pied fixe des
  // réponses, posé hors de cette zone.
  useEffect(() => {
    if (turns.length === 0 && currentMessage === undefined) return
    // `scrollIntoView` est absent de jsdom (`vitest.setup.ts` ne le comble
    // pas globalement) : la garde évite un crash en test sans rien retirer
    // au navigateur réel, où la méthode existe toujours.
    bottomRef.current?.scrollIntoView?.({ block: 'end' })
  }, [turns.length, currentMessage])

  return (
    <section className="flex flex-col border border-plane-rule bg-plane">
      <div
        aria-live="polite"
        className="flex max-h-[13vh] flex-col gap-3 overflow-y-auto p-3 sm:max-h-[28vh] sm:p-4"
      >
        {turns.map((turn) => (
          <AssistantTurn
            key={turn.nodeId}
            message={turn.assistantMessage}
            replyText={turn.chosenReplyText}
          />
        ))}
        {currentMessage === undefined ? null : (
          <AssistantTurn message={currentMessage} />
        )}
        <div ref={bottomRef} />
      </div>

      {currentReplies === undefined ? null : (
        <fieldset className="flex flex-col gap-1.5 border-plane-rule border-t p-3 sm:p-4">
          <legend className="sr-only">Votre réponse</legend>
          {currentReplies.map((reply, index) => (
            <ReplyChoice
              key={reply.id}
              text={reply.text}
              autoFocus={index === 0}
              onSelect={() => onReply(reply.id)}
            />
          ))}
        </fieldset>
      )}
    </section>
  )
}
