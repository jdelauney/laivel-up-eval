import { useEffect, useRef } from 'react'
import type { Poles } from '../../schema/config.schema'

export type PlaneToken = {
  id: string
  label: string
  intensity: number
  rigor: number
}

/**
 * Le plan continu et ses quatre pôles nommés — ce sont eux qui portent le
 * cadre. **Aucune ligne de quadrant** : la story demande une lecture sans
 * case prédéfinie, et une croix visible aimanterait les jetons dans quatre
 * cases.
 *
 * La conversion pixels → plan vit ici, et nulle part ailleurs : un clic ou
 * un tap sur le plan calcule la coordonnée `[0,1]` et la transmet telle
 * quelle.
 *
 * Le plan est lui-même atteignable au clavier une fois qu'un jeton est
 * saisi : les flèches déplacent le jeton d'un pas fixe, Entrée et Espace le
 * posent, Échap le relâche sans le placer.
 */
export const PracticePlane = ({
  placedTokens,
  heldToken,
  poles,
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
      <div className="flex items-stretch gap-1">
        <p className="flex w-20 shrink-0 items-center justify-end text-right text-plane-foreground/55 text-xs">
          {poles.intensityLow}
        </p>
        <div
          ref={planeRef}
          role="application"
          aria-label="Le plan des pratiques"
          tabIndex={interactive ? 0 : -1}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          className="relative aspect-square min-h-56 flex-1 border border-plane-rule bg-plane"
        >
          {placedTokens.map((token) => (
            <button
              key={token.id}
              type="button"
              onClick={(event) => {
                event.stopPropagation()
                onHoldToken(token.id)
              }}
              style={{
                left: `${token.intensity * 100}%`,
                top: `${(1 - token.rigor) * 100}%`,
              }}
              className="-translate-x-1/2 -translate-y-1/2 absolute border border-plane-foreground bg-plane px-1.5 py-0.5 text-plane-foreground text-xs"
            >
              {token.label}
            </button>
          ))}
          {heldToken !== undefined ? (
            <span
              aria-hidden
              style={{
                left: `${heldToken.intensity * 100}%`,
                top: `${(1 - heldToken.rigor) * 100}%`,
              }}
              className="-translate-x-1/2 -translate-y-1/2 absolute border border-plane-foreground border-dashed px-1.5 py-0.5 text-plane-foreground/70 text-xs"
            >
              {heldToken.label}
            </span>
          ) : null}
        </div>
        <p className="flex w-20 shrink-0 items-center text-plane-foreground/55 text-xs">
          {poles.intensityHigh}
        </p>
      </div>
      <p className="text-center text-plane-foreground/55 text-xs">
        {poles.rigorLow}
      </p>
    </div>
  )
}
