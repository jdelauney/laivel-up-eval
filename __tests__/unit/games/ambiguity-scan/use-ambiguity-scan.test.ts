import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useAmbiguityScan } from '@/games/ambiguity-scan/hooks/use-ambiguity-scan.hook'

const segment = (id: string, ambiguous: boolean) => ({
  id,
  text: `Texte de ${id}.`,
  ambiguous,
  ...(ambiguous ? { reading: `Lecture de ${id}.` } : {}),
})

const baseConfig = () => ({
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

const renderGame = (
  config: unknown = baseConfig(),
  onLock = vi.fn(),
  onAdvance = vi.fn(),
) => ({
  onLock,
  onAdvance,
  ...renderHook(() => useAmbiguityScan(config, onLock, onAdvance)),
})

describe('use ambiguity scan', () => {
  it('opens with every segment unflagged, scanning phase, submission unavailable', () => {
    const { result } = renderGame()

    expect(result.current.phase).toBe('scanning')
    expect(result.current.segments).toHaveLength(6)
    expect(result.current.segments.every((entry) => !entry.flagged)).toBe(true)
    expect(result.current.flaggedCount).toBe(0)
    expect(result.current.canSubmit).toBe(false)
  })

  it('never exposes ambiguous or reading before the revelation', () => {
    const { result } = renderGame()

    const serializeVisible = () =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(result.current).filter(
            ([, value]) => typeof value !== 'function',
          ),
        ),
      )

    expect(serializeVisible()).not.toContain('ambiguous')
    expect(serializeVisible()).not.toContain('Lecture de')

    act(() => {
      result.current.toggle('s3')
    })

    expect(serializeVisible()).not.toContain('ambiguous')
    expect(serializeVisible()).not.toContain('Lecture de')
  })

  it('toggles a segment flagged, then back to unflagged', () => {
    const { result } = renderGame()

    act(() => {
      result.current.toggle('s1')
    })
    expect(
      result.current.segments.find((entry) => entry.id === 's1')?.flagged,
    ).toBe(true)
    expect(result.current.flaggedCount).toBe(1)

    act(() => {
      result.current.toggle('s1')
    })
    expect(
      result.current.segments.find((entry) => entry.id === 's1')?.flagged,
    ).toBe(false)
    expect(result.current.flaggedCount).toBe(0)
  })

  it('makes submission available as soon as one segment is flagged, never at zero', () => {
    const { result } = renderGame()

    expect(result.current.canSubmit).toBe(false)

    act(() => {
      result.current.toggle('s3')
    })

    expect(result.current.canSubmit).toBe(true)
  })

  it('does nothing on submit while no segment is flagged', () => {
    const { result } = renderGame()

    act(() => {
      result.current.submit()
    })

    expect(result.current.phase).toBe('scanning')
  })

  it('reveals the ambiguous segments only once submitted', () => {
    const { result } = renderGame()

    act(() => {
      result.current.toggle('s3')
    })
    expect(result.current.revelations).toHaveLength(0)

    act(() => {
      result.current.submit()
    })

    expect(result.current.phase).toBe('revealed')
    expect(result.current.revelations).toHaveLength(3)
    expect(result.current.revelations.map((entry) => entry.id)).toEqual([
      's3',
      's4',
      's5',
    ])
  })

  it('locks the trace on submit, before the revelation is read, even if submit fires twice', () => {
    const { result, onLock } = renderGame()

    act(() => {
      result.current.toggle('s3')
    })
    act(() => {
      result.current.toggle('s4')
    })
    act(() => {
      result.current.submit()
    })
    act(() => {
      result.current.submit()
    })

    expect(result.current.phase).toBe('revealed')
    expect(onLock).toHaveBeenCalledTimes(1)
    const answer = onLock.mock.calls[0][0] as { flaggedIds: string[] }
    expect(answer.flaggedIds).toEqual(['s3', 's4'])
  })

  it('advances only once, even if advance fires twice, without locking again', () => {
    const { result, onLock, onAdvance } = renderGame()

    act(() => {
      result.current.toggle('s3')
    })
    act(() => {
      result.current.submit()
    })
    act(() => {
      result.current.advance()
    })
    act(() => {
      result.current.advance()
    })

    expect(onLock).toHaveBeenCalledTimes(1)
    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  it('locks toggle and submit once revealed', () => {
    const { result } = renderGame()

    act(() => {
      result.current.toggle('s3')
    })
    act(() => {
      result.current.submit()
    })

    act(() => {
      result.current.toggle('s1')
    })

    expect(
      result.current.segments.find((entry) => entry.id === 's1')?.flagged,
    ).toBe(false)
  })
})
