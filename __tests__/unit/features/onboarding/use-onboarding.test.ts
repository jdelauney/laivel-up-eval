import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { PersistenceSessionAdapter } from '../../../../src/core/ports/persistence-session-adapter.interface'
import type { GameSessionFacade } from '../../../../src/core/session/game-session.facade'
import { useOnboarding } from '../../../../src/features/onboarding/hooks/use-onboarding.hook'
import { SessionProvider } from '../../../../src/providers/session-context'
import { useSessionStore } from '../../../../src/store/session.store'
import {
  buildTestFacade,
  buildTestFacadeWithGroups,
} from '../../../fixtures/configuration'
import { MemoryPersistence } from '../../../fixtures/memory-persistence'

const buildFacade = (persistence: PersistenceSessionAdapter) =>
  buildTestFacade(persistence)

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
    expect(state.identity?.playerName).toBe('Alice')
    expect(state.progress?.game?.id).toBe('test-bench-1')
    expect(facade.hasSession()).toBe(true)
  })

  it('puts the designated repository in the store alongside the name', () => {
    const facade = buildFacade(new MemoryPersistence())
    const { result } = renderOnboarding(facade)

    act(() => {
      result.current.start('Alice', 'alice/atelier')
    })

    expect(useSessionStore.getState().identity?.repository).toBe(
      'alice/atelier',
    )
    expect(facade.designatedRepository()).toBe('alice/atelier')
  })

  it('describes the course shape for the rail, one entry per group', () => {
    const { result } = renderOnboarding(buildFacade(new MemoryPersistence()))

    expect(result.current.rail).toEqual([
      {
        id: 'groupe-banc-essai',
        label: "Banc d'essai du moteur",
        gameCount: 1,
        state: 'pending',
      },
    ])
  })

  /**
   * Au repos la rampe donne la forme du parcours, jamais une position dedans.
   * Un seul groupe marqué courant fait lire une partie déjà commencée à qui
   * n'a pas encore saisi son nom.
   */
  it('leaves every group pending on the rail, before the run starts', () => {
    const { result } = renderOnboarding(buildTestFacadeWithGroups([3, 2, 1]))

    expect(result.current.rail.map((group) => group.state)).toEqual([
      'pending',
      'pending',
      'pending',
    ])
  })

  it('exposes the total of situations and the estimated minutes of the test course', () => {
    const { result } = renderOnboarding(buildFacade(new MemoryPersistence()))

    expect(result.current.totalSituations).toBe(1)
    expect(result.current.estimatedMinutes).toBe(5)
  })
})
