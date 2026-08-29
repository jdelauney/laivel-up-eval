import courseData from '../config/course.json'
import gridData from '../config/grid.json'
import signatureData from '../config/signature.json'
import {
  ConfigValidationError,
  parseConfiguration,
} from './core/contracts/helpers/parse-config.helper'
import { UnknownGameTypeError } from './core/registry/game-registry'
import { WeightedMappingStrategy } from './core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from './core/session/game-session.facade'
import { buildGameRegistry } from './games/register-games'
import { SystemClock } from './infrastructure/clock/system.adapter'
import { LocalSessionStorageAdapter } from './infrastructure/persistence/local-session-storage.adapter'

/**
 * LE seul endroit où tout se câble. Le domaine ne connaît que des interfaces ;
 * les implémentations concrètes sont choisies ici, et nulle part ailleurs.
 *
 * Une configuration hors contrat n'ouvre pas de session : elle rend un état
 * d'erreur qui nomme le champ fautif, pour que l'écran l'affiche tel quel.
 */

export type Composition =
  | { status: 'ready'; facade: GameSessionFacade }
  | { status: 'invalid-config'; message: string; field: string }

/**
 * Le câblage prend ses données en paramètre, pour que la branche de refus soit
 * exerçable : c'est le chemin du jour J si la grille officielle arrive mal
 * formée, et il ne doit pas dépendre des fichiers réels pour être vérifié.
 */
export const composeFrom = (
  rawGrid: unknown,
  rawCourse: unknown,
  rawSignature?: unknown,
): Composition => {
  try {
    const { grid, course, signature } = parseConfiguration(
      rawGrid,
      rawCourse,
      rawSignature,
    )

    return {
      status: 'ready',
      facade: new GameSessionFacade({
        registry: buildGameRegistry(),
        scoring: new WeightedMappingStrategy(),
        persistence: new LocalSessionStorageAdapter(globalThis.localStorage),
        clock: new SystemClock(),
        grid,
        course,
        signature,
      }),
    }
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      return {
        status: 'invalid-config',
        message: error.message,
        field: error.field,
      }
    }
    if (error instanceof UnknownGameTypeError) {
      return {
        status: 'invalid-config',
        message: error.message,
        field: error.gameType,
      }
    }
    throw error
  }
}

export const composeApp = (): Composition =>
  composeFrom(gridData, courseData, signatureData)

export const composition = composeApp()
