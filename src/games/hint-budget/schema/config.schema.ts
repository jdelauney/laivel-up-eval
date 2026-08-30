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
  // Les causes que le texte de cet indice écarte par leur nom — jamais la
  // cause réelle. Un tableau vide est légitime : la plupart des indices
  // apportent une mesure, pas une élimination nommée. C'est ce champ,
  // structurel plutôt que déclaratif dans le texte, que les refus ci-dessous
  // vérifient : le texte doit dire exactement ce que ce tableau déclare.
  eliminates: z.array(z.string().min(1)),
})

export const causeSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  actual: z.boolean(),
  // Pourquoi cette cause est la bonne, ou pourquoi celle-ci ne l'est pas.
  // Montrée à la révélation uniquement.
  verification: z.string().min(1),
  // Le rapport gratuit écarte-t-il déjà cette cause. Jamais vrai pour la
  // cause réelle — un refus ci-dessous l'interdit.
  ruledOutByReport: z.boolean(),
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

/**
 * Tous les sous-ensembles d'indices d'une situation, par index, de taille 1
 * à `maxSize` — assez peu d'indices par situation (moins d'une dizaine) pour
 * qu'une énumération complète reste triviale au chargement.
 */
const combinationsUpTo = (length: number, maxSize: number): number[][] => {
  const indexes = Array.from({ length }, (_, index) => index)
  const combinations: number[][] = []

  const build = (start: number, current: number[]): void => {
    if (current.length > 0) combinations.push([...current])
    if (current.length === maxSize) return
    for (let i = start; i < indexes.length; i++) {
      current.push(indexes[i])
      build(i + 1, current)
      current.pop()
    }
  }

  build(0, [])
  return combinations
}

const baseConfigSchema = z.object({
  // Même nom que les six autres jeux : deux jeux ne nomment pas
  // différemment la même chose.
  statement: z.string().min(1),
  wrongCutPenalty: z.number().int().positive(),
  blindCutSurcharge: z.number().int().positive(),
  situations: z.array(situationSchema).min(2),
})

/**
 * Refus au chargement, plutôt qu'au verdict :
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
 * - la surtaxe d'aveugle qui n'excède pas le coût de l'indice le plus cher
 *   du corpus est la mise en mécanique du quatrième critère d'acceptation de
 *   la story : « trancher sans aucun indice et se tromper coûte plus cher
 *   que d'en avoir acheté un » n'est vrai pour n'importe quel indice que si
 *   la surtaxe excède strictement le plus cher d'entre eux. Le message nomme
 *   les deux montants.
 *
 * **Le graphe d'élimination des causes, ajouté après les deux revues du
 * 30/08.** Deux tours de revue ont montré le même motif : une consigne
 * d'écriture du corpus ferme un canal de fuite (l'indice le plus cher
 * paraphrase la cause réelle) et en découvre aussitôt un autre (le même
 * indice l'écarte plutôt que de la nommer, mais élimine quatre causes sur
 * cinq — la délégation totale reste possible, seul le mécanisme change).
 * Une note dans un fichier de phase ne borne rien : le contrat le doit.
 * `causeSchema.ruledOutByReport` et `hintSchema.eliminates` rendent le
 * champ d'élimination explicite, et les cinq refus suivants rendent la
 * fuite inexprimable plutôt que de compter sur la relecture du corpus :
 * - un `eliminates` qui référence une cause absente de la situation est une
 *   référence pendante ;
 * - la cause `actual` n'est jamais `ruledOutByReport`, et n'apparaît dans le
 *   `eliminates` d'aucun indice — le rapport et les indices peuvent écarter
 *   des alternatives, jamais confirmer ou nommer la bonne réponse ;
 * - après le rapport seul, il doit rester au moins trois causes en lice —
 *   sinon le cadrage n'a plus de matière et la frugalité cesse d'être un
 *   arbitrage ;
 * - **aucun indice pris seul ne peut, combiné au rapport, ramener le champ
 *   en dessous de deux causes** — c'est le refus qui ferme la délégation
 *   totale : sans lui, acheter le seul indice qui élimine tout le reste et
 *   trancher par élimination tient le critère de frugalité sans lecture ni
 *   cadrage, exactement ce que l'épique nomme comme triche à bloquer ;
 * - **un chemin frugal doit exister** : au moins une combinaison d'au plus
 *   la moitié des indices (arrondie au sol) doit, avec le rapport, ramener
 *   le champ à exactement une cause. Sans ce refus, le précédent pourrait
 *   rendre une situation ingagnable sous le seuil de frugalité du parcours.
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

      const ruledOutByReportIds = new Set(
        situation.causes
          .filter((cause) => cause.ruledOutByReport)
          .map((cause) => cause.id),
      )

      // Un `eliminates` qui référence une cause absente de la situation est
      // une référence pendante, invisible jusqu'au verdict.
      situation.hints.forEach((hint, hintIndex) => {
        hint.eliminates.forEach((causeId, eliminatesIndex) => {
          const known = situation.causes.some((cause) => cause.id === causeId)
          if (known) return

          context.addIssue({
            code: 'custom',
            path: [
              'situations',
              situationIndex,
              'hints',
              hintIndex,
              'eliminates',
              eliminatesIndex,
            ],
            message: `l'indice « ${hint.id} » écarte la cause « ${causeId} », absente de la situation « ${situation.id} »`,
          })
        })
      })

      const actualCause = situation.causes.find((cause) => cause.actual)

      if (actualCause !== undefined) {
        // Le rapport gratuit ne peut jamais écarter la bonne cause, sinon le
        // jeu se résoudrait sans jamais rien acheter.
        if (actualCause.ruledOutByReport) {
          context.addIssue({
            code: 'custom',
            path: ['situations', situationIndex, 'causes'],
            message: `le rapport de la situation « ${situation.id} » écarte la cause réelle « ${actualCause.id} » : le rapport ne peut jamais écarter la bonne cause`,
          })
        }

        // Aucun indice ne peut nommer la cause réelle parmi ses
        // éliminations : l'achat remplacerait le raisonnement au lieu de le
        // nourrir, la délégation totale que l'épique interdit.
        situation.hints.forEach((hint, hintIndex) => {
          if (!hint.eliminates.includes(actualCause.id)) return

          context.addIssue({
            code: 'custom',
            path: [
              'situations',
              situationIndex,
              'hints',
              hintIndex,
              'eliminates',
            ],
            message: `l'indice « ${hint.id} » de la situation « ${situation.id} » écarte la cause réelle « ${actualCause.id} » : un indice ne peut jamais écarter la bonne cause`,
          })
        })
      }

      // Si le rapport écarte trois causes ou plus, il ne reste plus assez de
      // matière pour que le cadrage vaille la peine d'être lu — le jeu se
      // résoudrait sur le seul rapport, gratuit.
      const remainingAfterReport =
        situation.causes.length - ruledOutByReportIds.size
      if (remainingAfterReport < 3) {
        context.addIssue({
          code: 'custom',
          path: ['situations', situationIndex, 'causes'],
          message: `le rapport de la situation « ${situation.id} » écarte ${ruledOutByReportIds.size} cause(s), il n'en reste que ${remainingAfterReport} en lice : il en faut au moins 3 pour que le cadrage garde une matière`,
        })
      }

      // Le refus qui ferme la délégation totale : aucun indice, pris seul
      // avec le rapport, ne peut ramener le champ des causes en jeu sous
      // deux — sinon acheter ce seul indice et trancher par élimination
      // tient le critère de frugalité sans une seule ligne lue.
      situation.hints.forEach((hint, hintIndex) => {
        const coveredIds = new Set([...ruledOutByReportIds, ...hint.eliminates])
        const remainingAfterHint = situation.causes.filter(
          (cause) => !coveredIds.has(cause.id),
        ).length

        if (remainingAfterHint >= 2) return

        context.addIssue({
          code: 'custom',
          path: [
            'situations',
            situationIndex,
            'hints',
            hintIndex,
            'eliminates',
          ],
          message: `l'indice « ${hint.id} » de la situation « ${situation.id} », combiné au rapport, ramène seul le champ à ${remainingAfterHint} cause(s) : aucun indice ne peut, pris seul, trancher une situation`,
        })
      })

      // Le refus qui garde le jeu gagnable frugalement : sans lui, le refus
      // précédent pourrait rendre toute situation ingagnable sous le seuil
      // de frugalité du parcours. Une combinaison d'au plus la moitié des
      // indices (arrondie au sol) doit exister qui, avec le rapport, ramène
      // le champ à exactement une cause.
      const maxFrugalHints = Math.floor(situation.hints.length / 2)
      const hasFrugalPath = combinationsUpTo(
        situation.hints.length,
        maxFrugalHints,
      ).some((combo) => {
        const coveredIds = new Set([
          ...ruledOutByReportIds,
          ...combo.flatMap(
            (hintIndex) => situation.hints[hintIndex].eliminates,
          ),
        ])
        return (
          situation.causes.filter((cause) => !coveredIds.has(cause.id))
            .length === 1
        )
      })

      if (!hasFrugalPath) {
        context.addIssue({
          code: 'custom',
          path: ['situations', situationIndex, 'hints'],
          message: `aucune combinaison d'au plus ${maxFrugalHints} indice(s) ne permet, avec le rapport, de trancher la situation « ${situation.id} » à une seule cause : le seuil de frugalité serait ingagnable`,
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
