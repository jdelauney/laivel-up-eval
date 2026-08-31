import type { PlanStep } from '@/core/scoring/helpers/progression-plan.helper'

/**
 * Une étape du plan : l'axe et le cran visé, l'action à mener, la preuve qui
 * la validerait. Rien n'est rédigé ici — l'action et la preuve viennent
 * telles quelles de `PlanStep`, lui-même lu sur `config/grid.json`. Une
 * bande sans action rend une étape qui le dit, jamais une phrase inventée.
 * Un axe non mesuré le dit à part : l'action affichée reste la même, elle
 * ne dépend pas de la mesure.
 */
type ProgressionStepProps = Readonly<{ step: PlanStep }>

export const ProgressionStep = ({ step }: ProgressionStepProps) => (
  <li className="flex flex-col gap-2 border-plane-rule border-b py-4">
    <h4 className="font-medium text-plane-foreground">
      {step.label}
      {step.target !== undefined ? ` → ${step.target.label}` : null}
    </h4>

    <p className="text-plane-foreground/80 text-sm">
      {step.action ?? "La grille ne porte pas d'action pour ce cran."}
    </p>

    {step.proof !== undefined ? (
      <p className="text-plane-foreground/60 text-sm">Preuve : {step.proof}</p>
    ) : null}

    {step.measurement === 'unmeasured' ? (
      <p className="text-plane-foreground/60 text-sm">
        Cet axe n'a pas été mesuré.
      </p>
    ) : null}
  </li>
)
