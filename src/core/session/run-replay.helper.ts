import type { ReplayProfile } from '../contracts/replay-profile.schema'
import {
  GameSessionFacade,
  type SessionDependencies,
  type Verdict,
} from './game-session.facade'

/**
 * Le harnais du critère « ça tombe juste ».
 *
 * Il emprunte exactement le chemin du jeu interactif : même façade, mêmes
 * évaluateurs, même scoring. Aucun branchement du type « si rejeu » — une
 * branche réservée rendrait la suite aveugle aux régressions du vrai chemin,
 * ce que la spec interdit explicitement.
 *
 * L'horloge et la persistance sont injectées : avec une horloge figée, deux
 * exécutions du même profil produisent une trace identique.
 */

export class MissingReplayAnswerError extends Error {
  readonly gameId: string

  constructor(gameId: string, profileId: string) {
    super(
      `le profil « ${profileId} » n'a pas de réponse pour le jeu « ${gameId} »`,
    )
    this.name = 'MissingReplayAnswerError'
    this.gameId = gameId
  }
}

export type ReplayDependencies = SessionDependencies

export const runReplay = (
  profile: ReplayProfile,
  dependencies: ReplayDependencies,
): Verdict => {
  const facade = new GameSessionFacade(dependencies)

  facade.start(profile.meta.label)

  const orderedGames = [...dependencies.course.groups]
    .sort((a, b) => a.order - b.order)
    .flatMap((group) => group.games)

  for (const game of orderedGames) {
    const recorded = profile.answers.find((answer) => answer.gameId === game.id)
    if (recorded === undefined) {
      throw new MissingReplayAnswerError(game.id, profile.id)
    }

    facade.submitAnswer(recorded.answer)
    facade.nextGame()
  }

  return facade.getVerdict()
}
