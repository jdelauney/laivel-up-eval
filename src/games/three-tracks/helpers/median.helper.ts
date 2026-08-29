/**
 * La médiane du relevé de vivants par tour, jamais son maximum. Le référentiel
 * mesure ce que le joueur mène « habituellement », pas son meilleur instant :
 * un pic isolé de chantiers vivants ne doit pas racheter le reste de la partie,
 * c'est ce qui rend « ouvrir quatre chantiers puis en perdre trois » sans effet
 * sur le cran mesuré.
 */
export const median = (values: readonly number[]): number => {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)

  if (sorted.length % 2 === 1) return sorted[middle]

  return (sorted[middle - 1] + sorted[middle]) / 2
}
