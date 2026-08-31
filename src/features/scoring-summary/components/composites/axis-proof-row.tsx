import type { AxisProof } from '@/core/scoring/helpers/axis-proof.helper'
import { MeasurementMark } from '../elements/measurement-mark'

/**
 * Un axe, dans l'ordre de lecture de la preuve : le cran atteint — l'objet
 * le plus grand de la ligne, jamais un chiffre —, le libellé de l'axe, le
 * signal qui l'a fixé, la valeur observée en contributions, puis les deux
 * seuils qui l'encadrent, dans les mots de la grille. Aucun pourcentage,
 * aucune décimale nulle part.
 *
 * Un axe non mesuré affiche la phrase à la place du cran et aucun chiffre :
 * un cran inconnu n'est pas un cran bas. Un axe mesuré ou inféré qui n'a
 * tenu aucun signal reste sur ses gardes : la ligne nomme le signal le plus
 * proche resté sans réponse plutôt que de se taire. Un axe inféré ajoute une
 * phrase sur le nombre de signaux indirects qui l'ont fixé.
 */
type AxisProofRowProps = Readonly<{ proof: AxisProof }>

const UNMEASURED_HEADLINE = 'aucun critère ne mesure cet axe'

const indirectSignalWording = (count: number): string =>
  count > 1 ? 'signaux indirects' : 'signal indirect'

export const AxisProofRow = ({ proof }: AxisProofRowProps) => {
  const isUnmeasured = proof.measurement === 'unmeasured'
  const decisiveSignal = proof.held[0]
  const closestMiss = proof.missed[0]
  const indirectSignalCount = proof.held.length + proof.missed.length

  return (
    <li className="flex flex-col gap-3 border-plane-rule border-b py-4">
      <div className="flex items-start justify-between gap-4">
        <span className="font-semibold text-2xl leading-tight tracking-tight md:text-3xl">
          {isUnmeasured
            ? UNMEASURED_HEADLINE
            : (proof.band ?? 'sans cran défini')}
        </span>
        <MeasurementMark measurement={proof.measurement} />
      </div>

      <span className="font-medium text-plane-foreground">{proof.label}</span>

      {decisiveSignal !== undefined ? (
        <p className="text-plane-foreground/80 text-sm">
          fixé par « {decisiveSignal.question} »
        </p>
      ) : closestMiss !== undefined ? (
        <p className="text-plane-foreground/80 text-sm">
          aucun signal tenu — le plus proche resté sans réponse : «{' '}
          {closestMiss.question} »
        </p>
      ) : null}

      {isUnmeasured ? null : (
        <p className="text-plane-foreground/60 text-sm tabular-nums">
          {proof.earned} sur {proof.possible} contributions
          {proof.band !== undefined ? <> · franchi « {proof.band} »</> : null}
          {proof.missedBand !== undefined ? (
            <> · manqué « {proof.missedBand.label} »</>
          ) : null}
        </p>
      )}

      {proof.measurement === 'inferred' ? (
        <p className="text-plane-foreground/60 text-sm">
          {indirectSignalCount} {indirectSignalWording(indirectSignalCount)},
          aucune mise en situation dédiée pour cet axe
        </p>
      ) : null}
    </li>
  )
}
