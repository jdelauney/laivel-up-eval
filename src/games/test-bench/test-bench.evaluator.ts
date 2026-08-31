import type { Criterion } from '../../core/contracts/course.schema'
import type {
  CriterionAttribution,
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

/**
 * Un geste par proposition, nommée par son texte — jamais son `id` — tenu
 * selon `holds`. Partagée par les deux règles : l'une porte sur les
 * propositions attendues, l'autre sur celles qui ne le sont pas.
 */
const buildPropositionAttributions = (
  propositions: readonly { id: string; text: string }[],
  selected: ReadonlySet<string>,
  holds: (
    proposition: { id: string },
    selected: ReadonlySet<string>,
  ) => boolean,
): readonly CriterionAttribution[] =>
  propositions.map((proposition) => ({
    label: proposition.text,
    held: holds(proposition, selected),
  }))

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

    return criteria.map((criterion) => {
      const verdict = this.applyRule(criterion.rule.type, {
        selected,
        expected,
        unexpected,
      })
      return {
        criterionId: criterion.id,
        satisfied: verdict.satisfied,
        attributions: verdict.attributions,
      }
    })
  }

  private applyRule(
    ruleType: string,
    context: {
      selected: ReadonlySet<string>
      expected: readonly { id: string; text: string }[]
      unexpected: readonly { id: string; text: string }[]
    },
  ): { satisfied: boolean; attributions: readonly CriterionAttribution[] } {
    switch (ruleType) {
      case 'all-expected-selected':
        return {
          satisfied: context.expected.every((proposition) =>
            context.selected.has(proposition.id),
          ),
          // Chaque proposition vérifiable est tenue quand elle a été
          // retenue : c'est ce que ce critère juge, une à une.
          attributions: buildPropositionAttributions(
            context.expected,
            context.selected,
            (proposition, selected) => selected.has(proposition.id),
          ),
        }
      case 'no-unexpected-selected':
        return {
          satisfied: context.unexpected.every(
            (proposition) => !context.selected.has(proposition.id),
          ),
          // Le critère mesure une absence — n'avoir retenu aucune
          // proposition non vérifiable — donc l'entrée tenue est celle
          // qu'on a bien écartée.
          attributions: buildPropositionAttributions(
            context.unexpected,
            context.selected,
            (proposition, selected) => !selected.has(proposition.id),
          ),
        }
      default:
        throw new Error(
          `la règle « ${ruleType} » n'est pas connue du jeu test-bench`,
        )
    }
  }
}
