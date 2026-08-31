/** Une coordonnée du plan, sur les deux axes. */
export type PlanePoint = { intensity: number; rigor: number }

/**
 * La conversion pixels → plan, et nulle part ailleurs : un point de l'écran
 * devient une coordonnée continue du plan des pratiques. Deux gestes s'en
 * servent — le clic qui désigne un point, et le glisser qui promène un
 * jeton — et ils doivent rendre exactement la même coordonnée pour le même
 * pixel, sans quoi poser un jeton d'un geste ou de l'autre ne noterait pas
 * pareil.
 *
 * **La fraction n'est pas bornée ici.** Un point hors du cadre rend une
 * valeur hors de `[0,1]`, et c'est ce qui permet à l'appelant de savoir
 * qu'un jeton a été lâché à côté du plan. Le bornage appartient au dépôt
 * (`place`) et à l'aperçu (`designate`), qui ont chacun leur raison de
 * ramener la coordonnée dans le cadre.
 *
 * Rend `undefined` sur un cadre dégénéré — jamais une division par zéro.
 */
export const readPlanePoint = (
  plane: HTMLElement | null,
  clientX: number,
  clientY: number,
): PlanePoint | undefined => {
  if (plane === null) return undefined
  const rect = plane.getBoundingClientRect()
  if (rect.width === 0 || rect.height === 0) return undefined
  return {
    intensity: (clientX - rect.left) / rect.width,
    rigor: 1 - (clientY - rect.top) / rect.height,
  }
}

/** Le point tombe-t-il dans le cadre du plan ? */
export const isOnPlane = (point: PlanePoint): boolean =>
  point.intensity >= 0 &&
  point.intensity <= 1 &&
  point.rigor >= 0 &&
  point.rigor <= 1
