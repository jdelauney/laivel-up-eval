import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useCheckpoints } from '@/games/checkpoints/hooks/use-checkpoints.hook'
import type { Choice } from '@/games/checkpoints/schema/config.schema'

const stage = (
  id: string,
  corriger: number,
  defect?: { id: string; burstsAt: string; factor: number },
) => ({
  id,
  label: id,
  output: { prose: `sortie de l'IA pour ${id}` },
  costs: { 'laisser-passer': 0, corriger, 're-cadrer': corriger + 1 },
  defect,
})

const config = {
  budget: 10,
  stages: [
    stage('cadrage', 2, { id: 'ambiguite', burstsAt: 'revue', factor: 3 }),
    stage('plan', 2, { id: 'pan-non-couvert', burstsAt: 'tests', factor: 3 }),
    stage('generation', 3),
    stage('revue', 4),
    stage('tests', 5),
    stage('merge', 6),
  ],
}

const LET_IT_RIDE: Choice[] = Array.from({ length: 6 }, () => 'laisser-passer')

const renderGame = (onLock = vi.fn(), onAdvance = vi.fn()) => ({
  onLock,
  onAdvance,
  ...renderHook(() => useCheckpoints(config, onLock, onAdvance)),
})

/**
 * Le hook rend une nouvelle fonction `choose` à chaque rendu : rejouer celle du
 * premier rendu écraserait les choix suivants.
 */
const playAll = (
  result: { current: { choose: (choice: Choice) => void } },
  choices: readonly Choice[],
) => {
  for (const choice of choices) {
    act(() => {
      result.current.choose(choice)
    })
  }
}

describe('use checkpoints', () => {
  it('opens on the first stage, with the budget the config declares', () => {
    const { result } = renderGame()

    expect(result.current.stage?.id).toBe('cadrage')
    expect(result.current.stageNumber).toBe(1)
    expect(result.current.stageCount).toBe(6)
    expect(result.current.budget).toBe(10)
    expect(result.current.journal).toEqual([])
  })

  it('parses the config once, not on every render', () => {
    const { result, rerender } = renderGame()
    const first = result.current.stages

    rerender()

    expect(result.current.stages).toBe(first)
  })

  it('records a choice, advances one stage and appends to the journal', () => {
    const { result } = renderGame()

    act(() => {
      result.current.choose('corriger')
    })

    expect(result.current.stage?.id).toBe('plan')
    expect(result.current.stageNumber).toBe(2)
    expect(result.current.budget).toBe(8)
    expect(result.current.journal).toEqual([
      { stageId: 'cadrage', choice: 'corriger', cost: 2 },
    ])
  })

  it('locks and advances once, on the sixth choice and never before', () => {
    const { result, onLock, onAdvance } = renderGame()

    playAll(result, LET_IT_RIDE.slice(0, 5))
    expect(onLock).not.toHaveBeenCalled()
    expect(onAdvance).not.toHaveBeenCalled()

    act(() => {
      result.current.choose('laisser-passer')
    })

    expect(onLock).toHaveBeenCalledTimes(1)
    expect(onLock.mock.calls[0][0]).toMatchObject({
      remainingBudget: -2,
      remainingDefects: ['ambiguite', 'pan-non-couvert'],
    })
    // Ce jeu ne révèle rien entre le verrou et l'avance : les deux partent du
    // même geste, sans révélation à protéger entre les deux.
    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  it('keeps the six stages playable once the budget is spent', () => {
    const { result, onLock } = renderGame()

    playAll(
      result,
      Array.from({ length: 6 }, () => 'corriger'),
    )

    expect(onLock).toHaveBeenCalledTimes(1)
    expect(onLock.mock.calls[0][0]).toMatchObject({ remainingBudget: -12 })
  })

  it('offers no way back: a seventh choice changes nothing', () => {
    const { result, onLock } = renderGame()

    playAll(result, LET_IT_RIDE)
    const journal = result.current.journal

    act(() => {
      result.current.choose('re-cadrer')
    })

    expect(result.current.journal).toEqual(journal)
    expect(onLock).toHaveBeenCalledTimes(1)
    expect(result.current.stage).toBeUndefined()
  })

  it('submits a trace whose stages follow the config order', () => {
    const { result, onLock } = renderGame()

    playAll(result, LET_IT_RIDE)

    const answer = onLock.mock.calls[0][0] as {
      decisions: { stageId: string }[]
    }
    expect(answer.decisions.map((decision) => decision.stageId)).toEqual(
      config.stages.map((entry) => entry.id),
    )
  })
})
