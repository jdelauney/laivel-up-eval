import type { PlanStep } from '@/core/scoring/helpers/progression-plan.helper'
import { describePlanStep } from '../../helpers/condition-gap-text.helper'

type CappingAxisProps = Readonly<{ capping: PlanStep | undefined }>

/**
 * L'axe qui plafonne le cran suivant, nommé en toutes lettres, avec le cran
 * actuel et le cran visé — jamais déduit d'une barre ou d'un pourcentage. Au
 * sommet du référentiel, plus aucun axe ne plafonne : l'écran le dit plutôt
 * que de rester muet. `capping` est la tête de `plan` : le même axe que
 * celui que le plan de progression détaille juste en dessous.
 */
export const CappingAxis = ({ capping }: CappingAxisProps) => (
  <section className="flex flex-col gap-2">
    <h3 className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
      Ce qui plafonne
    </h3>
    <p className="text-plane-foreground/80 text-sm">
      {capping === undefined
        ? 'Le sommet du référentiel est atteint : aucun axe ne plafonne plus.'
        : describePlanStep(capping)}
    </p>
  </section>
)
