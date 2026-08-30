import { useMemo, useRef, useState } from 'react'
import { buildPracticeMapAnswer } from '../actions/build-practice-map-answer.action'
import {
  type Poles,
  type PracticeMapConfig,
  practiceMapConfigSchema,
} from '../schema/config.schema'

/** Les deux temps d'une lecture : poser, voir la révélation. */
export type PracticeMapPhase = 'placing' | 'revealed'

/** Une pratique telle que la réserve ou le plan la lisent : jamais `expected`. */
export type PracticeToken = { id: string; label: string }

/** Une pratique posée, avec sa coordonnée : jamais `expected`. */
export type PlacedToken = {
  id: string
  label: string
  intensity: number
  rigor: number
}

/** Une coordonnée, sur les deux axes, dans `[0,1]`. */
export type Position = { intensity: number; rigor: number }

/** Une pratique révélée : son repère, jamais sa place attendue. */
export type Marker = { id: string; label: string; marker: string }

/** Un pas de déplacement au clavier, identique sur les deux axes. */
const NUDGE_STEP = 0.1

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

/**
 * Le cycle de vie React d'une lecture, et rien d'autre. Aucune règle de
 * verdict n'y vit : les seuils sont dans le parcours, lus par l'évaluateur.
 *
 * Le verrou de soumission tient par l'**absence de chemin** : `submit` ne
 * fait rien tant que la réserve n'est pas vide, et `hold` / `place` / `nudge`
 * ne font plus rien une fois la phase `'revealed'` atteinte.
 *
 * Le hook n'expose **jamais** `expected` ni `marker` avant leur heure : les
 * jetons rendus à l'écran ne portent que `id` et `label`, et les repères
 * n'apparaissent dans la valeur de retour qu'en phase `'revealed'`. Ce qui
 * n'est pas exposé ne peut pas fuiter à l'écran.
 */
export const usePracticeMap = (
  config: unknown,
  onSubmit: (answer: unknown) => void,
) => {
  // La config ne change pas en cours de partie : la valider à chaque rendu
  // était du travail jeté.
  const parsed: PracticeMapConfig = useMemo(
    () => practiceMapConfigSchema.parse(config),
    [config],
  )

  const [placements, setPlacements] = useState<ReadonlyMap<string, Position>>(
    new Map(),
  )
  const [heldId, setHeldId] = useState<string | undefined>(undefined)
  const [heldPosition, setHeldPosition] = useState<Position | undefined>(
    undefined,
  )
  const [phase, setPhase] = useState<PracticeMapPhase>('placing')
  const submittedRef = useRef(false)

  /** Saisit un jeton, en réserve ou déjà posé, à sa position courante ou au centre du plan. */
  const hold = (practiceId: string): void => {
    if (phase !== 'placing') return
    const existing = placements.get(practiceId)
    setHeldId(practiceId)
    setHeldPosition(existing ?? { intensity: 0.5, rigor: 0.5 })
  }

  /** Repose le jeton saisi sans le placer. */
  const release = (): void => {
    if (phase !== 'placing') return
    setHeldId(undefined)
    setHeldPosition(undefined)
  }

  /**
   * Pose le jeton saisi à cette coordonnée, bornée dans `[0,1]`, et le
   * relâche. Remplace tout placement déjà existant pour cette pratique :
   * jamais un second placement pour la même pratique, la trace n'en porte
   * qu'un par construction et non par filtrage.
   */
  const place = (intensity: number, rigor: number): void => {
    if (phase !== 'placing' || heldId === undefined) return
    const next = new Map(placements)
    next.set(heldId, { intensity: clamp01(intensity), rigor: clamp01(rigor) })
    setPlacements(next)
    setHeldId(undefined)
    setHeldPosition(undefined)
  }

  /**
   * Déplace le jeton saisi d'un pas fixe sur un axe, borné dans `[0,1]`.
   *
   * Passe par la forme fonctionnelle de `setHeldPosition` : deux nudges
   * déclenchés dans le même tick — une flèche diagonale, ou deux touches
   * pressées avant le prochain rendu — liraient sinon la même valeur figée
   * de `heldPosition` et le second écraserait le premier.
   */
  const nudge = (axis: 'intensity' | 'rigor', direction: 1 | -1): void => {
    if (phase !== 'placing' || heldId === undefined) return
    setHeldPosition((current) =>
      current === undefined
        ? current
        : {
            ...current,
            [axis]: clamp01(current[axis] + direction * NUDGE_STEP),
          },
    )
  }

  /** Verrouille la lecture : ne fait rien tant qu'une pratique reste en réserve. */
  const submit = (): void => {
    if (phase !== 'placing') return
    if (placements.size < parsed.practices.length) return
    setPhase('revealed')
  }

  /** Transmet la trace à la façade, une seule fois. */
  const advance = (): void => {
    if (phase !== 'revealed') return
    if (submittedRef.current) return
    submittedRef.current = true

    onSubmit(
      buildPracticeMapAnswer(
        parsed,
        parsed.practices.map((practice) => {
          const placement = placements.get(practice.id)
          if (placement === undefined) {
            throw new Error(
              `la pratique « ${practice.id} » n'a pas de placement`,
            )
          }
          return { practiceId: practice.id, ...placement }
        }),
      ),
    )
  }

  const tray: readonly PracticeToken[] = parsed.practices
    .filter((practice) => !placements.has(practice.id))
    .map((practice) => ({ id: practice.id, label: practice.label }))

  const placedTokens: readonly PlacedToken[] = parsed.practices.flatMap(
    (practice) => {
      const placement = placements.get(practice.id)
      if (placement === undefined) return []
      return [{ id: practice.id, label: practice.label, ...placement }]
    },
  )

  const canSubmit = placements.size === parsed.practices.length

  const markers: readonly Marker[] =
    phase === 'revealed'
      ? parsed.practices.map((practice) => ({
          id: practice.id,
          label: practice.label,
          marker: practice.marker,
        }))
      : []

  /**
   * La position en mots : deux crans nommés par axe, tirés des pôles de la
   * configuration, jamais un nombre — un joueur au clavier ne doit pas
   * obtenir une précision que le joueur à la souris n'a pas.
   */
  const positionLabel = (intensity: number, rigor: number): string => {
    const intensityWord =
      intensity < 0.5 ? parsed.poles.intensityLow : parsed.poles.intensityHigh
    const rigorWord =
      rigor < parsed.highRigorFrom
        ? parsed.poles.rigorLow
        : parsed.poles.rigorHigh
    return `${intensityWord}, ${rigorWord}`
  }

  return {
    statement: parsed.statement,
    poles: parsed.poles as Poles,
    tray,
    placedTokens,
    heldId,
    heldPosition,
    phase,
    canSubmit,
    markers,
    hold,
    release,
    place,
    nudge,
    submit,
    advance,
    positionLabel,
  }
}
