import { useEffect, useRef, useState } from 'react'

/**
 * Le compte à rebours d'un budget de temps connu à l'avance, sur le modèle
 * exact de `use-elapsed-seconds.hook.ts` de `defect-hunt` : `Date.now()`
 * dans une ref posée au premier rendu, `setInterval` à 250 ms, et une
 * lecture fraîche au moment du gel — jamais la valeur d'état affichée, qui
 * peut avoir jusqu'à un quart de seconde de retard.
 *
 * `Date.now()` est appelé ici, dans la couche interface, jamais dans
 * `core/` : la durée entre dans la trace comme donnée mesurée, produite par
 * l'écran, jamais par un port `Clock` injecté au composant — décision de
 * `defect-hunt`, reprise telle quelle.
 */

const TICK_MS = 250

/**
 * Les paliers d'annonce, du plus grand au plus petit : `aria-live` n'est
 * déclenché qu'à leur franchissement, jamais à chaque battement — annoncer
 * chaque tick noierait un lecteur d'écran sous vingt messages par minute.
 * Un palier au-delà de `durationSeconds` ne se franchit simplement jamais,
 * sans traitement particulier à prévoir : un lot de vingt secondes ne verra
 * jamais le palier des trente.
 */
const MILESTONES_SECONDS = [30, 10, 5] as const

export const useCountdown = (durationSeconds: number, running: boolean) => {
  // L'instant de départ vit dans une ref, posé au premier rendu : il ne
  // bouge plus ensuite, quel que soit le nombre de rendus qui suivent.
  const startedAt = useRef(Date.now())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [announcement, setAnnouncement] = useState('')
  // Les paliers déjà annoncés, pour n'annoncer chacun qu'une fois.
  const announcedMilestones = useRef<ReadonlySet<number>>(new Set())

  /**
   * Recalcule depuis la ref, à l'instant de l'appel — jamais depuis l'état
   * affiché : celui-ci peut avoir jusqu'à un quart de seconde de retard, et
   * la durée retenue dans la trace doit être celle du geste qui gèle le
   * tri, pas celle du dernier battement.
   */
  const readElapsedSeconds = (): number =>
    (Date.now() - startedAt.current) / 1000

  // biome-ignore lint/correctness/useExhaustiveDependencies: readElapsedSeconds se redéfinit à chaque rendu mais ne dépend que de la ref, stable par nature ; l'ajouter relancerait l'intervalle à chaque rendu.
  useEffect(() => {
    if (!running) return

    const interval = setInterval(() => {
      const elapsed = readElapsedSeconds()
      setElapsedSeconds(elapsed)

      const remaining = durationSeconds - elapsed
      const toAnnounce = MILESTONES_SECONDS.find(
        (milestone) =>
          milestone <= durationSeconds &&
          remaining <= milestone &&
          !announcedMilestones.current.has(milestone),
      )
      if (toAnnounce !== undefined) {
        announcedMilestones.current = new Set([
          ...announcedMilestones.current,
          toAnnounce,
        ])
        setAnnouncement(`${toAnnounce} secondes restantes`)
      }
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [running, durationSeconds])

  const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds)

  return {
    elapsedSeconds,
    remainingSeconds,
    expired: elapsedSeconds >= durationSeconds,
    announcement,
    readElapsedSeconds,
  }
}
