import { CheckpointsGame } from './checkpoints/components/composites/checkpoints-game'
import { ConfidenceBetGame } from './confidence-bet/components/composites/confidence-bet-game'
import { DefectHuntGame } from './defect-hunt/components/composites/defect-hunt-game'
import { HintBudgetGame } from './hint-budget/components/composites/hint-budget-game'
import { LieDetectorGame } from './lie-detector/components/composites/lie-detector-game'
import { TestBenchGame } from './test-bench/components/composites/test-bench-game'
import { ThreeTracksGame } from './three-tracks/components/composites/three-tracks-game'
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
  checkpoints: CheckpointsGame,
  'three-tracks': ThreeTracksGame,
  'confidence-bet': ConfidenceBetGame,
  'defect-hunt': DefectHuntGame,
  'lie-detector': LieDetectorGame,
  'hint-budget': HintBudgetGame,
}

export const resolveGameComponent = (
  gameType: string,
): GameComponent | undefined => components[gameType]
