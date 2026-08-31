import type { ConditionGap } from '@/core/scoring/helpers/level-resolver.helper'
import { describeConditionGap } from '../../helpers/condition-gap-text.helper'

type CappingAxisProps = Readonly<{ capping: ConditionGap | undefined }>

/**
 * L'axe qui plafonne le cran suivant, nommé en toutes lettres — jamais
 * déduit d'une barre ou d'un pourcentage. Au sommet du référentiel, plus
 * aucun axe ne plafonne : l'écran le dit plutôt que de rester muet.
 */
export const CappingAxis = ({ capping }: CappingAxisProps) => (
  <section className="flex flex-col gap-2">
    <h3 className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
      Ce qui plafonne
    </h3>
    <p className="text-plane-foreground/80 text-sm">
      {capping === undefined
        ? 'Le sommet du référentiel est atteint : aucun axe ne plafonne plus.'
        : describeConditionGap(capping)}
    </p>
  </section>
)
