import type { ReactNode } from 'react'
import type {
  ClaimRevelation,
  ClaimView,
  LieDetectorPhase,
} from '../../hooks/use-lie-detector.hook'
import type { Objection } from '../../schema/config.schema'
import { ClaimCard, ClaimVerification } from '../elements/claim-card'
import { ObjectionNote } from '../elements/objection-note'

/**
 * La manche : la mise en situation, les quatre affirmations, l'objection
 * quand elle est là, la révélation quand elle est là.
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
      <header className="border-plane-rule border-b px-4 py-3">
        <p className="max-w-[64ch] text-plane-foreground text-sm leading-relaxed">
          {prompt}
        </p>
      </header>

      <div>
        {claims.map((claim) => {
          const revelation = revelations?.find((entry) => entry.id === claim.id)

          return (
            <div key={claim.id}>
              <ClaimCard
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
                yours={revelations !== undefined && claim.id === finalPickId}
              />
              {revelation !== undefined ? (
                <ClaimVerification text={revelation.verification} />
              ) : null}
            </div>
          )
        })}
      </div>

      {objection !== undefined ? (
        <div className="border-plane-rule border-t px-4 py-3">
          <ObjectionNote argument={objection.argument} />
        </div>
      ) : null}

      {foot !== undefined ? (
        <footer className="border-plane-rule border-t px-4 py-3">{foot}</footer>
      ) : null}
    </section>
  )
}
