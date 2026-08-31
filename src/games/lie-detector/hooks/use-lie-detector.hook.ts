import { useMemo, useRef, useState } from 'react'
import { buildLieDetectorAnswer } from '../actions/build-lie-detector-answer.action'
import type { Pick } from '../schema/answer.schema'
import {
  lieDetectorConfigSchema,
  type Objection,
} from '../schema/config.schema'

/** Les trois temps d'une manche : désigner, être contredit, voir la révélation. */
export type LieDetectorPhase = 'picking' | 'objection' | 'revealed'

/** Une affirmation telle que l'écran la lit avant la révélation : jamais `lying`. */
export type ClaimView = { id: string; text: string }

/** Une affirmation une fois la manche révélée : ce que le joueur emporte. */
export type ClaimRevelation = {
  id: string
  text: string
  lying: boolean
  verification: string
}

/**
 * Le cycle de vie React de la partie, et rien d'autre : la lecture d'une
 * manche vit dans `readRounds`, partagée avec l'évaluateur, jamais
 * recalculée ici.
 *
 * Le verrou de la désignation tient par l'**absence de chemin**, jamais par
 * une garde décorative : en phase `picking`, `designate` pose la première
 * désignation et bascule sur `objection` ; en phase `objection`, elle
 * remplace la désignation finale et bascule sur `revealed` ; en phase
 * `revealed`, aucune branche ne la rappelle — il n'existe tout simplement
 * plus de geste qui la ferait bouger.
 *
 * La dernière manche verrouillée écrit la trace complète (`onLock`) au même
 * geste qui bascule sur sa révélation — jamais après qu'elle a été lue : un
 * rechargement pendant la révélation de la dernière manche retrouve le jeu
 * déjà soumis, jamais rejouable dans son état d'avant.
 * `aidd_docs/backlog/defects/la-revelation-precede-le-verrou-donc-un-rechargement-la-rejoue.md`.
 * `advance()` fait toujours passer à la manche suivante en local pour les
 * manches intermédiaires ; à la dernière, il ne fait plus que passer au jeu
 * suivant (`onAdvance`), la trace ayant déjà été écrite.
 *
 * Le hook n'expose **jamais** `lying`, ni l'objection, avant que le joueur
 * ait posé sa première désignation : ce qui n'est pas exposé ne peut pas
 * fuiter à l'écran.
 */
export const useLieDetector = (
  config: unknown,
  onLock: (answer: unknown) => void,
  onAdvance: () => void,
) => {
  // La config ne change pas en cours de partie : la valider à chaque rendu
  // était du travail jeté.
  const parsed = useMemo(() => lieDetectorConfigSchema.parse(config), [config])

  const [roundIndex, setRoundIndex] = useState(0)
  const [phase, setPhase] = useState<LieDetectorPhase>('picking')
  const [firstPickId, setFirstPickId] = useState<string | undefined>(undefined)
  const [finalPickId, setFinalPickId] = useState<string | undefined>(undefined)
  const [completedPicks, setCompletedPicks] = useState<readonly Pick[]>([])
  const lockedRef = useRef(false)
  const advancedRef = useRef(false)

  const currentRound = parsed.rounds[roundIndex]
  const isLastRound = roundIndex === parsed.rounds.length - 1

  /**
   * Pose la désignation finale de la manche courante, bascule sur la
   * révélation. À la dernière manche, écrit la trace complète (`onLock`)
   * avant de basculer — jamais après.
   */
  const lockRound = (claimId: string): void => {
    setFinalPickId(claimId)
    setPhase('revealed')

    if (!isLastRound || currentRound === undefined) return
    if (firstPickId === undefined || lockedRef.current) return
    lockedRef.current = true

    const finishedPick: Pick = {
      roundId: currentRound.id,
      firstPickId,
      finalPickId: claimId,
    }
    onLock(buildLieDetectorAnswer(parsed, [...completedPicks, finishedPick]))
  }

  /**
   * Avant le premier geste : pose la première désignation, verrouille-la,
   * bascule sur l'objection. Après l'objection : remplace la désignation
   * finale, une fois, bascule sur la révélation. Après la révélation :
   * aucune des deux branches ne s'exécute, la fonction ne fait plus rien.
   */
  const designate = (claimId: string): void => {
    if (phase === 'picking') {
      setFirstPickId(claimId)
      setPhase('objection')
      return
    }
    if (phase === 'objection') {
      lockRound(claimId)
    }
  }

  /** Maintient la désignation courante, sans repasser par une affirmation cliquée. */
  const hold = (): void => {
    if (phase !== 'objection' || firstPickId === undefined) return
    lockRound(firstPickId)
  }

  /**
   * Passe à la manche suivante en local, ou au jeu suivant **une seule
   * fois** à la dernière manche — la trace y a déjà été écrite par
   * `lockRound`, `advance` ne fait plus que prévenir la façade.
   */
  const advance = (): void => {
    if (phase !== 'revealed') return
    if (currentRound === undefined) return
    if (firstPickId === undefined || finalPickId === undefined) return

    if (!isLastRound) {
      const finishedPick: Pick = {
        roundId: currentRound.id,
        firstPickId,
        finalPickId,
      }
      setCompletedPicks((current) => [...current, finishedPick])
      setRoundIndex((index) => index + 1)
      setFirstPickId(undefined)
      setFinalPickId(undefined)
      setPhase('picking')
      return
    }

    if (advancedRef.current) return
    advancedRef.current = true
    onAdvance()
  }

  const claims: readonly ClaimView[] =
    currentRound === undefined
      ? []
      : currentRound.claims.map((claim) => ({
          id: claim.id,
          text: claim.text,
        }))

  // L'objection n'est jamais exposée en phase `picking` : le joueur désigne
  // avant de savoir ce que l'assistant rétorquera.
  const objection: Objection | undefined =
    phase === 'picking' || currentRound === undefined
      ? undefined
      : currentRound.objection

  const revelations: readonly ClaimRevelation[] | undefined =
    phase !== 'revealed' || currentRound === undefined
      ? undefined
      : currentRound.claims.map((claim) => ({
          id: claim.id,
          text: claim.text,
          lying: claim.lying,
          verification: claim.verification,
        }))

  return {
    statement: parsed.statement,
    roundNumber: roundIndex + 1,
    roundsTotal: parsed.rounds.length,
    prompt: currentRound?.prompt,
    claims,
    phase,
    firstPickId,
    finalPickId,
    objection,
    designate,
    hold,
    advance,
    revelations,
  }
}
