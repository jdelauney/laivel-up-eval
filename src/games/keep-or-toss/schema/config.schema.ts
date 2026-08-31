import { z } from 'zod'

/**
 * Ce qu'un auteur de parcours écrit pour ce jeu : la consigne, le temps
 * imparti pour tout le lot, et le corpus de pratiques à trier.
 *
 * `keep` est la réponse attendue — jamais exposée avant la fin — et
 * `reason` le pourquoi, montré à la révélation seulement, sur le modèle de
 * `marker` dans `practice-map` et de `reveal` dans `defect-hunt`.
 */

export const keepOrTossItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  // La réponse attendue : garder ou jeter. Jamais exposée avant le gel.
  keep: z.boolean(),
  // Le pourquoi, montré à la révélation seulement.
  reason: z.string().min(1),
})

/**
 * Huit items au moins : sous ce compte, le déséquilibre des deux tiers
 * laisserait trop peu de marge pour représenter les deux verdicts.
 */
const MIN_ITEMS = 8

/**
 * Aucun verdict ne dépasse cette part du lot. Sans ce plafond, un lot à dix
 * « garder » sur douze rendrait « tout garder » payant à 83 % — le refus
 * est mécanique, porté par le schéma, jamais laissé à la relecture d'un
 * corpus.
 */
const MAX_SHARE_NUMERATOR = 2
const MAX_SHARE_DENOMINATOR = 3

/**
 * Le plafond du chronomètre, en secondes par item. Sans lui, un corpus
 * futur pourrait desserrer `durationSeconds` jusqu'à annuler la contrainte
 * de temps, et le jeu ne mesurerait plus « sans le temps de chercher ».
 *
 * Fixé à **3**, pas 2. La revue du 31/08 a mesuré qu'un plafond de deux
 * secondes par item, appliqué au corpus réel de douze pratiques, exigeait
 * 351 mots/minute soutenus **plus** un verdict par carte — au-dessus de la
 * vitesse de lecture silencieuse d'une prose non fictionnelle courante
 * (environ 240 mots/minute). Sous ce régime, le jeu mesurait la vitesse de
 * lecture, pas la connaissance : un lecteur honnête n'avait jamais le temps
 * de boucler le lot, quand bien même il connaîtrait chaque réponse. Trois
 * secondes par item laisse la place à une lecture réelle à 240 mots/minute
 * d'un corpus aux libellés courts, plus un temps de jugement par carte,
 * tout en conservant une pression réelle : le budget reste très inférieur à
 * ce qu'il faudrait pour chercher une réponse. `brute-force.test.ts` épingle
 * le débit exigé par le corpus **réel** du parcours contre ce plafond, pour
 * qu'un futur corpus plus bavard fasse rougir un test plutôt que de rouvrir
 * la fuite en silence.
 */
const MAX_SECONDS_PER_ITEM = 3

const baseConfigSchema = z.object({
  statement: z.string().min(1),
  durationSeconds: z.number().positive(),
  items: z.array(keepOrTossItemSchema).min(MIN_ITEMS),
})

/**
 * Trois refus au chargement, chacun fermant une fuite mécanique plutôt que
 * de compter sur une relecture du corpus :
 * - identifiants uniques : deux items de même `id` s'écraseraient
 *   silencieusement à la lecture de la trace ;
 * - **les deux verdicts sont représentés, et aucun ne dépasse les deux
 *   tiers du lot** : sans quoi « tout garder » ou « tout jeter » tiendrait
 *   `c1` d'un seul geste répété ;
 * - **`durationSeconds` reste sous deux secondes par item** : au-delà, le
 *   chronomètre n'est plus une contrainte et le jeu mesure autre chose que
 *   « sans le temps de chercher ». La comparaison se fait ici, contre le
 *   nombre d'items réellement déclaré — jamais une valeur figée à côté,
 *   qui pourrait diverger du corpus sans que rien ne le remarque.
 */
export const keepOrTossConfigSchema = baseConfigSchema.superRefine(
  (config, context) => {
    config.items.forEach((item, index) => {
      const firstIndex = config.items.findIndex(
        (candidate) => candidate.id === item.id,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['items', index, 'id'],
        message: `l'item « ${item.id} » est déclaré plusieurs fois`,
      })
    })

    const total = config.items.length
    const keepCount = config.items.filter((item) => item.keep).length
    const tossCount = total - keepCount

    // Comparaison par produit croisé, jamais par division : `total` n'est
    // pas nécessairement un multiple de trois, et une division flottante
    // ferait dériver la borne d'un lot à l'autre.
    const exceedsShare = (count: number): boolean =>
      count * MAX_SHARE_DENOMINATOR > total * MAX_SHARE_NUMERATOR

    if (keepCount === 0 || tossCount === 0) {
      context.addIssue({
        code: 'custom',
        path: ['items'],
        message:
          'le lot doit représenter les deux verdicts, garder et jeter, au moins une fois chacun',
      })
    } else if (exceedsShare(keepCount) || exceedsShare(tossCount)) {
      context.addIssue({
        code: 'custom',
        path: ['items'],
        message: `aucun verdict ne peut dépasser ${MAX_SHARE_NUMERATOR}/${MAX_SHARE_DENOMINATOR} du lot (garder : ${keepCount}/${total}, jeter : ${tossCount}/${total})`,
      })
    }

    const capSeconds = total * MAX_SECONDS_PER_ITEM
    if (config.durationSeconds >= capSeconds) {
      context.addIssue({
        code: 'custom',
        path: ['durationSeconds'],
        message: `« durationSeconds » (${config.durationSeconds}) doit rester sous ${MAX_SECONDS_PER_ITEM} secondes par item, soit moins de ${capSeconds} pour un lot de ${total}`,
      })
    }
  },
)

export type KeepOrTossItem = z.infer<typeof keepOrTossItemSchema>
export type KeepOrTossConfig = z.infer<typeof baseConfigSchema>
