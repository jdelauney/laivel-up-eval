import type { Dimension } from '../../contracts/grid.schema'

/**
 * Le score d'une dimension dit « 0.75 » ; la grille dit « L — multi-étapes ».
 * C'est le second mot que le joueur et le jury lisent, donc on le résout ici,
 * une fois, à partir de l'échelle portée par la grille — jamais dans la vue.
 *
 * Une dimension sans échelle n'a pas de bande : le score reste le seul mot.
 */
export const bandFor = (
  dimension: Dimension,
  score: number,
): string | undefined => {
  if (dimension.scale === undefined) return undefined

  const reached = dimension.scale.filter((band) => score >= band.from)
  return reached[reached.length - 1]?.label
}
