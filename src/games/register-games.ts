import { CheckpointsEvaluator } from '@/games/checkpoints/checkpoints.evaluator'
import { checkpointsAnswerSchema } from '@/games/checkpoints/schema/answer.schema'
import { checkpointsConfigSchema } from '@/games/checkpoints/schema/config.schema'
import { ConfidenceBetEvaluator } from '@/games/confidence-bet/confidence-bet.evaluator'
import { confidenceBetAnswerSchema } from '@/games/confidence-bet/schema/answer.schema'
import { confidenceBetConfigSchema } from '@/games/confidence-bet/schema/config.schema'
import { DefectHuntEvaluator } from '@/games/defect-hunt/defect-hunt.evaluator'
import { defectHuntAnswerSchema } from '@/games/defect-hunt/schema/answer.schema'
import { defectHuntConfigSchema } from '@/games/defect-hunt/schema/config.schema'
import { HintBudgetEvaluator } from '@/games/hint-budget/hint-budget.evaluator'
import { hintBudgetAnswerSchema } from '@/games/hint-budget/schema/answer.schema'
import { hintBudgetConfigSchema } from '@/games/hint-budget/schema/config.schema'
import { LieDetectorEvaluator } from '@/games/lie-detector/lie-detector.evaluator'
import { lieDetectorAnswerSchema } from '@/games/lie-detector/schema/answer.schema'
import { lieDetectorConfigSchema } from '@/games/lie-detector/schema/config.schema'
import { testBenchAnswerSchema } from '@/games/test-bench/schema/answer.schema'
import { TestBenchEvaluator } from '@/games/test-bench/test-bench.evaluator'
import { threeTracksAnswerSchema } from '@/games/three-tracks/schema/answer.schema'
import { threeTracksConfigSchema } from '@/games/three-tracks/schema/config.schema'
import { ThreeTracksEvaluator } from '@/games/three-tracks/three-tracks.evaluator'
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

  registry.register('checkpoints', {
    evaluator: new CheckpointsEvaluator(),
    configSchema: checkpointsConfigSchema,
    answerSchema: checkpointsAnswerSchema,
  })

  registry.register('three-tracks', {
    evaluator: new ThreeTracksEvaluator(),
    configSchema: threeTracksConfigSchema,
    answerSchema: threeTracksAnswerSchema,
  })

  registry.register('confidence-bet', {
    evaluator: new ConfidenceBetEvaluator(),
    configSchema: confidenceBetConfigSchema,
    answerSchema: confidenceBetAnswerSchema,
  })

  registry.register('defect-hunt', {
    evaluator: new DefectHuntEvaluator(),
    configSchema: defectHuntConfigSchema,
    answerSchema: defectHuntAnswerSchema,
  })

  registry.register('lie-detector', {
    evaluator: new LieDetectorEvaluator(),
    configSchema: lieDetectorConfigSchema,
    answerSchema: lieDetectorAnswerSchema,
  })

  registry.register('hint-budget', {
    evaluator: new HintBudgetEvaluator(),
    configSchema: hintBudgetConfigSchema,
    answerSchema: hintBudgetAnswerSchema,
  })

  return registry
}
