import { create } from 'zustand'
import type { RepositorySlug } from '../core/contracts/repository-slug.schema'
import type { Progress } from '../core/session/game-session.facade'

/**
 * État d'interface uniquement : où en est le joueur à l'écran, et sous quelle
 * identité. Aucun calcul de score ici, aucune règle de progression : tout est
 * décidé par la façade, ce store ne fait qu'en refléter le résultat.
 */

export type Screen = 'onboarding' | 'course' | 'summary'

/**
 * Ce que le joueur a saisi à l'accueil, groupé plutôt qu'aligné en arguments :
 * deux chaînes de suite au même appel se confondent au site d'appel, et la
 * seconde est facultative.
 */
export type PlayerIdentity = {
  playerName: string
  repository: RepositorySlug | undefined
}

type SessionUiState = {
  screen: Screen
  playerName: string
  repository: RepositorySlug | undefined
  progress: Progress | undefined
  openCourse: (identity: PlayerIdentity, progress: Progress) => void
  setProgress: (progress: Progress) => void
  showSummary: () => void
  reset: () => void
}

export const useSessionStore = create<SessionUiState>((set) => ({
  screen: 'onboarding',
  playerName: '',
  repository: undefined,
  progress: undefined,
  openCourse: ({ playerName, repository }, progress) =>
    set({ screen: 'course', playerName, repository, progress }),
  setProgress: (progress) => set({ progress }),
  showSummary: () => set({ screen: 'summary' }),
  reset: () =>
    set({
      screen: 'onboarding',
      playerName: '',
      repository: undefined,
      progress: undefined,
    }),
}))
