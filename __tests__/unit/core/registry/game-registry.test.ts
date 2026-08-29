import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { Criterion } from '../../../../src/core/contracts/course.schema'
import type {
  CriterionResult,
  GameEvaluator,
} from '../../../../src/core/ports/game-evaluator.interface'
import {
  GameRegistry,
  UnknownGameTypeError,
} from '../../../../src/core/registry/game-registry'
import { buildGameRegistry } from '../../../../src/games/register-games'

class AlwaysSatisfiedEvaluator implements GameEvaluator {
  evaluate(
    _answer: unknown,
    _config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: true,
    }))
  }
}

const contract = () => ({
  evaluator: new AlwaysSatisfiedEvaluator(),
  configSchema: z.object({}),
  answerSchema: z.object({}),
})

describe('game registry', () => {
  it('resolves a registered type to its contract', () => {
    const registry = new GameRegistry()
    registry.register('anything', contract())

    expect(registry.resolve('anything').evaluator).toBeInstanceOf(
      AlwaysSatisfiedEvaluator,
    )
  })

  it('throws naming the unknown type instead of returning nothing', () => {
    const registry = new GameRegistry()
    registry.register('known', contract())

    expect(() => registry.resolve('ghost')).toThrow(UnknownGameTypeError)
    expect(() => registry.resolve('ghost')).toThrow('ghost')
  })

  it('accepts an evaluator that knows nothing of the engine, only of the port', () => {
    const registry = buildGameRegistry()
    registry.register('second-bench', contract())

    expect(registry.types()).toContain('test-bench')
    expect(registry.types()).toContain('second-bench')
    expect(registry.has('second-bench')).toBe(true)
  })

  it('wires the test bench through register-games alone', () => {
    expect(buildGameRegistry().resolve('test-bench').evaluator).toBeDefined()
  })
})
