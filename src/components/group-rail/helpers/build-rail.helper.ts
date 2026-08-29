import type { RailGroup } from '../composites/group-rail'

/**
 * La rampe se construit au même endroit pour tous les écrans. Deux copies
 * divergeaient déjà sur l'état d'un groupe : l'accueil marquait toujours le
 * premier comme courant, le parcours comparait à la position réelle.
 *
 * `currentIndex` vaut `undefined` tant qu'aucune partie n'est ouverte, et la
 * rampe entière reste alors à venir. Sans ce cas, un appelant au repos n'a
 * d'autre choix que de désigner un groupe, et l'accueil désignait le premier.
 */
export const buildRail = (
  shape: readonly { id: string; label: string; gameCount: number }[],
  currentIndex: number | undefined,
): RailGroup[] =>
  shape.map((group, index) => ({
    id: group.id,
    label: group.label,
    gameCount: group.gameCount,
    state:
      currentIndex === undefined || index > currentIndex
        ? 'pending'
        : index === currentIndex
          ? 'current'
          : 'done',
  }))
