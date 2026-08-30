import { z } from 'zod'

/**
 * Ce qu'un auteur de parcours écrit pour ce jeu : la consigne, le seuil de
 * haute rigueur, les pôles nommés des deux axes, et les sept pratiques avec
 * leur zone attendue et leurs relations d'ordre.
 *
 * Aucun champ ne dit au joueur où une pratique se tient : `expected` n'est
 * jamais exposé avant la révélation, et `marker` — le repère montré à la
 * révélation — jamais avant elle non plus.
 *
 * **Le champ `poles`, ajouté ici alors que le plan ne l'énumère pas** parmi
 * les champs de `baseConfigSchema`. `phase-3.md` exige que `positionLabel`
 * tire ses deux crans nommés « des pôles de la configuration », et
 * `phase-4.md` écrit ces pôles comme un contenu de configuration à part
 * entière, distinct de `statement`. Sans un champ dédié, ni l'écran ni le
 * corpus n'ont où les poser. Décision prise faute d'un champ déjà nommé par
 * le plan, sur le modèle de `statement` : un objet à quatre chaînes, une par
 * extrémité d'axe.
 */

export const polesSchema = z.object({
  intensityLow: z.string().min(1),
  intensityHigh: z.string().min(1),
  rigorLow: z.string().min(1),
  rigorHigh: z.string().min(1),
})

export const zoneSchema = z
  .object({
    intensityFrom: z.number().min(0).max(1),
    intensityTo: z.number().min(0).max(1),
    rigorFrom: z.number().min(0).max(1),
    rigorTo: z.number().min(0).max(1),
  })
  .superRefine((zone, context) => {
    if (zone.intensityFrom >= zone.intensityTo) {
      context.addIssue({
        code: 'custom',
        path: ['intensityTo'],
        message: `la zone est plate ou inversée sur l'axe d'intensité (${zone.intensityFrom} → ${zone.intensityTo})`,
      })
    }
    if (zone.rigorFrom >= zone.rigorTo) {
      context.addIssue({
        code: 'custom',
        path: ['rigorTo'],
        message: `la zone est plate ou inversée sur l'axe de rigueur (${zone.rigorFrom} → ${zone.rigorTo})`,
      })
    }
  })

export const practiceSchema = z.object({
  id: z.string().min(1),
  // Ce qui est écrit sur le jeton.
  label: z.string().min(1),
  expected: zoneSchema,
  // Le repère montré à la révélation, jamais avant : ce que la pratique
  // demande réellement, jamais sa place attendue.
  marker: z.string().min(1),
})

export const orderingSchema = z.object({
  id: z.string().min(1),
  axis: z.enum(['intensity', 'rigor']),
  // « higherId se tient plus haut que lowerId sur cet axe », rien d'autre.
  higherId: z.string().min(1),
  lowerId: z.string().min(1),
})

const baseConfigSchema = z.object({
  // Même nom que les sept autres jeux.
  statement: z.string().min(1),
  highRigorFrom: z.number().min(0).max(1),
  poles: polesSchema,
  practices: z.array(practiceSchema).min(4),
  orderings: z.array(orderingSchema).min(3),
})

/** Aire d'une zone, dans [0,1] : le plan entier vaut 1. */
const zoneArea = (zone: z.infer<typeof zoneSchema>): number =>
  (zone.intensityTo - zone.intensityFrom) * (zone.rigorTo - zone.rigorFrom)

/**
 * Deux zones se chevauchent dès qu'elles partagent le moindre point, bornes
 * incluses : deux intervalles fermés se touchent dès que le plus petit des
 * deux maximums dépasse ou égale le plus grand des deux minimums.
 */
const zonesOverlap = (
  a: z.infer<typeof zoneSchema>,
  b: z.infer<typeof zoneSchema>,
): boolean => {
  const intensityOverlap =
    a.intensityFrom <= b.intensityTo && b.intensityFrom <= a.intensityTo
  const rigorOverlap = a.rigorFrom <= b.rigorTo && b.rigorFrom <= a.rigorTo
  return intensityOverlap && rigorOverlap
}

/** Une zone ne peut couvrir plus d'un huitième du plan. */
const MAX_ZONE_SHARE = 0.12
/** Les zones étant disjointes, la somme de leurs aires est l'union. */
const MAX_TOTAL_SHARE = 0.5
/** Le milieu de l'axe d'intensité, pour la répartition gauche / droite. */
const INTENSITY_MIDPOINT = 0.5

/**
 * Refus au chargement, plutôt qu'au verdict — chacun ferme une fuite
 * mécanique plutôt que de compter sur une relecture du corpus :
 * - deux pratiques ou deux relations de même `id` s'écraseraient
 *   silencieusement à la lecture ;
 * - une relation dont `higherId` ou `lowerId` est absent des pratiques est
 *   une référence pendante ;
 * - une relation qui compare une pratique à elle-même ne dit rien ;
 * - deux relations qui portent la même paire sur le même axe, dans un sens
 *   ou dans l'autre, sont redondantes ou contradictoires ;
 * - **zones disjointes** : deux zones qui partagent le moindre point
 *   fermeraient sinon la fuite principale — empiler les sept jetons au même
 *   endroit poserait plusieurs pratiques « dans leur zone » d'un seul geste ;
 * - **plafond de surface** : une zone au-delà d'un huitième du plan n'est
 *   plus une lecture, c'est une moitié, et un dépôt au hasard y tombe trop
 *   souvent ;
 * - **plafond d'emprise** : la somme des zones ne dépasse jamais la moitié du
 *   plan — les zones étant déjà disjointes, la somme est l'union ;
 * - **répartition sur les deux axes** : au moins une zone de part et d'autre
 *   du seuil de haute rigueur, et au moins une de part et d'autre du milieu
 *   de l'axe d'intensité — sans quoi « tout poser en haut » ou « tout poser
 *   à droite » tiendrait le placement sans lecture ;
 * - **relations soutenues par les zones** : pour chaque relation, la zone de
 *   `higherId` se tient strictement au-dessus de celle de `lowerId` sur
 *   l'axe visé — sans ce refus, une relation que les zones ne soutiennent
 *   pas rendrait `c3` inatteignable pour un joueur pourtant parfait sur `c1`.
 */
export const practiceMapConfigSchema = baseConfigSchema.superRefine(
  (config, context) => {
    config.practices.forEach((practice, index) => {
      const firstIndex = config.practices.findIndex(
        (candidate) => candidate.id === practice.id,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['practices', index, 'id'],
        message: `la pratique « ${practice.id} » est déclarée plusieurs fois`,
      })
    })

    config.orderings.forEach((ordering, index) => {
      const firstIndex = config.orderings.findIndex(
        (candidate) => candidate.id === ordering.id,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['orderings', index, 'id'],
        message: `la relation « ${ordering.id} » est déclarée plusieurs fois`,
      })
    })

    const practiceIds = new Set(config.practices.map((practice) => practice.id))
    const practiceById = new Map(
      config.practices.map((practice) => [practice.id, practice]),
    )

    config.orderings.forEach((ordering, index) => {
      if (!practiceIds.has(ordering.higherId)) {
        context.addIssue({
          code: 'custom',
          path: ['orderings', index, 'higherId'],
          message: `la relation « ${ordering.id} » référence la pratique « ${ordering.higherId} », absente de la configuration`,
        })
      }

      if (!practiceIds.has(ordering.lowerId)) {
        context.addIssue({
          code: 'custom',
          path: ['orderings', index, 'lowerId'],
          message: `la relation « ${ordering.id} » référence la pratique « ${ordering.lowerId} », absente de la configuration`,
        })
      }

      if (ordering.higherId === ordering.lowerId) {
        context.addIssue({
          code: 'custom',
          path: ['orderings', index, 'lowerId'],
          message: `la relation « ${ordering.id} » compare la pratique « ${ordering.higherId} » à elle-même`,
        })
      }
    })

    config.orderings.forEach((ordering, index) => {
      const firstIndex = config.orderings.findIndex(
        (candidate) =>
          candidate.axis === ordering.axis &&
          ((candidate.higherId === ordering.higherId &&
            candidate.lowerId === ordering.lowerId) ||
            (candidate.higherId === ordering.lowerId &&
              candidate.lowerId === ordering.higherId)),
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['orderings', index, 'id'],
        message: `la relation « ${ordering.id} » porte la même paire que « ${config.orderings[firstIndex].id} » sur l'axe « ${ordering.axis} »`,
      })
    })

    for (let i = 0; i < config.practices.length; i++) {
      for (let j = i + 1; j < config.practices.length; j++) {
        const a = config.practices[i]
        const b = config.practices[j]
        if (!zonesOverlap(a.expected, b.expected)) continue

        context.addIssue({
          code: 'custom',
          path: ['practices', j, 'expected'],
          message: `la zone de « ${b.id} » chevauche celle de « ${a.id} »`,
        })
      }
    }

    config.practices.forEach((practice, index) => {
      const area = zoneArea(practice.expected)
      if (area <= MAX_ZONE_SHARE) return

      context.addIssue({
        code: 'custom',
        path: ['practices', index, 'expected'],
        message: `la zone de « ${practice.id} » couvre ${(area * 100).toFixed(1)} % du plan, au-delà du plafond de ${MAX_ZONE_SHARE * 100} %`,
      })
    })

    const totalArea = config.practices.reduce(
      (sum, practice) => sum + zoneArea(practice.expected),
      0,
    )
    if (totalArea > MAX_TOTAL_SHARE) {
      context.addIssue({
        code: 'custom',
        path: ['practices'],
        message: `les zones attendues couvrent ${(totalArea * 100).toFixed(1)} % du plan, au-delà du plafond de ${MAX_TOTAL_SHARE * 100} %`,
      })
    }

    const hasHighRigorZone = config.practices.some(
      (practice) => practice.expected.rigorFrom >= config.highRigorFrom,
    )
    const hasLowRigorZone = config.practices.some(
      (practice) => practice.expected.rigorTo < config.highRigorFrom,
    )
    if (!hasHighRigorZone || !hasLowRigorZone) {
      context.addIssue({
        code: 'custom',
        path: ['practices'],
        message:
          "les zones attendues ne se répartissent pas de part et d'autre du seuil de haute rigueur",
      })
    }

    const hasHighIntensityZone = config.practices.some(
      (practice) => practice.expected.intensityFrom >= INTENSITY_MIDPOINT,
    )
    const hasLowIntensityZone = config.practices.some(
      (practice) => practice.expected.intensityTo < INTENSITY_MIDPOINT,
    )
    if (!hasHighIntensityZone || !hasLowIntensityZone) {
      context.addIssue({
        code: 'custom',
        path: ['practices'],
        message:
          "les zones attendues ne se répartissent pas de part et d'autre du milieu de l'axe d'intensité",
      })
    }

    config.orderings.forEach((ordering, index) => {
      const higher = practiceById.get(ordering.higherId)
      const lower = practiceById.get(ordering.lowerId)
      // Une référence pendante est déjà signalée plus haut : ne pas la
      // signaler une seconde fois ici.
      if (higher === undefined || lower === undefined) return

      const [higherFrom, lowerTo] =
        ordering.axis === 'rigor'
          ? [higher.expected.rigorFrom, lower.expected.rigorTo]
          : [higher.expected.intensityFrom, lower.expected.intensityTo]

      if (higherFrom > lowerTo) return

      context.addIssue({
        code: 'custom',
        path: ['orderings', index],
        message: `la relation « ${ordering.id} » n'est pas soutenue par les zones : la zone de « ${ordering.higherId} » ne se tient pas strictement au-dessus de celle de « ${ordering.lowerId} » sur l'axe « ${ordering.axis} »`,
      })
    })
  },
)

export type Poles = z.infer<typeof polesSchema>
export type Zone = z.infer<typeof zoneSchema>
export type Practice = z.infer<typeof practiceSchema>
export type Ordering = z.infer<typeof orderingSchema>
export type PracticeMapConfig = z.infer<typeof practiceMapConfigSchema>
