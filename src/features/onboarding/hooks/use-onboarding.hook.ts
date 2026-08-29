import { useCallback, useState } from 'react'
import { useSessionFacade } from '@/providers/session-context'
import type { RailGroup } from '../../../components/group-rail/composites/group-rail'
import { buildRail } from '../../../components/group-rail/helpers/build-rail.helper'
import { useSessionStore } from '../../../store/session.store'

/**
 * Démarre une session neuve, reprend celle qui existe, ou l'efface. Le hook ne
 * décide rien : il interroge la façade et range le résultat dans le store.
 *
 * La reprise n'est jamais automatique — l'accueil montre la partie enregistrée
 * et laisse le joueur choisir.
 */
export const useOnboarding = () => {
  const facade = useSessionFacade()
  const openCourse = useSessionStore((state) => state.openCourse)
  const showSummary = useSessionStore((state) => state.showSummary)
  const [storedRun, setStoredRun] = useState(() => facade.storedRun())

  const rail: RailGroup[] = buildRail(facade.courseShape(), 0)

  const start = useCallback(
    (playerName: string): void => {
      facade.start(playerName)
      openCourse(playerName, facade.getProgress())
    },
    [facade, openCourse],
  )

  /**
   * Une partie terminée se reprend sur son verdict, pas sur un parcours vide.
   * Sans ce test, reprendre après la dernière situation menait à un écran
   * « aucune situation en cours » sans issue.
   */
  const resume = useCallback((): boolean => {
    if (!facade.resume()) return false

    const progress = facade.getProgress()
    openCourse(facade.playerName() ?? '', progress)
    if (progress.finished) showSummary()
    return true
  }, [facade, openCourse, showSummary])

  const discard = useCallback((): void => {
    facade.resetSession()
    setStoredRun(undefined)
  }, [facade])

  return { start, resume, discard, storedRun, rail }
}
