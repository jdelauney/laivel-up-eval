/**
 * Un jeton, en réserve ou déjà posé sur le plan : son libellé, et le geste
 * de le saisir. Ne connaît ni le hook, ni la configuration, ni sa
 * coordonnée — la position est l'affaire du composite qui le place à
 * l'écran.
 *
 * L'état saisi se porte par le filet et le poids du texte, jamais par une
 * teinte seule.
 */
export const PracticeToken = ({
  label,
  held,
  onHold,
}: {
  label: string
  held: boolean
  onHold: () => void
}) => (
  <button
    type="button"
    aria-pressed={held}
    onClick={onHold}
    className={`border px-2.5 py-1.5 text-left text-plane-foreground text-sm outline-plane-foreground -outline-offset-2 focus-visible:outline-2 ${
      held
        ? 'border-plane-foreground font-medium'
        : 'border-plane-rule hover:border-plane-foreground'
    }`}
  >
    {label}
  </button>
)
