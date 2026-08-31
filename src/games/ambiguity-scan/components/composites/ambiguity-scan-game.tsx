import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import { useAmbiguityScan } from '../../hooks/use-ambiguity-scan.hook'
import { PromptBody } from './prompt-body'

/**
 * Le neuvième jeu du parcours, et le second du sixième groupe : un prompt
 * de commande de feature s'affiche en bloc continu, chaque segment se
 * signale ou non, avant de verrouiller une lecture qui ne se corrige plus.
 *
 * La consigne annonce le cadre — que le prompt se lit dans son ensemble,
 * que la lecture se verrouille à la soumission — jamais ce qui est noté :
 * ni le nombre de segments ambigus, ni un seuil, ni un indice visuel sur
 * lequel l'est. `DESIGN.md`, « Un jeu ne dit jamais ce qu'il note. »
 *
 * Seule cette composition connaît le hook et `GameComponentProps` : le
 * composite du prompt et l'élément de segment restent des vues pures.
 */
export const AmbiguityScanGame = ({ config, onSubmit }: GameComponentProps) => {
  const {
    statement,
    promptTitle,
    segments,
    flaggedCount,
    canSubmit,
    phase,
    revelations,
    toggle,
    submit,
    advance,
  } = useAmbiguityScan(config, onSubmit)

  if (phase === 'revealed') {
    return (
      <div className="flex flex-col gap-3 sm:gap-6">
        <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
          {statement}
        </p>
        <section className="border border-plane-rule bg-plane">
          <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
            Ce que ces segments laissaient ouvert
          </header>
          <div>
            {revelations.map((entry) => (
              <div
                key={entry.id}
                className="border-plane-rule border-b px-3 py-2 last:border-b-0"
              >
                <p className="text-plane-foreground text-sm">{entry.text}</p>
                <p className="mt-1 text-plane-foreground/60 text-xs leading-relaxed">
                  {entry.reading}
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
      <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
        {statement}
      </p>

      <PromptBody title={promptTitle} segments={segments} onToggle={toggle} />

      {/* Le compte dit combien de segments sont signalés, jamais combien il
       * en reste à trouver : un total à atteindre serait déjà un indice sur
       * ce que le jeu note. */}
      <p
        aria-live="polite"
        className="font-medium text-plane-foreground/50 text-xs uppercase tabular-nums tracking-[0.14em]"
      >
        {flaggedCount === 0
          ? 'Aucun segment signalé.'
          : `${flaggedCount} segment${flaggedCount > 1 ? 's' : ''} signalé${flaggedCount > 1 ? 's' : ''}.`}
      </p>

      <div>
        <Button type="button" size="lg" disabled={!canSubmit} onClick={submit}>
          Verrouiller mes signalements
        </Button>
      </div>
    </div>
  )
}
