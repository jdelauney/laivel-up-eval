import { testBenchAnswerSchema } from '@/games/test-bench/schema/answer.schema'
import { TestBenchEvaluator } from '@/games/test-bench/test-bench.evaluator'
import { GameRegistry } from '../core/registry/game-registry'
import { testBenchConfigSchema } from './test-bench/schema/config.schema'

/**
 * Le seul point de câblage centralisé du projet, et la seule exception
 * assumée à l'interdiction des barrel exports. Ajouter un jeu = un dossier
 * sous `games/`, et un bloc ici. Rien d'autre ne bouge.
 */
export const buildGameRegistry = (): GameRegistry => {
  const registry = new GameRegistry()

  registry.register('test-bench', {
    evaluator: new TestBenchEvaluator(),
    configSchema: testBenchConfigSchema,
    answerSchema: testBenchAnswerSchema,
  })

  return registry
}
