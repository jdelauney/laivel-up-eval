import type {
  CauseView,
  SituationRevelation,
} from '../../hooks/use-hint-budget.hook'
import { CauseOption } from '../elements/cause-option'

/**
 * Les causes candidates et le geste de trancher : cliquer une cause est
 * l'action, irréversible, jamais un second temps de confirmation — sur le
 * modèle de la désignation de `lie-detector`. Puis, une fois révélée, la
 * cause réelle, sa vérification et le relevé du coût de la situation.
 *
 * Ne porte **rien** sur la qualité du cadrage : la révélation pose la cause
 * et le relevé, jamais un verdict sur la façon dont le joueur a cadré.
 */
export const CutPanel = ({
  causes,
  interactive,
  onCut,
  revelation,
}: {
  causes: readonly CauseView[]
  interactive: boolean
  onCut: (causeId: string) => void
  revelation?: SituationRevelation
}) => (
  <section className="border border-plane-rule bg-plane">
    <div className="grid grid-cols-1 gap-px bg-plane-rule sm:grid-cols-3">
      {causes.map((cause) => {
        const causeRevelation = revelation?.causes.find(
          (entry) => entry.id === cause.id,
        )
        return (
          <CauseOption
            key={cause.id}
            text={cause.text}
            selected={cause.id === revelation?.cutCauseId}
            interactive={interactive}
            onSelect={interactive ? () => onCut(cause.id) : undefined}
            actual={causeRevelation?.actual}
            verification={causeRevelation?.verification}
          />
        )
      })}
    </div>

    {revelation !== undefined ? (
      <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-plane-rule border-t px-4 py-3 font-medium text-[10px] text-plane-foreground/60 uppercase tabular-nums tracking-[0.14em]">
        <span>Indices {revelation.hintCost}</span>
        {revelation.wrongCutPenalty !== undefined ? (
          <span>Tranche fausse +{revelation.wrongCutPenalty}</span>
        ) : null}
        {revelation.blindCutSurcharge !== undefined ? (
          <span>Aveugle +{revelation.blindCutSurcharge}</span>
        ) : null}
        <span className="text-plane-foreground">Total {revelation.total}</span>
      </footer>
    ) : null}
  </section>
)
