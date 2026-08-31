import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import { useWrongAssistant } from '../../hooks/use-wrong-assistant.hook'
import { ExchangeThread } from './exchange-thread'

/**
 * Le dixième jeu du parcours, et le premier du troisième groupe
 * (« Résilience ») : un fil de conversation avec un assistant qui rend un
 * travail et commente ce qu'il a fait, s'allongeant tour après tour, où
 * chaque réponse choisie est irréversible.
 *
 * La consigne annonce le cadre — qu'un choix ne revient jamais en arrière,
 * que le fil se relit en entier — jamais ce qui est noté : ni qu'un tour
 * sur trois ment, ni le seuil de réponses correctives attendu. `DESIGN.md`,
 * « Un jeu ne dit jamais ce qu'il note. »
 *
 * Rien ne distingue un tour défectueux d'un tour sain à l'écran : même
 * cadre, même ton, `ExchangeThread` et `AssistantTurn` ne reçoivent jamais
 * `flawed`, `flaw` ni `stance`. La révélation, une fois le scénario clos,
 * ne liste que les tours défectueux **rencontrés sur ce fil précis** et ce
 * qui clochait — jamais si le joueur les avait repérés, jamais un score.
 */
export const WrongAssistantGame = ({
  config,
  onSubmit,
}: GameComponentProps) => {
  const {
    statement,
    thread,
    currentMessage,
    currentReplies,
    phase,
    reply,
    advance,
    revelations,
  } = useWrongAssistant(config, onSubmit)

  return (
    <div className="flex flex-col gap-3 sm:gap-6">
      <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
        {statement}
      </p>

      <ExchangeThread
        turns={thread}
        currentMessage={currentMessage}
        currentReplies={currentReplies}
        onReply={reply}
      />

      {phase === 'revealed' && revelations !== undefined ? (
        <Revelation revelations={revelations} onAdvance={advance} />
      ) : null}
    </div>
  )
}

/**
 * Ce qui clochait dans les tours défectueux rencontrés sur ce fil, jamais
 * lesquels le joueur avait laissé passer — un jeu déjà soumis peut être
 * rejoué, et ce qu'il en emporte est la matière, pas sa propre note. Choix
 * identique aux jeux précédents (`lie-detector`, `ambiguity-scan`).
 *
 * Cette liste s'ajoute **sous** le fil déjà rendu par `ExchangeThread` : sur
 * un chemin qui a rencontré les trois nœuds défectueux, les deux relevés
 * cumulés dépassaient l'écran, « Continuer » restant hors de vue — mesuré au
 * navigateur (voir la fiche de surface). La liste porte donc le même
 * traitement que le fil : bornée, défilante, et son propre pied fixe qui ne
 * suit jamais son contenu vers le bas.
 */
const Revelation = ({
  revelations,
  onAdvance,
}: {
  revelations: readonly { nodeId: string; message: string; flaw: string }[]
  onAdvance: () => void
}) => (
  <section className="flex flex-col border border-plane-rule bg-plane">
    <header className="border-plane-rule border-b px-4 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
      Ce qui clochait
    </header>
    <ul className="flex max-h-[10vh] flex-col gap-3 overflow-y-auto p-3 sm:max-h-[14vh] sm:p-4">
      {revelations.map((entry) => (
        <li key={entry.nodeId}>
          <p className="max-w-[58ch] text-plane-foreground/60 text-xs italic leading-snug">
            « {entry.message} »
          </p>
          <p className="mt-1 max-w-[58ch] text-plane-foreground text-sm leading-relaxed">
            {entry.flaw}
          </p>
        </li>
      ))}
    </ul>
    <footer className="border-plane-rule border-t px-4 py-3">
      <Button type="button" size="lg" onClick={onAdvance}>
        Continuer
      </Button>
    </footer>
  </section>
)
