import { describe, expect, it } from 'vitest'
import {
  BrokenChainError,
  parseWrongAssistantTrace,
  UnknownNodeError,
  UnknownReplyError,
  WrongRootError,
} from '@/games/wrong-assistant/schema/answer.schema'
import {
  type ReplyStance,
  type WrongAssistantConfig,
  wrongAssistantConfigSchema,
} from '@/games/wrong-assistant/schema/config.schema'

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

/** Même arbre minimal que `config.schema.test.ts` : deux nœuds défectueux, un chemin de lecture complet. */
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

describe('wrong-assistant answer schema', () => {
  it('accepts a complete, correctly chained trace from root to a leaf', () => {
    const trace = parseWrongAssistantTrace(
      {
        steps: [
          step('a', 'a-challenge'),
          step('b', 'b-1'),
          step('c', 'c-challenge'),
        ],
      },
      config,
    )

    expect(trace.steps).toHaveLength(3)
  })

  it('accepts a trace that ends on an acceptance, walking into its consequence', () => {
    const trace = parseWrongAssistantTrace(
      { steps: [step('a', 'a-accept'), step('consA', 'consA-1')] },
      config,
    )

    expect(trace.steps).toHaveLength(2)
  })

  it('rejects a first step off the configured rootId', () => {
    const call = () =>
      parseWrongAssistantTrace({ steps: [step('b', 'b-1')] }, config)

    expect(call).toThrow(WrongRootError)
  })

  it('rejects a step aiming at a node absent from the configuration, naming it', () => {
    const call = () =>
      parseWrongAssistantTrace(
        { steps: [step('a', 'a-challenge'), step('introuvable', 'x')] },
        config,
      )

    expect(call).toThrow(UnknownNodeError)
    expect(call).toThrow('introuvable')
  })

  it('rejects a step aiming at a reply foreign to its node, naming both', () => {
    const call = () =>
      parseWrongAssistantTrace({ steps: [step('a', 'c-accept')] }, config)

    expect(call).toThrow(UnknownReplyError)
    expect(call).toThrow('c-accept')
    expect(call).toThrow('a')
  })

  it('rejects a broken chain, a step that does not follow the previous reply nextId', () => {
    const call = () =>
      parseWrongAssistantTrace(
        {
          steps: [
            step('a', 'a-challenge'),
            // `a-challenge` mène à `b`, pas à `c` : chaînage rompu.
            step('c', 'c-challenge'),
          ],
        },
        config,
      )

    expect(call).toThrow(BrokenChainError)
  })

  it('rejects a trace that revisits a step past the reply that already ended the scenario', () => {
    const call = () =>
      parseWrongAssistantTrace(
        {
          steps: [
            step('a', 'a-challenge'),
            step('b', 'b-1'),
            step('c', 'c-challenge'),
            // `c-challenge` n'a pas de `nextId` : rien ne peut légitimement suivre.
            step('consA', 'consA-1'),
          ],
        },
        config,
      )

    expect(call).toThrow(BrokenChainError)
  })
})
