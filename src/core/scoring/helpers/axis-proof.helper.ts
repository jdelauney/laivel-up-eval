import type { MappingEvidence } from '../../contracts/course.schema'
import type { Dimension, Grid } from '../../contracts/grid.schema'
import type { CriterionOutcome } from '../../entities/evaluation-result.entity'
import type {
  DimensionContribution,
  DimensionScore,
  MeasurementStatus,
} from '../../ports/scoring-strategy.interface'

/**
 * La preuve d'un axe, calculée une fois pour l'écran comme pour la
 * signature : le cran atteint, ce qui l'a fixé, la valeur observée et le
 * cran manqué juste au-dessus. Rien n'est rédigé ici, tout vient de la
 * grille et de la trace des critères.
 *
 * Pur : aucune horloge, aucun aléa, aucun accès réseau. Deux appels sur le
 * même profil rendent le même résultat.
 */

export type AxisSignal = {
  criterionId: string
  gameId: string
  question: string
  weight: number
  satisfied: boolean
  evidence: MappingEvidence
}

export type AxisProof = {
  dimensionId: string
  label: string
  measurement: MeasurementStatus
  /** Le cran atteint, dans les mots de la grille. Absent sans échelle. */
  band: string | undefined
  /** Le cran juste au-dessus, manqué. Absent au sommet de l'échelle. */
  missedBand: { label: string } | undefined
  /** La valeur observée, en contributions — jamais un pourcentage. */
  earned: number
  possible: number
  /** Ce qui a fixé le cran : les contributions tenues, la plus lourde en tête. */
  held: readonly AxisSignal[]
  /** Ce qui a manqué : les contributions non tenues, la plus lourde en tête. */
  missed: readonly AxisSignal[]
}

/**
 * Un critère absent de la trace est une incohérence de câblage entre le
 * scoring et l'agrégation des résultats, pas un signal sans question :
 * `buildGameOutcome` refuse déjà ce cas de la même façon.
 */
const resolveQuestion = (
  criterionId: string,
  criteria: readonly CriterionOutcome[],
): string => {
  const criterion = criteria.find(
    (candidate) => candidate.criterionId === criterionId,
  )
  if (criterion === undefined) {
    throw new Error(
      `le critère « ${criterionId} » est absent de la trace des critères`,
    )
  }
  return criterion.question
}

const toSignal = (
  contribution: DimensionContribution,
  criteria: readonly CriterionOutcome[],
): AxisSignal => ({
  criterionId: contribution.criterionId,
  gameId: contribution.gameId,
  question: resolveQuestion(contribution.criterionId, criteria),
  weight: contribution.weight,
  satisfied: contribution.satisfied,
  evidence: contribution.evidence,
})

/** Poids décroissant, puis `criterionId` pour rester déterministe. */
const sortByWeightThenId = (signals: readonly AxisSignal[]): AxisSignal[] =>
  [...signals].sort(
    (a, b) => b.weight - a.weight || a.criterionId.localeCompare(b.criterionId),
  )

/**
 * Le cran manqué, lu sur l'échelle brute de la grille — jamais recalculé
 * depuis le libellé de bande. Absent dès que la dimension n'a pas de bande à
 * l'écran, mesure comme échelle.
 */
const resolveMissedBand = (
  gridDimension: Dimension | undefined,
  dimensionScore: DimensionScore,
): AxisProof['missedBand'] => {
  const scale = gridDimension?.scale
  if (dimensionScore.band === undefined || scale === undefined) {
    return undefined
  }

  const reached = scale.filter((band) => dimensionScore.score >= band.from)
  const missed = scale.at(reached.length)

  return missed === undefined ? undefined : { label: missed.label }
}

const buildAxisProof = (
  grid: Grid,
  dimensionScore: DimensionScore,
  criteria: readonly CriterionOutcome[],
): AxisProof => {
  const gridDimension = grid.dimensions.find(
    (candidate) => candidate.id === dimensionScore.dimensionId,
  )
  const signals = dimensionScore.contributions.map((contribution) =>
    toSignal(contribution, criteria),
  )

  return {
    dimensionId: dimensionScore.dimensionId,
    label: dimensionScore.label,
    measurement: dimensionScore.measurement,
    band: dimensionScore.band,
    missedBand: resolveMissedBand(gridDimension, dimensionScore),
    earned: dimensionScore.earned,
    possible: dimensionScore.possible,
    held: sortByWeightThenId(signals.filter((signal) => signal.satisfied)),
    missed: sortByWeightThenId(signals.filter((signal) => !signal.satisfied)),
  }
}

export const proveAxes = (
  grid: Grid,
  dimensions: readonly DimensionScore[],
  criteria: readonly CriterionOutcome[],
): AxisProof[] =>
  dimensions.map((dimensionScore) =>
    buildAxisProof(grid, dimensionScore, criteria),
  )
