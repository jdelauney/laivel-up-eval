import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import { useFlowOrder } from '../../hooks/use-flow-order.hook'
import { FlowTimeline } from './flow-timeline'

/**
 * Le dixième jeu du parcours, et le second du cinquième groupe : sept
 * gestes du flux AIDD à remettre dans l'ordre où ils se jouent réellement,
 * avant de verrouiller une frise qui ne se corrige plus.
 *
 * La consigne annonce le cadre — que la frise se lit de haut en bas, que la
 * lecture se verrouille à la soumission — jamais ce qui est noté : ni
 * l'ordre exact, ni la tolérance d'une position. `DESIGN.md`, « Un jeu ne
 * dit jamais ce qu'il note. »
 *
 * Seule cette composition connaît le hook et `GameComponentProps` : la
 * frise et la carte d'étape restent des vues pures.
 */
export const FlowOrderGame = ({ config, onSubmit }: GameComponentProps) => {
  const {
    statement,
    steps,
    heldId,
    phase,
    announcement,
    activate,
    move,
    submit,
    advance,
    revelations,
  } = useFlowOrder(config, onSubmit)

  if (phase === 'revealed') {
    return (
      <div className="flex flex-col gap-3 sm:gap-6">
        <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
          {statement}
        </p>
        <section className="border border-plane-rule bg-plane">
          <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
            Ce que chaque étape apporte au flux
          </header>
          <div>
            {revelations.map((entry, index) => (
              <div
                key={entry.id}
                className="border-plane-rule border-b px-3 py-2 last:border-b-0"
              >
                <p className="text-plane-foreground text-sm">
                  <span
                    aria-hidden
                    className="tabular-nums text-plane-foreground/55"
                  >
                    {index + 1}.{' '}
                  </span>
                  {entry.label}
                </p>
                <p className="mt-1 text-plane-foreground/60 text-xs leading-relaxed">
                  {entry.note}
                </p>
              </div>
            ))}
          </div>
        </section>
        <div>
          <Button type="button" size="lg" onClick={advance}>
            Continuer
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 sm:gap-6">
      {/* La consigne et son annonce clavier forment un seul bloc, sur le
       * modèle de `practice-map-game.tsx` : un `gap` séparé de chaque côté
       * de l'annonce — vide tant qu'aucun geste n'a eu lieu — creuserait un
       * vide double entre la consigne et la frise, sans rien dedans. */}
      <div className="flex flex-col gap-1">
        <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
          {statement}
        </p>
        {/* Le pendant clavier du retour visuel : la position de la
         * dernière étape déplacée, annoncée en mots à chaque geste, saisi
         * au pointeur ou déplacé au clavier. */}
        <p
          aria-live="polite"
          className="font-medium text-plane-foreground/50 text-xs uppercase tabular-nums tracking-[0.14em]"
        >
          {announcement}
        </p>
      </div>

      <FlowTimeline
        steps={steps}
        heldId={heldId}
        onActivate={activate}
        onMoveUp={(stepId) => move(stepId, -1)}
        onMoveDown={(stepId) => move(stepId, 1)}
      />

      <div>
        <Button type="button" size="lg" onClick={submit}>
          Verrouiller la frise
        </Button>
      </div>
    </div>
  )
}
