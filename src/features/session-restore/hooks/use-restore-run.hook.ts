import { useLayoutEffect, useRef } from 'react'
import { useSessionFacade } from '@/providers/session-context'
import { useSessionStore } from '../../../store/session.store'

/**
 * Rouvre au montage la partie enregistrée, si la façade en tient une. La
 * position vit dans le snapshot ; personne ne la lisait au démarrage, et
 * l'application restait bloquée sur l'accueil en attendant un clic qui,
 * désormais, n'existe plus.
 *
 * `useLayoutEffect`, pas `useEffect` : ce dernier s'exécute après la peinture,
 * donc l'accueil se peignait en entier avant de basculer sur le parcours —
 * un éclair invisible en test, où `render()` vidange les effets dans `act()`,
 * mais réel au premier chargement d'un navigateur. Le travail est purement
 * synchrone (lecture de la façade, écriture dans le store), rien ne justifie
 * de le différer après la peinture.
 *
 * Un `ref` garde l'exécution unique : sous `StrictMode`, l'effet est monté
 * deux fois sur la même instance de composant. Sans ce garde, une seconde
 * ouverture n'aurait rien de faux en soi — elle relit le même instantané —
 * mais rien ne le garantirait non plus si la façade venait à changer.
 */
export const useRestoreRun = (): void => {
  const facade = useSessionFacade()
  const openCourse = useSessionStore((state) => state.openCourse)
  const showSummary = useSessionStore((state) => state.showSummary)
  const hasAttempted = useRef(false)

  useLayoutEffect(() => {
    if (hasAttempted.current) return
    hasAttempted.current = true

    if (facade.hasSession()) return
    if (!facade.resume()) return

    const progress = facade.getProgress()
    openCourse(
      {
        playerName: facade.playerName() ?? '',
        repository: facade.designatedRepository(),
      },
      progress,
    )
    if (progress.finished) showSummary()
  }, [facade, openCourse, showSummary])
}
