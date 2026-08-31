import { z } from 'zod'

/**
 * Ce qu'un auteur de parcours écrit pour ce jeu : la consigne, les étapes du
 * flux avec leur place attendue (`rank`) et ce qu'elles apportent
 * (`note`), et l'ordre de présentation initial (`initialOrder`).
 *
 * `rank` n'est **jamais** exposé à l'écran avant la révélation — c'est la
 * place attendue, exactement ce que le jeu mesure. `note` — ce qu'une étape
 * apporte au flux — n'est montrée qu'à la révélation, sur le modèle de
 * `marker` dans `practice-map` et de `reading` dans `ambiguity-scan`.
 *
 * `initialOrder` est écrit par le corpus, jamais tiré au hasard au
 * chargement : une partie doit rendre la même trace d'un joueur à l'autre
 * pour que les seuils veuillent dire quelque chose, et le mode rejeu du
 * projet interdit l'aléatoire non semé.
 */

const stepSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  // La place attendue de l'étape dans le flux, jamais exposée avant la
  // révélation.
  rank: z.number().int().positive(),
  // Ce que l'étape apporte au flux, montré à la révélation seulement.
  note: z.string().min(1),
})

/**
 * Sous six étapes, l'ordre exact se tient au hasard trop souvent : `1/6! ≈
 * 0,14 %` reste supportable, `1/5! ≈ 0,83 %` commence à se voir sur un
 * échantillon de joueurs modeste.
 */
const MIN_STEPS = 6

/**
 * L'écart, en positions, au-delà duquel une étape de l'ordre de présentation
 * est dite « déplacée » pour ce garde-fou de chargement.
 *
 * **Ce nombre n'est pas, et ne peut pas être, le `maxDisplacement` que le
 * parcours attache à la règle `order-within-displacement`.** La `config`
 * d'un jeu et la `rule` d'un critère restent opaques l'une à l'autre par
 * construction (`core/contracts/course.schema.ts` : « le moteur ne les
 * interprète jamais ») — ce schéma ne lit jamais `course.json`. Les deux
 * valeurs coïncident aujourd'hui (`1`), par écriture, pas par lecture : rien
 * ici ne les compare, et rien ne les rend impossibles à diverger. Le
 * couplage se ferme ailleurs, à l'endroit où les deux valeurs se
 * rencontrent effectivement — au chargement du jeu réel, pas à la
 * validation du schéma — par un test d'intégration qui rejoue l'évaluateur
 * contre le seuil **déclaré par le parcours** :
 * `__tests__/integration/config-loading/flow-order-threshold.test.ts`. Ce
 * schéma reste un plancher de robustesse locale ; ce test est le seul
 * endroit qui garantit que « ne rien toucher » perd vraiment.
 */
const DISPLACEMENT_THRESHOLD = 1

/**
 * Nombre minimal d'étapes déplacées de plus d'un cran dans l'ordre de
 * présentation. Une seule étape déplacée de plus d'une position suffit déjà
 * à faire échouer `order-within-displacement` — `maxDisplacement` est un
 * maximum, pas un compte — mais exiger deux ici évite qu'un corpus futur ne
 * s'appuie sur une seule inversion fragile, à la merci d'un renommage
 * d'étape qui la corrigerait par accident. C'est une marge de robustesse,
 * pas la condition nécessaire du refus.
 */
const MIN_INITIAL_DISPLACED_STEPS = 2

const baseConfigSchema = z.object({
  statement: z.string().min(1),
  steps: z.array(stepSchema).min(MIN_STEPS),
  initialOrder: z.array(z.string().min(1)),
})

/**
 * Refus au chargement, chacun fermant une fuite mécanique plutôt que de
 * compter sur une relecture du corpus :
 * - identifiants uniques : deux étapes de même `id` s'écraseraient
 *   silencieusement à la lecture de la trace ;
 * - **`rank` forme exactement `1..n`, sans trou ni doublon** : un trou
 *   rendrait une place attendue inatteignable, un doublon rendrait « ordre
 *   exact » ambigu ;
 * - **`initialOrder` couvre exactement les étapes déclarées** : ni un
 *   identifiant de plus, ni un de moins, ni un doublon ;
 * - **`initialOrder` ne satisfait aucun des deux critères** : au moins deux
 *   étapes y sont déplacées de plus d'une position. Sans ce refus,
 *   « soumettre sans rien toucher » tiendrait le second critère, et le jeu
 *   ne mesurerait personne.
 */
export const flowOrderConfigSchema = baseConfigSchema.superRefine(
  (config, context) => {
    config.steps.forEach((step, index) => {
      const firstIndex = config.steps.findIndex(
        (candidate) => candidate.id === step.id,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['steps', index, 'id'],
        message: `l'étape « ${step.id} » est déclarée plusieurs fois`,
      })
    })

    const sortedRanks = [...config.steps.map((step) => step.rank)].sort(
      (a, b) => a - b,
    )
    const ranksAreExact = sortedRanks.every((rank, index) => rank === index + 1)
    if (!ranksAreExact) {
      context.addIssue({
        code: 'custom',
        path: ['steps'],
        message: `les rangs des étapes ne forment pas exactement 1..${config.steps.length}, sans trou ni doublon`,
      })
    }

    const stepIds = new Set(config.steps.map((step) => step.id))
    const initialIds = new Set(config.initialOrder)
    const noDuplicateInInitialOrder =
      initialIds.size === config.initialOrder.length
    const sameLength = config.initialOrder.length === config.steps.length
    const coversExactly =
      noDuplicateInInitialOrder &&
      sameLength &&
      config.initialOrder.every((id) => stepIds.has(id))

    if (!coversExactly) {
      context.addIssue({
        code: 'custom',
        path: ['initialOrder'],
        message:
          '« initialOrder » ne couvre pas exactement les étapes déclarées : un identifiant manque, est en trop, ou est répété',
      })
      // Le refus suivant lit `rankById` contre `initialOrder` : sans une
      // couverture exacte déjà établie, il ne rendrait qu'un second refus
      // confus sur la même cause.
      return
    }

    const rankById = new Map(config.steps.map((step) => [step.id, step.rank]))
    const displacedCount = config.initialOrder.filter((id, index) => {
      const rank = rankById.get(id)
      // `coversExactly` garantit que `rank` existe toujours ici.
      if (rank === undefined) return false
      return Math.abs(index + 1 - rank) > DISPLACEMENT_THRESHOLD
    }).length

    if (displacedCount < MIN_INITIAL_DISPLACED_STEPS) {
      context.addIssue({
        code: 'custom',
        path: ['initialOrder'],
        message: `« initialOrder » ne déplace que ${displacedCount} étape(s) de plus d'une position, au moins ${MIN_INITIAL_DISPLACED_STEPS} sont requises par cette marge de robustesse (une seule étape déplacée suffit déjà à faire échouer « order-within-displacement », mais ce schéma refuse de s'appuyer sur une inversion aussi fragile)`,
      })
    }
  },
)

export type Step = z.infer<typeof stepSchema>
export type FlowOrderConfig = z.infer<typeof baseConfigSchema>
