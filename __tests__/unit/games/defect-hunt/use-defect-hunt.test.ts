import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useDefectHunt } from '@/games/defect-hunt/hooks/use-defect-hunt.hook'

type Kind = 'security' | 'logic' | 'hallucinated-dependency'

const CODE = Array.from(
  { length: 10 },
  (_, index) => `const line${index + 1} = ${index + 1}`,
).join('\n')

const defect = (id: string, line: number, kind: Kind) => ({
  id,
  line,
  kind,
  reveal: `révélation ${id}`,
})

const baseConfig = () => ({
  statement: 'Consigne de test.',
  snippet: { label: 'Extrait', language: 'ts', code: CODE },
  timeLimitSeconds: 180,
  defects: [
    defect('d1', 2, 'security'),
    defect('d2', 4, 'logic'),
    defect('d3', 6, 'hallucinated-dependency'),
  ],
})

const renderGame = (config: unknown = baseConfig(), onSubmit = vi.fn()) => ({
  onSubmit,
  ...renderHook(() => useDefectHunt(config, onSubmit)),
})

afterEach(() => {
  vi.useRealTimers()
})

describe('use defect hunt', () => {
  it('opens with the announced count, no marks and no revelation', () => {
    const { result } = renderGame()

    expect(result.current.statement).toBe('Consigne de test.')
    expect(result.current.announcedCount).toBe(3)
    expect(result.current.markedLines.size).toBe(0)
    expect(result.current.submitted).toBe(false)
    expect(result.current.reading).toBeUndefined()
    expect(result.current.revelations).toBeUndefined()
  })

  it('toggles a mark on, and off again, before the review is rendered', () => {
    const { result } = renderGame()

    act(() => {
      result.current.toggleLine(4)
    })
    expect(result.current.markedLines.has(4)).toBe(true)

    act(() => {
      result.current.toggleLine(4)
    })
    expect(result.current.markedLines.has(4)).toBe(false)
  })

  it('does not carry a mark toggled off before submission, in the submitted trace', () => {
    const { result, onSubmit } = renderGame()

    act(() => {
      result.current.toggleLine(2)
    })
    act(() => {
      result.current.toggleLine(4)
    })
    act(() => {
      result.current.toggleLine(4)
    })
    act(() => {
      result.current.submitReview()
    })
    act(() => {
      result.current.advance()
    })

    const answer = onSubmit.mock.calls[0][0] as { markedLines: number[] }
    expect(answer.markedLines).toEqual([2])
  })

  it('locks the marks once the review is rendered: toggling afterwards changes nothing', () => {
    const { result } = renderGame()

    act(() => {
      result.current.toggleLine(2)
    })
    act(() => {
      result.current.submitReview()
    })
    act(() => {
      result.current.toggleLine(4)
    })

    expect(result.current.markedLines).toEqual(new Set([2]))
  })

  it('submits the frozen trace only once, even if the passage action fires twice', () => {
    const { result, onSubmit } = renderGame()

    act(() => {
      result.current.toggleLine(2)
    })
    act(() => {
      result.current.submitReview()
    })
    act(() => {
      result.current.advance()
    })
    act(() => {
      result.current.advance()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('never exposes a defect nature or line before the review is rendered', () => {
    const { result } = renderGame()

    const serialized = JSON.stringify(
      Object.fromEntries(
        Object.entries(result.current).filter(
          ([, value]) => typeof value !== 'function',
        ),
      ),
    )

    expect(serialized).not.toContain('révélation')
    expect(serialized).not.toContain('security')
    expect(serialized).not.toContain('hallucinated-dependency')
  })

  it('exposes the reading and the revelations, in declared order, once rendered', () => {
    const { result } = renderGame()

    act(() => {
      result.current.toggleLine(2)
    })
    act(() => {
      result.current.toggleLine(6)
    })
    act(() => {
      result.current.submitReview()
    })

    expect(result.current.reading?.found.map((entry) => entry.id)).toEqual([
      'd1',
      'd3',
    ])
    expect(result.current.revelations?.map((entry) => entry.line)).toEqual([
      2, 4, 6,
    ])
    expect(result.current.revelations?.map((entry) => entry.found)).toEqual([
      true,
      false,
      true,
    ])
  })

  it('advances the displayed time while the review is not rendered', () => {
    vi.useFakeTimers()
    const { result } = renderGame()

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.elapsedSeconds).toBeCloseTo(1, 1)
  })

  it('stops the displayed time once the review is rendered', () => {
    vi.useFakeTimers()
    const { result } = renderGame()

    act(() => {
      vi.advanceTimersByTime(500)
    })
    act(() => {
      result.current.submitReview()
    })
    const afterSubmit = result.current.elapsedSeconds

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.elapsedSeconds).toBe(afterSubmit)
  })

  it('keeps ticking, and keeps the review toggleable, past the time budget', () => {
    vi.useFakeTimers()
    const { result } = renderGame({ ...baseConfig(), timeLimitSeconds: 1 })

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.elapsedSeconds).toBeGreaterThan(1)

    act(() => {
      result.current.toggleLine(2)
    })
    expect(result.current.markedLines.has(2)).toBe(true)
  })

  it('captures the duration of the gesture in the submitted trace, not the last displayed tick', () => {
    vi.useFakeTimers()
    const start = new Date('2024-01-01T00:00:00.000Z')
    vi.setSystemTime(start)

    const { result, onSubmit } = renderGame()

    // Le temps réel avance, mais aucun battement d'intervalle n'a eu lieu :
    // l'état affiché reste donc figé à zéro.
    vi.setSystemTime(new Date(start.getTime() + 1234))
    expect(result.current.elapsedSeconds).toBe(0)

    act(() => {
      result.current.submitReview()
    })
    act(() => {
      result.current.advance()
    })

    const answer = onSubmit.mock.calls[0][0] as { elapsedSeconds: number }
    expect(answer.elapsedSeconds).toBeCloseTo(1.234, 3)
    expect(result.current.elapsedSeconds).toBe(0)
  })
})
