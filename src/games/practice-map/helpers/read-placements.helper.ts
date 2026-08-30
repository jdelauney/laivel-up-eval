import type { PracticeMapAnswer } from '../schema/answer.schema'
import type { PracticeMapConfig } from '../schema/config.schema'

/**
 * Une seule lecture de ce que vaut un placement, partagée par l'écran et par
 * le scoring : deux implémentations auraient divergé au premier ajustement
 * de règle.
 *
 * Aucune horloge, aucun aléa, aucun accès extérieur, et **aucun seuil de
 * critère** : les seuils de critère — combien de pratiques en zone, combien
 * de relations tenues — sont déclarés dans le parcours et lus par les règles
 * de l'évaluateur, jamais ici. Déplacer l'un d'eux ne touche pas ce fichier.
 *
 * Précision apportée le 31/08, la revue indépendante ayant relevé à raison
 * que le commentaire disait « aucun seuil » alors que `config.highRigorFrom`
 * est bien lu plus bas : c'est un seuil **de configuration**, qui définit ce
 * qu'est une zone de haute rigueur, et non un seuil de notation. Il décrit
 * le corpus, pas la barre à franchir. La distinction compte, parce que
 * `highRigorFrom` ne doit jamais remonter jusqu'à une surface que le joueur
 * lit ou entend — voir `PLANE_MIDPOINT` dans `use-practice-map.hook.ts`.
 */

export type PlacementReading = {
  practiceId: string
  intensity: number
  rigor: number
  // Le point posé tombe dans la zone attendue de sa propre pratique, bornes
  // incluses.
  inZone: boolean
  // `inZone` l'est, et la zone attendue de cette pratique se tient en haute
  // rigueur.
  inHighRigorZone: boolean
}

export type OrderingReading = {
  orderingId: string
  axis: 'intensity' | 'rigor'
  // La coordonnée du `higherId` posé dépasse strictement celle du `lowerId`
  // sur l'axe de la relation. L'égalité ne tient pas la relation : deux
  // pratiques posées au même niveau ne disent pas laquelle est au-dessus.
  held: boolean
}

export type Reading = {
  placements: readonly PlacementReading[]
  orderings: readonly OrderingReading[]
  inZoneCount: number
  // Au moins une pratique dont la zone attendue est en haute rigueur y est
  // effectivement posée.
  highRigorHit: boolean
  heldOrderingCount: number
}

const isWithinZone = (
  zone: PracticeMapConfig['practices'][number]['expected'],
  intensity: number,
  rigor: number,
): boolean =>
  intensity >= zone.intensityFrom &&
  intensity <= zone.intensityTo &&
  rigor >= zone.rigorFrom &&
  rigor <= zone.rigorTo

/**
 * Lit chaque placement puis chaque relation d'ordre à partir de la même
 * configuration et de la même trace, en une seule passe.
 */
export const readPlacements = (
  config: PracticeMapConfig,
  trace: PracticeMapAnswer,
): Reading => {
  const placementByPracticeId = new Map(
    trace.placements.map((placement) => [placement.practiceId, placement]),
  )

  // `parsePracticeMapTrace` garantit qu'un placement couvre chaque pratique :
  // le `find` ci-dessous rend donc toujours une valeur.
  const placements: PlacementReading[] = config.practices.map((practice) => {
    const placement = placementByPracticeId.get(practice.id)
    if (placement === undefined) {
      throw new Error(
        `la pratique « ${practice.id} » n'a pas de placement à lire`,
      )
    }

    const inZone = isWithinZone(
      practice.expected,
      placement.intensity,
      placement.rigor,
    )
    const zoneIsHighRigor = practice.expected.rigorFrom >= config.highRigorFrom

    return {
      practiceId: practice.id,
      intensity: placement.intensity,
      rigor: placement.rigor,
      inZone,
      inHighRigorZone: inZone && zoneIsHighRigor,
    }
  })

  const readingByPracticeId = new Map(
    placements.map((placement) => [placement.practiceId, placement]),
  )

  // Le schéma de configuration garantit que `higherId` et `lowerId`
  // référencent tous deux une pratique déclarée : les `find` ci-dessous
  // rendent donc toujours une valeur.
  const orderings: OrderingReading[] = config.orderings.map((ordering) => {
    const higher = readingByPracticeId.get(ordering.higherId)
    const lower = readingByPracticeId.get(ordering.lowerId)
    if (higher === undefined || lower === undefined) {
      throw new Error(
        `la relation « ${ordering.id} » référence une pratique sans lecture`,
      )
    }

    const higherValue =
      ordering.axis === 'intensity' ? higher.intensity : higher.rigor
    const lowerValue =
      ordering.axis === 'intensity' ? lower.intensity : lower.rigor

    return {
      orderingId: ordering.id,
      axis: ordering.axis,
      held: higherValue > lowerValue,
    }
  })

  return {
    placements,
    orderings,
    inZoneCount: placements.filter((placement) => placement.inZone).length,
    highRigorHit: placements.some((placement) => placement.inHighRigorZone),
    heldOrderingCount: orderings.filter((ordering) => ordering.held).length,
  }
}
