import {
  type TestBenchAnswer,
  testBenchAnswerSchema,
} from '../schema/answer.schema'

/**
 * Construit la réponse conforme au contrat du jeu. Testable sans composant :
 * c'est tout l'intérêt de la séparer du hook.
 *
 * L'ordre des propositions retenues suit celui de la configuration, pour
 * qu'une même partie produise toujours la même réponse.
 */
export const buildTestBenchAnswer = (
  selected: ReadonlySet<string>,
  propositionIds: readonly string[],
): TestBenchAnswer =>
  testBenchAnswerSchema.parse({
    selected: propositionIds.filter((id) => selected.has(id)),
  })
