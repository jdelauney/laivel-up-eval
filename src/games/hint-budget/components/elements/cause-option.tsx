import { Circle, Disc } from 'lucide-react'

/**
 * Une cause candidate, sélectionnable ; à la révélation, elle porte en plus
 * sa vérification et son statut.
 *
 * Le verdict ne passe jamais par la triade `--nominal` / `--caution` /
 * `--missed` : cette triade note la performance du joueur ailleurs dans le
 * produit. Un poids de glyphe porte le fait (réelle ou non), jamais la
 * couleur seule.
 */
export const CauseOption = ({
  text,
  interactive,
  onSelect,
  actual,
  verification,
}: {
  text: string
  interactive: boolean
  onSelect?: () => void
  actual?: boolean
  verification?: string
}) => {
  // Le clic est l'action elle-même — immédiate, irréversible — jamais un
  // premier temps de sélection suivi d'une confirmation : il n'existe donc
  // aucun état « choisie, pas encore tranchée » à porter avant la
  // révélation. `aria-pressed` supposait cet état intermédiaire ; retiré
  // le 30/08, tour 2, avec la prop `selected` qui ne l'alimentait jamais
  // (elle ne pouvait valoir `true` qu'à la révélation, où cette branche ne
  // se rend plus).
  const revealed = actual !== undefined
  const stateLabel = revealed
    ? actual
      ? 'cause réelle'
      : 'écartée'
    : 'candidate'

  const mark =
    revealed && actual ? (
      <Disc
        aria-hidden
        className="size-3 text-plane-foreground"
        fill="currentColor"
      />
    ) : revealed ? (
      <Circle
        aria-hidden
        className="size-3 text-plane-foreground/40"
        strokeWidth={1.5}
      />
    ) : (
      <Circle
        aria-hidden
        className="size-3 text-plane-foreground/25"
        strokeWidth={1.5}
      />
    )

  const body = (
    <>
      <p className="text-plane-foreground text-sm leading-snug">{text}</p>
      <p className="mt-1.5 flex items-center gap-1.5 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
        {mark}
        <span>{stateLabel}</span>
      </p>
      {verification !== undefined ? (
        <p className="mt-2 text-plane-foreground/70 text-xs leading-relaxed">
          {verification}
        </p>
      ) : null}
    </>
  )

  // Un filet propre à chaque carte, jamais une couleur de fond du conteneur
  // vue à travers un espacement : la grille des causes ne compte pas
  // toujours un multiple de ses colonnes, et le second motif laisserait un
  // pan de fond nu là où une carte manque.
  const shell =
    'flex flex-col gap-0.5 border border-plane-rule bg-plane p-3 text-left'

  if (!interactive) {
    return <div className={shell}>{body}</div>
  }

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`${shell} outline-plane-foreground -outline-offset-2 hover:bg-plane-foreground/4 focus-visible:outline-2`}
    >
      {body}
    </button>
  )
}
