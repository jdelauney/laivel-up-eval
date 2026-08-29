import { act, renderHook } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { GameSessionFacade } from '../../../../src/core/session/game-session.facade'
import { useCourse } from '../../../../src/features/group-navigation/hooks/use-course.hook'
import { SessionProvider } from '../../../../src/providers/session-context'
import { useSessionStore } from '../../../../src/store/session.store'
import { buildTestFacade } from '../../../fixtures/configuration'

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

  it('submits the answer and advances the position', () => {
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
      result.current.submit({ selected: ['p1', 'p3'] })
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
      result.current.submit({ selected: ['p1', 'p3'] })
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
        result.current.submit({ selected: 'p1' })
      }),
    ).toThrow()

    expect(useSessionStore.getState().progress?.submitted).toBe(0)
    expect(useSessionStore.getState().screen).toBe('course')
  })
})
