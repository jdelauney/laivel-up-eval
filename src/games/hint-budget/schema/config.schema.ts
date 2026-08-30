import { z } from 'zod'

/**
 * Ce qu'un auteur de parcours écrit pour ce jeu, et rien de plus : la
 * consigne affichée au joueur, les deux montants de l'économie, et le
 * corpus de situations qu'il porte.
 *
 * `framings` porte les deux natures de lecture d'un rapport d'incident,
 * présentées exactement pareil au joueur : `established` marque une lecture
 * que le rapport soutient, l'absence de cette marque désigne une supposition
 * que rien à l'écran n'établit. `causes.verification` et `hints.text` ne
 * sont montrés qu'à leur heure — la vérification à la révélation, le texte
 * d'un indice à son achat — jamais avant.
 */

export const framingSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  // Une lecture que le rapport d'incident soutient. L'absence de cette
  // marque désigne une supposition — une phrase qui sonne juste, que rien
  // à l'écran n'appuie. Les deux se présentent exactement pareil au joueur.
  established: z.boolean(),
})

export const hintSchema = z.object({
  id: z.string().min(1),
  // Ce sur quoi l'indice porte, jamais son contenu : visible avant l'achat.
  label: z.string().min(1),
  cost: z.number().int().positive(),
  // Révélé à l'achat seulement.
  text: z.string().min(1),
})

export const causeSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  actual: z.boolean(),
  // Pourquoi cette cause est la bonne, ou pourquoi celle-ci ne l'est pas.
  // Montrée à la révélation uniquement.
  verification: z.string().min(1),
})

export const situationSchema = z.object({
  id: z.string().min(1),
  // Ce qui est observé, la mise en situation.
  symptom: z.string().min(1),
  // Les faits déjà en main, gratuits, toujours visibles : la matière du
  // cadrage.
  report: z.array(z.string().min(1)).min(2),
  framings: z.array(framingSchema).min(3),
  hints: z.array(hintSchema).min(3),
  causes: z.array(causeSchema).min(3),
})

const baseConfigSchema = z.object({
  // Même nom que les six autres jeux : deux jeux ne nomment pas
  // différemment la même chose.
  statement: z.string().min(1),
  wrongCutPenalty: z.number().int().positive(),
  blindCutSurcharge: z.number().int().positive(),
  situations: z.array(situationSchema).min(2),
})

/**
 * Neuf refus au chargement, plutôt qu'au verdict :
 * - deux situations de même `id` s'écraseraient silencieusement à la lecture ;
 * - deux indices, deux causes ou deux lectures de cadrage de même `id` dans
 *   une situation rendraient une référence ambiguë ;
 * - une situation sans aucune cause `actual` n'a rien à résoudre ;
 * - une situation à plusieurs causes `actual` rend la tranche ambiguë ;
 * - une situation sans lecture `established`, ou sans lecture non
 *   `established`, est le garde-fou anti-triche du cadrage : sans lecture
 *   non établie, « tout cocher » est un cadrage fondé sans avoir rien lu ;
 *   sans lecture établie, « ne rien cocher » l'est aussi. C'est le mélange
 *   des deux natures qui force à lire le rapport ;
 * - le dernier refus est la mise en mécanique du quatrième critère
 *   d'acceptation de la story : « trancher sans aucun indice et se tromper
 *   coûte plus cher que d'en avoir acheté un » n'est vrai pour n'importe
 *   quel indice que si la surtaxe excède strictement le plus cher d'entre
 *   eux. Le message nomme les deux montants.
 */
export const hintBudgetConfigSchema = baseConfigSchema.superRefine(
  (config, context) => {
    config.situations.forEach((situation, index) => {
      const firstIndex = config.situations.findIndex(
        (candidate) => candidate.id === situation.id,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['situations', index, 'id'],
        message: `la situation « ${situation.id} » est déclarée plusieurs fois`,
      })
    })

    let highestHintCost = 0

    config.situations.forEach((situation, situationIndex) => {
      situation.hints.forEach((hint, hintIndex) => {
        const firstIndex = situation.hints.findIndex(
          (candidate) => candidate.id === hint.id,
        )
        if (firstIndex !== hintIndex) {
          context.addIssue({
            code: 'custom',
            path: ['situations', situationIndex, 'hints', hintIndex, 'id'],
            message: `l'indice « ${hint.id} » est déclaré plusieurs fois dans la situation « ${situation.id} »`,
          })
        }
        highestHintCost = Math.max(highestHintCost, hint.cost)
      })

      situation.causes.forEach((cause, causeIndex) => {
        const firstIndex = situation.causes.findIndex(
          (candidate) => candidate.id === cause.id,
        )
        if (firstIndex === causeIndex) return

        context.addIssue({
          code: 'custom',
          path: ['situations', situationIndex, 'causes', causeIndex, 'id'],
          message: `la cause « ${cause.id} » est déclarée plusieurs fois dans la situation « ${situation.id} »`,
        })
      })

      situation.framings.forEach((framing, framingIndex) => {
        const firstIndex = situation.framings.findIndex(
          (candidate) => candidate.id === framing.id,
        )
        if (firstIndex === framingIndex) return

        context.addIssue({
          code: 'custom',
          path: ['situations', situationIndex, 'framings', framingIndex, 'id'],
          message: `la lecture de cadrage « ${framing.id} » est déclarée plusieurs fois dans la situation « ${situation.id} »`,
        })
      })

      const actualCount = situation.causes.filter(
        (cause) => cause.actual,
      ).length

      if (actualCount === 0) {
        context.addIssue({
          code: 'custom',
          path: ['situations', situationIndex, 'causes'],
          message: `la situation « ${situation.id} » ne porte aucune cause réelle`,
        })
      }

      if (actualCount > 1) {
        context.addIssue({
          code: 'custom',
          path: ['situations', situationIndex, 'causes'],
          message: `la situation « ${situation.id} » porte plusieurs causes réelles`,
        })
      }

      const establishedCount = situation.framings.filter(
        (framing) => framing.established,
      ).length

      if (establishedCount === 0) {
        context.addIssue({
          code: 'custom',
          path: ['situations', situationIndex, 'framings'],
          message: `la situation « ${situation.id} » ne porte aucune lecture de cadrage établie`,
        })
      }

      if (establishedCount === situation.framings.length) {
        context.addIssue({
          code: 'custom',
          path: ['situations', situationIndex, 'framings'],
          message: `la situation « ${situation.id} » ne porte aucune lecture de cadrage supposée`,
        })
      }
    })

    if (config.blindCutSurcharge <= highestHintCost) {
      context.addIssue({
        code: 'custom',
        path: ['blindCutSurcharge'],
        message: `la surtaxe d'aveugle (${config.blindCutSurcharge}) n'excède pas l'indice le plus cher du corpus (${highestHintCost})`,
      })
    }
  },
)

export type Framing = z.infer<typeof framingSchema>
export type Hint = z.infer<typeof hintSchema>
export type Cause = z.infer<typeof causeSchema>
export type Situation = z.infer<typeof situationSchema>
export type HintBudgetConfig = z.infer<typeof hintBudgetConfigSchema>
