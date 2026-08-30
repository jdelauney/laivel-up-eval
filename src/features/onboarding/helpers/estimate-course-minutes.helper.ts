/**
 * Budget de 1,5 minute par situation. Arbitrage du 29/08 : moyenne entre les
 * jeux courts et les jeux à état du parcours.
 */
const MINUTES_PER_GAME = 1.5

/**
 * L'arrondi tient l'estimation lisible comme une durée indicative plutôt que
 * comme un chronomètre : au multiple de cinq minutes le plus proche.
 */
const ROUNDING_STEP_MINUTES = 5

/**
 * Une estimation d'expérience produit, pas une règle de session : aucun
 * verdict ne dépend de la DURÉE DU PARCOURS, et c'est bien pourquoi cette
 * estimation vit dans la feature `onboarding` et non dans le domaine. Le
 * temps imparti d'une situation, lui, est l'affaire du jeu qui le porte —
 * `defect-hunt` note un dépassement — et il vit dans sa propre configuration,
 * jamais ici.
 *
 * Le résultat suit toujours le nombre de situations du parcours chargé —
 * jamais une valeur figée — pour ne pas mentir au premier jeu ajouté.
 */
export const estimateCourseMinutes = (totalSituations: number): number => {
  if (totalSituations <= 0) return 0

  const rawMinutes = totalSituations * MINUTES_PER_GAME
  const nearestStep =
    Math.round(rawMinutes / ROUNDING_STEP_MINUTES) * ROUNDING_STEP_MINUTES

  return Math.max(nearestStep, ROUNDING_STEP_MINUTES)
}
