import type { ComponentType } from 'react'
import type { MeasurementStatus } from '@/core/ports/scoring-strategy.interface'

/**
 * Le statut de mesure d'un axe. Chaque état porte un mot lisible et une
 * forme qui lui est propre — jamais une simple variation d'opacité — pour
 * qu'un lecteur distingue les trois sans comparer deux lignes ni lire une
 * couleur.
 */
type MeasurementMarkProps = Readonly<{ measurement: MeasurementStatus }>

const MEASUREMENT_LABEL: Record<MeasurementStatus, string> = {
  measured: 'mesuré',
  inferred: 'inféré',
  unmeasured: 'non mesuré',
}

const MeasuredRule = () => (
  <span className="h-8 w-1.5 shrink-0 bg-plane-foreground" aria-hidden="true" />
)

const InferredRule = () => (
  <span
    className="h-5 w-1.5 shrink-0 border border-plane-foreground text-plane-foreground"
    style={{
      backgroundImage:
        'repeating-linear-gradient(135deg, currentColor 0 2px, transparent 2px 5px)',
    }}
    aria-hidden="true"
  />
)

const UnmeasuredRule = () => (
  <span
    className="h-8 w-1.5 shrink-0 border-2 border-plane-rule border-dashed"
    aria-hidden="true"
  />
)

const MEASUREMENT_RULE: Record<MeasurementStatus, ComponentType> = {
  measured: MeasuredRule,
  inferred: InferredRule,
  unmeasured: UnmeasuredRule,
}

export const MeasurementMark = ({ measurement }: MeasurementMarkProps) => {
  const Rule = MEASUREMENT_RULE[measurement]

  return (
    <span className="flex shrink-0 flex-col items-end gap-1.5">
      <span className="font-medium text-[10px] text-plane-foreground/60 uppercase tracking-[0.12em]">
        {MEASUREMENT_LABEL[measurement]}
      </span>
      <Rule />
    </span>
  )
}
