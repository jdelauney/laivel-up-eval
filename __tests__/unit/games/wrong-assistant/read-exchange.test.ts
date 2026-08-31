import { describe, expect, it } from 'vitest'
import { readExchange } from '@/games/wrong-assistant/helpers/read-exchange.helper'
import { parseWrongAssistantTrace } from '@/games/wrong-assistant/schema/answer.schema'
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

const readSteps = (steps: { nodeId: string; replyId: string }[]) =>
  readExchange(config, parseWrongAssistantTrace({ steps }, config))

describe('read-exchange helper', () => {
  it('reads a fully corrective path: both flawed nodes caught, no consequence hit', () => {
    const reading = readSteps([
      step('a', 'a-verify'),
      step('b', 'b-1'),
      step('c', 'c-reformulate'),
    ])

    expect(reading.flawedNodesMet).toBe(2)
    expect(reading.flawedNodesCaught).toBe(2)
    expect(reading.allFlawsCaughtBeforeAccepting).toBe(true)
    expect(reading.correctiveRepliesCount).toBe(2)
    expect(reading.consequencesHit).toBe(0)
  })

  it('reads a path that refuses without ever verifying: caught, but not corrective', () => {
    const reading = readSteps([
      step('a', 'a-challenge'),
      step('b', 'b-1'),
      step('c', 'c-challenge'),
    ])

    expect(reading.flawedNodesCaught).toBe(2)
    expect(reading.allFlawsCaughtBeforeAccepting).toBe(true)
    expect(reading.correctiveRepliesCount).toBe(0)
  })

  it('reads a path that accepts the first flaw: not caught, its consequence hit', () => {
    const reading = readSteps([step('a', 'a-accept'), step('consA', 'consA-1')])

    expect(reading.flawedNodesMet).toBe(1)
    expect(reading.flawedNodesCaught).toBe(0)
    expect(reading.allFlawsCaughtBeforeAccepting).toBe(false)
    expect(reading.consequencesHit).toBe(1)
  })

  it('reads a path that catches the first flaw then accepts the second: partially caught, its consequence hit', () => {
    const reading = readSteps([
      step('a', 'a-challenge'),
      step('b', 'b-1'),
      step('c', 'c-accept'),
      step('consB', 'consB-1'),
    ])

    expect(reading.flawedNodesMet).toBe(2)
    expect(reading.flawedNodesCaught).toBe(1)
    expect(reading.allFlawsCaughtBeforeAccepting).toBe(false)
    expect(reading.consequencesHit).toBe(1)
  })

  it('exposes a per-step reading, one entry per played step, in order', () => {
    const reading = readSteps([
      step('a', 'a-verify'),
      step('b', 'b-1'),
      step('c', 'c-reformulate'),
    ])

    expect(reading.steps.map((entry) => entry.nodeId)).toEqual(['a', 'b', 'c'])
    expect(reading.steps[0]).toMatchObject({
      flawed: true,
      stance: 'verify',
      caught: true,
      corrective: true,
      consequence: false,
    })
    expect(reading.steps[1]).toMatchObject({
      flawed: false,
      stance: 'accept',
      caught: false,
      corrective: false,
      consequence: false,
    })
  })
})
