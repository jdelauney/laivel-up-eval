import type { Criterion } from '../../core/contracts/course.schema'
import type {
  CriterionResult,
  GameEvaluator,
} from '../../core/ports/game-evaluator.interface'
import { testBenchAnswerSchema } from './schema/answer.schema'
import { testBenchConfigSchema } from './schema/config.schema'

/**
 * Le point de contact public avec le port `GameEvaluator`, d'où sa place à la
 * racine du dossier du jeu et non sous `actions/`.
 *
 * Il interprète les règles déclaratives portées par les critères du parcours :
 * modifier un critère se fait dans le JSON, pas ici. Aucun accès au store,
 * aucun effet de bord, aucune connaissance des autres jeux.
 */
export class TestBenchEvaluator implements GameEvaluator {
  evaluate(
    answer: unknown,
    config: unknown,
    criteria: readonly Criterion[],
  ): CriterionResult[] {
    const parsedConfig = testBenchConfigSchema.parse(config)
    const parsedAnswer = testBenchAnswerSchema.parse(answer)
    const selected = new Set(parsedAnswer.selected)

    const expected = parsedConfig.propositions.filter(
      (proposition) => proposition.expected,
    )
    const unexpected = parsedConfig.propositions.filter(
      (proposition) => !proposition.expected,
    )

    return criteria.map((criterion) => ({
      criterionId: criterion.id,
      satisfied: this.applyRule(criterion.rule.type, {
        selected,
        expected,
        unexpected,
      }),
    }))
  }

  private applyRule(
    ruleType: string,
    context: {
      selected: ReadonlySet<string>
      expected: readonly { id: string }[]
      unexpected: readonly { id: string }[]
    },
  ): boolean {
    switch (ruleType) {
      case 'all-expected-selected':
        return context.expected.every((proposition) =>
          context.selected.has(proposition.id),
        )
      case 'no-unexpected-selected':
        return context.unexpected.every(
          (proposition) => !context.selected.has(proposition.id),
        )
      default:
        throw new Error(
          `la règle « ${ruleType} » n'est pas connue du jeu test-bench`,
        )
    }
  }
}
