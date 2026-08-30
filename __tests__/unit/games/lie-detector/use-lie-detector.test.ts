import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useLieDetector } from '@/games/lie-detector/hooks/use-lie-detector.hook'

const claim = (id: string, lying: boolean) => ({
  id,
  text: `Affirmation ${id}.`,
  lying,
  verification: `Vérification ${id}.`,
})

const round = (id: string, targetId: string) => ({
  id,
  prompt: `Mise en situation ${id}.`,
  claims: [
    claim(`${id}-a`, false),
    claim(`${id}-b`, true),
    claim(`${id}-c`, false),
    claim(`${id}-d`, false),
  ],
  objection: { targetId, argument: `Argument de ${id}.` },
})

const baseConfig = () => ({
  statement: 'Consigne de test.',
  rounds: [round('r1', 'r1-b'), round('r2', 'r2-a'), round('r3', 'r3-a')],
})

const renderGame = (config: unknown = baseConfig(), onSubmit = vi.fn()) => ({
  onSubmit,
  ...renderHook(() => useLieDetector(config, onSubmit)),
})

describe('use lie detector', () => {
  it('opens in the picking phase, no objection, no reading, no revelation exposed', () => {
    const { result } = renderGame()

    expect(result.current.phase).toBe('picking')
    expect(result.current.roundNumber).toBe(1)
    expect(result.current.roundsTotal).toBe(3)
    expect(result.current.objection).toBeUndefined()
    expect(result.current.currentReading).toBeUndefined()
    expect(result.current.revelations).toBeUndefined()
  })

  it('never exposes lying or a verification string before the round is revealed', () => {
    const { result } = renderGame()

    const serialized = JSON.stringify(
      Object.fromEntries(
        Object.entries(result.current).filter(
          ([, value]) => typeof value !== 'function',
        ),
      ),
    )

    expect(serialized).not.toContain('lying')
    expect(serialized).not.toContain('Vérification')
    expect(serialized).not.toContain('Argument de')
  })

  it('locks the first designation: a further click while in the objection phase moves the final pick, never the first', () => {
    const { result } = renderGame()

    act(() => {
      result.current.designate('r1-a')
    })
    expect(result.current.phase).toBe('objection')
    expect(result.current.firstPickId).toBe('r1-a')

    act(() => {
      result.current.designate('r1-c')
    })
    expect(result.current.phase).toBe('revealed')
    expect(result.current.firstPickId).toBe('r1-a')
    expect(result.current.finalPickId).toBe('r1-c')
  })

  it('exposes the objection only once the first designation is posed', () => {
    const { result } = renderGame()

    act(() => {
      result.current.designate('r1-a')
    })

    expect(result.current.objection).toEqual({
      targetId: 'r1-b',
      argument: 'Argument de r1.',
    })
  })

  it('maintains the current pick as the final one on hold, and moves to revealed', () => {
    const { result } = renderGame()

    act(() => {
      result.current.designate('r1-b')
    })
    act(() => {
      result.current.hold()
    })

    expect(result.current.phase).toBe('revealed')
    expect(result.current.finalPickId).toBe('r1-b')
  })

  it('makes the second gesture unique: no designate or hold call changes anything once revealed', () => {
    const { result } = renderGame()

    act(() => {
      result.current.designate('r1-a')
    })
    act(() => {
      result.current.hold()
    })
    act(() => {
      result.current.designate('r1-d')
    })
    act(() => {
      result.current.hold()
    })

    expect(result.current.finalPickId).toBe('r1-a')
  })

  it('exposes the current round reading only once revealed, derived from readRounds', () => {
    const { result } = renderGame()

    act(() => {
      result.current.designate('r1-b')
    })
    act(() => {
      result.current.hold()
    })

    expect(result.current.currentReading?.unmasked).toBe(true)
    expect(result.current.revelations?.map((entry) => entry.id)).toEqual([
      'r1-a',
      'r1-b',
      'r1-c',
      'r1-d',
    ])
  })

  it('advances to the next round, resetting the phase and the picks', () => {
    const { result } = renderGame()

    act(() => {
      result.current.designate('r1-b')
    })
    act(() => {
      result.current.hold()
    })
    act(() => {
      result.current.advance()
    })

    expect(result.current.roundNumber).toBe(2)
    expect(result.current.phase).toBe('picking')
    expect(result.current.firstPickId).toBeUndefined()
    expect(result.current.objection).toBeUndefined()
  })

  it('submits the trace only once, even if advance fires twice at the last round', () => {
    const { result, onSubmit } = renderGame()

    const playRound = (claimId: string) => {
      act(() => {
        result.current.designate(claimId)
      })
      act(() => {
        result.current.hold()
      })
      act(() => {
        result.current.advance()
      })
    }

    playRound('r1-b')
    playRound('r2-b')

    act(() => {
      result.current.designate('r3-b')
    })
    act(() => {
      result.current.hold()
    })
    act(() => {
      result.current.advance()
    })
    act(() => {
      result.current.advance()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const answer = onSubmit.mock.calls[0][0] as {
      picks: { roundId: string }[]
    }
    expect(answer.picks.map((entry) => entry.roundId)).toEqual([
      'r1',
      'r2',
      'r3',
    ])
  })
})
