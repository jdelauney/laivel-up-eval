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
  selected,
  interactive,
  onSelect,
  actual,
  verification,
}: {
  text: string
  selected: boolean
  interactive: boolean
  onSelect?: () => void
  actual?: boolean
  verification?: string
}) => {
  // `selected` ne peut valoir `true` qu'à la révélation : `CutPanel` le
  // dérive de `revelation?.cutCauseId`, `undefined` tant que la situation
  // n'est pas tranchée. Avant la révélation, la carte ne porte donc jamais
  // de marque de sélection — seul `aria-pressed` en garde trace pour le
  // clavier et le lecteur d'écran.
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
      aria-pressed={selected}
      onClick={onSelect}
      className={`${shell} outline-plane-foreground -outline-offset-2 hover:bg-plane-foreground/4 focus-visible:outline-2`}
    >
      {body}
    </button>
  )
}
