import type { PlanStep } from '@/core/scoring/helpers/progression-plan.helper'

/**
 * La phrase d'un axe qui bloque un cran, dans les mots de la grille : le cran
 * actuel de l'axe et le cran visé, tous deux lus sur `PlanStep` — jamais un
 * chiffre, jamais une direction vague du type « un cran plus haut ». Un axe
 * non mesuré le dit en toutes lettres — « aucune condition ne peut tenir » —
 * plutôt que d'emprunter au vocabulaire d'un cran bas. Un axe mesuré dont la
 * condition ne vise aucune bande (pas d'échelle) nomme l'axe seul.
 */
export const describePlanStep = (step: PlanStep): string => {
  if (step.measurement === 'unmeasured') {
    return `${step.label} — non mesuré, aucune condition ne peut tenir`
  }

  const currentBand = step.observedBand ?? 'sans cran défini'

  if (step.target === undefined) {
    return `${step.label} — actuellement « ${currentBand} », la condition ne vise aucun cran de l'échelle`
  }

  return `${step.label} — actuellement « ${currentBand} », la condition demande « ${step.target.label} »`
}
