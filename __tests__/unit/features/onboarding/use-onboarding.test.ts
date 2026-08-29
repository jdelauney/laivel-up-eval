import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import projectCourse from '../../../../config/course.json'
import projectGrid from '../../../../config/grid.json'
import projectSignature from '../../../../config/signature.json'
import { parseConfiguration } from '../../../../src/core/contracts/helpers/parse-config.helper'
import type { PersistenceSessionAdapter } from '../../../../src/core/ports/persistence-session-adapter.interface'
import { WeightedMappingStrategy } from '../../../../src/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '../../../../src/core/session/game-session.facade'
import { useOnboarding } from '../../../../src/features/onboarding/hooks/use-onboarding.hook'
import { buildGameRegistry } from '../../../../src/games/register-games'
import { FixedClock } from '../../../../src/infrastructure/clock/fixed.adapter'
import { SessionProvider } from '../../../../src/providers/session-context'
import { useSessionStore } from '../../../../src/store/session.store'
import { MemoryPersistence } from '../../../fixtures/memory-persistence'

const { grid, course, signature } = parseConfiguration(
  projectGrid,
  projectCourse,
  projectSignature,
)

const buildFacade = (persistence: PersistenceSessionAdapter) =>
  new GameSessionFacade({
    registry: buildGameRegistry(),
    scoring: new WeightedMappingStrategy(),
    persistence: persistence,
    clock: new FixedClock(),
    grid,
    course: course,
    signature,
  })

const renderOnboarding = (facade: GameSessionFacade) =>
  renderHook(() => useOnboarding(), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(SessionProvider, {
        composition: { status: 'ready', facade },
        children,
      }),
  })

describe('onboarding', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  it('opens a session on the course and records the player name', () => {
    const facade = buildFacade(new MemoryPersistence())
    const { result } = renderOnboarding(facade)

    act(() => {
      result.current.start('Alice')
    })

    const state = useSessionStore.getState()
    expect(state.screen).toBe('course')
    expect(state.playerName).toBe('Alice')
    expect(state.progress?.game?.id).toBe('test-bench-1')
    expect(facade.hasSession()).toBe(true)
  })

  it('reports nothing to resume on an empty store, and stays on onboarding', () => {
    const { result } = renderOnboarding(buildFacade(new MemoryPersistence()))

    let resumed = true
    act(() => {
      resumed = result.current.resume()
    })

    expect(resumed).toBe(false)
    expect(useSessionStore.getState().screen).toBe('onboarding')
  })

  it('surfaces a stored run instead of resuming it silently', () => {
    const persistence = new MemoryPersistence()
    const played = buildFacade(persistence)
    played.start('Alice')
    played.submitAnswer({ selected: ['p1', 'p3'] })

    const { result } = renderOnboarding(buildFacade(persistence))

    expect(result.current.storedRun).toEqual({
      playerName: 'Alice',
      submitted: 1,
      total: 1,
    })
    expect(useSessionStore.getState().screen).toBe('onboarding')
  })

  it('describes the course shape for the rail, one entry per group', () => {
    const { result } = renderOnboarding(buildFacade(new MemoryPersistence()))

    expect(result.current.rail).toEqual([
      {
        id: 'groupe-banc-essai',
        label: "Banc d'essai du moteur",
        gameCount: 1,
        state: 'current',
      },
    ])
  })

  it('drops the stored run when the player starts over', () => {
    const persistence = new MemoryPersistence()
    const played = buildFacade(persistence)
    played.start('Alice')

    const { result } = renderOnboarding(buildFacade(persistence))

    act(() => {
      result.current.discard()
    })

    expect(result.current.storedRun).toBeUndefined()
    expect(persistence.read()).toBeUndefined()
  })

  it('resumes a finished run on its verdict, not on an empty course', () => {
    const persistence = new MemoryPersistence()
    const played = buildFacade(persistence)
    played.start('Alice')
    played.submitAnswer({ selected: ['p1', 'p3'] })
    played.nextGame()

    useSessionStore.getState().reset()
    const { result } = renderOnboarding(buildFacade(persistence))

    act(() => {
      result.current.resume()
    })

    expect(useSessionStore.getState().screen).toBe('summary')
  })

  it('resumes a stored session with its player name and its position', () => {
    const persistence = new MemoryPersistence()
    const first = buildFacade(persistence)
    first.start('Alice')
    first.submitAnswer({ selected: ['p1', 'p3'] })

    useSessionStore.getState().reset()
    const { result } = renderOnboarding(buildFacade(persistence))

    let resumed = false
    act(() => {
      resumed = result.current.resume()
    })

    const state = useSessionStore.getState()
    expect(resumed).toBe(true)
    expect(state.screen).toBe('course')
    expect(state.playerName).toBe('Alice')
    expect(state.progress?.submitted).toBe(1)
  })
})
