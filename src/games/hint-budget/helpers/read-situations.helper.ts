import type { HintBudgetAnswer } from '../schema/answer.schema'
import type { HintBudgetConfig } from '../schema/config.schema'

/**
 * Une seule lecture de ce que vaut une situation, partagée par l'écran et
 * par le scoring : deux implémentations auraient divergé au premier
 * ajustement de règle.
 *
 * Aucune horloge, aucun aléa, aucun accès extérieur : la fonction ne dépend
 * que de ses arguments.
 */
export type SituationReading = {
  situationId: string
  actualCauseId: string
  cutCauseId: string
  // La cause tranchée est la cause réelle.
  solved: boolean
  hintsBought: number
  hintsTotal: number
  // Aucun indice acheté dans cette situation.
  blindCut: boolean
  // Un cadrage a été posé, et il l'a été avant le premier achat.
  framedFirst: boolean
  // Le cadrage retient exactement l'ensemble des lectures établies — toutes,
  // et aucune autre. La version faible (« au moins une établie, aucune
  // supposée ») laissait passer la sélection d'une seule ligne au hasard,
  // trop peu cher pour un critère qui pèse la moitié du jeu ; et un brief
  // partiel est du contexte manquant, mesuré au même titre qu'un contexte
  // faux.
  framingGrounded: boolean
  // Les deux à la fois, le seul cas qui vaut quelque chose au scoring.
  framedAndGrounded: boolean
  hintCost: number
  cost: number
}

export type Reading = {
  situations: readonly SituationReading[]
  groundedFramingCount: number
  totalCost: number
}

const readSituation = (
  situation: HintBudgetConfig['situations'][number],
  attempt: HintBudgetAnswer['attempts'][number],
  wrongCutPenalty: number,
  blindCutSurcharge: number,
): SituationReading => {
  // Le schéma de configuration garantit exactement une cause `actual` par
  // situation : le `find` rend donc toujours une valeur.
  const actualCauseId = situation.causes.find((cause) => cause.actual)?.id ?? ''

  const solved = attempt.cutCauseId === actualCauseId
  const blindCut = attempt.boughtHintIds.length === 0
  const framedFirst =
    attempt.framing !== null && attempt.framing.afterHints === 0

  const establishedIds = situation.framings
    .filter((framing) => framing.established)
    .map((framing) => framing.id)
    .sort()
  const retainedIds = [...(attempt.framing?.retainedIds ?? [])].sort()
  const framingGrounded =
    attempt.framing !== null &&
    establishedIds.length === retainedIds.length &&
    establishedIds.every((id, index) => id === retainedIds[index])

  const framedAndGrounded = framedFirst && framingGrounded

  const hintById = new Map(situation.hints.map((hint) => [hint.id, hint]))
  const hintCost = attempt.boughtHintIds.reduce(
    (total, hintId) => total + (hintById.get(hintId)?.cost ?? 0),
    0,
  )

  // La surtaxe d'aveugle ne s'applique QUE sur une tranche fausse : la
  // story la conditionne à l'erreur (« trancher sans aucun indice et se
  // tromper »). Trancher juste sans indice est une lecture réussie, pas une
  // imprudence.
  const cost =
    hintCost +
    (solved ? 0 : wrongCutPenalty) +
    (!solved && blindCut ? blindCutSurcharge : 0)

  return {
    situationId: situation.id,
    actualCauseId,
    cutCauseId: attempt.cutCauseId,
    solved,
    hintsBought: attempt.boughtHintIds.length,
    hintsTotal: situation.hints.length,
    blindCut,
    framedFirst,
    framingGrounded,
    framedAndGrounded,
    hintCost,
    cost,
  }
}

/**
 * Le compte de résolutions frugales n'est pas ici : sa borne (`share`) est
 * déclarée dans la règle du parcours, et ce helper est aussi lu par
 * l'écran, qui ne doit rien savoir des seuils.
 */
export const readSituations = (
  config: HintBudgetConfig,
  trace: HintBudgetAnswer,
): Reading => {
  const attemptBySituationId = new Map(
    trace.attempts.map((attempt) => [attempt.situationId, attempt]),
  )

  // `parseHintBudgetTrace` garantit qu'une entrée couvre chaque situation :
  // le `find` ci-dessous rend donc toujours une valeur ici aussi.
  const situations = config.situations.map((situation) => {
    const attempt = attemptBySituationId.get(situation.id)
    if (attempt === undefined) {
      throw new Error(
        `la situation « ${situation.id} » n'a pas de tentative à lire`,
      )
    }
    return readSituation(
      situation,
      attempt,
      config.wrongCutPenalty,
      config.blindCutSurcharge,
    )
  })

  return {
    situations,
    groundedFramingCount: situations.filter(
      (situation) => situation.framedAndGrounded,
    ).length,
    totalCost: situations.reduce(
      (total, situation) => total + situation.cost,
      0,
    ),
  }
}
