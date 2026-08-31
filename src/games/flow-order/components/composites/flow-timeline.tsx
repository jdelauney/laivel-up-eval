import type { StepView } from '../../hooks/use-flow-order.hook'
import { StepCard } from '../elements/step-card'

/**
 * La frise **verticale numérotée**, sur le modèle des sections en bloc de
 * `prompt-body.tsx` et `practice-tray.tsx` : un cadre unique, un en-tête
 * muet, une pile de cartes. Rien ne distingue une étape bien placée d'une
 * étape déplacée avant la révélation — seul l'état saisi se voit.
 *
 * La pile est une liste ordonnée (`<ol>`/`<li>`) : la position jouée, seul
 * état que ce jeu mesure, est aussi la seule chose qu'un ordre de balisage
 * peut porter sans dépendre d'un attribut. Chaque carte double ce rang par
 * `aria-label` (voir `step-card.tsx`) pour que l'assistance technique le lise
 * même hors contexte de liste.
 */
export const FlowTimeline = ({
  steps,
  heldId,
  onActivate,
  onMoveUp,
  onMoveDown,
  onRelease,
}: {
  steps: readonly StepView[]
  heldId: string | undefined
  onActivate: (stepId: string) => void
  onMoveUp: (stepId: string) => void
  onMoveDown: (stepId: string) => void
  onRelease: () => void
}) => (
  <section className="border border-plane-rule bg-plane">
    <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
      La frise
    </header>
    {/* `gap-1.5` plutôt que `gap-2` : sept cartes cliquables gardent leur
     * cible de frappe pleine (`StepCard` ne perd rien), seul l'espace entre
     * elles se resserre — mesuré en navigateur réel dans la fiche de
     * surface. */}
    <ol className="flex flex-col gap-1.5 p-3">
      {steps.map((step) => (
        <StepCard
          key={step.id}
          position={step.position}
          label={step.label}
          held={step.id === heldId}
          onActivate={() => onActivate(step.id)}
          onMoveUp={() => onMoveUp(step.id)}
          onMoveDown={() => onMoveDown(step.id)}
          onRelease={onRelease}
        />
      ))}
    </ol>
  </section>
)
