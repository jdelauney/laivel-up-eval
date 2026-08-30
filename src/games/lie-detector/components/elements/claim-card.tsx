import { CheckIcon, CircleIcon, XIcon } from 'lucide-react'

/**
 * Une affirmation du lot : son état avant la révélation (`libre` ·
 * `désignée`), son verdict après (`menteuse` · `vraie`), et sa vérification
 * une fois révélée.
 *
 * Un bouton natif, pour l'atteignabilité au clavier native : quatre arrêts
 * de tabulation, quatre affirmations, sans hook de focus glissant — à la
 * différence de la feuille de `defect-hunt`, ce jeu ne balaie pas des
 * dizaines de lignes.
 *
 * Purement présentationnel : il affiche ce qu'on lui donne, il ne connaît
 * ni le barème ni les critères qui liront cette manche.
 */
export const ClaimCard = ({
  claimId,
  text,
  designated,
  interactive,
  onDesignate,
  verdict,
  yours,
}: {
  claimId: string
  text: string
  designated: boolean
  interactive: boolean
  onDesignate?: (claimId: string) => void
  verdict?: 'lying' | 'true'
  yours?: boolean
}) => {
  const stateLabel =
    verdict === undefined
      ? designated
        ? 'désignée'
        : 'libre'
      : verdict === 'lying'
        ? 'menteuse'
        : 'vraie'

  const mark =
    verdict === 'lying' ? (
      <XIcon aria-hidden className="size-3.5 text-missed" />
    ) : verdict === 'true' ? (
      <CheckIcon aria-hidden className="size-3.5 text-nominal" />
    ) : designated ? (
      <CircleIcon
        aria-hidden
        className="size-3.5 text-plane-foreground"
        strokeWidth={2.75}
      />
    ) : (
      <CircleIcon
        aria-hidden
        className="size-3.5 text-plane-foreground/25"
        strokeWidth={1.5}
      />
    )

  const body = (
    <>
      <span className="flex h-[1.4rem] w-[1.4rem] shrink-0 items-center justify-center">
        {mark}
      </span>
      <span className="flex-1 text-left text-plane-foreground text-sm leading-relaxed">
        {text}
      </span>
      <span className="whitespace-nowrap font-medium text-[10px] text-plane-foreground/50 uppercase tracking-[0.14em]">
        {stateLabel}
        {yours ? ' · la vôtre' : ''}
      </span>
    </>
  )

  if (!interactive) {
    return (
      <div className="flex items-start gap-3 border-plane-rule border-t px-4 py-3 first:border-t-0">
        {body}
      </div>
    )
  }

  return (
    <button
      type="button"
      aria-pressed={designated}
      onClick={() => onDesignate?.(claimId)}
      className="flex w-full items-start gap-3 border-plane-rule border-t px-4 py-3 text-left outline-plane-foreground -outline-offset-2 first:border-t-0 hover:bg-plane-foreground/4 focus-visible:outline-2"
    >
      {body}
    </button>
  )
}

/** Ce que la vérification affiche à la révélation : le seul texte de configuration. */
export const ClaimVerification = ({ text }: { text: string }) => (
  <p className="mt-1 max-w-[62ch] pl-[2.15rem] text-plane-foreground/70 text-xs leading-relaxed">
    {text}
  </p>
)
