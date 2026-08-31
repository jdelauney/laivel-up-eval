import type { ConditionGap } from '@/core/scoring/helpers/level-resolver.helper'

/**
 * La phrase d'un axe qui bloque un cran, dans les mots de la grille : le cran
 * actuel de l'axe, jamais un chiffre. Un axe non mesuré le dit en toutes
 * lettres — « aucune condition ne peut tenir » — plutôt que d'emprunter au
 * vocabulaire d'un cran bas.
 *
 * La résolution du libellé exact de la borne visée (le futur « axis proof »)
 * n'est pas construite ici : elle appartient à la phase suivante. Cette
 * phrase nomme l'axe et la direction manquante, sans jamais afficher de
 * pourcentage.
 */
export const describeConditionGap = (gap: ConditionGap): string => {
  const label = gap.dimension?.label ?? gap.condition.dimension

  if (
    gap.dimension === undefined ||
    gap.dimension.measurement === 'unmeasured'
  ) {
    return `${label} — non mesuré, aucune condition ne peut tenir`
  }

  const direction =
    gap.condition.min !== undefined ? 'un cran plus haut' : 'un cran plus bas'
  const currentBand = gap.dimension.band ?? 'sans cran défini'

  return `${label} — actuellement « ${currentBand} », la condition demande ${direction}`
}
