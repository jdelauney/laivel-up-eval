import type { PlanStep } from '@/core/scoring/helpers/progression-plan.helper'
import { describePlanStep } from '../../helpers/condition-gap-text.helper'

type CappingAxisProps = Readonly<{
  capping: PlanStep | undefined
  /**
   * Pourquoi `capping` est absent — ignoré tant que `capping` existe. Les
   * deux raisons ne se disent pas de la même phrase : l'une dit que le
   * sommet est atteint, l'autre que la grille ne propose aucun cran
   * atteignable en montant.
   */
  noNextLevelReason: 'summit' | 'unreachable' | undefined
}>

const SUMMIT_MESSAGE =
  'Le sommet du référentiel est atteint : aucun axe ne plafonne plus.'
const UNREACHABLE_MESSAGE =
  "Aucun cran au-dessus n'est atteignable en montant : la grille n'en propose pas."

/**
 * L'axe qui plafonne le cran suivant, nommé en toutes lettres, avec le cran
 * actuel et le cran visé — jamais déduit d'une barre ou d'un pourcentage.
 * `capping` est la tête de `plan` : le même axe que celui que le plan de
 * progression détaille juste en dessous.
 *
 * Sans axe qui plafonne, deux raisons distinctes, jamais confondues : le
 * sommet du référentiel est atteint, ou aucun cran au-dessus n'est
 * atteignable en montant.
 */
export const CappingAxis = ({
  capping,
  noNextLevelReason,
}: CappingAxisProps) => (
  <section className="flex flex-col gap-2">
    <h3 className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
      Ce qui plafonne
    </h3>
    <p className="text-plane-foreground/80 text-sm">
      {capping !== undefined
        ? describePlanStep(capping)
        : noNextLevelReason === 'unreachable'
          ? UNREACHABLE_MESSAGE
          : SUMMIT_MESSAGE}
    </p>
  </section>
)
