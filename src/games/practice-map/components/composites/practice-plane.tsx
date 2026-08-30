import { useEffect, useRef } from 'react'
import type { Poles, Quadrants } from '../../schema/config.schema'

export type PlaneToken = {
  id: string
  number: number
  label: string
  shortLabel: string
  intensity: number
  rigor: number
}

/**
 * Le diamètre du badge rond d'un jeton posé, en pixels — vingt-cinq,
 * comme demandé. Sert à borner la zone où le **centre** d'un badge peut se
 * poser, pour que son **bord** ne sorte jamais du cadre — voir le calcul de
 * `left`/`top` plus bas. Un badge rond a la même empreinte sur les deux
 * axes.
 */
const BADGE_SIZE_PX = 25

/**
 * Le centre d'un badge reste toujours à au moins un rayon du bord : à
 * `intensity = 0` ou `1`, son bord touche le cadre sans jamais le dépasser.
 * Une position en pourcentage brut (`${pct}%`) ne le garantissait pas :
 * combinée à `-translate-x-1/2`, elle plaçait le bord du badge à un rayon
 * *au-delà* du cadre aux deux extrémités de chaque axe.
 */
const centeredInset = (fraction: number, sizePx: number): string =>
  `calc(${sizePx / 2}px + ${fraction} * (100% - ${sizePx}px))`

/**
 * Les quatre quadrants, chacun ancré à son propre coin plutôt que centré
 * sur un point. Un libellé centré sur `(25 %, 25 %)` avec une largeur
 * maximale fixe pouvait déborder par-dessus la médiane dès que le texte
 * approchait cette largeur : son bord droit atteignait le centre du plan,
 * son bord gauche le dépassait dès qu'un mot ne pouvait pas se couper.
 * Ancré au coin et borné à `calc(50% - 0.5rem)`, un libellé ne peut
 * structurellement jamais franchir la médiane : sa largeur maximale est
 * définie *par rapport à* cette médiane, pas devinée depuis un centre.
 */
const QUADRANT_CORNERS = [
  { key: 'top-left', corner: 'top-1 left-1', align: 'text-left' },
  { key: 'top-right', corner: 'top-1 right-1', align: 'text-right' },
  { key: 'bottom-left', corner: 'bottom-1 left-1', align: 'text-left' },
  { key: 'bottom-right', corner: 'bottom-1 right-1', align: 'text-right' },
] as const

const quadrantLabels = (
  quadrants: Quadrants,
): readonly { key: string; label: string; corner: string; align: string }[] => [
  {
    ...QUADRANT_CORNERS[0],
    label: quadrants.highRigorLowIntensity,
  },
  {
    ...QUADRANT_CORNERS[1],
    label: quadrants.highRigorHighIntensity,
  },
  {
    ...QUADRANT_CORNERS[2],
    label: quadrants.lowRigorLowIntensity,
  },
  {
    ...QUADRANT_CORNERS[3],
    label: quadrants.lowRigorHighIntensity,
  },
]

/**
 * Le plan continu, ses quatre pôles nommés, sa croix centrale avec ses
 * quatre quadrants nommés, et ses jetons posés en badges ronds numérotés.
 *
 * **Révision du 30/08, troisième tour.** Le plan affichait jusqu'ici le
 * `shortLabel` en clair sur chaque jeton posé : sept jetons proches se
 * recouvraient encore, et les quatre libellés de quadrant — de simples
 * combinaisons des pôles déjà affichés au bord du plan — débordaient de
 * leur cellule de 112px dès que le texte dépassait deux mots. Deux
 * corrections structurelles, pas un réglage de plus :
 *
 * 1. **Un jeton posé n'affiche plus qu'un numéro**, dans un badge rond de
 *    25px — l'index de la pratique dans la configuration, jamais un champ
 *    de corpus. Sept pastilles ne se recouvrent pas, ne se tronquent pas.
 *    La réserve tient la légende permanente qui résout chaque numéro
 *    (`practice-tray.tsx`). Le libellé complet (`shortLabel`) n'apparaît
 *    plus qu'au moment où le jeton est **saisi** (l'aperçu en pointillés)
 *    ou **porte le focus** (`group-focus:`), pour ne pas obliger un
 *    aller-retour vers la légende à chaque geste. Le nom accessible du
 *    bouton reste `label`, jamais le numéro seul.
 * 2. **Les quatre quadrants portent des noms propres**, écrits par le
 *    corpus (`quadrantsSchema`, plafonnés à 24 caractères) plutôt que
 *    recopiés depuis les pôles — une conjonction de deux phrases entières
 *    ne tenait dans aucune cellule. Chaque libellé est ancré à son coin,
 *    jamais centré : voir `QUADRANT_CORNERS`.
 *
 * **Aucune ligne de quadrant** n'a jamais réellement disparu : la croix (deux
 * traits au milieu géométrique du plan, 50/50, jamais au seuil réel
 * `highRigorFrom`) et l'aria-hidden/pointer-events-none du calque entier
 * restent inchangés depuis la révision précédente. Le dépôt reste continu
 * au pixel près : `handleClick` calcule toujours la même fraction `[0,1]`,
 * sans arrondi vers un centre de case.
 *
 * La conversion pixels → plan vit ici, et nulle part ailleurs : un clic ou
 * un tap sur le plan calcule la coordonnée `[0,1]` et la transmet telle
 * quelle.
 *
 * Le plan est lui-même atteignable au clavier une fois qu'un jeton est
 * saisi : les flèches déplacent le jeton d'un pas fixe, Entrée et Espace le
 * posent, Échap le relâche sans le placer.
 *
 * **Le plan reste carré, et prend toute la largeur de sa colonne.**
 * Révision du 31/08, quatrième tour : les quatre pôles étaient disposés en
 * croix autour du plan, les deux pôles d'intensité occupant chacun une
 * colonne latérale de 3,5rem. Ces 112px se prenaient sur les 265px de la
 * colonne, et il n'en restait que 145 au plan — plus étroit que la légende
 * posée à côté, pour la seule surface du jeu où le joueur agit. Les quatre
 * quadrants s'y trouvaient réduits à 72px chacun, où leurs noms de 24
 * caractères se tronquaient en charabia.
 *
 * Les pôles d'intensité descendent donc **sous** le plan, aux deux
 * extrémités d'une rangée qui porte aussi la rigueur basse en son centre.
 * Le plan garde la largeur entière et le carré tient sans plancher qui le
 * combatte : `min-h-28` (112px) ne sert plus que de garde-bas aux fenêtres
 * les plus étroites, et n'est jamais atteint aux gabarits réels.
 */
export const PracticePlane = ({
  placedTokens,
  heldToken,
  poles,
  quadrants,
  interactive,
  onDesignate,
  onNudge,
  onPlace,
  onRelease,
  onHoldToken,
}: {
  placedTokens: readonly PlaneToken[]
  // Le jeton saisi, à sa position candidate — affiché en aperçu tant qu'il
  // n'est pas posé.
  heldToken: PlaneToken | undefined
  poles: Poles
  quadrants: Quadrants
  // Un jeton est saisi : le plan devient la cible du clavier.
  interactive: boolean
  onDesignate: (intensity: number, rigor: number) => void
  onNudge: (axis: 'intensity' | 'rigor', direction: 1 | -1) => void
  onPlace: () => void
  onRelease: () => void
  onHoldToken: (practiceId: string) => void
}) => {
  const planeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (interactive) planeRef.current?.focus()
  }, [interactive])

  const handleClick = (event: React.MouseEvent<HTMLDivElement>): void => {
    const rect = event.currentTarget.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return
    const intensity = (event.clientX - rect.left) / rect.width
    const rigor = 1 - (event.clientY - rect.top) / rect.height
    onDesignate(intensity, rigor)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>): void => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault()
        onNudge('rigor', 1)
        break
      case 'ArrowDown':
        event.preventDefault()
        onNudge('rigor', -1)
        break
      case 'ArrowRight':
        event.preventDefault()
        onNudge('intensity', 1)
        break
      case 'ArrowLeft':
        event.preventDefault()
        onNudge('intensity', -1)
        break
      case 'Enter':
      case ' ':
        event.preventDefault()
        onPlace()
        break
      case 'Escape':
        event.preventDefault()
        onRelease()
        break
      default:
        break
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <p className="text-center text-plane-foreground/55 text-xs">
        {poles.rigorHigh}
      </p>
      <div>
        <div
          ref={planeRef}
          role="application"
          aria-label="Le plan des pratiques"
          tabIndex={interactive ? 0 : -1}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className="relative aspect-square min-h-28 w-full overflow-hidden border border-plane-rule bg-plane"
        >
          {/* La croix centrale et les quatre quadrants : un calque
           * purement visuel, sans effet sur le dépôt. `pointer-events-none`
           * pour qu'un clic sur le trait retombe sur le conteneur et
           * calcule la même fraction continue que n'importe quel autre
           * point du plan. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-plane-rule"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-plane-rule"
          />
          {quadrantLabels(quadrants).map((quadrant) => (
            <span
              key={quadrant.key}
              aria-hidden
              className={`pointer-events-none absolute ${quadrant.corner} ${quadrant.align} max-w-[calc(50%-0.5rem)] truncate whitespace-nowrap text-[10px] text-plane-foreground/40`}
            >
              {quadrant.label}
            </span>
          ))}
          {placedTokens.map((token) => (
            <div
              key={token.id}
              className="-translate-x-1/2 -translate-y-1/2 absolute"
              style={{
                left: centeredInset(token.intensity, BADGE_SIZE_PX),
                top: centeredInset(1 - token.rigor, BADGE_SIZE_PX),
              }}
            >
              <button
                type="button"
                title={token.label}
                aria-label={token.label}
                onClick={(event) => {
                  event.stopPropagation()
                  onHoldToken(token.id)
                }}
                className="group relative flex size-6.25 items-center justify-center rounded-full border border-plane-foreground bg-plane font-medium text-[11px] text-plane-foreground tabular-nums"
              >
                {token.number}
                {/* Le libellé complet, caché au repos, révélé au focus —
                 * sans forcer un aller-retour vers la légende à chaque
                 * reprise d'un jeton déjà posé. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-full top-1/2 ml-1 max-w-28 -translate-y-1/2 truncate whitespace-nowrap bg-plane px-1 text-left text-[10px] text-plane-foreground opacity-0 group-focus:opacity-100"
                >
                  {token.shortLabel}
                </span>
              </button>
            </div>
          ))}
          {heldToken !== undefined ? (
            <div
              aria-hidden
              className="-translate-x-1/2 -translate-y-1/2 absolute"
              style={{
                left: centeredInset(heldToken.intensity, BADGE_SIZE_PX),
                top: centeredInset(1 - heldToken.rigor, BADGE_SIZE_PX),
              }}
            >
              <span className="relative flex size-6.25 items-center justify-center rounded-full border border-plane-foreground border-dashed bg-plane font-medium text-[11px] text-plane-foreground/70 tabular-nums">
                {heldToken.number}
                {/* Un jeton saisi montre toujours son libellé complet : le
                 * joueur est en train de décider où le poser. */}
                <span className="absolute left-full top-1/2 ml-1 max-w-28 -translate-y-1/2 truncate whitespace-nowrap bg-plane px-1 text-left text-[10px] text-plane-foreground/70">
                  {heldToken.shortLabel}
                </span>
              </span>
            </div>
          ) : null}
        </div>
      </div>
      {/* Les trois libellés du bas sur une seule rangée : l'intensité à ses
       * deux extrémités, la rigueur basse au centre, sous l'axe qu'ils
       * nomment. Les pôles d'intensité occupaient jusqu'ici deux colonnes
       * latérales de 3,5rem chacune, soit 112px pris sur les 265px de la
       * colonne — le plan n'en gardait que 145. Sous le plan, ils ne lui
       * coûtent plus rien en largeur, et la convention est celle de
       * n'importe quel nuage de points : le bas-gauche nomme le départ de
       * l'axe horizontal, le bas-droit son extrémité. */}
      <div className="grid grid-cols-3 items-start gap-1">
        <p className="text-left text-plane-foreground/55 text-xs">
          {poles.intensityLow}
        </p>
        <p className="text-center text-plane-foreground/55 text-xs">
          {poles.rigorLow}
        </p>
        <p className="text-right text-plane-foreground/55 text-xs">
          {poles.intensityHigh}
        </p>
      </div>
    </div>
  )
}
