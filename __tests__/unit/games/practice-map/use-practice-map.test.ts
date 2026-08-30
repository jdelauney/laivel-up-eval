import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePracticeMap } from '@/games/practice-map/hooks/use-practice-map.hook'

const poles = () => ({
  intensityLow: 'vous le faites',
  intensityHigh: "l'agent le fait seul",
  rigorLow: 'rien ne la vérifie',
  rigorHigh: 'un garde-fou la tient sans vous',
})

const zone = (
  intensityFrom: number,
  intensityTo: number,
  rigorFrom: number,
  rigorTo: number,
) => ({ intensityFrom, intensityTo, rigorFrom, rigorTo })

const practice = (id: string, expected: ReturnType<typeof zone>) => ({
  id,
  label: `Pratique ${id}.`,
  expected,
  marker: `Repère de ${id}.`,
})

const baseConfig = () => ({
  statement: 'Consigne de test.',
  highRigorFrom: 0.5,
  poles: poles(),
  practices: [
    practice('p1', zone(0, 0.2, 0, 0.2)),
    practice('p2', zone(0.3, 0.5, 0.3, 0.5)),
    practice('p3', zone(0.6, 0.8, 0.6, 0.8)),
    practice('p4', zone(0.8, 1, 0, 0.15)),
  ],
  orderings: [
    { id: 'o1', axis: 'rigor', higherId: 'p3', lowerId: 'p1' },
    { id: 'o2', axis: 'rigor', higherId: 'p2', lowerId: 'p1' },
    { id: 'o3', axis: 'intensity', higherId: 'p4', lowerId: 'p1' },
  ],
})

const renderGame = (config: unknown = baseConfig(), onSubmit = vi.fn()) => ({
  onSubmit,
  ...renderHook(() => usePracticeMap(config, onSubmit)),
})

describe('use practice map', () => {
  it('opens with every practice in the tray, nothing placed, playing phase', () => {
    const { result } = renderGame()

    expect(result.current.phase).toBe('placing')
    expect(result.current.tray).toHaveLength(4)
    expect(result.current.placedTokens).toHaveLength(0)
    expect(result.current.canSubmit).toBe(false)
  })

  it('never exposes expected or marker before the revelation', () => {
    const { result } = renderGame()

    const serializeVisible = () =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(result.current).filter(
            ([, value]) => typeof value !== 'function',
          ),
        ),
      )

    expect(serializeVisible()).not.toContain('expected')
    expect(serializeVisible()).not.toContain('Repère de')

    act(() => {
      result.current.hold('p1')
    })
    act(() => {
      result.current.place(0.1, 0.1)
    })

    expect(serializeVisible()).not.toContain('expected')
    expect(serializeVisible()).not.toContain('Repère de')
  })

  it('moves a practice from the tray to the plane once placed', () => {
    const { result } = renderGame()

    act(() => {
      result.current.hold('p1')
    })
    act(() => {
      result.current.place(0.15, 0.05)
    })

    expect(result.current.tray.map((entry) => entry.id)).not.toContain('p1')
    expect(result.current.placedTokens).toEqual([
      { id: 'p1', label: 'Pratique p1.', intensity: 0.15, rigor: 0.05 },
    ])
  })

  it('replaces the placement of a practice placed twice, with no duplicate', () => {
    const { result } = renderGame()

    act(() => {
      result.current.hold('p1')
    })
    act(() => {
      result.current.place(0.1, 0.1)
    })
    act(() => {
      result.current.hold('p1')
    })
    act(() => {
      result.current.place(0.9, 0.9)
    })

    expect(result.current.placedTokens).toHaveLength(1)
    expect(result.current.placedTokens[0]).toEqual({
      id: 'p1',
      label: 'Pratique p1.',
      intensity: 0.9,
      rigor: 0.9,
    })
  })

  it('clamps a nudge at the four extremities of the plane', () => {
    const { result } = renderGame()

    // Le jeton est saisi au centre (0.5, 0.5) : il faut au moins cinq pas de
    // 0,1 pour atteindre chaque borne basse, et le double pour la haute.
    act(() => {
      result.current.hold('p1')
    })
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.nudge('intensity', -1)
        result.current.nudge('rigor', -1)
      })
    }
    expect(result.current.heldPosition).toEqual({ intensity: 0, rigor: 0 })

    for (let i = 0; i < 20; i++) {
      act(() => {
        result.current.nudge('intensity', 1)
        result.current.nudge('rigor', 1)
      })
    }
    expect(result.current.heldPosition).toEqual({ intensity: 1, rigor: 1 })
  })

  it('does nothing on release without a held practice, and clears the held state on release', () => {
    const { result } = renderGame()

    act(() => {
      result.current.hold('p1')
    })
    act(() => {
      result.current.release()
    })

    expect(result.current.heldId).toBeUndefined()
    expect(result.current.heldPosition).toBeUndefined()
    expect(result.current.tray.map((entry) => entry.id)).toContain('p1')
  })

  it('does nothing on submit while the tray is not empty', () => {
    const { result } = renderGame()

    act(() => {
      result.current.hold('p1')
    })
    act(() => {
      result.current.place(0.1, 0.1)
    })
    act(() => {
      result.current.submit()
    })

    expect(result.current.phase).toBe('placing')
  })

  it('reveals the markers only once every practice is placed and submitted', () => {
    const { result } = renderGame()

    const placeAll = () => {
      ;['p1', 'p2', 'p3', 'p4'].forEach((id) => {
        act(() => {
          result.current.hold(id)
        })
        act(() => {
          result.current.place(0.5, 0.5)
        })
      })
    }
    placeAll()

    expect(result.current.canSubmit).toBe(true)
    expect(result.current.markers).toHaveLength(0)

    act(() => {
      result.current.submit()
    })

    expect(result.current.phase).toBe('revealed')
    expect(result.current.markers).toHaveLength(4)
  })

  it('submits the trace only once, even if advance fires twice', () => {
    const { result, onSubmit } = renderGame()

    ;['p1', 'p2', 'p3', 'p4'].forEach((id) => {
      act(() => {
        result.current.hold(id)
      })
      act(() => {
        result.current.place(0.5, 0.5)
      })
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

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const answer = onSubmit.mock.calls[0][0] as {
      placements: { practiceId: string }[]
    }
    expect(answer.placements.map((entry) => entry.practiceId)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
    ])
  })

  it('renders the position in words, never in numbers, and reflects the two poles of the configuration', () => {
    const { result } = renderGame()

    expect(result.current.positionLabel(0.9, 0.9)).toBe(
      "l'agent le fait seul, un garde-fou la tient sans vous",
    )
    expect(result.current.positionLabel(0.1, 0.1)).toBe(
      'vous le faites, rien ne la vérifie',
    )
    expect(result.current.positionLabel(0.9, 0.9)).not.toMatch(/[0-9]/)
  })

  it('locks hold, place, nudge, release and submit once revealed', () => {
    const { result } = renderGame()

    ;['p1', 'p2', 'p3', 'p4'].forEach((id) => {
      act(() => {
        result.current.hold(id)
      })
      act(() => {
        result.current.place(0.5, 0.5)
      })
    })
    act(() => {
      result.current.submit()
    })

    act(() => {
      result.current.hold('p1')
    })
    expect(result.current.heldId).toBeUndefined()

    const before = result.current.placedTokens
    act(() => {
      result.current.place(0.1, 0.1)
    })
    expect(result.current.placedTokens).toEqual(before)
  })
})
