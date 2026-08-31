/**
 * Un segment du prompt, cliquable, inline dans le flux de texte. Ne connaît
 * ni la configuration ni le hook — seulement son texte et son état de
 * signalement.
 *
 * Un seul état visuel distingue signalé de non signalé, et c'est le
 * **seul** : même fonte, même fond que tout autre segment tant qu'il n'est
 * pas signalé, qu'il soit ambigu ou clair. `DESIGN.md`, « Un jeu ne dit
 * jamais ce qu'il note. »
 */
export const SegmentToggle = ({
  text,
  flagged,
  onToggle,
}: {
  text: string
  flagged: boolean
  onToggle: () => void
}) => (
  <button
    type="button"
    aria-pressed={flagged}
    onClick={onToggle}
    className={`rounded-xs px-0.5 outline-plane-foreground -outline-offset-2 focus-visible:outline-2 ${
      flagged
        ? 'bg-plane-foreground/15 text-plane-foreground underline decoration-2 underline-offset-4'
        : 'text-plane-foreground hover:bg-plane-foreground/5'
    }`}
  >
    {text}
  </button>
)
