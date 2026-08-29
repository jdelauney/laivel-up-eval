import { useCallback } from 'react'
import { useSessionFacade } from '@/providers/session-context'
import type { RailGroup } from '../../../components/group-rail/composites/group-rail'
import { buildRail } from '../../../components/group-rail/helpers/build-rail.helper'
import { useSessionStore } from '../../../store/session.store'

/**
 * Le jeu courant, la soumission, l'avance. Le hook ne détermine pas la fin du
 * parcours : il la lit sur ce que la façade rend.
 */
export const useCourse = () => {
  const facade = useSessionFacade()
  const progress = useSessionStore((state) => state.progress)
  const setProgress = useSessionStore((state) => state.setProgress)
  const showSummary = useSessionStore((state) => state.showSummary)

  const currentIndex = progress?.group?.index ?? 0

  const rail: RailGroup[] = buildRail(facade.courseShape(), currentIndex)

  const submit = useCallback(
    (answer: unknown): void => {
      facade.submitAnswer(answer)
      facade.nextGame()

      const next = facade.getProgress()
      setProgress(next)
      if (next.finished) showSummary()
    },
    [facade, setProgress, showSummary],
  )

  return { progress, rail, submit }
}
