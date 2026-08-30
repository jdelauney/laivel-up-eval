import { useEffect, useRef, useState } from 'react'

/**
 * Le temps qui court, et rien d'autre : ce hook ignore le budget, le
 * dépassement, et tout ce qui n'est pas la mesure elle-même. C'est l'écran
 * qui nomme le dépassement, pas le compteur — il laisse la valeur croître
 * au-delà de n'importe quel budget, sans jamais s'interrompre.
 *
 * `Date.now()` est appelé ici, dans la couche interface. L'interdiction
 * d'appeler `Date` porte sur `core/` : le domaine reste sans horloge parce
 * que la durée lui arrive par la trace, jamais par un port `Clock` injecté au
 * composant — c'est la décision du plan `defect-hunt`, « La durée écoulée
 * entre dans la trace comme donnée mesurée, produite par l'écran, jamais par
 * le port `Clock` ».
 */

const TICK_MS = 250

export const useElapsedSeconds = (running: boolean) => {
  // L'instant de départ vit dans une ref, posé au premier rendu : il ne
  // bouge plus ensuite, quel que soit le nombre de rendus qui suivent.
  const startedAt = useRef(Date.now())
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  /**
   * Recalcule depuis la ref, à l'instant de l'appel — jamais depuis l'état
   * affiché : celui-ci peut avoir jusqu'à un quart de seconde de retard, et
   * la durée retenue dans la trace doit être celle du geste qui rend la
   * revue, pas celle du dernier battement.
   */
  const readElapsedSeconds = (): number =>
    (Date.now() - startedAt.current) / 1000

  // biome-ignore lint/correctness/useExhaustiveDependencies: readElapsedSeconds se redéfinit à chaque rendu mais ne dépend que de la ref, stable par nature ; l'ajouter relancerait l'intervalle à chaque rendu.
  useEffect(() => {
    if (!running) return

    const interval = setInterval(() => {
      setElapsedSeconds(readElapsedSeconds())
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [running])

  return { elapsedSeconds, readElapsedSeconds }
}
