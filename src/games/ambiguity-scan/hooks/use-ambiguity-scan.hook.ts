import { useMemo, useRef, useState } from 'react'
import { buildAmbiguityScanAnswer } from '../actions/build-ambiguity-scan-answer.action'
import {
  type AmbiguityScanConfig,
  ambiguityScanConfigSchema,
} from '../schema/config.schema'

/** Les deux temps d'une lecture : scanner, voir la révélation. */
export type AmbiguityScanPhase = 'scanning' | 'revealed'

/**
 * Un segment tel que l'écran le lit avant la révélation : son texte et son
 * état de signalement, jamais `ambiguous` ni `reading`. Rien ne distingue
 * un segment ambigu d'un segment clair dans cette forme — c'est
 * précisément ce que le jeu mesure.
 */
export type SegmentView = {
  id: string
  text: string
  flagged: boolean
}

/** Un segment ambigu révélé : son texte et la lecture qu'il ouvrait, jamais un verdict sur le joueur. */
export type SegmentRevelation = {
  id: string
  text: string
  reading: string
}

/**
 * Le cycle de vie React d'une lecture, et rien d'autre. Aucune règle de
 * verdict n'y vit : les seuils sont dans le parcours, lus par l'évaluateur.
 *
 * Le verrou de soumission tient par l'**absence de chemin** : `submit` ne
 * fait rien tant qu'aucun segment n'est signalé, et `toggle` / `submit` ne
 * font plus rien une fois la phase `'revealed'` atteinte.
 *
 * `submit` écrit la trace (`onLock`) au moment même où il bascule sur la
 * révélation — jamais après qu'elle a été lue. Un rechargement pendant la
 * révélation retrouve donc le jeu déjà soumis, jamais rejouable dans son état
 * d'avant :
 * `aidd_docs/backlog/defects/la-revelation-precede-le-verrou-donc-un-rechargement-la-rejoue.md`.
 * `advance` ne fait plus que passer au jeu suivant (`onAdvance`).
 *
 * Le hook n'expose **jamais** `ambiguous` ni `reading` avant leur heure :
 * `segments` ne porte que `id`, `text` et `flagged`, et `revelations` reste
 * vide tant que la phase n'est pas `'revealed'`. Ce qui n'est pas exposé ne
 * peut pas fuiter à l'écran.
 */
export const useAmbiguityScan = (
  config: unknown,
  onLock: (answer: unknown) => void,
  onAdvance: () => void,
) => {
  // La config ne change pas en cours de partie : la valider à chaque rendu
  // était du travail jeté.
  const parsed: AmbiguityScanConfig = useMemo(
    () => ambiguityScanConfigSchema.parse(config),
    [config],
  )

  const [flaggedIds, setFlaggedIds] = useState<ReadonlySet<string>>(new Set())
  const [phase, setPhase] = useState<AmbiguityScanPhase>('scanning')
  const lockedRef = useRef(false)
  const advancedRef = useRef(false)

  /** Bascule le signalement d'un segment. Ne fait rien une fois révélé. */
  const toggle = (segmentId: string): void => {
    if (phase !== 'scanning') return
    setFlaggedIds((current) => {
      const next = new Set(current)
      if (next.has(segmentId)) next.delete(segmentId)
      else next.add(segmentId)
      return next
    })
  }

  const canSubmit = flaggedIds.size > 0

  /**
   * Verrouille la lecture : ne fait rien tant qu'aucun segment n'est signalé.
   * Écrit la trace immédiatement, avant de basculer sur la révélation — le
   * verrou précède ce qu'il montre, jamais l'inverse.
   */
  const submit = (): void => {
    if (phase !== 'scanning') return
    if (!canSubmit) return
    if (lockedRef.current) return
    lockedRef.current = true

    onLock(buildAmbiguityScanAnswer(parsed, [...flaggedIds]))
    setPhase('revealed')
  }

  /** Passe au jeu suivant, une seule fois. */
  const advance = (): void => {
    if (phase !== 'revealed') return
    if (advancedRef.current) return
    advancedRef.current = true

    onAdvance()
  }

  const segments: readonly SegmentView[] = parsed.segments.map((segment) => ({
    id: segment.id,
    text: segment.text,
    flagged: flaggedIds.has(segment.id),
  }))

  const revelations: readonly SegmentRevelation[] =
    phase === 'revealed'
      ? parsed.segments
          .filter((segment) => segment.ambiguous)
          .map((segment) => {
            // Garanti par `ambiguityScanConfigSchema` : un segment ambigu
            // porte toujours une seconde lecture.
            if (segment.reading === undefined) {
              throw new Error(
                `le segment ambigu « ${segment.id} » n'a pas de seconde lecture à lire`,
              )
            }
            return {
              id: segment.id,
              text: segment.text,
              reading: segment.reading,
            }
          })
      : []

  return {
    statement: parsed.statement,
    promptTitle: parsed.promptTitle,
    segments,
    flaggedCount: flaggedIds.size,
    canSubmit,
    phase,
    revelations,
    toggle,
    submit,
    advance,
  }
}
