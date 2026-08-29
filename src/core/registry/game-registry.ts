import type { z } from 'zod'
import type { GameEvaluator } from '../ports/game-evaluator.interface'

/**
 * La ligne ouvert/fermé sur laquelle repose tout le système de plugins :
 * ajouter un jeu ne touche aucun fichier existant hors `register-games.ts`.
 *
 * Le composant de rendu n'entre pas dans ce contrat : le domaine ignore
 * React. La phase 5 l'ajoute côté interface.
 */

export type GameContract = {
  evaluator: GameEvaluator
  configSchema: z.ZodType
  answerSchema: z.ZodType
}

export class UnknownGameTypeError extends Error {
  readonly gameType: string

  constructor(gameType: string, known: readonly string[]) {
    super(
      `le type de jeu « ${gameType} » n'est pas enregistré (connus : ${known.join(', ') || 'aucun'})`,
    )
    this.name = 'UnknownGameTypeError'
    this.gameType = gameType
  }
}

export class GameRegistry {
  private readonly contracts = new Map<string, GameContract>()

  register(gameType: string, contract: GameContract): void {
    this.contracts.set(gameType, contract)
  }

  /** Un type absent lève en se nommant, il ne rend jamais un contrat vide. */
  resolve(gameType: string): GameContract {
    const contract = this.contracts.get(gameType)
    if (contract === undefined) {
      throw new UnknownGameTypeError(gameType, this.types())
    }
    return contract
  }

  has(gameType: string): boolean {
    return this.contracts.has(gameType)
  }

  types(): string[] {
    return [...this.contracts.keys()]
  }
}
