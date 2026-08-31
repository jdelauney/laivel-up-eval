import { useMemo, useRef, useState } from 'react'
import { buildThreeTracksAnswer } from '../actions/build-three-tracks-answer.action'
import { replayTrace, type TrackStatus } from '../helpers/run-simulation.helper'
import { threeTracksConfigSchema } from '../schema/config.schema'

/**
 * Ce que l'écran a besoin de savoir sur un chantier pour se dessiner, déjà
 * assemblé : l'élément et le composite restent muets, ils reçoivent et
 * affichent.
 */
export type TrackView = {
  id: string
  label: string
  brief: string
  work: number
  status: TrackStatus
  progress: number
  pending: number
  maxSelectable: number
}

/**
 * Le cycle de vie React de la partie, et rien d'autre : l'avancée, la dérive
 * et la mort d'un chantier vivent dans la simulation partagée avec
 * l'évaluateur, jamais recalculées ici.
 *
 * Le registre est en ajout seul : un tour clos rejoint `playedTurns` et n'en
 * ressort jamais, aucune fonction n'est exposée pour l'en retirer.
 *
 * Aucune révélation ne s'affiche dans ce jeu entre le dernier tour et le
 * passage au suivant : `closeTurn` écrit la trace (`onLock`) et avance
 * (`onAdvance`) dans le même geste, au dernier tour.
 */
export const useThreeTracks = (
  config: unknown,
  onLock: (answer: unknown) => void,
  onAdvance: () => void,
) => {
  // La config ne change pas d'un tour à l'autre : la valider à chaque rendu
  // était du travail jeté.
  const parsed = useMemo(() => threeTracksConfigSchema.parse(config), [config])
  const [playedTurns, setPlayedTurns] = useState<
    readonly Readonly<Record<string, number>>[]
  >([])
  const [pending, setPending] = useState<Readonly<Record<string, number>>>({})
  const submitted = useRef(false)

  const closedTurns = useMemo(
    () =>
      playedTurns.map((allocationByTrack) => ({
        allocations: parsed.tracks.map((track) => ({
          trackId: track.id,
          attention: allocationByTrack[track.id] ?? 0,
        })),
      })),
    [parsed, playedTurns],
  )

  const state = useMemo(
    () => replayTrace(parsed, closedTurns),
    [parsed, closedTurns],
  )

  const turnNumber = state.turn + 1
  const isComplete = state.turn >= parsed.turns
  const attentionPlaced = Object.values(pending).reduce(
    (sum, value) => sum + value,
    0,
  )
  const attentionRemaining = parsed.attentionPerTurn - attentionPlaced

  const tracks: readonly TrackView[] = parsed.tracks.map((track) => {
    const simulated = state.tracks.find((entry) => entry.id === track.id)
    const status: TrackStatus = simulated?.status ?? 'open'
    const trackPending = pending[track.id] ?? 0
    const outOfGame = status === 'merged' || status === 'lost'

    return {
      id: track.id,
      label: track.label,
      brief: track.brief,
      work: track.work,
      status,
      progress: simulated?.progress ?? 0,
      pending: trackPending,
      /**
       * Le plus haut posable sur ce chantier, là, maintenant : jamais plus
       * que son plafond, jamais plus que ce que l'attention du tour permet
       * encore une fois sa propre pastille remise à zéro.
       */
      maxSelectable: outOfGame
        ? 0
        : Math.min(parsed.maxPerTrack, attentionRemaining + trackPending),
    }
  })

  /**
   * Refuse hors jeu, au-delà du plafond du chantier ou de l'attention du
   * tour : la même règle vaut à l'écran et à la relecture de la trace, un
   * clic qui la franchirait ne produirait jamais une réponse valide.
   */
  const setAttention = (trackId: string, value: number): void => {
    if (isComplete) return
    const track = tracks.find((entry) => entry.id === trackId)
    if (track === undefined || value > track.maxSelectable) return

    setPending((current) => ({ ...current, [trackId]: value }))
  }

  /**
   * Toujours disponible, y compris à zéro unité posée : l'attention non
   * placée est perdue, sans avertissement. C'est ce prix qui force un
   * arbitrage entre chantiers plutôt que d'imposer une réponse complète.
   */
  const closeTurn = (): void => {
    if (isComplete) return

    const next = [...playedTurns, pending]
    setPlayedTurns(next)
    setPending({})

    /** Soumet au dernier tour, une seule fois, par l'action. */
    if (next.length < parsed.turns || submitted.current) return
    submitted.current = true
    onLock(buildThreeTracksAnswer(parsed, next))
    onAdvance()
  }

  return {
    statement: parsed.statement,
    tracks,
    turnNumber,
    turnsTotal: parsed.turns,
    maxPerTrack: parsed.maxPerTrack,
    attentionRemaining,
    isComplete,
    setAttention,
    closeTurn,
  }
}
