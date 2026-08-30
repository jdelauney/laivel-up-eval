import { Circle, Disc } from 'lucide-react'

/**
 * Une tuile de la grille de comparaison : une affirmation, son état avant
 * la révélation (`libre` · `désignée`), son verdict après (`a menti` ·
 * `disait vrai`), et sa vérification une fois révélée.
 *
 * Le verdict ne passe jamais par la triade `--nominal` / `--caution` /
 * `--missed` : cette triade note la performance du joueur ailleurs dans le
 * produit, et la réutiliser ici ferait dire à la couleur autre chose que ce
 * qu'elle dit — une menteuse démasquée n'est pas un succès du joueur, une
 * vraie affirmation n'est pas son erreur. Le fait (menteuse ou vraie) et
 * l'appartenance (la vôtre) sont deux canaux séparés : un poids de glyphe
 * pour le premier, un anneau structurel pour le second, jamais la couleur.
 *
 * Un bouton natif, pour l'atteignabilité au clavier native : quatre arrêts
 * de tabulation, quatre affirmations, sans hook de focus glissant — à la
 * différence de la feuille de `defect-hunt`, ce jeu ne balaie pas des
 * dizaines de lignes.
 *
 * Purement présentationnel : il affiche ce qu'on lui donne, il ne connaît
 * ni le barème ni les critères qui liront cette manche. La présentation ne
 * dépend jamais de la nature de l'objection — elle ne la connaît pas.
 */
export const ClaimCard = ({
  claimId,
  text,
  designated,
  interactive,
  onDesignate,
  verdict,
  verification,
  yours,
  order,
}: {
  claimId: string
  text: string
  designated: boolean
  interactive: boolean
  onDesignate?: (claimId: string) => void
  verdict?: 'lying' | 'true'
  verification?: string
  yours?: boolean
  order: number
}) => {
  const stateLabel =
    verdict === undefined
      ? designated
        ? 'désignée'
        : 'libre'
      : verdict === 'lying'
        ? 'a menti'
        : 'disait vrai'

  const mark =
    verdict === 'lying' ? (
      <Disc
        aria-hidden
        className="size-3 text-plane-foreground"
        fill="currentColor"
      />
    ) : verdict === 'true' ? (
      <Circle
        aria-hidden
        className="size-3 text-plane-foreground/40"
        strokeWidth={1.5}
      />
    ) : designated ? (
      <Disc
        aria-hidden
        className="size-3 text-plane-foreground"
        fill="currentColor"
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
      <p className="text-plane-foreground text-sm leading-snug sm:leading-relaxed">
        {text}
      </p>
      <div>
        <p className="mt-1 flex items-center gap-1.5 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em] sm:mt-3">
          {mark}
          <span>{stateLabel}</span>
          {yours ? (
            <span className="text-plane-foreground/85">· la vôtre</span>
          ) : null}
        </p>
        {verification !== undefined ? (
          <p
            style={{ animationDelay: `${order * 70}ms` }}
            className="mt-2 text-plane-foreground/70 text-xs leading-relaxed motion-safe:fade-in motion-safe:slide-in-from-bottom-1 motion-safe:animate-in motion-safe:fill-mode-backwards motion-safe:duration-500 motion-safe:ease-out"
          >
            {verification}
          </p>
        ) : null}
      </div>
    </>
  )

  const shell = [
    'flex h-full flex-col justify-between gap-1 bg-plane p-2 text-left sm:gap-4 sm:p-4',
    yours ? 'ring-1 ring-plane-foreground/45 ring-inset' : '',
  ].join(' ')

  if (!interactive) {
    return <div className={shell}>{body}</div>
  }

  return (
    <button
      type="button"
      aria-pressed={designated}
      onClick={() => onDesignate?.(claimId)}
      className={`${shell} outline-plane-foreground -outline-offset-2 hover:bg-plane-foreground/4 focus-visible:outline-2`}
    >
      {body}
    </button>
  )
}
