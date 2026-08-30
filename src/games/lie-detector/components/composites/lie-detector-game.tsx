import { ChevronDown } from 'lucide-react'
import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import { useLieDetector } from '../../hooks/use-lie-detector.hook'
import { RoundSheet } from './round-sheet'

/**
 * Le sixième jeu à état du parcours : une manche se joue en deux temps —
 * désigner, puis tenir ou se dédire — avant que la révélation ne vienne
 * poser ce qui était vrai.
 *
 * **La désignation se verrouille au clic**, et l'assistant ne l'objecte
 * qu'une fois posée : il n'y a alors qu'un second geste possible, maintenir
 * ou désigner autrement, jamais un troisième. L'objection est écrite dans le
 * corpus, elle ne lit jamais ce que le joueur a désigné — un adversaire
 * adaptatif serait un modèle de comportement dans la chaîne de décision.
 *
 * La consigne annonce ce cadre — qu'une seule affirmation ment par manche,
 * que la désignation se verrouille, que l'assistant donnera son avis puis
 * qu'il sera possible de désigner autrement une fois — jamais ce qui est
 * noté : ni les seuils, ni le fait que l'assistant se trompe parfois.
 * `DESIGN.md`, « Un jeu ne dit jamais ce qu'il note. »
 */
export const LieDetectorGame = ({ config, onSubmit }: GameComponentProps) => {
  const {
    statement,
    roundNumber,
    roundsTotal,
    prompt,
    claims,
    phase,
    firstPickId,
    finalPickId,
    objection,
    designate,
    hold,
    advance,
    revelations,
  } = useLieDetector(config, onSubmit)

  if (prompt === undefined) return null

  const isLastRound = roundNumber === roundsTotal

  return (
    <div className="flex flex-col gap-6">
      <Statement text={statement} roundNumber={roundNumber} />

      <RoundNumber roundNumber={roundNumber} roundsTotal={roundsTotal} />

      <RoundSheet
        prompt={prompt}
        claims={claims}
        phase={phase}
        firstPickId={firstPickId}
        finalPickId={finalPickId}
        objection={objection}
        onDesignate={designate}
        revelations={revelations}
        foot={
          phase === 'objection' ? (
            <Button type="button" size="lg" onClick={hold}>
              Je maintiens
            </Button>
          ) : undefined
        }
      />

      {phase === 'revealed' ? (
        <div>
          <Button type="button" size="lg" onClick={advance}>
            {isLastRound ? 'Situation suivante' : 'Manche suivante'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/**
 * La consigne ne change jamais d'une manche à l'autre : la relire en entier
 * à chaque fois repousse la grille de comparaison sous la ligne de
 * flottaison, mesuré à 390 de large — la première carte n'apparaissait qu'à
 * 648px sur un écran de 844. Elle ne s'affiche donc en entier qu'à la
 * première manche, là où elle doit être lue ; ensuite elle se replie derrière
 * un repli natif (`<details>`), jamais introuvable, jamais réduite au silence
 * — seulement pas répétée. Le coût du geste (verrou de la désignation) ne
 * vit pas ici : il reste porté par `RoundSheet`, annoncé à chaque manche.
 */
const Statement = ({
  text,
  roundNumber,
}: {
  text: string
  roundNumber: number
}) => {
  if (roundNumber === 1) {
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
 * La manche courante sur le total, jamais le compte des manches déjà
 * réussies : un compteur de réussites transformerait les dernières manches
 * en calcul de seuil.
 */
const RoundNumber = ({
  roundNumber,
  roundsTotal,
}: {
  roundNumber: number
  roundsTotal: number
}) => (
  <p
    aria-live="polite"
    className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em] tabular-nums"
  >
    Manche {roundNumber} sur {roundsTotal}
  </p>
)
