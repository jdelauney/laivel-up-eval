import { describe, expect, it } from 'vitest'
import { buildAmbiguityScanAnswer } from '@/games/ambiguity-scan/actions/build-ambiguity-scan-answer.action'
import {
  type AmbiguityScanConfig,
  ambiguityScanConfigSchema,
} from '@/games/ambiguity-scan/schema/config.schema'

const segment = (id: string, ambiguous: boolean) => ({
  id,
  text: `Texte de ${id}.`,
  ambiguous,
  ...(ambiguous ? { reading: `Lecture de ${id}.` } : {}),
})

const config: AmbiguityScanConfig = ambiguityScanConfigSchema.parse({
  statement: 'Consigne de test.',
  promptTitle: 'Titre du prompt',
  segments: [
    segment('s1', false),
    segment('s2', false),
    segment('s3', true),
    segment('s4', true),
    segment('s5', true),
    segment('s6', false),
  ],
})

describe('build ambiguity-scan answer', () => {
  it('orders the trace like the configuration, not like the order in which the player flagged segments', () => {
    const answer = buildAmbiguityScanAnswer(config, ['s5', 's1', 's3'])

    expect(answer.flaggedIds).toEqual(['s1', 's3', 's5'])
  })

  it('drops a segment flagged twice by the player, by construction of the Set', () => {
    const answer = buildAmbiguityScanAnswer(config, ['s3', 's3', 's4'])

    expect(answer.flaggedIds).toEqual(['s3', 's4'])
  })

  it('builds an empty trace when nothing is flagged', () => {
    const answer = buildAmbiguityScanAnswer(config, [])

    expect(answer.flaggedIds).toEqual([])
  })

  /**
   * Symétrique de `practiceMapEvaluator` : la fonction ne parcourt que les
   * segments **déclarés dans la configuration** pour construire la trace,
   * sur le même modèle que `buildPracticeMapAnswer`. Un identifiant qui ne
   * correspond à aucun segment ne peut donc jamais y entrer — il est
   * silencieusement ignoré, jamais reporté dans la trace. `UnknownSegmentError`
   * ne se déclenche qu'en appelant `parseAmbiguityScanTrace` directement sur
   * une trace forgée, couvert par `answer.schema.test.ts`.
   */
  it('drops a flag aiming at a segment absent from the configuration, rather than including it', () => {
    const answer = buildAmbiguityScanAnswer(config, ['introuvable', 's3'])

    expect(answer.flaggedIds).toEqual(['s3'])
  })
})
