import { TestBenchGame } from './test-bench/components/composites/test-bench-game'
import type { GameComponent } from './types/game-component'

/**
 * Le jumeau interface de `core/registry/register-games.ts`. Deuxième et
 * dernier point de câblage centralisé du projet, assumé au même titre : le
 * domaine enregistre l'évaluateur, l'interface enregistre le composant, tous
 * deux résolus par le même `type`.
 *
 * Ajouter un jeu, c'est un dossier sous `games/`, un bloc dans chacun de ces
 * deux fichiers, et rien d'autre.
 */
const components: Record<string, GameComponent> = {
  'test-bench': TestBenchGame,
}

export const resolveGameComponent = (
  gameType: string,
): GameComponent | undefined => components[gameType]
