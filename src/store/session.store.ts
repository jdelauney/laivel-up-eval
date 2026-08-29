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
  /**
   * Absente tant que rien n'a été saisi. Un pseudo vide dirait la même chose
   * une seconde fois, et laisserait deux façons d'écrire « personne ».
   */
  identity: PlayerIdentity | undefined
  progress: Progress | undefined
  openCourse: (identity: PlayerIdentity, progress: Progress) => void
  setProgress: (progress: Progress) => void
  showSummary: () => void
  reset: () => void
}

export const useSessionStore = create<SessionUiState>((set) => ({
  screen: 'onboarding',
  identity: undefined,
  progress: undefined,
  openCourse: (identity, progress) =>
    set({ screen: 'course', identity, progress }),
  setProgress: (progress) => set({ progress }),
  showSummary: () => set({ screen: 'summary' }),
  reset: () =>
    set({ screen: 'onboarding', identity: undefined, progress: undefined }),
}))
