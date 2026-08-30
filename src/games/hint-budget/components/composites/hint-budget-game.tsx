import { ChevronDown } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import type { HintView } from '../../hooks/use-hint-budget.hook'
import { useHintBudget } from '../../hooks/use-hint-budget.hook'
import { FramingLine } from '../elements/framing-line'
import { HintCard } from '../elements/hint-card'
import { CutPanel } from './cut-panel'
import { IncidentBrief } from './incident-brief'

/**
 * Le relevé des indices déjà achetés se plafonne à deux entrées visibles
 * d'emblée, le reste se replie derrière un repli natif — `DESIGN.md` :
 * « un relevé qui s'allonge ne pousse jamais la décision courante hors de
 * l'écran ». Le marché lui-même ne peut pas s'allonger : il ne fait que
 * rétrécir à mesure que ses indices rejoignent le relevé.
 */
const PURCHASED_LOG_CAP = 2

/**
 * Le septième jeu à état du parcours, et le premier du deuxième groupe :
 * une situation se cadre et s'interroge dans l'ordre que le joueur choisit,
 * avant de trancher une cause.
 *
 * **Le cadrage et le marché d'indices sont deux pairs** : aucun des deux
 * n'est l'étape d'avant ou d'après l'autre, et le geste de cadrage se
 * verrouille au dépôt, une fois par situation — la structure ne privilégie
 * ni l'un ni l'autre par sa seule position. Le rendu final de cette parité,
 * en particulier au gabarit mobile, est le travail de la phase 5.
 *
 * La consigne annonce ce cadre — que le cadre se transmet une seule fois,
 * que chaque indice a un prix affiché, que l'ordre des deux gestes est
 * libre — jamais ce qui est noté : ni les seuils, ni le fait qu'une tranche
 * fausse ou aveugle coûte davantage. `DESIGN.md`, « Un jeu ne dit jamais ce
 * qu'il note. »
 */
export const HintBudgetGame = ({ config, onSubmit }: GameComponentProps) => {
  const {
    statement,
    situationNumber,
    situationsTotal,
    symptom,
    report,
    framings,
    retainedIds,
    framingPosted,
    hints,
    causes,
    spent,
    phase,
    revelation,
    toggleFraming,
    postFraming,
    buyHint,
    cut,
    advance,
  } = useHintBudget(config, onSubmit)

  if (symptom === undefined || report === undefined) return null

  const isLastSituation = situationNumber === situationsTotal
  const interactive = phase === 'playing'

  return (
    <div className="flex flex-col gap-3 sm:gap-6">
      <Statement text={statement} situationNumber={situationNumber} />

      <div className="flex items-center justify-between">
        <SituationNumber
          situationNumber={situationNumber}
          situationsTotal={situationsTotal}
        />
        <SpentMeter spent={spent} />
      </div>

      <IncidentBrief symptom={symptom} report={report} />

      <div className="grid grid-cols-2 gap-3 sm:gap-6">
        <section className="border border-plane-rule bg-plane">
          <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
            Le cadrage
          </header>
          <div>
            {framings.map((framing) => (
              <FramingLine
                key={framing.id}
                text={framing.text}
                retained={retainedIds.includes(framing.id)}
                locked={framingPosted}
                onToggle={() => toggleFraming(framing.id)}
              />
            ))}
          </div>
          <footer className="border-plane-rule border-t px-3 py-2">
            <Button
              type="button"
              size="sm"
              disabled={framingPosted}
              onClick={postFraming}
            >
              {framingPosted ? 'Cadre transmis' : 'Transmettre ce cadre'}
            </Button>
          </footer>
        </section>

        <HintMarket hints={hints} onBuy={buyHint} />
      </div>

      <CutPanel
        causes={causes}
        interactive={interactive}
        onCut={cut}
        revelation={revelation}
      />

      {phase === 'revealed' ? (
        <div>
          <Button type="button" size="lg" onClick={advance}>
            {isLastSituation ? 'Groupe suivant' : 'Situation suivante'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Le marché : les indices restant à acheter, prix affiché avant tout clic,
 * puis le relevé de ceux déjà achetés. Le marché ne peut que rétrécir — un
 * indice acheté le quitte pour rejoindre le relevé, jamais l'inverse — donc
 * lui seul n'a pas besoin de se plafonner. Le relevé, qui ne fait que
 * s'allonger, se replie au-delà de deux entrées.
 */
const HintMarket = ({
  hints,
  onBuy,
}: {
  hints: readonly HintView[]
  onBuy: (hintId: string) => void
}) => {
  const shopHints = hints.filter((hint) => !hint.bought)
  const boughtHints = hints.filter((hint) => hint.bought)
  const visibleBought = boughtHints.slice(0, PURCHASED_LOG_CAP)
  const collapsedBought = boughtHints.slice(PURCHASED_LOG_CAP)

  return (
    <section className="border border-plane-rule bg-plane">
      <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
        L'assistant
      </header>
      <div>
        {shopHints.map((hint) => (
          <HintCard
            key={hint.id}
            label={hint.label}
            cost={hint.cost}
            bought={false}
            onBuy={() => onBuy(hint.id)}
          />
        ))}
      </div>
      {boughtHints.length > 0 ? (
        <div className="border-plane-rule border-t">
          <p className="px-3 pt-2 font-medium text-[10px] text-plane-foreground/45 uppercase tracking-[0.14em]">
            Déjà acheté
          </p>
          {visibleBought.map((hint) => (
            <HintCard
              key={hint.id}
              label={hint.label}
              cost={hint.cost}
              bought
              text={hint.text}
              onBuy={() => onBuy(hint.id)}
            />
          ))}
          {collapsedBought.length > 0 ? (
            <details>
              <summary className="cursor-pointer list-none px-3 py-2 font-medium text-[10px] text-plane-foreground/60 uppercase tracking-[0.14em] [&::-webkit-details-marker]:hidden">
                Voir {collapsedBought.length} indice
                {collapsedBought.length > 1 ? 's' : ''} de plus
              </summary>
              {collapsedBought.map((hint) => (
                <HintCard
                  key={hint.id}
                  label={hint.label}
                  cost={hint.cost}
                  bought
                  text={hint.text}
                  onBuy={() => onBuy(hint.id)}
                />
              ))}
            </details>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}

/**
 * La consigne ne change jamais d'une situation à l'autre : la relire en
 * entier à chaque fois repousse la décision courante sous la ligne de
 * flottaison, sur le modèle de `lie-detector`. Elle ne s'affiche donc en
 * entier qu'à la première situation, ensuite elle se replie derrière un
 * repli natif.
 */
const Statement = ({
  text,
  situationNumber,
}: {
  text: string
  situationNumber: number
}) => {
  if (situationNumber === 1) {
    return (
      <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
        {text}
      </p>
    )
  }

  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 font-medium text-plane-foreground/60 text-xs uppercase tracking-[0.14em] [&::-webkit-details-marker]:hidden">
        <ChevronDown
          aria-hidden
          className="size-3 transition-transform group-open:rotate-180"
        />
        Revoir la consigne
      </summary>
      <p className="mt-2 max-w-[54ch] text-plane-foreground text-sm leading-relaxed">
        {text}
      </p>
    </details>
  )
}

/**
 * La situation courante sur le total, jamais le compte des situations déjà
 * résolues : un compteur de réussites transformerait les dernières
 * situations en calcul de seuil.
 */
const SituationNumber = ({
  situationNumber,
  situationsTotal,
}: {
  situationNumber: number
  situationsTotal: number
}) => (
  <p
    aria-live="polite"
    className="font-medium text-plane-foreground/50 text-xs uppercase tabular-nums tracking-[0.14em]"
  >
    Situation {situationNumber} sur {situationsTotal}
  </p>
)

/**
 * Le coût engagé depuis le début de la partie. Une quantité qui monte, pas
 * une conséquence annoncée à l'avance — `DESIGN.md`, « le coût d'un geste
 * est annoncé, sa conséquence ne l'est jamais ».
 */
const SpentMeter = ({ spent }: { spent: number }) => (
  <p
    aria-live="polite"
    className="font-medium text-plane-foreground/50 text-xs uppercase tabular-nums tracking-[0.14em]"
  >
    Coût engagé {spent}
  </p>
)
