import { createContext, type ReactNode, useContext } from 'react'
import type { Composition } from '@/composition-root'
import type { GameSessionFacade } from '@/core/session/game-session.facade'

/**
 * Le passage du câblage à React. Aucun composant n'importe la façade
 * directement : elle arrive par ce contexte, ce qui garde un seul point
 * d'injection et rend les écrans testables avec une façade de test.
 */

const CompositionContext = createContext<Composition | undefined>(undefined)

export const SessionProvider = ({
  composition,
  children,
}: {
  composition: Composition
  children: ReactNode
}) => (
  <CompositionContext.Provider value={composition}>
    {children}
  </CompositionContext.Provider>
)

export const useComposition = (): Composition => {
  const composition = useContext(CompositionContext)
  if (composition === undefined) {
    throw new Error('useComposition doit être appelé sous SessionProvider')
  }
  return composition
}

export const useSessionFacade = (): GameSessionFacade => {
  const composition = useComposition()
  if (composition.status !== 'ready') {
    throw new Error(
      'aucune façade disponible : la configuration a été refusée au chargement',
    )
  }
  return composition.facade
}
