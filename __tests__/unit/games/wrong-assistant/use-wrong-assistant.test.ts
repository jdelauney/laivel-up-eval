import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useWrongAssistant } from '@/games/wrong-assistant/hooks/use-wrong-assistant.hook'
import type { ReplyStance } from '@/games/wrong-assistant/schema/config.schema'

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

const baseConfig = () => ({
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

const renderGame = (config: unknown = baseConfig(), onSubmit = vi.fn()) => ({
  onSubmit,
  ...renderHook(() => useWrongAssistant(config, onSubmit)),
})

describe('use wrong assistant', () => {
  it('opens on the root node, talking, an empty thread, no revelation exposed', () => {
    const { result } = renderGame()

    expect(result.current.phase).toBe('talking')
    expect(result.current.thread).toEqual([])
    expect(result.current.currentMessage).toBe('Message a.')
    expect(result.current.currentReplies?.map((entry) => entry.id)).toEqual([
      'a-accept',
      'a-challenge',
      'a-verify',
    ])
    expect(result.current.revelations).toBeUndefined()
  })

  it('never exposes flawed, flaw, consequence or stance before the scenario is revealed', () => {
    const { result } = renderGame()

    const serializeVisible = () =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(result.current).filter(
            ([, value]) => typeof value !== 'function',
          ),
        ),
      )

    expect(serializeVisible()).not.toMatch(/flawed|flaw|consequence|stance/i)

    act(() => {
      result.current.reply('a-challenge')
    })

    expect(serializeVisible()).not.toMatch(/flawed|flaw|consequence|stance/i)
  })

  it('advances the thread on a reply that carries a nextId, appending the played turn', () => {
    const { result } = renderGame()

    act(() => {
      result.current.reply('a-challenge')
    })

    expect(result.current.phase).toBe('talking')
    expect(result.current.currentMessage).toBe('Message b.')
    expect(result.current.thread).toEqual([
      {
        nodeId: 'a',
        assistantMessage: 'Message a.',
        chosenReplyText: 'Réponse a-challenge.',
      },
    ])
  })

  it('is irreversible: a further reply once revealed changes nothing', () => {
    const { result } = renderGame()

    act(() => {
      result.current.reply('a-challenge')
    })
    act(() => {
      result.current.reply('b-1')
    })
    act(() => {
      result.current.reply('c-challenge')
    })
    expect(result.current.phase).toBe('revealed')

    const threadBefore = result.current.thread

    act(() => {
      result.current.reply('c-reformulate')
    })

    expect(result.current.thread).toBe(threadBefore)
  })

  it('closes on a reply with no nextId, revealing only the flawed nodes met on this path', () => {
    const { result } = renderGame()

    act(() => {
      result.current.reply('a-challenge')
    })
    act(() => {
      result.current.reply('b-1')
    })
    act(() => {
      result.current.reply('c-challenge')
    })

    expect(result.current.phase).toBe('revealed')
    expect(result.current.currentMessage).toBeUndefined()
    expect(result.current.currentReplies).toBeUndefined()
    expect(result.current.revelations).toEqual([
      { nodeId: 'a', message: 'Message a.', flaw: 'Ce qui cloche en a.' },
      { nodeId: 'c', message: 'Message c.', flaw: 'Ce qui cloche en c.' },
    ])
  })

  it('reveals only the flawed node actually met when an early accept ends the scenario', () => {
    const { result } = renderGame()

    act(() => {
      result.current.reply('a-accept')
    })
    act(() => {
      result.current.reply('consA-1')
    })

    expect(result.current.revelations).toEqual([
      { nodeId: 'a', message: 'Message a.', flaw: 'Ce qui cloche en a.' },
    ])
  })

  it('does not submit before advance is called, even once revealed', () => {
    const { result, onSubmit } = renderGame()

    act(() => {
      result.current.reply('a-challenge')
    })
    act(() => {
      result.current.reply('b-1')
    })
    act(() => {
      result.current.reply('c-challenge')
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the played trace only once, even if advance fires twice', () => {
    const { result, onSubmit } = renderGame()

    act(() => {
      result.current.reply('a-challenge')
    })
    act(() => {
      result.current.reply('b-1')
    })
    act(() => {
      result.current.reply('c-challenge')
    })
    act(() => {
      result.current.advance()
    })
    act(() => {
      result.current.advance()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const answer = onSubmit.mock.calls[0][0] as {
      steps: { nodeId: string; replyId: string }[]
    }
    expect(answer.steps).toEqual([
      { nodeId: 'a', replyId: 'a-challenge' },
      { nodeId: 'b', replyId: 'b-1' },
      { nodeId: 'c', replyId: 'c-challenge' },
    ])
  })

  it('does nothing on advance while still talking', () => {
    const { result, onSubmit } = renderGame()

    act(() => {
      result.current.advance()
    })

    expect(onSubmit).not.toHaveBeenCalled()
    expect(result.current.phase).toBe('talking')
  })
})
