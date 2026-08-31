import { useEffect, useRef } from 'react'
import { isOnPlane, readPlanePoint } from '../helpers/read-plane-point.helper'

/**
 * En deçà de trois pixels, le geste reste un clic. Sans ce seuil, le
 * tremblement de main qui accompagne n'importe quel clic ferait du premier
 * pixel un glisser, et le jeton se poserait sous le doigt au lieu de rester
 * saisi en attente d'un point désigné — le parcours « saisir puis
 * désigner » disparaîtrait au profit du seul glisser.
 */
const DRAG_THRESHOLD_PX = 3

/**
 * Le glisser-déposer d'un jeton, au pointeur comme au doigt.
 *
 * **Pourquoi des écouteurs sur `window` plutôt que sur le jeton saisi.** Un
 * glisser commence sur un jeton — une ligne de la réserve, ou un badge déjà
 * posé — et se termine ailleurs, sur le plan. Les événements qui suivent le
 * `pointerdown` sont capturés implicitement par la cible d'origine au doigt,
 * et suivraient le curseur au-dessus de n'importe quel élément à la souris :
 * dans les deux cas, les poser sur le plan ne les verrait jamais arriver. La
 * fenêtre les voit tous, et la coordonnée se lit du cadre du plan, pas de la
 * cible de l'événement — le geste reste juste où qu'il passe.
 *
 * Les trois gestes que le hook distingue, et rien de plus :
 * - **un clic** (moins de {@link DRAG_THRESHOLD_PX}) saisit le jeton et le
 *   laisse saisi : le joueur désignera ensuite un point du plan, au clic ou
 *   aux flèches. Le parcours d'origine est intact.
 * - **un glisser lâché sur le plan** pose le jeton là où il est lâché.
 * - **un glisser lâché à côté du plan** relâche le jeton sans rien poser.
 *   Jamais une suppression : un jeton déjà posé garde sa place, puisque le
 *   dépôt n'a pas été touché.
 */
export const usePlaneDrag = ({
  onHold,
  onMove,
  onDrop,
  onCancel,
}: {
  onHold: (practiceId: string) => void
  onMove: (intensity: number, rigor: number) => void
  onDrop: (intensity: number, rigor: number) => void
  onCancel: () => void
}) => {
  const planeRef = useRef<HTMLDivElement>(null)
  // Un glisser en cours quand le jeu quitte l'écran laisserait ses
  // écouteurs derrière lui.
  const detachRef = useRef<(() => void) | undefined>(undefined)

  useEffect(() => () => detachRef.current?.(), [])

  const startDrag = (practiceId: string, event: React.PointerEvent): void => {
    // Le bouton principal seul : un clic droit ou un bouton latéral ne
    // déplace rien.
    if (event.button > 0) return

    detachRef.current?.()
    onHold(practiceId)

    const origin = { x: event.clientX, y: event.clientY }
    const controller = new AbortController()
    const { signal } = controller
    let dragging = false

    const detach = (): void => {
      controller.abort()
      detachRef.current = undefined
    }

    const handleMove = (move: PointerEvent): void => {
      if (!dragging) {
        const distance = Math.hypot(
          move.clientX - origin.x,
          move.clientY - origin.y,
        )
        if (distance < DRAG_THRESHOLD_PX) return
        dragging = true
      }
      const point = readPlanePoint(planeRef.current, move.clientX, move.clientY)
      if (point === undefined) return
      onMove(point.intensity, point.rigor)
    }

    const handleUp = (up: PointerEvent): void => {
      detach()
      // Un simple clic : le jeton reste saisi, le joueur désigne ensuite.
      if (!dragging) return
      const point = readPlanePoint(planeRef.current, up.clientX, up.clientY)
      if (point === undefined || !isOnPlane(point)) {
        onCancel()
        return
      }
      onDrop(point.intensity, point.rigor)
    }

    const handleCancel = (): void => {
      detach()
      if (dragging) onCancel()
    }

    window.addEventListener('pointermove', handleMove, { signal })
    window.addEventListener('pointerup', handleUp, { signal })
    window.addEventListener('pointercancel', handleCancel, { signal })
    detachRef.current = detach
  }

  return { planeRef, startDrag }
}
