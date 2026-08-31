import { useCallback } from 'react'
import type { RepositorySlug } from '@/core/contracts/repository-slug.schema'
import { useSessionFacade } from '@/providers/session-context'
import type { RailGroup } from '../../../components/group-rail/composites/group-rail'
import { buildRail } from '../../../components/group-rail/helpers/build-rail.helper'
import { useSessionStore } from '../../../store/session.store'
import { estimateCourseMinutes } from '../helpers/estimate-course-minutes.helper'

/**
 * Démarre une session neuve. Le hook ne décide rien : il interroge la façade
 * et range le résultat dans le store. La reprise d'une partie enregistrée est
 * automatique, au montage de l'application — voir `useRestoreRun` — ce hook
 * ne s'occupe que du premier départ.
 */
export const useOnboarding = () => {
  const facade = useSessionFacade()
  const openCourse = useSessionStore((state) => state.openCourse)

  /**
   * Aucune position à montrer : l'accueil donne la forme du parcours, pas
   * l'avancée dedans. Une partie enregistrée ne change rien — tant qu'elle
   * n'est pas reprise, le joueur n'est nulle part.
   */
  const rail: RailGroup[] = buildRail(facade.courseShape(), undefined)
  const totalSituations = rail.reduce((sum, group) => sum + group.gameCount, 0)
  const estimatedMinutes = estimateCourseMinutes(totalSituations)

  const start = useCallback(
    (playerName: string, repository?: RepositorySlug | undefined): void => {
      facade.start(playerName, repository)
      openCourse({ playerName, repository }, facade.getProgress())
    },
    [facade, openCourse],
  )

  return {
    start,
    rail,
    totalSituations,
    estimatedMinutes,
  }
}
