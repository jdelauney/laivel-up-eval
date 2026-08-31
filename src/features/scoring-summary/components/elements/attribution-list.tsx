import type { CriterionAttribution } from '@/core/ports/game-evaluator.interface'

/**
 * Les gestes qui ont produit un verdict de critère, un par ligne. Les deux
 * états se distinguent par un mot et une forme — jamais par la seule
 * couleur, même règle que `MeasurementMark` : un point plein contre un point
 * creux, et le mot à côté.
 *
 * Le mot n'est pas celui du critère. « tenu » et « manqué » disent le verdict
 * d'un critère ; un geste, lui, est acquis ou ne l'est pas. Employer le même
 * couple aux deux niveaux les rendait indiscernables à la lecture, alors
 * qu'ils sont imbriqués l'un dans l'autre.
 */
type AttributionListProps = Readonly<{
  attributions: readonly CriterionAttribution[]
}>

export const AttributionList = ({ attributions }: AttributionListProps) => (
  <ul aria-label="Les gestes en cause" className="flex flex-col gap-1.5 pl-5">
    {attributions.map((attribution) => (
      <li key={attribution.label} className="flex items-baseline gap-2 text-sm">
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${
            attribution.held ? 'bg-nominal' : 'border-2 border-missed'
          }`}
          aria-hidden="true"
        />
        <span className="flex-1 text-plane-foreground/70">
          {attribution.label}
        </span>
        <span
          className={`shrink-0 font-medium text-[10px] uppercase tracking-[0.1em] ${
            attribution.held ? 'text-nominal' : 'text-missed'
          }`}
        >
          {attribution.held ? 'acquis' : 'pas acquis'}
        </span>
      </li>
    ))}
  </ul>
)
