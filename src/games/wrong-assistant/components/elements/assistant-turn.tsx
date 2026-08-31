/**
 * Un tour du fil : ce que l'assistant a dit, et — une fois répondu — ce que
 * le joueur lui a répondu. Un seul traitement, qu'un `flaw` se cache
 * derrière ce tour ou non : cette vue ne reçoit jamais `flawed`, `flaw` ni
 * `consequence`, et ne peut donc pas les laisser fuiter par le cadre, le
 * ton ou une marque quelconque — `DESIGN.md`, « Un jeu ne dit jamais ce
 * qu'il note ».
 *
 * Les deux lignes portent la même conversation, jamais deux bulles
 * asymétriques façon messagerie : ce jeu n'est pas une messagerie, c'est un
 * relevé d'échange qu'on relit. Le joueur se distingue de l'assistant par un
 * retrait et son propre label, jamais par un liseré latéral — `DESIGN.md`
 * refuse `border-l-*` comme marque d'état, la même règle vaut ici pour ne
 * pas l'introduire pour un usage purement décoratif.
 */
export const AssistantTurn = ({
  message,
  replyText,
}: {
  message: string
  replyText?: string
}) => (
  <div className="flex flex-col gap-2">
    <div>
      <p className="font-medium text-[10px] text-plane-foreground/50 uppercase tracking-[0.14em]">
        L'assistant
      </p>
      <p className="mt-1 max-w-[58ch] text-plane-foreground text-sm leading-relaxed">
        {message}
      </p>
    </div>
    {replyText === undefined ? null : (
      <div className="ml-6">
        <p className="font-medium text-[10px] text-plane-foreground/50 uppercase tracking-[0.14em]">
          Vous
        </p>
        <p className="mt-1 max-w-[58ch] text-plane-foreground/85 text-sm leading-relaxed">
          {replyText}
        </p>
      </div>
    )}
  </div>
)
