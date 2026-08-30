import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useConfidenceBet } from '@/games/confidence-bet/hooks/use-confidence-bet.hook'
import { confidenceBetConfigSchema } from '@/games/confidence-bet/schema/config.schema'

const snippet = (id: string, nature: 'sound' | 'flawed' | 'undecidable') => ({
  id,
  label: id,
  language: 'ts',
  code: `const ${id} = 1`,
  nature,
  reveal: `révélation ${id}`,
})

const config = {
  statement: 'Consigne de test.',
  stakes: [10, 30, 50, 70, 90],
  neutralStake: 50,
  startingCapital: 100,
  snippets: [
    snippet('s1', 'sound'),
    snippet('f1', 'flawed'),
    snippet('u1', 'undecidable'),
  ],
}

const renderGame = (onSubmit = vi.fn()) => ({
  onSubmit,
  ...renderHook(() => useConfidenceBet(config, onSubmit)),
})

const playSnippet = (
  result: { current: ReturnType<typeof useConfidenceBet> },
  stake: number,
): void => {
  act(() => {
    result.current.selectStake(stake)
  })
  act(() => {
    result.current.engage()
  })
  act(() => {
    result.current.advance()
  })
}

describe('use confidence bet', () => {
  it('opens on the first snippet, with no revelation and the full stake scale', () => {
    const { result } = renderGame()

    expect(result.current.statement).toBe(config.statement)
    expect(result.current.snippet?.id).toBe('s1')
    expect(result.current.snippetNumber).toBe(1)
    expect(result.current.snippetsTotal).toBe(3)
    expect(result.current.stakes).toEqual([10, 30, 50, 70, 90])
    expect(result.current.revelation).toBeUndefined()
    expect(result.current.canEngage).toBe(false)
    expect(result.current.capital).toBe(100)
    expect(result.current.ledger).toEqual([])
  })

  it('parses the config once, not on every render', () => {
    const parseSpy = vi.spyOn(confidenceBetConfigSchema, 'parse')
    const { rerender } = renderGame()

    rerender()
    rerender()

    expect(parseSpy).toHaveBeenCalledTimes(1)
    parseSpy.mockRestore()
  })

  it('unlocks the engagement only once a stake is selected', () => {
    const { result } = renderGame()

    act(() => {
      result.current.selectStake(70)
    })

    expect(result.current.selectedStake).toBe(70)
    expect(result.current.canEngage).toBe(true)
  })

  it('reveals the snippet only once its bet is engaged', () => {
    const { result } = renderGame()

    act(() => {
      result.current.selectStake(90)
    })
    act(() => {
      result.current.engage()
    })

    expect(result.current.revelation).toEqual({
      nature: 'sound',
      reveal: 'révélation s1',
      delta: 40,
      stake: 90,
      // Sur un extrait sain, la position juste est la mise la plus haute de
      // l'échelle : c'est elle que la règle de la révélation désigne.
      truthStake: 90,
    })
    expect(result.current.capital).toBe(140)
    expect(result.current.ledger).toEqual([
      { snippetId: 's1', label: 's1', stake: 90, delta: 40 },
    ])
  })

  it('keeps the engaged snippet on screen until the passage action opens the next one', () => {
    const { result } = renderGame()

    act(() => {
      result.current.selectStake(90)
    })
    act(() => {
      result.current.engage()
    })

    expect(result.current.snippet?.id).toBe('s1')
    expect(result.current.snippetNumber).toBe(1)

    act(() => {
      result.current.advance()
    })

    expect(result.current.snippet?.id).toBe('f1')
    expect(result.current.snippetNumber).toBe(2)
    expect(result.current.revelation).toBeUndefined()
  })

  it('offers no way to change a selection while the revelation is on screen', () => {
    const { result } = renderGame()

    act(() => {
      result.current.selectStake(90)
    })
    act(() => {
      result.current.engage()
    })
    act(() => {
      result.current.selectStake(10)
    })

    expect(result.current.selectedStake).toBeUndefined()
    expect(result.current.ledger).toHaveLength(1)
  })

  it('offers no way to engage a second bet on the same snippet before the passage action', () => {
    const { result } = renderGame()

    act(() => {
      result.current.selectStake(90)
    })
    act(() => {
      result.current.engage()
    })
    act(() => {
      result.current.engage()
    })

    expect(result.current.ledger).toHaveLength(1)
  })

  it('exposes no function that can retract or rewrite an engaged bet', () => {
    const { result } = renderGame()

    const functionKeys = Object.entries(result.current)
      .filter(([, value]) => typeof value === 'function')
      .map(([key]) => key)
      .sort()

    expect(functionKeys).toEqual(['advance', 'engage', 'selectStake'])
  })

  it('submits once, on the third snippet and never before', () => {
    const { result, onSubmit } = renderGame()

    playSnippet(result, 90)
    expect(onSubmit).not.toHaveBeenCalled()

    playSnippet(result, 10)
    expect(onSubmit).not.toHaveBeenCalled()

    playSnippet(result, 50)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(result.current.isComplete).toBe(true)
  })

  it('offers no way back: advancing once the game is complete changes nothing', () => {
    const { result, onSubmit } = renderGame()

    playSnippet(result, 90)
    playSnippet(result, 10)
    playSnippet(result, 50)

    act(() => {
      result.current.advance()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('submits a trace whose bets follow the config order', () => {
    const { result, onSubmit } = renderGame()

    playSnippet(result, 90)
    playSnippet(result, 10)
    playSnippet(result, 50)

    const answer = onSubmit.mock.calls[0][0] as {
      bets: { snippetId: string }[]
    }
    expect(answer.bets.map((bet) => bet.snippetId)).toEqual(['s1', 'f1', 'u1'])
  })
})
