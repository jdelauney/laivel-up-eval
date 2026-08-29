import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { TrackView } from '@/games/three-tracks/hooks/use-three-tracks.hook'
import { useThreeTracks } from '@/games/three-tracks/hooks/use-three-tracks.hook'
import { threeTracksConfigSchema } from '@/games/three-tracks/schema/config.schema'

const config = {
  statement: 'Consigne de test.',
  turns: 3,
  attentionPerTurn: 3,
  maxPerTrack: 2,
  driftAfter: 2,
  diesAfter: 3,
  tracks: [
    { id: 'alpha', label: 'Alpha', brief: 'brief alpha', work: 4 },
    { id: 'beta', label: 'Beta', brief: 'brief beta', work: 6 },
  ],
}

const renderGame = (onSubmit = vi.fn()) => ({
  onSubmit,
  ...renderHook(() => useThreeTracks(config, onSubmit)),
})

const findTrack = (tracks: readonly TrackView[], id: string): TrackView => {
  const track = tracks.find((entry) => entry.id === id)
  if (track === undefined) throw new Error(`chantier « ${id} » introuvable`)
  return track
}

describe('use three tracks', () => {
  it('opens on the first turn, with the full attention of the turn to place', () => {
    const { result } = renderGame()

    expect(result.current.statement).toBe(config.statement)
    expect(result.current.turnNumber).toBe(1)
    expect(result.current.turnsTotal).toBe(3)
    expect(result.current.attentionRemaining).toBe(3)
    expect(result.current.isComplete).toBe(false)
    expect(result.current.tracks.map((track) => track.status)).toEqual([
      'open',
      'open',
    ])
    expect(
      result.current.tracks.every((track) => track.maxSelectable === 2),
    ).toBe(true)
  })

  it('parses the config once, not on every render', () => {
    const parseSpy = vi.spyOn(threeTracksConfigSchema, 'parse')
    const { rerender } = renderGame()

    rerender()
    rerender()

    expect(parseSpy).toHaveBeenCalledTimes(1)
    parseSpy.mockRestore()
  })

  it('records attention on a track, and tightens what the others can still take', () => {
    const { result } = renderGame()

    act(() => {
      result.current.setAttention('alpha', 2)
    })

    expect(findTrack(result.current.tracks, 'alpha').pending).toBe(2)
    expect(result.current.attentionRemaining).toBe(1)
    expect(findTrack(result.current.tracks, 'beta').maxSelectable).toBe(1)
  })

  it("refuses a value beyond a track's own cap", () => {
    const { result } = renderGame()

    act(() => {
      result.current.setAttention('alpha', 3)
    })

    expect(findTrack(result.current.tracks, 'alpha').pending).toBe(0)
  })

  it("refuses a value beyond the turn's remaining attention", () => {
    const { result } = renderGame()

    act(() => {
      result.current.setAttention('alpha', 2)
    })
    act(() => {
      result.current.setAttention('beta', 2)
    })

    expect(findTrack(result.current.tracks, 'alpha').pending).toBe(2)
    expect(findTrack(result.current.tracks, 'beta').pending).toBe(0)
  })

  it('places no unit on a track once it has merged', () => {
    const { result } = renderGame()

    act(() => {
      result.current.setAttention('alpha', 2)
    })
    act(() => {
      result.current.closeTurn()
    })
    act(() => {
      result.current.setAttention('alpha', 2)
    })
    act(() => {
      result.current.closeTurn()
    })

    expect(findTrack(result.current.tracks, 'alpha').status).toBe('merged')

    act(() => {
      result.current.setAttention('alpha', 1)
    })

    expect(findTrack(result.current.tracks, 'alpha').pending).toBe(0)
  })

  it('closes the turn even with attention left unplaced, and loses it', () => {
    const { result } = renderGame()

    act(() => {
      result.current.setAttention('alpha', 1)
    })
    act(() => {
      result.current.closeTurn()
    })

    expect(result.current.turnNumber).toBe(2)
    expect(findTrack(result.current.tracks, 'alpha').progress).toBe(1)
    expect(result.current.attentionRemaining).toBe(3)
  })

  it('submits once, on the third turn and never before', () => {
    const { result, onSubmit } = renderGame()

    act(() => {
      result.current.closeTurn()
    })
    act(() => {
      result.current.closeTurn()
    })
    expect(onSubmit).not.toHaveBeenCalled()

    act(() => {
      result.current.closeTurn()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(result.current.isComplete).toBe(true)
  })

  it('offers no way back: closing once the game is complete changes nothing', () => {
    const { result, onSubmit } = renderGame()

    act(() => {
      result.current.closeTurn()
    })
    act(() => {
      result.current.closeTurn()
    })
    act(() => {
      result.current.closeTurn()
    })
    const turnNumber = result.current.turnNumber

    act(() => {
      result.current.closeTurn()
    })

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(result.current.turnNumber).toBe(turnNumber)
  })

  it('submits a trace whose allocations follow the config order, never the click order', () => {
    const { result, onSubmit } = renderGame()

    act(() => {
      result.current.setAttention('beta', 1)
      result.current.setAttention('alpha', 1)
    })
    act(() => {
      result.current.closeTurn()
    })
    act(() => {
      result.current.closeTurn()
    })
    act(() => {
      result.current.closeTurn()
    })

    const answer = onSubmit.mock.calls[0][0] as {
      turns: { allocations: { trackId: string }[] }[]
    }
    expect(answer.turns[0].allocations.map((entry) => entry.trackId)).toEqual(
      config.tracks.map((track) => track.id),
    )
  })
})
