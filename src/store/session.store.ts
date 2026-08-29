import { create } from 'zustand'
import type { Progress } from '../core/session/game-session.facade'

/**
 * État d'interface uniquement : où en est le joueur à l'écran, et sous quel
 * pseudo. Aucun calcul de score ici, aucune règle de progression : tout est
 * décidé par la façade, ce store ne fait qu'en refléter le résultat.
 */

export type Screen = 'onboarding' | 'course' | 'summary'

type SessionUiState = {
  screen: Screen
  playerName: string
  progress: Progress | undefined
  openCourse: (playerName: string, progress: Progress) => void
  setProgress: (progress: Progress) => void
  showSummary: () => void
  reset: () => void
}

export const useSessionStore = create<SessionUiState>((set) => ({
  screen: 'onboarding',
  playerName: '',
  progress: undefined,
  openCourse: (playerName, progress) =>
    set({ screen: 'course', playerName, progress }),
  setProgress: (progress) => set({ progress }),
  showSummary: () => set({ screen: 'summary' }),
  reset: () =>
    set({ screen: 'onboarding', playerName: '', progress: undefined }),
}))
