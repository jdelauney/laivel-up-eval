import { type KeyboardEvent, useCallback, useRef, useState } from 'react'

/**
 * Une liste longue qui ne coûte qu'un seul arrêt de tabulation.
 *
 * L'extrait de ce jeu fait vingt-cinq lignes, et chacune est une cible. Vingt-
 * cinq contrôles tabulables obligeraient un joueur au clavier à traverser tout
 * le code pour atteindre le bouton de rendu : conforme ligne à ligne, hostile
 * dans son ensemble. Le motif standard est celui-ci — un seul descendant
 * porte `tabIndex={0}`, les flèches déplacent ce porteur, et le reste de la
 * liste est hors du parcours de tabulation.
 *
 * Le focus se pose sur le nœud réel plutôt que sur un état seul : sans cet
 * appel, la flèche déplacerait la sélection sans que le lecteur d'écran ne
 * suive.
 */
export const useRovingFocus = (
  count: number,
  onActivate?: (index: number) => void,
) => {
  const [activeIndex, setActiveIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const focusIndex = useCallback(
    (index: number) => {
      if (count === 0) return
      const clamped = Math.min(Math.max(index, 0), count - 1)
      setActiveIndex(clamped)
      containerRef.current
        ?.querySelector<HTMLElement>(`[data-roving-index="${clamped}"]`)
        ?.focus()
    },
    [count],
  )

  /** Le pas de chaque touche de navigation, ou `undefined` si elle ne navigue pas. */
  const stepFor = (key: string): number | undefined => {
    if (key === 'ArrowDown') return 1
    if (key === 'ArrowUp') return -1
    if (key === 'PageDown') return 10
    if (key === 'PageUp') return -10
    return undefined
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>): void => {
    const { key } = event

    if (key === 'Enter' || key === ' ') {
      // Sans ce `preventDefault`, l'espace fait défiler la page sous la
      // marque que le joueur vient de poser.
      event.preventDefault()
      onActivate?.(activeIndex)
      return
    }

    if (key === 'Home') {
      event.preventDefault()
      focusIndex(0)
      return
    }

    if (key === 'End') {
      event.preventDefault()
      focusIndex(count - 1)
      return
    }

    const step = stepFor(key)
    if (step === undefined) return

    event.preventDefault()
    focusIndex(activeIndex + step)
  }

  return { activeIndex, containerRef, handleKeyDown, setActiveIndex }
}
