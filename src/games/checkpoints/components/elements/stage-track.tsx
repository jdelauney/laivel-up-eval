/**
 * La frise des six étapes. L'état d'une étape passe par trois quantités — le
 * remplissage du jeton, sa taille et le filet qui y entre — jamais par une
 * couleur ni par une opacité réduite.
 *
 * Décorative pour le lecteur d'écran : la position est annoncée par la ligne de
 * position, qui est une région `status`. La répéter ici ferait deux annonces
 * pour un seul déplacement.
 */

export type TrackStage = {
  id: string
  label: string
}

const DOTS = {
  done: 'size-3 bg-plane-foreground',
  current:
    'size-4 bg-plane-foreground ring-2 ring-plane-foreground ring-offset-2 ring-offset-plane',
  pending: 'size-3 border border-plane-foreground bg-transparent',
} as const

const LINKS = {
  reached: 'border-plane-foreground',
  ahead: 'border-plane-rule border-dashed',
} as const

const stateOf = (index: number, currentIndex: number) => {
  if (index < currentIndex) return 'done'
  if (index === currentIndex) return 'current'
  return 'pending'
}

const leadingLink = (index: number, currentIndex: number): string => {
  if (index === 0) return 'border-transparent'
  return index <= currentIndex ? LINKS.reached : LINKS.ahead
}

const trailingLink = (
  index: number,
  currentIndex: number,
  count: number,
): string => {
  if (index === count - 1) return 'border-transparent'
  return index < currentIndex ? LINKS.reached : LINKS.ahead
}

export const StageTrack = ({
  stages,
  currentIndex,
}: {
  stages: readonly TrackStage[]
  currentIndex: number
}) => (
  <ol aria-hidden="true" className="flex flex-row items-start">
    {stages.map((stage, index) => {
      const state = stateOf(index, currentIndex)
      return (
        <li
          key={stage.id}
          className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
        >
          <div className="flex w-full items-center">
            <span
              className={`h-0 flex-1 border-t ${leadingLink(index, currentIndex)}`}
            />
            <span className={`shrink-0 rounded-full ${DOTS[state]}`} />
            <span
              className={`h-0 flex-1 border-t ${trailingLink(index, currentIndex, stages.length)}`}
            />
          </div>
          <span
            className={`truncate text-[0.6875rem] text-plane-foreground ${
              state === 'current' ? 'font-semibold' : 'hidden md:block'
            }`}
          >
            {stage.label}
          </span>
        </li>
      )
    })}
  </ol>
)
