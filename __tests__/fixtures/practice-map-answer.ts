import { buildPracticeMapAnswer } from '@/games/practice-map/actions/build-practice-map-answer.action'
import {
  type PracticeMapConfig,
  practiceMapConfigSchema,
} from '@/games/practice-map/schema/config.schema'

/**
 * Trois traces de référence pour `g2-2`, sur le modèle de
 * `hint-budget-answer.ts` : la lecture juste, la lecture nulle, la lecture
 * décalée en bloc.
 *
 * **Le relevé de difficulté du corpus réel**, sous un placement uniforme au
 * hasard, indépendant par pratique :
 * - `g2-2-c1` (quatre pratiques en zone sur sept) : quasi nulle. Les sept
 *   zones du corpus couvrent 40,6 % du plan au total ; l'espérance du nombre
 *   de pratiques tombant chacune dans sa propre zone sous un tirage uniforme
 *   est donc de 0,41 pratique en zone sur sept, très loin du seuil de
 *   quatre ;
 * - `g2-2-c2` (au moins une pratique de haute rigueur dans sa propre zone) :
 *   environ 13 %, du même ordre que `lie-detector` (15,6 %) et
 *   `hint-budget` (10,4 %) ;
 * - `g2-2-c3` (six relations sur sept tenues) : **8,33 %**, soit exactement
 *   un douzième. Corrigé le 31/08 sur constat de la revue indépendante, qui
 *   a recalculé la valeur exacte et l'a confirmée par vingt millions de
 *   tirages. Le chiffre annoncé jusque-là — `(C(7,6) + C(7,7)) × (1/2)⁷ =
 *   6,25 %` — supposait les sept relations **indépendantes**. Elles ne le
 *   sont pas : `p1` porte à elle seule `o2`, `o5` et `o6` sur l'axe de
 *   rigueur, plus `o7` sur celui d'intensité, de sorte que sa coordonnée
 *   tirée décide quatre relations à la fois. Un tiers d'écart, dans le sens
 *   du plus permissif.
 */

const centerOf = (
  zone: PracticeMapConfig['practices'][number]['expected'],
) => ({
  intensity: (zone.intensityFrom + zone.intensityTo) / 2,
  rigor: (zone.rigorFrom + zone.rigorTo) / 2,
})

/** Chaque pratique posée au centre de sa propre zone attendue. */
export const correctPracticeMapAnswer = (config: unknown): unknown => {
  const parsed = practiceMapConfigSchema.parse(config)
  return buildPracticeMapAnswer(
    parsed,
    parsed.practices.map((practice) => ({
      practiceId: practice.id,
      ...centerOf(practice.expected),
    })),
  )
}

/** Les sept pratiques empilées au même point, au centre du plan. */
export const nullPracticeMapAnswer = (config: unknown): unknown => {
  const parsed = practiceMapConfigSchema.parse(config)
  return buildPracticeMapAnswer(
    parsed,
    parsed.practices.map((practice) => ({
      practiceId: practice.id,
      intensity: 0.5,
      rigor: 0.5,
    })),
  )
}

/**
 * Chaque pratique posée au centre de sa propre zone, puis décalée de 0,3
 * vers le bas sur l'axe de rigueur, bornée à zéro : l'ordre relatif entre
 * les pratiques est préservé, mais la plupart quittent leur propre zone.
 */
export const shiftedDownPracticeMapAnswer = (config: unknown): unknown => {
  const parsed = practiceMapConfigSchema.parse(config)
  return buildPracticeMapAnswer(
    parsed,
    parsed.practices.map((practice) => {
      const { intensity, rigor } = centerOf(practice.expected)
      return {
        practiceId: practice.id,
        intensity,
        rigor: Math.max(0, rigor - 0.3),
      }
    }),
  )
}

/**
 * Les sept pratiques posées sur une diagonale unique, dans l'ordre des
 * pratiques de la configuration : une politique de placement aveugle qui ne
 * lit rien, mais qui n'empile pas non plus tout au même point.
 */
export const diagonalPracticeMapAnswer = (config: unknown): unknown => {
  const parsed = practiceMapConfigSchema.parse(config)
  return buildPracticeMapAnswer(
    parsed,
    parsed.practices.map((practice, index) => {
      const step =
        parsed.practices.length <= 1 ? 0 : index / (parsed.practices.length - 1)
      return { practiceId: practice.id, intensity: step, rigor: step }
    }),
  )
}
