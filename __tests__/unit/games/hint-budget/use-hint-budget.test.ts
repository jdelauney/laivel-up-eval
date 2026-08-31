import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useHintBudget } from '@/games/hint-budget/hooks/use-hint-budget.hook'

const framing = (
  id: string,
  established: boolean,
  refersTo: string | null = null,
) => ({
  id,
  text: `Lecture ${id}.`,
  established,
  refersTo,
})

const hint = (id: string, cost: number, eliminates: string[] = []) => ({
  id,
  label: `Indice ${id}.`,
  cost,
  text: `Texte de l'indice ${id}.`,
  eliminates,
})

const cause = (id: string, actual: boolean, ruledOutByReport = false) => ({
  id,
  text: `Cause ${id}.`,
  actual,
  verification: `Vérification ${id}.`,
  ruledOutByReport,
})

const situation = (id: string) => ({
  id,
  symptom: `Symptôme ${id}.`,
  report: [`Fait 1 de ${id}.`, `Fait 2 de ${id}.`],
  framings: [
    framing(`${id}-f1`, true),
    framing(`${id}-f2`, true),
    framing(`${id}-f3`, false),
    framing(`${id}-f4`, false),
    framing(`${id}-f5`, false),
  ],
  hints: [
    hint(`${id}-h1`, 5, [`${id}-c1`]),
    hint(`${id}-h2`, 10, [`${id}-c4`]),
    hint(`${id}-h3`, 15, [`${id}-c4`]),
    hint(`${id}-h4`, 20, [`${id}-c4`]),
  ],
  causes: [
    cause(`${id}-c1`, false),
    cause(`${id}-c2`, true),
    cause(`${id}-c3`, false),
    cause(`${id}-c4`, false, true),
  ],
})

const baseConfig = () => ({
  statement: 'Consigne de test.',
  wrongCutPenalty: 40,
  blindCutSurcharge: 30,
  situations: [situation('s1'), situation('s2'), situation('s3')],
})

const renderGame = (
  config: unknown = baseConfig(),
  onLock = vi.fn(),
  onAdvance = vi.fn(),
) => ({
  onLock,
  onAdvance,
  ...renderHook(() => useHintBudget(config, onLock, onAdvance)),
})

describe('use hint budget', () => {
  it('opens on the first situation, playing, no framing posted, no revelation', () => {
    const { result } = renderGame()

    expect(result.current.phase).toBe('playing')
    expect(result.current.situationNumber).toBe(1)
    expect(result.current.situationsTotal).toBe(3)
    expect(result.current.framingPosted).toBe(false)
    expect(result.current.revelation).toBeUndefined()
  })

  it('never exposes established, actual, verification, or the text of an unbought hint', () => {
    const { result } = renderGame()

    const serializeVisible = () =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(result.current).filter(
            ([, value]) => typeof value !== 'function',
          ),
        ),
      )

    expect(serializeVisible()).not.toContain('established')

    act(() => {
      result.current.toggleFraming('s1-f1')
    })
    act(() => {
      result.current.postFraming()
    })
    act(() => {
      result.current.buyHint('s1-h1')
    })

    const midGame = serializeVisible()
    expect(midGame).not.toContain('established')
    expect(midGame).not.toContain(`Texte de l'indice s1-h2`)
    expect(midGame).not.toContain('actual')
    expect(midGame).not.toContain('Vérification')
  })

  it('locks the framing at deposit: toggling a reading afterwards changes nothing', () => {
    const { result } = renderGame()

    act(() => {
      result.current.toggleFraming('s1-f1')
    })
    act(() => {
      result.current.postFraming()
    })
    expect(result.current.framingPosted).toBe(true)

    act(() => {
      result.current.toggleFraming('s1-f2')
    })
    expect(result.current.retainedIds).toEqual(['s1-f1'])
  })

  it('accepts a framing posted after a purchase, and the locked trace records it as posted after one hint', () => {
    const { result, onLock } = renderGame()

    act(() => {
      result.current.buyHint('s1-h1')
    })
    act(() => {
      result.current.toggleFraming('s1-f1')
    })
    act(() => {
      result.current.postFraming()
    })
    act(() => {
      result.current.cut('s1-c2')
    })
    act(() => {
      result.current.advance()
    })
    act(() => {
      result.current.cut('s2-c2')
    })
    act(() => {
      result.current.advance()
    })
    act(() => {
      // La trace complète s'écrit ici, au verrou de la dernière situation —
      // avant même que « advance » n'ait été rappelé.
      result.current.cut('s3-c2')
    })

    const answer = onLock.mock.calls[0][0] as {
      attempts: {
        situationId: string
        framing: { afterHints: number } | null
      }[]
    }
    const s1 = answer.attempts.find((entry) => entry.situationId === 's1')
    expect(s1?.framing?.afterHints).toBe(1)
  })

  it('never buys more than one hint per call: buying twice the same hint changes nothing the second time', () => {
    const { result } = renderGame()

    act(() => {
      result.current.buyHint('s1-h1')
    })
    act(() => {
      result.current.buyHint('s1-h1')
    })

    expect(result.current.hints.filter((entry) => entry.bought)).toHaveLength(1)
  })

  it('exposes the revelation only once the situation is cut', () => {
    const { result } = renderGame()

    act(() => {
      result.current.cut('s1-c2')
    })

    expect(result.current.phase).toBe('revealed')
    expect(result.current.revelation?.causes).toHaveLength(4)
    expect(result.current.revelation?.cutCauseId).toBe('s1-c2')
  })

  it('advances to the next situation, resetting the phase, the framing and the purchases', () => {
    const { result } = renderGame()

    act(() => {
      result.current.buyHint('s1-h1')
    })
    act(() => {
      result.current.cut('s1-c2')
    })
    act(() => {
      result.current.advance()
    })

    expect(result.current.situationNumber).toBe(2)
    expect(result.current.phase).toBe('playing')
    expect(result.current.framingPosted).toBe(false)
    expect(result.current.hints.some((entry) => entry.bought)).toBe(false)
  })

  it('locks the trace only once, at the last situation, even if cut fires twice', () => {
    const { result, onLock } = renderGame()

    const playSituation = (causeId: string) => {
      act(() => {
        result.current.cut(causeId)
      })
      act(() => {
        result.current.advance()
      })
    }

    playSituation('s1-c2')
    playSituation('s2-c2')

    act(() => {
      result.current.cut('s3-c2')
    })
    act(() => {
      result.current.cut('s3-c2')
    })

    expect(onLock).toHaveBeenCalledTimes(1)
    const answer = onLock.mock.calls[0][0] as {
      attempts: { situationId: string }[]
    }
    expect(answer.attempts.map((entry) => entry.situationId)).toEqual([
      's1',
      's2',
      's3',
    ])
  })

  it('advances only once, even if advance fires twice at the last situation', () => {
    const { result, onAdvance } = renderGame()

    const playSituation = (causeId: string) => {
      act(() => {
        result.current.cut(causeId)
      })
      act(() => {
        result.current.advance()
      })
    }

    playSituation('s1-c2')
    playSituation('s2-c2')

    act(() => {
      result.current.cut('s3-c2')
    })
    act(() => {
      result.current.advance()
    })
    act(() => {
      result.current.advance()
    })

    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  it('keeps the spent total free of the current situation penalty until it is revealed', () => {
    const { result } = renderGame()

    act(() => {
      result.current.buyHint('s1-h1')
    })
    // Ne tranche pas encore : le coût engagé ne doit porter que l'achat.
    expect(result.current.spent).toBe(5)

    act(() => {
      result.current.cut('s1-c1')
    })
    // Tranche fausse, aveugle sur le reste des indices : la pénalité et la
    // surtaxe n'entrent qu'à la révélation.
    expect(result.current.spent).toBe(5 + 40)
  })
})
