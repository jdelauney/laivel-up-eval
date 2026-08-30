import { useMemo, useRef, useState } from 'react'
import { buildHintBudgetAnswer } from '../actions/build-hint-budget-answer.action'
import {
  readSituations,
  type SituationReading,
} from '../helpers/read-situations.helper'
import type { Attempt, FramingEntry } from '../schema/answer.schema'
import {
  type HintBudgetConfig,
  hintBudgetConfigSchema,
} from '../schema/config.schema'

/** Les deux temps d'une situation : jouer, voir la révélation. */
export type HintBudgetPhase = 'playing' | 'revealed'

/** Une lecture de cadrage telle que l'écran la lit : jamais `established`. */
export type FramingView = { id: string; text: string }

/** Un indice tel que l'écran le lit : son texte, seulement une fois acheté. */
export type HintView = {
  id: string
  label: string
  cost: number
  bought: boolean
  text?: string
}

/** Une cause candidate telle que l'écran la lit avant la révélation : jamais `actual`. */
export type CauseView = { id: string; text: string }

export type CauseRevelation = {
  id: string
  text: string
  actual: boolean
  verification: string
}

/**
 * Le relevé d'une situation révélée : la cause réelle, sa vérification,
 * celles qui ne l'étaient pas, et le coût. Ne porte rien sur la qualité du
 * cadrage — la révélation pose la cause et le relevé, jamais un verdict sur
 * la façon dont le joueur a cadré.
 */
export type SituationRevelation = {
  causes: readonly CauseRevelation[]
  cutCauseId: string
  hintCost: number
  wrongCutPenalty?: number
  blindCutSurcharge?: number
  total: number
}

/** Lit une seule situation à travers `readSituations`, jamais recalculée ici. */
const readOne = (
  config: HintBudgetConfig,
  situation: HintBudgetConfig['situations'][number],
  attempt: Attempt,
): SituationReading =>
  readSituations(
    { ...config, situations: [situation] },
    { attempts: [attempt] },
  ).situations[0]

/**
 * Le cycle de vie React d'une situation, et rien d'autre. La lecture d'une
 * situation vit dans `readSituations`, jamais recalculée ici.
 *
 * Le verrou du cadre tient par l'**absence de chemin**, jamais par une garde
 * décorative : `toggleFraming` et `postFraming` ne font plus rien une fois
 * `framing` posé, ou une fois la situation révélée — il n'existe tout
 * simplement plus de geste qui les rappellerait.
 *
 * Le hook n'expose **jamais** `established`, `actual`, `verification`, ni le
 * `text` d'un indice non acheté, avant leur heure : ce qui n'est pas exposé
 * ne peut pas fuiter à l'écran.
 */
export const useHintBudget = (
  config: unknown,
  onSubmit: (answer: unknown) => void,
) => {
  // La config ne change pas en cours de partie : la valider à chaque rendu
  // était du travail jeté.
  const parsed = useMemo(() => hintBudgetConfigSchema.parse(config), [config])

  const [situationIndex, setSituationIndex] = useState(0)
  const [phase, setPhase] = useState<HintBudgetPhase>('playing')
  const [retainedIds, setRetainedIds] = useState<readonly string[]>([])
  const [framing, setFraming] = useState<FramingEntry | null>(null)
  const [boughtHintIds, setBoughtHintIds] = useState<readonly string[]>([])
  const [cutCauseId, setCutCauseId] = useState<string | undefined>(undefined)
  const [completedAttempts, setCompletedAttempts] = useState<
    readonly Attempt[]
  >([])
  const submittedRef = useRef(false)

  const currentSituation = parsed.situations[situationIndex]

  /** Ne fait rien une fois le cadre déposé, et rien après la tranche. */
  const toggleFraming = (framingId: string): void => {
    if (framing !== null || phase !== 'playing') return
    setRetainedIds((current) =>
      current.includes(framingId)
        ? current.filter((id) => id !== framingId)
        : [...current, framingId],
    )
  }

  /** Fige `retainedIds` et enregistre `afterHints` : la seule écriture de cette position, brute. */
  const postFraming = (): void => {
    if (framing !== null || phase !== 'playing') return
    setFraming({
      retainedIds: [...retainedIds],
      afterHints: boughtHintIds.length,
    })
  }

  /**
   * Ajoute un indice, une fois, et ne fait rien sur un indice déjà acheté.
   * Aucune action d'achat groupé n'existe dans l'API du hook.
   */
  const buyHint = (hintId: string): void => {
    if (phase !== 'playing' || boughtHintIds.includes(hintId)) return
    setBoughtHintIds((current) => [...current, hintId])
  }

  /** Clôt la situation et bascule sur `revealed`. */
  const cut = (causeId: string): void => {
    if (phase !== 'playing') return
    setCutCauseId(causeId)
    setPhase('revealed')
  }

  /**
   * Passe à la situation suivante, ou soumet la trace **une seule fois** à
   * la dernière, via un `useRef` d'appel unique, sur le modèle de
   * `useLieDetector`.
   */
  const advance = (): void => {
    if (phase !== 'revealed') return
    if (currentSituation === undefined || cutCauseId === undefined) return

    const finishedAttempt: Attempt = {
      situationId: currentSituation.id,
      framing,
      boughtHintIds: [...boughtHintIds],
      cutCauseId,
    }
    const isLastSituation = situationIndex === parsed.situations.length - 1

    if (!isLastSituation) {
      setCompletedAttempts((current) => [...current, finishedAttempt])
      setSituationIndex((index) => index + 1)
      setPhase('playing')
      setRetainedIds([])
      setFraming(null)
      setBoughtHintIds([])
      setCutCauseId(undefined)
      return
    }

    if (submittedRef.current) return
    submittedRef.current = true
    onSubmit(
      buildHintBudgetAnswer(parsed, [...completedAttempts, finishedAttempt]),
    )
  }

  const framings: readonly FramingView[] =
    currentSituation === undefined
      ? []
      : currentSituation.framings.map((entry) => ({
          id: entry.id,
          text: entry.text,
        }))

  const hints: readonly HintView[] =
    currentSituation === undefined
      ? []
      : currentSituation.hints.map((entry) => {
          const bought = boughtHintIds.includes(entry.id)
          return {
            id: entry.id,
            label: entry.label,
            cost: entry.cost,
            bought,
            text: bought ? entry.text : undefined,
          }
        })

  const causes: readonly CauseView[] =
    currentSituation === undefined
      ? []
      : currentSituation.causes.map((entry) => ({
          id: entry.id,
          text: entry.text,
        }))

  // Le coût engagé des situations déjà closes : leur relevé complet, achats
  // et pénalités éventuelles compris. `Reading.totalCost` porte déjà cette
  // somme ; un second cumul local ici aurait été la même règle écrite deux
  // fois.
  const completedSituations = parsed.situations.filter((situation) =>
    completedAttempts.some((attempt) => attempt.situationId === situation.id),
  )
  const completedCost =
    completedSituations.length === 0
      ? 0
      : readSituations(
          { ...parsed, situations: completedSituations },
          { attempts: [...completedAttempts] },
        ).totalCost

  const currentHintCost =
    currentSituation === undefined
      ? 0
      : boughtHintIds.reduce((total, hintId) => {
          const hintDef = currentSituation.hints.find(
            (entry) => entry.id === hintId,
          )
          return total + (hintDef?.cost ?? 0)
        }, 0)

  const currentAttempt: Attempt | undefined =
    currentSituation === undefined || cutCauseId === undefined
      ? undefined
      : {
          situationId: currentSituation.id,
          framing,
          boughtHintIds: [...boughtHintIds],
          cutCauseId,
        }

  const currentReading =
    phase === 'revealed' &&
    currentSituation !== undefined &&
    currentAttempt !== undefined
      ? readOne(parsed, currentSituation, currentAttempt)
      : undefined

  // Le coût engagé : le relevé des situations déjà révélées, plus les seuls
  // achats de la situation courante. Les pénalités de la situation en cours
  // n'y entrent qu'à sa révélation — le coût d'un geste est annoncé, sa
  // conséquence ne l'est jamais.
  const spent = completedCost + (currentReading?.cost ?? currentHintCost)

  const revelation: SituationRevelation | undefined =
    currentReading === undefined ||
    currentSituation === undefined ||
    cutCauseId === undefined
      ? undefined
      : {
          causes: currentSituation.causes.map((entry) => ({
            id: entry.id,
            text: entry.text,
            actual: entry.actual,
            verification: entry.verification,
          })),
          cutCauseId,
          hintCost: currentReading.hintCost,
          wrongCutPenalty: currentReading.solved
            ? undefined
            : parsed.wrongCutPenalty,
          blindCutSurcharge:
            !currentReading.solved && currentReading.blindCut
              ? parsed.blindCutSurcharge
              : undefined,
          total: currentReading.cost,
        }

  return {
    statement: parsed.statement,
    situationNumber: situationIndex + 1,
    situationsTotal: parsed.situations.length,
    symptom: currentSituation?.symptom,
    report: currentSituation?.report,
    framings,
    retainedIds,
    framingPosted: framing !== null,
    hints,
    causes,
    spent,
    phase,
    revelation,
    toggleFraming,
    postFraming,
    buyHint,
    cut,
    advance,
  }
}
