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
  // La cause candidate que cette lecture désigne nommément, `null` quand
  // elle n'en désigne aucune.
  //
  // **Ajouté au tour 5.** Le plancher du tour 4 ne portait que sur les
  // cibles d'indices, alors que le panneau de cadrage nomme lui aussi des
  // causes : les lectures établies redisent ce que le rapport écarte, et
  // les suppositions pouvaient déguiser une hypothèse de diagnostic. Sur
  // `s2`, les cinq lectures et les cinq intitulés nommaient ensemble quatre
  // causes sur cinq — la survivante était la réponse, sans un achat.
  //
  // Une mesure lexicale ne pouvait pas servir de garde-fou : elle compte
  // aussi les locutions partagées (« de l'agent CI ») et rejetterait un
  // corpus sain. La désignation se déclare donc, comme `hint.eliminates`,
  // et le plancher se calcule sur l'union de tout ce que l'écran nomme.
  refersTo: z.string().min(1).nullable(),
})

export const hintSchema = z.object({
  id: z.string().min(1),
  // Ce sur quoi l'indice porte, jamais son contenu : visible avant l'achat.
  label: z.string().min(1),
  cost: z.number().int().positive(),
  // Révélé à l'achat seulement.
  text: z.string().min(1),
  // La cause, et l'unique cause, que le texte de cet indice écarte par son
  // nom — jamais la cause réelle.
  //
  // **Exactement une, depuis la troisième revue du 30/08.** Le tableau était
  // d'abord de taille libre, et un tableau vide y était déclaré légitime :
  // « la plupart des indices apportent une mesure, pas une élimination
  // nommée ». C'est précisément par là que la fuite est revenue. Un indice
  // qui n'élimine rien n'était borné par rien, et trois d'entre eux
  // énonçaient la cause réelle — `s1-h3` la donnait sur quatre-vingts
  // caractères. Le contrat ne bornait qu'un seul côté : ce qu'un indice
  // écarte, jamais ce qu'il confirme.
  //
  // En imposant exactement une élimination, aucun indice n'est plus *à
  // propos* de la bonne réponse : la confirmation devient inexprimable au
  // lieu d'être interdite par une consigne d'écriture. Un indice ne peut
  // plus dire que « ce n'est pas X ».
  eliminates: z.array(z.string().min(1)).length(1),
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
 * Un troisième tour a montré que le contrat ne bornait encore qu'un seul
 * côté : ce qu'un indice **écarte**, jamais ce qu'il **confirme**. Les
 * indices qui n'éliminaient rien n'étaient contraints par rien, et trois
 * d'entre eux énonçaient la cause réelle. D'où `eliminates` de taille
 * exactement un : aucun indice n'est plus à propos de la bonne réponse, et
 * un indice ne peut dire que « ce n'est pas X ».
 *
 * `causeSchema.ruledOutByReport` et `hintSchema.eliminates` rendent le
 * champ d'élimination explicite, et les huit refus suivants rendent la
 * fuite inexprimable plutôt que de compter sur la relecture du corpus :
 * - un `eliminates` qui référence une cause absente de la situation est une
 *   référence pendante ;
 * - deux indices n'écartent jamais la même cause **encore en lice** : la
 *   règle porte sur les causes qui décident quelque chose, donc sans
 *   exception. Un doublon sur une cause que le rapport a déjà écartée ne
 *   fuite rien et paie deux fois la même information — c'est l'achat
 *   gaspillé, le prix de ne pas avoir lu le rapport ;
 * - au moins un indice vise une cause déjà écartée par le rapport, sinon
 *   lire le rapport n'a aucune conséquence économique ;
 * - la cause `actual` n'est jamais `ruledOutByReport`, et n'apparaît dans le
 *   `eliminates` d'aucun indice — le rapport et les indices peuvent écarter
 *   des alternatives, jamais confirmer ou nommer la bonne réponse ;
 * - après le rapport seul, il doit rester au moins trois causes en lice —
 *   sinon le cadrage n'a plus de matière et la frugalité cesse d'être un
 *   arbitrage ;
 * - une lecture de cadrage ne désigne jamais la cause réelle, et son
 *   `refersTo` référence une cause connue de sa situation ;
 * - **le plancher de deux causes** : tout ce que l'écran nomme — ce que le
 *   rapport écarte, ce que les indices éliminent, ce que les lectures de
 *   cadrage désignent — laisse toujours au moins deux causes jamais
 *   nommées, dont la réelle ;
 * - **un chemin frugal doit exister** : au moins une combinaison d'au plus
 *   la moitié des indices (arrondie au sol) doit ramener le champ à ce
 *   plancher de deux. Sans ce refus, le plancher pourrait rendre une
 *   situation impossible à resserrer sous le seuil de frugalité.
 *
 * **Le plancher, tour 4 puis tour 5.** Les refus précédents formaient un
 * théorème que personne n'avait vu : ils forçaient les indices à couvrir
 * toutes les causes en lice sauf la réelle, et les `label` sont publics
 * avant l'achat. Lire les intitulés, barrer les causes qu'ils nomment, et la
 * survivante *était* la réponse — sans achat, sans lecture, sans cadrage. Le
 * tour 5 a montré que le même complément restait ouvert sur le panneau de
 * cadrage, qui nomme lui aussi des causes. Le plancher couvre donc l'union
 * de toutes les désignations, et remplace le refus « aucun indice pris seul
 * ne descend sous deux causes », qui depuis la cardinalité exacte ne pouvait
 * plus rejeter aucune configuration que les autres acceptaient.
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

      // Deux indices d'une même situation n'écartent jamais la même cause
      // **encore en lice**. La règle porte sur les causes qui décident
      // quelque chose, et n'a donc pas d'exception : un doublon sur une
      // cause que le rapport a déjà écartée ne fuite rien — le rapport
      // l'annonçait gratuitement — et paie deux fois la même information.
      // C'est le mécanisme même du jeu : l'achat gaspillé est le prix de ne
      // pas avoir lu le rapport.
      const liveEliminationSeen = new Map<string, string>()
      situation.hints.forEach((hint, hintIndex) => {
        const [targetId] = hint.eliminates
        if (targetId === undefined || ruledOutByReportIds.has(targetId)) return

        const firstHintId = liveEliminationSeen.get(targetId)
        if (firstHintId === undefined) {
          liveEliminationSeen.set(targetId, hint.id)
          return
        }

        context.addIssue({
          code: 'custom',
          path: [
            'situations',
            situationIndex,
            'hints',
            hintIndex,
            'eliminates',
          ],
          message: `les indices « ${firstHintId} » et « ${hint.id} » de la situation « ${situation.id} » écartent tous deux « ${targetId} », une cause encore en lice : deux indices ne peuvent pas payer la même élimination utile`,
        })
      })

      // Au moins un indice vise une cause que le rapport a déjà écartée.
      // Sans lui, le rapport gratuit n'a aucune conséquence économique :
      // tous les achats se valent, et le joueur qui ne l'a pas lu ne paie
      // jamais son inattention.
      const hasWastedHint = situation.hints.some((hint) =>
        hint.eliminates.some((causeId) => ruledOutByReportIds.has(causeId)),
      )
      if (!hasWastedHint) {
        context.addIssue({
          code: 'custom',
          path: ['situations', situationIndex, 'hints'],
          message: `aucun indice de la situation « ${situation.id} » ne vise une cause déjà écartée par le rapport : lire le rapport n'y coûte alors rien à ignorer`,
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

      // **Le plancher de deux causes, posé au tour 4 de revue.** Il remplace
      // le refus « aucun indice pris seul ne ramène le champ sous deux »,
      // qui ne pouvait plus rien rejeter depuis la cardinalité exacte, et
      // qui ne protégeait de toute façon pas de la vraie fuite.
      //
      // Celle-ci : les refus précédents forçaient les indices à couvrir
      // toutes les causes en lice sauf la réelle, et les `label` sont
      // publics avant l'achat. Lire les cinq intitulés, barrer les causes
      // qu'ils nomment, et la survivante *était* la réponse — sans lire une
      // ligne, sans acheter, sans cadrer. Le correctif du tour 3, qui a rendu
      // les indices purement éliminatifs, est précisément ce qui a rendu ce
      // complément lisible : la confirmation fermée, la soustraction ouverte.
      //
      // Le plancher casse le complément : au moins deux causes restent
      // debout même en achetant tout. Le balayage des intitulés ne rend donc
      // jamais mieux qu'un pile ou face, et la discrimination finale revient
      // au symptôme et au rapport — c'est-à-dire à une lecture, ce que le jeu
      // prétend mesurer.
      // Une lecture de cadrage ne désigne jamais la cause réelle : sinon le
      // panneau la donnerait avant même le premier achat.
      const declaredCauseIds = new Set(
        situation.causes.map((cause) => cause.id),
      )

      situation.framings.forEach((framing, framingIndex) => {
        if (framing.refersTo === null) return

        if (!declaredCauseIds.has(framing.refersTo)) {
          context.addIssue({
            code: 'custom',
            path: [
              'situations',
              situationIndex,
              'framings',
              framingIndex,
              'refersTo',
            ],
            message: `la lecture « ${framing.id} » de la situation « ${situation.id} » désigne « ${framing.refersTo} », absente de ses causes`,
          })
          return
        }

        if (framing.refersTo !== actualCause?.id) return

        context.addIssue({
          code: 'custom',
          path: [
            'situations',
            situationIndex,
            'framings',
            framingIndex,
            'refersTo',
          ],
          message: `la lecture « ${framing.id} » de la situation « ${situation.id} » désigne la cause réelle : aucune lecture de cadrage ne peut nommer la bonne réponse`,
        })
      })

      // **Le plancher, élargi au tour 5 à tout ce que l'écran nomme.** Il ne
      // portait que sur les cibles d'indices ; le panneau de cadrage nommait
      // lui aussi des causes, et le complément redevenait un singleton. Le
      // plancher couvre désormais l'union : ce que le rapport écarte, ce que
      // les indices éliminent, ce que les lectures de cadrage désignent.
      const namedCauseIds = new Set([
        ...ruledOutByReportIds,
        ...situation.hints.flatMap((hint) => hint.eliminates),
        ...situation.framings.flatMap((framing) =>
          framing.refersTo === null ? [] : [framing.refersTo],
        ),
      ])
      const standingCauses = situation.causes.filter(
        (cause) => !namedCauseIds.has(cause.id),
      )

      if (standingCauses.length < 2) {
        context.addIssue({
          code: 'custom',
          path: ['situations', situationIndex, 'causes'],
          message: `dans la situation « ${situation.id} », tout ce que l'écran nomme — rapport, indices, lectures de cadrage — ne laisse que ${standingCauses.length} cause(s) jamais nommée(s) : il en faut au moins deux, sinon la cause réelle est le complément de ce qui est affiché, lisible sans rien acheter`,
        })
      }

      // Le refus qui garde le jeu gagnable frugalement, recalé sur le
      // plancher : une combinaison d'au plus la moitié des indices (arrondie
      // au sol) doit ramener le champ **au plancher de deux**, jamais à une.
      // Sans lui, le plancher pourrait rendre une situation impossible à
      // resserrer sous le seuil de frugalité du parcours.
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
            .length === 2
        )
      })

      if (!hasFrugalPath) {
        context.addIssue({
          code: 'custom',
          path: ['situations', situationIndex, 'hints'],
          message: `aucune combinaison d'au plus ${maxFrugalHints} indice(s) ne ramène la situation « ${situation.id} » aux deux dernières causes : le seuil de frugalité serait ingagnable`,
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
