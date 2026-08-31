import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import { useKeepOrToss } from '../../hooks/use-keep-or-toss.hook'
import { SortingDeck } from './sorting-deck'

/**
 * Le treizième jeu du parcours, et le second du groupe « Sécurité et
 * responsabilité » : douze pratiques de sécurité à trier, une carte à la
 * fois, avant que le temps ne fige le lot.
 *
 * **Aucune validation, aucun retour, aucun compteur de justes avant la
 * fin.** C'est le chronomètre qui remplace le retour immédiat — le joueur
 * ne sait à aucun moment s'il vient de bien classer une pratique, seulement
 * combien de temps il lui reste et combien de cartes il a déjà triées.
 *
 * La consigne annonce le cadre — qu'il faut garder ou jeter, que le temps
 * gèle le lot — jamais ce qui est noté : ni le seuil de bon classement, ni
 * celui de complétion. `DESIGN.md`, « Un jeu ne dit jamais ce qu'il note. »
 *
 * Seule cette composition connaît le hook et `GameComponentProps` : la
 * pile et la carte restent des vues pures.
 */
export const KeepOrTossGame = ({ config, onSubmit }: GameComponentProps) => {
  const {
    statement,
    total,
    sortedCount,
    durationSeconds,
    remainingSeconds,
    announcement,
    phase,
    currentItem,
    sort,
    reveal,
    advance,
    revelations,
  } = useKeepOrToss(config, onSubmit)

  if (phase === 'revealed') {
    return (
      <div className="flex flex-col gap-3 sm:gap-6">
        <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
          {statement}
        </p>
        <section className="border border-plane-rule bg-plane">
          <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
            Ce que chaque pratique était
          </header>
          <div>
            {revelations.map((entry) => (
              <div
                key={entry.id}
                className="border-plane-rule border-b px-3 py-2 last:border-b-0"
              >
                <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="text-plane-foreground text-sm">
                    {entry.label}
                  </span>
                  <span
                    className={`font-semibold text-[10px] uppercase tracking-[0.16em] ${
                      entry.keep ? 'text-nominal' : 'text-missed'
                    }`}
                  >
                    {entry.keep ? 'à garder' : 'à jeter'}
                  </span>
                </p>
                <p className="mt-1 max-w-[68ch] text-plane-foreground/70 text-xs leading-relaxed">
                  {entry.reason}
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

  if (phase === 'frozen') {
    return (
      <div className="flex flex-col gap-3 sm:gap-6">
        <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
          {statement}
        </p>
        <section className="flex flex-col items-start gap-3 border border-plane-rule bg-plane px-4 py-6">
          <p className="font-medium text-plane-foreground/70 text-xs uppercase tracking-[0.14em]">
            Le tri est figé
          </p>
          <p className="text-plane-foreground text-sm leading-relaxed">
            {sortedCount} carte{sortedCount === 1 ? '' : 's'} sur {total} ont
            reçu un verdict.
          </p>
        </section>
        <div>
          <Button type="button" size="lg" onClick={reveal}>
            Voir la révélation
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

      <SortingDeck
        currentItem={currentItem}
        sortedCount={sortedCount}
        total={total}
        remainingSeconds={remainingSeconds}
        durationSeconds={durationSeconds}
        announcement={announcement}
        onSort={sort}
      />
    </div>
  )
}
