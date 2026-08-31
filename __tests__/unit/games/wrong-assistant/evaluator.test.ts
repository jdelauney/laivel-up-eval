import { describe, expect, it } from 'vitest'
import type { Criterion } from '@/core/contracts/course.schema'
import {
  type ReplyStance,
  type WrongAssistantConfig,
  wrongAssistantConfigSchema,
} from '@/games/wrong-assistant/schema/config.schema'
import { WrongAssistantEvaluator } from '@/games/wrong-assistant/wrong-assistant.evaluator'

const reply = (
  id: string,
  stance: ReplyStance,
  nextId?: string,
  text?: string,
) => ({ id, text: text ?? `Réponse ${id}.`, stance, nextId })

const node = (
  id: string,
  flawed: boolean,
  replies: ReturnType<typeof reply>[],
  extra: { flaw?: string; consequence?: string } = {},
) => ({
  id,
  speaker: 'assistant' as const,
  message: `Message ${id}.`,
  flawed,
  replies,
  ...extra,
})

const config: WrongAssistantConfig = wrongAssistantConfigSchema.parse({
  statement: 'Consigne de test.',
  rootId: 'a',
  nodes: [
    node(
      'a',
      true,
      [
        reply('a-accept', 'accept', 'consA'),
        reply('a-challenge', 'challenge', 'b'),
        reply('a-verify', 'verify', 'b'),
      ],
      { flaw: 'Ce qui cloche en a.' },
    ),
    node('b', false, [reply('b-1', 'accept', 'c')]),
    node(
      'c',
      true,
      [
        reply('c-accept', 'accept', 'consB'),
        reply('c-challenge', 'challenge'),
        reply('c-reformulate', 'reformulate'),
      ],
      { flaw: 'Ce qui cloche en c.' },
    ),
    node('consA', false, [reply('consA-1', 'accept')], {
      consequence: 'Dommage A.',
    }),
    node('consB', false, [reply('consB-1', 'accept')], {
      consequence: 'Dommage B.',
    }),
  ],
})

const step = (nodeId: string, replyId: string) => ({ nodeId, replyId })

const criteria: Criterion[] = [
  {
    id: 'c1',
    question:
      "Chaque erreur rencontrée a-t-elle été repérée avant d'être acceptée ?",
    rule: { type: 'flaws-caught-before-accepting' },
    mapping: [{ dimension: 'resilience', weight: 2 }],
  },
  {
    id: 'c2',
    question:
      'La branche reformuler ou vérifier a-t-elle été choisie au moins deux fois ?',
    rule: { type: 'corrective-replies-at-least', threshold: 2 },
    mapping: [{ dimension: 'resilience', weight: 1 }],
  },
]

const evaluator = new WrongAssistantEvaluator()

const verdictFor = (steps: { nodeId: string; replyId: string }[]) =>
  evaluator
    .evaluate({ steps }, config, criteria)
    .reduce<Record<string, boolean>>((acc, result) => {
      acc[result.criterionId] = result.satisfied
      return acc
    }, {})

describe('wrong-assistant evaluator', () => {
  it('satisfies both criteria for a fully corrective read', () => {
    const verdict = verdictFor([
      step('a', 'a-verify'),
      step('b', 'b-1'),
      step('c', 'c-reformulate'),
    ])

    expect(verdict.c1).toBe(true)
    expect(verdict.c2).toBe(true)
  })

  it('holds c1 and misses c2 for a read that refuses everything without ever verifying', () => {
    const verdict = verdictFor([
      step('a', 'a-challenge'),
      step('b', 'b-1'),
      step('c', 'c-challenge'),
    ])

    expect(verdict.c1).toBe(true)
    expect(verdict.c2).toBe(false)
  })

  it('misses both criteria for a read that accepts everything', () => {
    const verdict = verdictFor([
      step('a', 'a-accept'),
      step('consA', 'consA-1'),
    ])

    expect(verdict.c1).toBe(false)
    expect(verdict.c2).toBe(false)
  })

  it('misses c1 the moment one encountered flaw is accepted, even after catching the other', () => {
    const verdict = verdictFor([
      step('a', 'a-challenge'),
      step('b', 'b-1'),
      step('c', 'c-accept'),
      step('consB', 'consB-1'),
    ])

    expect(verdict.c1).toBe(false)
  })

  it('rejects an unknown rule type, naming it', () => {
    const unknown: Criterion = {
      id: 'c9',
      question: 'Question inconnue ?',
      rule: { type: 'inconnue' },
      mapping: [{ dimension: 'resilience', weight: 1 }],
    }

    expect(() =>
      evaluator.evaluate(
        {
          steps: [
            step('a', 'a-challenge'),
            step('b', 'b-1'),
            step('c', 'c-challenge'),
          ],
        },
        config,
        [unknown],
      ),
    ).toThrow('inconnue')
  })
})
