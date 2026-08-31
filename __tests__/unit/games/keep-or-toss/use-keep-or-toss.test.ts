import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useKeepOrToss } from '@/games/keep-or-toss/hooks/use-keep-or-toss.hook'

const item = (id: string, keep: boolean) => ({
  id,
  label: `Libellé de ${id}.`,
  keep,
  reason: `Pourquoi ${id}.`,
})

const baseConfig = () => ({
  statement: 'Consigne de test.',
  durationSeconds: 10,
  items: [
    item('p1', true),
    item('p2', false),
    item('p3', true),
    item('p4', false),
    item('p5', true),
    item('p6', false),
    item('p7', true),
    item('p8', false),
  ],
})

const renderGame = (config: unknown = baseConfig(), onSubmit = vi.fn()) => ({
  onSubmit,
  ...renderHook(() => useKeepOrToss(config, onSubmit)),
})

/**
 * Trie huit cartes d'affilée, un geste `act()` par carte — jamais une boucle
 * dans un seul `act()` : un seul appel groupé rejouerait huit fois le même
 * rendu figé, `currentItem` ne bougeant qu'entre deux rendus réels, exactement
 * comme un joueur ne peut cliquer deux fois avant que l'écran ne se
 * redessine.
 */
const sortAll = (
  result: { current: ReturnType<typeof useKeepOrToss> },
  kept: boolean,
): void => {
  for (let i = 0; i < 8; i++) {
    act(() => {
      result.current.sort(kept)
    })
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('use keep or toss', () => {
  it('opens sorting the first item, nothing sorted yet, no revelation', () => {
    const { result } = renderGame()

    expect(result.current.phase).toBe('sorting')
    expect(result.current.sortedCount).toBe(0)
    expect(result.current.total).toBe(8)
    expect(result.current.currentItem).toEqual({
      id: 'p1',
      label: 'Libellé de p1.',
    })
    expect(result.current.revelations).toEqual([])
  })

  it('never exposes keep or reason before the reveal', () => {
    const { result } = renderGame()

    const serializeVisible = () =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(result.current).filter(
            ([, value]) => typeof value !== 'function',
          ),
        ),
      )

    expect(serializeVisible()).not.toContain('Pourquoi')

    act(() => {
      result.current.sort(true)
    })

    expect(serializeVisible()).not.toContain('Pourquoi')
  })

  it('advances to the next card on each sort, tracking the sorted count', () => {
    const { result } = renderGame()

    act(() => {
      result.current.sort(true)
    })
    expect(result.current.sortedCount).toBe(1)
    expect(result.current.currentItem?.id).toBe('p2')

    act(() => {
      result.current.sort(false)
    })
    expect(result.current.sortedCount).toBe(2)
    expect(result.current.currentItem?.id).toBe('p3')
  })

  it('freezes once the last card of the lot is sorted, without waiting for the timer', () => {
    const { result } = renderGame()

    sortAll(result, true)

    expect(result.current.phase).toBe('frozen')
    expect(result.current.sortedCount).toBe(8)
  })

  it('ignores further sorts once frozen: the last card sorted does not overflow into a ninth verdict', () => {
    const { result, onSubmit } = renderGame()

    sortAll(result, true)
    act(() => {
      result.current.sort(false)
    })
    act(() => {
      result.current.reveal()
    })
    act(() => {
      result.current.advance()
    })

    const answer = onSubmit.mock.calls[0][0] as { verdicts: unknown[] }
    expect(answer.verdicts).toHaveLength(8)
  })

  it('moves from frozen to revealed only on an explicit reveal(), never automatically', () => {
    const { result } = renderGame()

    sortAll(result, true)
    expect(result.current.phase).toBe('frozen')
    expect(result.current.revelations).toEqual([])

    act(() => {
      result.current.reveal()
    })
    expect(result.current.phase).toBe('revealed')
    expect(result.current.revelations).toHaveLength(8)
  })

  it('freezes automatically once the countdown expires, and drops a sort attempted afterwards', () => {
    vi.useFakeTimers()
    const { result } = renderGame({ ...baseConfig(), durationSeconds: 2 })

    act(() => {
      result.current.sort(true)
    })
    expect(result.current.sortedCount).toBe(1)

    act(() => {
      vi.advanceTimersByTime(2500)
    })

    expect(result.current.phase).toBe('frozen')
    expect(result.current.sortedCount).toBe(1)

    // Un tri arrivé après la limite n'entre pas dans la trace.
    act(() => {
      result.current.sort(false)
    })
    expect(result.current.sortedCount).toBe(1)
  })

  /**
   * Constat 8 de la revue du 31/08 : `phase` ne bascule à `'frozen'` qu'au
   * tick suivant de `useCountdown` (250 ms), jamais à l'instant exact où le
   * budget expire. Le test original avançait de 2500 ms sur un budget de
   * 2000 ms — largement après le tick qui gèle déjà à 2000/2250 ms — et ne
   * visitait donc jamais la fenêtre litigieuse. Ici, `vi.setSystemTime`
   * avance l'horloge réelle sans exécuter le `setInterval` : `phase` reste
   * `'sorting'`, exactement la situation où un tri déposé aurait avant le
   * correctif de `sort()` (lecture fraîche de `readElapsedSeconds`) été
   * accepté et compté dans la trace.
   */
  it('rejects a sort attempted 100ms past the budget, even before the next 250ms tick would flip the phase to frozen', () => {
    vi.useFakeTimers()
    const start = new Date('2024-01-01T00:00:00.000Z')
    vi.setSystemTime(start)

    const { result } = renderGame({ ...baseConfig(), durationSeconds: 2 })

    act(() => {
      result.current.sort(true)
    })
    expect(result.current.sortedCount).toBe(1)
    // Aucun tick de `setInterval` n'a encore eu lieu : la phase resterait
    // 'sorting' sans la lecture fraîche que `sort()` fait elle-même.
    expect(result.current.phase).toBe('sorting')

    act(() => {
      vi.setSystemTime(new Date(start.getTime() + 2100))
    })

    act(() => {
      result.current.sort(false)
    })

    // Le second geste, déposé 100 ms après la limite, n'entre pas dans la
    // trace : le lot se gèle sur son état d'avant ce geste.
    expect(result.current.sortedCount).toBe(1)
    expect(result.current.phase).toBe('frozen')
  })

  it('captures a duration below the budget for a lot frozen by expiry, not the last displayed tick', () => {
    vi.useFakeTimers()
    const { result, onSubmit } = renderGame({
      ...baseConfig(),
      durationSeconds: 2,
    })

    act(() => {
      vi.advanceTimersByTime(2500)
    })
    act(() => {
      result.current.reveal()
    })
    act(() => {
      result.current.advance()
    })

    const answer = onSubmit.mock.calls[0][0] as { elapsedSeconds: number }
    expect(answer.elapsedSeconds).toBeGreaterThanOrEqual(2)
  })

  it('submits the frozen trace only once, even if advance fires twice', () => {
    const { result, onSubmit } = renderGame()

    sortAll(result, true)
    act(() => {
      result.current.reveal()
    })
    act(() => {
      result.current.advance()
    })
    act(() => {
      result.current.advance()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('reveals in the declared order of the configuration, with the expected verdict and reason', () => {
    const { result } = renderGame()

    sortAll(result, true)
    act(() => {
      result.current.reveal()
    })

    expect(result.current.revelations.map((entry) => entry.id)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
      'p5',
      'p6',
      'p7',
      'p8',
    ])
    expect(result.current.revelations[0]).toEqual({
      id: 'p1',
      label: 'Libellé de p1.',
      keep: true,
      reason: 'Pourquoi p1.',
    })
  })
})
