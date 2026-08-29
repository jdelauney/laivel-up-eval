import type { RailGroup } from '../composites/group-rail'

/**
 * La rampe se construit au même endroit pour tous les écrans. Deux copies
 * divergeaient déjà sur l'état d'un groupe : l'accueil marquait toujours le
 * premier comme courant, le parcours comparait à la position réelle.
 */
export const buildRail = (
  shape: readonly { id: string; label: string; gameCount: number }[],
  currentIndex: number,
): RailGroup[] =>
  shape.map((group, index) => ({
    id: group.id,
    label: group.label,
    gameCount: group.gameCount,
    state:
      index < currentIndex
        ? 'done'
        : index === currentIndex
          ? 'current'
          : 'pending',
  }))
