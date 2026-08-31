import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import { useKeepOrToss } from '../../hooks/use-keep-or-toss.hook'
import { FrozenPanel } from './frozen-panel'
import { RevealedCamps } from './revealed-camps'
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
 * La consigne annonce qu'il faut garder ou jeter — jamais ce qui est noté :
 * ni le seuil de bon classement, ni celui de complétion, ni même le fait
 * que le temps gèle le lot. `DESIGN.md`, « Un jeu ne dit jamais ce qu'il
 * note. » (Ce dernier point était faux ici avant la revue du 31/08 : le
 * commentaire, tout comme la fiche de surface, affirmait que la consigne
 * annonçait le gel, ce que la consigne réelle ne dit pas — corrigé aux deux
 * endroits plutôt que d'ajouter l'annonce absente à la consigne elle-même,
 * hors du périmètre confié.)
 *
 * Trois vues, une par phase, chacune dans son propre fichier —
 * `SortingDeck` pendant le tri, `FrozenPanel` au gel, `RevealedCamps` à la
 * révélation — plutôt qu'une seule fonction qui les porterait toutes les
 * trois : la revue a relevé que la précédente version, 101 lignes, dépassait
 * largement les 30 lignes par fonction de
 * `.claude/skills/user-clean-code-typescript`.
 *
 * Seule cette composition connaît le hook et `GameComponentProps` : la
 * pile, le gel et la révélation restent des vues pures.
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
        <RevealedCamps revelations={revelations} />
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
        <FrozenPanel sortedCount={sortedCount} total={total} />
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
