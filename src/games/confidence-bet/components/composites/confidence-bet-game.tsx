import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import { useConfidenceBet } from '../../hooks/use-confidence-bet.hook'
import { RevealPanel } from '../elements/reveal-panel'
import { SnippetCard } from '../elements/snippet-card'
import { StakeRule } from '../elements/stake-rule'
import { BetLedger } from './bet-ledger'

/**
 * Le troisième jeu à état du parcours, sur le registre de l'instrument de
 * mesure : la règle graduée EST le jeu. Le joueur lit le code, plante son
 * repère entre le doute et la certitude, engage — la mise est verrouillée et
 * ne se reprend jamais — puis la vérité vient se poser sur la même règle,
 * à côté de sa marque.
 *
 * La consigne annonce le cadre du jeu — le nombre d'extraits, le
 * verrouillage de la mise, le sens du gain et de la perte, et le fait que
 * certains extraits ne peuvent pas être tranchés avec ce qui est montré —
 * jamais ce qui est noté : ni les seuils, ni la bande d'incertitude, ni le
 * fait que la moyenne par nature compte. `DESIGN.md`, « Un jeu ne dit jamais
 * ce qu'il note. »
 */
export const ConfidenceBetGame = ({ config, onSubmit }: GameComponentProps) => {
  const {
    statement,
    snippet,
    snippetNumber,
    snippetsTotal,
    stakes,
    neutralStake,
    selectedStake,
    canEngage,
    revelation,
    capital,
    ledger,
    isComplete,
    selectStake,
    engage,
    advance,
  } = useConfidenceBet(config, onSubmit)

  if (isComplete || snippet === undefined) return null

  return (
    <div className="flex flex-col gap-6">
      {/* Même traitement typographique que les autres jeux : un jeu à état
       * n'a pas droit à un contrat plus discret qu'un jeu sans état. */}
      <p className="max-w-[52ch] text-lg text-plane-foreground leading-relaxed">
        {statement}
      </p>

      <PositionLine
        snippetNumber={snippetNumber}
        snippetsTotal={snippetsTotal}
        capital={capital}
      />

      <SnippetCard
        label={snippet.label}
        language={snippet.language}
        code={snippet.code}
      />

      {/* L'échelle cède la place à la révélation, elle ne se grise pas :
       * une mise engagée ne se reprend jamais, et laisser le contrôle à
       * l'écran laisserait croire le contraire. */}
      {revelation === undefined ? (
        <div className="flex flex-col gap-5">
          <StakeRule
            stakes={stakes}
            neutralStake={neutralStake}
            snippetId={snippet.id}
            snippetLabel={snippet.label}
            value={selectedStake}
            onChange={selectStake}
          />
          <div>
            <Button
              type="button"
              size="lg"
              onClick={engage}
              disabled={!canEngage}
            >
              Engager la mise
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <RevealPanel
            nature={revelation.nature}
            reveal={revelation.reveal}
            delta={revelation.delta}
            stakes={stakes}
            neutralStake={neutralStake}
            stake={revelation.stake}
            truthStake={revelation.truthStake}
          />
          <div>
            <Button type="button" size="lg" onClick={advance}>
              Extrait suivant
            </Button>
          </div>
        </div>
      )}

      <BetLedger entries={ledger} stakes={stakes} neutralStake={neutralStake} />
    </div>
  )
}

/**
 * Informe, ne conditionne rien. Seule région annoncée à chaque changement,
 * le relevé ne réannonce rien.
 */
const PositionLine = ({
  snippetNumber,
  snippetsTotal,
  capital,
}: {
  snippetNumber: number
  snippetsTotal: number
  capital: number
}) => (
  <p
    aria-live="polite"
    className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em] tabular-nums"
  >
    Extrait {snippetNumber} sur {snippetsTotal} · Capital {capital}
  </p>
)
