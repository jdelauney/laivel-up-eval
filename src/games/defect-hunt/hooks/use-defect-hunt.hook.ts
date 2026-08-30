import { useMemo, useRef, useState } from 'react'
import { buildDefectHuntAnswer } from '../actions/build-defect-hunt-answer.action'
import { type Reading, readReview } from '../helpers/read-review.helper'
import { snippetLines } from '../helpers/snippet-lines.helper'
import type { DefectHuntAnswer } from '../schema/answer.schema'
import {
  type DefectKind,
  defectHuntConfigSchema,
} from '../schema/config.schema'
import { useElapsedSeconds } from './use-elapsed-seconds.hook'

/**
 * Le verdict d'une ligne une fois la revue rendue, mutuellement exclusif :
 * une ligne trouvée, manquée, marquée à côté, ou ni l'un ni l'autre —
 * `undefined` avant le rendu comme pour toute ligne saine et non marquée.
 */
export type LineVerdict = 'found' | 'missed' | 'false-positive' | undefined

/** Un défaut révélé, dans l'ordre déclaré par la configuration. */
export type DefectRevelation = {
  line: number
  kind: DefectKind
  reveal: string
  found: boolean
}

/**
 * Le cycle de vie React de la partie, et rien d'autre : la lecture de la
 * revue vit dans `readReview`, partagée avec l'évaluateur, jamais recalculée
 * ici.
 *
 * Avant le rendu, les marques sont en bascule libre : `toggleLine` pose ou
 * retire. Après le rendu (`submitReview`), aucune fonction exposée ne change
 * plus rien à l'extrait — le verrou tient par l'absence de chemin, pas par
 * une garde décorative : `toggleLine` devient un no-op, il n'existe aucun
 * autre moyen de rouvrir la revue.
 *
 * Le hook n'expose JAMAIS la nature ni la ligne d'un défaut avant le rendu :
 * ce qui n'est pas exposé ne peut pas fuiter à l'écran.
 */
export const useDefectHunt = (
  config: unknown,
  onSubmit: (answer: unknown) => void,
) => {
  // La config ne change pas en cours de partie : la valider à chaque rendu
  // était du travail jeté.
  const parsed = useMemo(() => defectHuntConfigSchema.parse(config), [config])
  const lines = useMemo(() => snippetLines(parsed.snippet.code), [parsed])

  const [markedLines, setMarkedLines] = useState<ReadonlySet<number>>(
    () => new Set(),
  )
  const [frozenAnswer, setFrozenAnswer] = useState<
    DefectHuntAnswer | undefined
  >(undefined)
  const submitted = frozenAnswer !== undefined
  const onSubmitCalled = useRef(false)

  // Le chronomètre tourne tant que la revue n'est pas rendue, et s'arrête
  // net au rendu : `submitted` bascule `running` à `false` le même rendu où
  // `frozenAnswer` se pose.
  const { elapsedSeconds, readElapsedSeconds } = useElapsedSeconds(!submitted)

  /** Avant le rendu seulement : après, cette fonction ne fait plus rien. */
  const toggleLine = (line: number): void => {
    if (submitted) return

    setMarkedLines((current) => {
      const next = new Set(current)
      if (next.has(line)) next.delete(line)
      else next.add(line)
      return next
    })
  }

  /**
   * Fige la durée à l'instant de l'appel, construit la trace, la garde en
   * mémoire, et bascule sur la révélation. N'appelle pas encore `onSubmit` :
   * c'est `advance` qui soumet, sur le modèle de `useConfidenceBet`.
   */
  const submitReview = (): void => {
    if (submitted) return

    setFrozenAnswer(
      buildDefectHuntAnswer(parsed, [...markedLines], readElapsedSeconds()),
    )
  }

  /** Soumet la trace déjà figée, une seule fois. */
  const advance = (): void => {
    if (frozenAnswer === undefined || onSubmitCalled.current) return
    onSubmitCalled.current = true
    onSubmit(frozenAnswer)
  }

  const reading: Reading | undefined = useMemo(
    () =>
      frozenAnswer === undefined ? undefined : readReview(parsed, frozenAnswer),
    [parsed, frozenAnswer],
  )

  const lineVerdict = (line: number): LineVerdict => {
    if (reading === undefined) return undefined
    if (reading.found.some((defect) => defect.line === line)) return 'found'
    if (reading.missed.some((defect) => defect.line === line)) return 'missed'
    if (reading.falsePositiveLines.includes(line)) return 'false-positive'
    return undefined
  }

  const revelations: readonly DefectRevelation[] | undefined = useMemo(() => {
    if (frozenAnswer === undefined) return undefined
    const marked = new Set(frozenAnswer.markedLines)

    return parsed.defects.map((defectEntry) => ({
      line: defectEntry.line,
      kind: defectEntry.kind,
      reveal: defectEntry.reveal,
      found: marked.has(defectEntry.line),
    }))
  }, [parsed, frozenAnswer])

  return {
    statement: parsed.statement,
    /**
     * L'intitulé et la langue seulement : le code passe par `lines`, découpé
     * une fois. La forme exposée reste volontairement plus étroite que la
     * configuration — un écran qui recevrait `parsed.snippet` entier pourrait
     * un jour recevoir `parsed.defects` par la même porte.
     */
    snippet: { label: parsed.snippet.label, language: parsed.snippet.language },
    lines,
    markedLines,
    announcedCount: parsed.defects.length,
    timeLimitSeconds: parsed.timeLimitSeconds,
    elapsedSeconds,
    submitted,
    toggleLine,
    submitReview,
    advance,
    lineVerdict,
    reading,
    revelations,
  }
}
