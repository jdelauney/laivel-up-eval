import { useCallback } from 'react'
import { useSessionFacade } from '@/providers/session-context'
import type { RailGroup } from '../../../components/group-rail/composites/group-rail'
import { buildRail } from '../../../components/group-rail/helpers/build-rail.helper'
import { useSessionStore } from '../../../store/session.store'

/**
 * Le jeu courant, le verrouillage, l'avance. Le hook ne détermine pas la fin
 * du parcours : il la lit sur ce que la façade rend.
 *
 * `lock` et `advance` restent deux fonctions distinctes, jamais une seule qui
 * les enchaînerait : c'est exactement la séparation que `GameComponentProps`
 * porte jusqu'à l'écran, pour qu'un jeu à révélation puisse écrire sa trace
 * sans avancer.
 */
export const useCourse = () => {
  const facade = useSessionFacade()
  const progress = useSessionStore((state) => state.progress)
  const setProgress = useSessionStore((state) => state.setProgress)
  const showSummary = useSessionStore((state) => state.showSummary)

  const currentIndex = progress?.group?.index ?? 0

  const rail: RailGroup[] = buildRail(facade.courseShape(), currentIndex)

  /** Évalue, empile et écrit la trace — sans avancer. */
  const lock = useCallback(
    (answer: unknown): void => {
      facade.submitAnswer(answer)
      setProgress(facade.getProgress())
    },
    [facade, setProgress],
  )

  /** Passe au jeu suivant, ou au relevé si le parcours est fini. */
  const advance = useCallback((): void => {
    facade.nextGame()

    const next = facade.getProgress()
    setProgress(next)
    if (next.finished) showSummary()
  }, [facade, setProgress, showSummary])

  return { progress, rail, lock, advance }
}
