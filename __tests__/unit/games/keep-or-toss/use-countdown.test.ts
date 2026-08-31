import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useCountdown } from '@/games/keep-or-toss/hooks/use-countdown.hook'

afterEach(() => {
  vi.useRealTimers()
})

describe('use countdown', () => {
  it('opens at the full duration, not expired, no announcement yet', () => {
    const { result } = renderHook(() => useCountdown(20, true))

    expect(result.current.remainingSeconds).toBe(20)
    expect(result.current.expired).toBe(false)
    expect(result.current.announcement).toBe('')
  })

  it('counts down as time passes while running', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCountdown(20, true))

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.remainingSeconds).toBeCloseTo(17, 1)
    expect(result.current.elapsedSeconds).toBeCloseTo(3, 1)
  })

  it('does not tick at all while not running', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCountdown(20, false))

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(result.current.remainingSeconds).toBe(20)
    expect(result.current.elapsedSeconds).toBe(0)
  })

  it('flips to expired once the elapsed time reaches the duration, and clamps remaining at zero', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCountdown(2, true))

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    expect(result.current.expired).toBe(true)
    expect(result.current.remainingSeconds).toBe(0)
  })

  it('announces the 10s and 5s milestones once each, for a 20s budget', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCountdown(20, true))

    act(() => {
      vi.advanceTimersByTime(10250)
    })
    expect(result.current.announcement).toBe('10 secondes restantes')

    act(() => {
      vi.advanceTimersByTime(4500)
    })
    // 14,75 s écoulées, 5,25 s restantes : pas encore le palier des 5 s.
    expect(result.current.announcement).toBe('10 secondes restantes')

    act(() => {
      vi.advanceTimersByTime(500)
    })
    expect(result.current.announcement).toBe('5 secondes restantes')
  })

  it('never announces the 30s milestone for a budget shorter than 30 seconds', () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useCountdown(20, true))

    act(() => {
      vi.advanceTimersByTime(20000)
    })

    expect(result.current.announcement).not.toContain('30')
  })

  it('captures the elapsed duration freshly at the instant of the call, not the last displayed tick', () => {
    vi.useFakeTimers()
    const start = new Date('2024-01-01T00:00:00.000Z')
    vi.setSystemTime(start)

    const { result } = renderHook(() => useCountdown(20, true))

    // Le temps réel avance, mais aucun battement d'intervalle n'a eu lieu :
    // l'état affiché reste donc figé à zéro.
    vi.setSystemTime(new Date(start.getTime() + 1234))
    expect(result.current.elapsedSeconds).toBe(0)

    expect(result.current.readElapsedSeconds()).toBeCloseTo(1.234, 3)
  })
})
