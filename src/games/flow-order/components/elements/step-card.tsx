/**
 * Une étape de la frise, cliquable et focusable. Ne connaît ni le hook ni
 * la configuration — seulement sa position jouée, son libellé, et si elle
 * est saisie.
 *
 * Les deux chemins d'entrée se posent ici, à égalité stricte de précision
 * (`DESIGN.md` §93-94) : `onClick` porte le geste pointeur (saisir ou
 * déposer, décidé par le hook), `onKeyDown` porte le geste clavier
 * (`ArrowUp` / `ArrowDown` déplacent l'étape d'un cran, sans saisie
 * préalable). Les deux chemins produisent le même résultat final — une
 * frise réordonnée — par des gestes distincts, jamais l'un simulant
 * l'autre.
 *
 * Un seul état visuel distingue saisi de non saisi, et c'est le seul :
 * `DESIGN.md`, « Un jeu ne dit jamais ce qu'il note » — aucune couleur, coche
 * ou compteur ne dit si la position jouée est la bonne.
 */
export const StepCard = ({
  position,
  label,
  held,
  onActivate,
  onMoveUp,
  onMoveDown,
}: {
  position: number
  label: string
  held: boolean
  onActivate: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}) => (
  <button
    type="button"
    aria-pressed={held}
    // Le nom accessible reste le seul libellé de l'étape : la position,
    // marquée `aria-hidden`, ne doit jamais s'y concaténer — sur le modèle
    // de `practice-token.tsx`, explicite plutôt que de compter sur le seul
    // retrait par `aria-hidden`.
    aria-label={label}
    onClick={onActivate}
    onKeyDown={(event) => {
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        onMoveUp()
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        onMoveDown()
      }
    }}
    className={`flex w-full items-center gap-3 border px-3 py-2 text-left text-plane-foreground text-sm outline-plane-foreground -outline-offset-2 focus-visible:outline-2 ${
      held
        ? 'border-plane-foreground font-medium'
        : 'border-plane-rule hover:border-plane-foreground'
    }`}
  >
    {/* La position se lit à gauche, sur le modèle du numéro de badge de
     * `practice-token.tsx` : un repère de lecture, jamais un verdict. */}
    <span
      aria-hidden
      className="w-5 shrink-0 text-left text-plane-foreground/55 text-xs tabular-nums"
    >
      {position}
    </span>
    <span className="min-w-0">{label}</span>
  </button>
)
