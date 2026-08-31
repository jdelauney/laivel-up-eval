import type { StepView } from '../../hooks/use-flow-order.hook'
import { StepCard } from '../elements/step-card'

/**
 * La frise **verticale numérotée**, sur le modèle des sections en bloc de
 * `prompt-body.tsx` et `practice-tray.tsx` : un cadre unique, un en-tête
 * muet, une pile de cartes. Rien ne distingue une étape bien placée d'une
 * étape déplacée avant la révélation — seul l'état saisi se voit.
 */
export const FlowTimeline = ({
  steps,
  heldId,
  onActivate,
  onMoveUp,
  onMoveDown,
}: {
  steps: readonly StepView[]
  heldId: string | undefined
  onActivate: (stepId: string) => void
  onMoveUp: (stepId: string) => void
  onMoveDown: (stepId: string) => void
}) => (
  <section className="border border-plane-rule bg-plane">
    <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
      La frise
    </header>
    <div className="flex flex-col gap-2 p-3">
      {steps.map((step) => (
        <StepCard
          key={step.id}
          position={step.position}
          label={step.label}
          held={step.id === heldId}
          onActivate={() => onActivate(step.id)}
          onMoveUp={() => onMoveUp(step.id)}
          onMoveDown={() => onMoveDown(step.id)}
        />
      ))}
    </div>
  </section>
)
