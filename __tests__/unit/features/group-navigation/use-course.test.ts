import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { GameSessionFacade } from '../../../../src/core/session/game-session.facade'
import { useCourse } from '../../../../src/features/group-navigation/hooks/use-course.hook'
import { SessionProvider } from '../../../../src/providers/session-context'
import { useSessionStore } from '../../../../src/store/session.store'
import {
  buildTestFacade,
  buildTestFacadeWithGroups,
} from '../../../fixtures/configuration'

const buildFacade = () => buildTestFacade()

const renderCourse = (facade: GameSessionFacade) =>
  renderHook(() => useCourse(), {
    wrapper: ({ children }: { children: ReactNode }) =>
      createElement(SessionProvider, {
        composition: { status: 'ready', facade },
        children,
      }),
  })

describe('course navigation', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  it('describes the rail with the current group marked', () => {
    const facade = buildFacade()
    facade.start('Alice')
    useSessionStore
      .getState()
      .openCourse(
        { playerName: 'Alice', repository: undefined },
        facade.getProgress(),
      )

    const { result } = renderCourse(facade)

    expect(result.current.rail.map((group) => group.state)).toEqual(['current'])
  })

  /**
   * Le pendant de la rampe au repos : une fois la partie ouverte, un groupe
   * porte bien la position, et les suivants restent à venir.
   */
  it('marks the group in progress and leaves the ones behind it', () => {
    const facade = buildTestFacadeWithGroups([2, 2, 1])
    facade.start('Alice')
    useSessionStore
      .getState()
      .openCourse(
        { playerName: 'Alice', repository: undefined },
        facade.getProgress(),
      )

    const { result } = renderCourse(facade)

    expect(result.current.rail.map((group) => group.state)).toEqual([
      'current',
      'pending',
      'pending',
    ])
  })

  it('locks the answer, writing it before anything advances', () => {
    const facade = buildFacade()
    facade.start('Alice')
    useSessionStore
      .getState()
      .openCourse(
        { playerName: 'Alice', repository: undefined },
        facade.getProgress(),
      )

    const { result } = renderCourse(facade)

    act(() => {
      result.current.lock({ selected: ['p1', 'p3'] })
    })

    expect(useSessionStore.getState().progress?.submitted).toBe(1)
    expect(facade.auditTrail()).toHaveLength(1)
  })

  it('advances the position once lock and advance both fire', () => {
    const facade = buildFacade()
    facade.start('Alice')
    useSessionStore
      .getState()
      .openCourse(
        { playerName: 'Alice', repository: undefined },
        facade.getProgress(),
      )

    const { result } = renderCourse(facade)

    act(() => {
      result.current.lock({ selected: ['p1', 'p3'] })
      result.current.advance()
    })

    expect(useSessionStore.getState().progress?.submitted).toBe(1)
    expect(facade.auditTrail()).toHaveLength(1)
  })

  it('switches to the summary when the course ends, without deciding it itself', () => {
    const facade = buildFacade()
    facade.start('Alice')
    useSessionStore
      .getState()
      .openCourse(
        { playerName: 'Alice', repository: undefined },
        facade.getProgress(),
      )

    const { result } = renderCourse(facade)

    act(() => {
      result.current.lock({ selected: ['p1', 'p3'] })
      result.current.advance()
    })

    expect(useSessionStore.getState().screen).toBe('summary')
    expect(facade.getProgress().finished).toBe(true)
  })

  it('refuses an answer outside the game contract and leaves the position alone', () => {
    const facade = buildFacade()
    facade.start('Alice')
    useSessionStore
      .getState()
      .openCourse(
        { playerName: 'Alice', repository: undefined },
        facade.getProgress(),
      )

    const { result } = renderCourse(facade)

    expect(() =>
      act(() => {
        result.current.lock({ selected: 'p1' })
      }),
    ).toThrow()

    expect(useSessionStore.getState().progress?.submitted).toBe(0)
    expect(useSessionStore.getState().screen).toBe('course')
  })
})
