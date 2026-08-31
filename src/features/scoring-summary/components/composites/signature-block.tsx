import type { SignatureReading } from '@/core/session/game-session.facade'
import { AxisProofRow } from './axis-proof-row'
import { NO_LEVEL_LABEL, UnrankedReasonList } from './level-block'

type SignatureBlockProps = Readonly<{ signature: SignatureReading }>

/**
 * La signature, dans son propre cadre : elle éclaire le niveau officiel,
 * elle ne le décide pas. La phrase de portée le dit en toutes lettres, pour
 * qu'un lecteur sur la défensive ne lise pas une sanction. Le libellé
 * emprunte un `h3`, jamais le `h2` du niveau : ce titre reste celui du
 * référentiel.
 *
 * Sans niveau de signature, la raison est rendue sous la même forme que
 * `LevelBlock` — le même `unrankedReason`, construit par le même
 * `planProgression` que le verdict officiel — jamais une phrase muette.
 *
 * Ni axe qui plafonne, ni plan de progression ici : la signature ne gate
 * rien.
 */
export const SignatureBlock = ({ signature }: SignatureBlockProps) => (
  <section className="flex flex-col gap-4">
    <p className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]">
      Signature
    </p>
    {signature.level.level === undefined ? (
      <>
        <h3 className="font-semibold text-3xl leading-[0.95] tracking-tight md:text-4xl">
          {NO_LEVEL_LABEL}
        </h3>
        <UnrankedReasonList unranked={signature.unrankedReason ?? []} />
      </>
    ) : (
      <h3 className="font-semibold text-3xl leading-[0.95] tracking-tight md:text-4xl">
        {signature.level.level.label}
      </h3>
    )}
    <p className="max-w-[54ch] border-plane-rule border-t pt-4 text-plane-foreground/80 text-sm">
      La signature ne déplace aucun niveau. Elle lit la rigueur du flux sur les
      mêmes réponses, en renfort de la lecture officielle.
    </p>
    <ul className="flex flex-col border-plane-rule border-t">
      {signature.proof.map((axisProof) => (
        <AxisProofRow key={axisProof.dimensionId} proof={axisProof} />
      ))}
    </ul>
  </section>
)
