import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'
import type {
  ClaimRevelation,
  ClaimView,
  LieDetectorPhase,
} from '../../hooks/use-lie-detector.hook'
import type { Objection } from '../../schema/config.schema'
import { ClaimCard } from '../elements/claim-card'
import { ObjectionNote } from '../elements/objection-note'

/**
 * La manche : la mise en situation, les quatre affirmations, l'objection
 * quand elle est là, la révélation quand elle est là.
 *
 * Les quatre affirmations vivent en **grille**, deux colonnes dès `sm`,
 * jamais en liste verticale : le geste réel du joueur est un aller-retour
 * entre elles, et une colonne unique ne fait lire le lot qu'une fois, de
 * haut en bas — exactement la lecture superficielle que ce jeu mesure. Le
 * filet hérite du même hairline que le reste du produit : la grille partage
 * `--plane-rule` en fond et laisse `gap-px` dessiner les traits, jamais un
 * double filet.
 *
 * Un seul objet, une seule feuille qui se redessine par cran d'un temps au
 * suivant — jamais un écran qui se recharge, `DESIGN.md` l'exige. La tête
 * ne porte jamais la menteuse ni la nature de l'objection avant la
 * révélation : `revelations` reste `undefined` jusque-là, et c'est cette
 * absence, pas une garde d'affichage, qui tient l'étanchéité.
 */
export const RoundSheet = ({
  prompt,
  claims,
  phase,
  firstPickId,
  finalPickId,
  objection,
  onDesignate,
  revelations,
  foot,
}: {
  prompt: string
  claims: readonly ClaimView[]
  phase: LieDetectorPhase
  firstPickId?: string
  finalPickId?: string
  objection?: Objection
  onDesignate: (claimId: string) => void
  revelations?: readonly ClaimRevelation[]
  foot?: ReactNode
}) => {
  const interactive = phase === 'picking' || phase === 'objection'
  const currentPickId = phase === 'picking' ? undefined : firstPickId

  return (
    <section className="border border-plane-rule bg-plane">
      <header className="border-plane-rule border-b px-4 py-2 sm:py-3">
        <p className="max-w-[64ch] text-plane-foreground text-sm leading-snug sm:leading-relaxed">
          {prompt}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-px bg-plane-rule sm:grid-cols-2">
        {claims.map((claim, index) => {
          const revelation = revelations?.find((entry) => entry.id === claim.id)

          return (
            <ClaimCard
              key={claim.id}
              claimId={claim.id}
              text={claim.text}
              designated={claim.id === currentPickId}
              interactive={interactive}
              onDesignate={interactive ? onDesignate : undefined}
              verdict={
                revelation === undefined
                  ? undefined
                  : revelation.lying
                    ? 'lying'
                    : 'true'
              }
              verification={revelation?.verification}
              yours={revelations !== undefined && claim.id === finalPickId}
              order={index}
            />
          )
        })}
      </div>

      {phase === 'picking' ? (
        <p className="flex items-center gap-1.5 border-plane-rule border-t px-4 py-1.5 font-medium text-[10px] text-plane-foreground/50 uppercase tracking-[0.14em] sm:py-2.5">
          <Lock aria-hidden className="size-3" />
          Un clic verrouille votre désignation
        </p>
      ) : null}

      {objection !== undefined ? (
        <div className="border-plane-rule border-t">
          <ObjectionNote argument={objection.argument} />
        </div>
      ) : null}

      {foot !== undefined ? (
        <footer className="border-plane-rule border-t px-4 py-3">{foot}</footer>
      ) : null}
    </section>
  )
}
