import { z } from 'zod'

/**
 * Ce qu'un auteur de parcours écrit pour ce jeu, et rien de plus : la
 * consigne affichée au joueur, et le corpus de manches qu'il porte.
 *
 * `verification` porte les DEUX sens : à quoi l'affirmation se vérifie
 * quand elle est vraie, pourquoi elle est fausse quand elle ment. Elle
 * n'est montrée qu'à la révélation, jamais avant.
 */

/**
 * 135 caractères : le budget de mise en page mobile mesuré à 390×844, plus
 * deux caractères. Le corpus le plus long tenu à cette mesure culmine à
 * 133 (`r1-b`, `r2-a`) ; au-delà, une affirmation bascule de trois à
 * quatre lignes en `text-sm leading-snug`, coûte environ 19px et double la
 * marge de 9px qui séparait alors le verrou du bas de l'écran. Ce n'est
 * pas une règle de rédaction : c'est ce budget-là, mesuré une fois, qui
 * doit se casser au chargement plutôt que devant le jury.
 */
const CLAIM_TEXT_MAX_LENGTH = 135

export const claimSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  lying: z.boolean(),
  verification: z.string().min(1),
})

export const objectionSchema = z.object({
  targetId: z.string().min(1),
  argument: z.string().min(1),
})

export const roundSchema = z.object({
  id: z.string().min(1),
  // La mise en situation du lot : ce sur quoi l'assistant affirme.
  prompt: z.string().min(1),
  claims: z.array(claimSchema).min(4),
  objection: objectionSchema,
})

const baseConfigSchema = z.object({
  // Même nom que les cinq autres jeux : deux jeux ne nomment pas
  // différemment la même chose.
  statement: z.string().min(1),
  rounds: z.array(roundSchema).min(3),
})

/** La menteuse d'une manche : la seule affirmation `lying`, s'il en existe une. */
const liarOf = (round: z.infer<typeof roundSchema>) =>
  round.claims.find((claim) => claim.lying)

/**
 * Une objection est fondée quand elle pointe la menteuse de sa manche,
 * creuse sinon — y compris quand elle pointe une cible absente du lot,
 * refusée par ailleurs par son propre garde-fou.
 */
const isObjectionFounded = (round: z.infer<typeof roundSchema>): boolean =>
  liarOf(round)?.id === round.objection.targetId

/**
 * Sept refus au chargement, plutôt qu'au verdict :
 * - deux manches de même `id` s'écraseraient silencieusement à la lecture ;
 * - deux affirmations de même `id` dans une manche rendraient une
 *   désignation ambiguë ;
 * - une manche sans aucune affirmation `lying` n'a rien à démasquer ;
 * - une manche avec plus d'une affirmation `lying` rendrait la
 *   désignation finale ambiguë : laquelle des deux compte comme
 *   « démasquée » ?
 * - une `objection.targetId` absente des affirmations de sa manche viserait
 *   une cible qui n'existe pas ;
 * - une affirmation qui dépasse `CLAIM_TEXT_MAX_LENGTH` casse la tenue
 *   mobile mesurée du jeu — voir sa documentation ;
 * - le dernier refus est le garde-fou anti-triche du jeu : sans lui, une
 *   politique fixe gagne sans lire. Toutes les objections creuses, « ne
 *   jamais bouger » gagne sans lire ; toutes fondées, « toujours suivre »
 *   gagne sans lire. Le mélange des deux natures est ce qui force à lire
 *   les affirmations.
 */
export const lieDetectorConfigSchema = baseConfigSchema.superRefine(
  (config, context) => {
    config.rounds.forEach((round, index) => {
      const firstIndex = config.rounds.findIndex(
        (candidate) => candidate.id === round.id,
      )
      if (firstIndex === index) return

      context.addIssue({
        code: 'custom',
        path: ['rounds', index, 'id'],
        message: `la manche « ${round.id} » est déclarée plusieurs fois`,
      })
    })

    config.rounds.forEach((round, roundIndex) => {
      round.claims.forEach((claim, claimIndex) => {
        const firstIndex = round.claims.findIndex(
          (candidate) => candidate.id === claim.id,
        )
        if (firstIndex === claimIndex) return

        context.addIssue({
          code: 'custom',
          path: ['rounds', roundIndex, 'claims', claimIndex, 'id'],
          message: `l'affirmation « ${claim.id} » est déclarée plusieurs fois dans la manche « ${round.id} »`,
        })
      })

      const liarCount = round.claims.filter((claim) => claim.lying).length

      if (liarCount === 0) {
        context.addIssue({
          code: 'custom',
          path: ['rounds', roundIndex, 'claims'],
          message: `la manche « ${round.id} » ne porte aucune affirmation menteuse`,
        })
      }

      if (liarCount > 1) {
        context.addIssue({
          code: 'custom',
          path: ['rounds', roundIndex, 'claims'],
          message: `la manche « ${round.id} » porte plusieurs affirmations menteuses`,
        })
      }

      const knownClaimIds = new Set(round.claims.map((claim) => claim.id))
      if (!knownClaimIds.has(round.objection.targetId)) {
        context.addIssue({
          code: 'custom',
          path: ['rounds', roundIndex, 'objection', 'targetId'],
          message: `l'objection de la manche « ${round.id} » vise « ${round.objection.targetId} », absente de son lot`,
        })
      }

      round.claims.forEach((claim, claimIndex) => {
        if (claim.text.length <= CLAIM_TEXT_MAX_LENGTH) return

        context.addIssue({
          code: 'custom',
          path: ['rounds', roundIndex, 'claims', claimIndex, 'text'],
          message: `l'affirmation « ${claim.id} » de la manche « ${round.id} » dépasse ${CLAIM_TEXT_MAX_LENGTH} caractères (${claim.text.length}) : au-delà de ce budget, mesuré sur le corpus tenu à 390×844, elle bascule sur une ligne de plus et casse la tenue mobile du jeu`,
        })
      })
    })

    const foundedCount = config.rounds.filter(isObjectionFounded).length
    const allFounded = foundedCount === config.rounds.length
    const allHollow = foundedCount === 0

    if (allFounded || allHollow) {
      context.addIssue({
        code: 'custom',
        path: ['rounds'],
        message:
          "le corpus ne porte des objections que d'une seule nature : il en faut au moins une fondée et au moins une creuse",
      })
    }
  },
)

export type Claim = z.infer<typeof claimSchema>
export type Objection = z.infer<typeof objectionSchema>
export type Round = z.infer<typeof roundSchema>
export type LieDetectorConfig = z.infer<typeof lieDetectorConfigSchema>
