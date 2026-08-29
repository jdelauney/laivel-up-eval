import { describe, expect, it } from 'vitest'
import type { Course } from '../../../../src/core/contracts/course.schema'
import {
  GameSession,
  GroupNotCompleteError,
} from '../../../../src/core/entities/game-session.entity'

const course: Course = {
  version: '1.0',
  groups: [
    {
      id: 'group-1',
      label: 'Groupe 1',
      order: 1,
      games: [
        {
          id: 'g1',
          type: 'test-bench',
          label: 'Jeu 1',
          config: {},
          criteria: [
            {
              id: 'c1',
              question: 'Critère ?',
              rule: { type: 'test-rule' },
              mapping: [{ dimension: 'verification', weight: 1 }],
            },
          ],
        },
        {
          id: 'g2',
          type: 'test-bench',
          label: 'Jeu 2',
          config: {},
          criteria: [
            {
              id: 'c1',
              question: 'Critère ?',
              rule: { type: 'test-rule' },
              mapping: [{ dimension: 'verification', weight: 1 }],
            },
          ],
        },
      ],
    },
    {
      id: 'group-2',
      label: 'Groupe 2',
      order: 2,
      games: [
        {
          id: 'g3',
          type: 'test-bench',
          label: 'Jeu 3',
          config: {},
          criteria: [
            {
              id: 'c1',
              question: 'Critère ?',
              rule: { type: 'test-rule' },
              mapping: [{ dimension: 'verification', weight: 1 }],
            },
          ],
        },
      ],
    },
  ],
}

const satisfied = [{ criterionId: 'c1', satisfied: true }]
const at = '2026-01-01T00:00:00.000Z'

describe('game session progression', () => {
  it('opens on the first game of the first group', () => {
    const session = new GameSession(course, 'Alice')

    expect(session.currentGroup()?.id).toBe('group-1')
    expect(session.currentGame()?.id).toBe('g1')
    expect(session.isFinished()).toBe(false)
  })

  it('refuses to open the next group while the current one is unfinished', () => {
    const session = new GameSession(course, 'Alice')
    session.submit('g1', {}, satisfied, at)

    expect(() => session.openNextGroup()).toThrow(GroupNotCompleteError)
    expect(session.currentGroup()?.id).toBe('group-1')
    expect(session.currentGame()?.id).toBe('g1')
  })

  it('moves to the next group once every game of the current one is submitted', () => {
    const session = new GameSession(course, 'Alice')
    session.submit('g1', {}, satisfied, at)
    session.advance()
    session.submit('g2', {}, satisfied, at)
    session.advance()

    expect(session.currentGroup()?.id).toBe('group-2')
    expect(session.currentGame()?.id).toBe('g3')
  })

  it('reports the course as finished after the last group', () => {
    const session = new GameSession(course, 'Alice')
    session.submit('g1', {}, satisfied, at)
    session.advance()
    session.submit('g2', {}, satisfied, at)
    session.advance()
    session.submit('g3', {}, satisfied, at)
    session.advance()

    expect(session.isFinished()).toBe(true)
    expect(session.currentGame()).toBeUndefined()
  })

  it('replaces a second submission on the same game instead of duplicating it', () => {
    const session = new GameSession(course, 'Alice')
    session.submit('g1', { first: true }, satisfied, at)
    session.submit('g1', { second: true }, satisfied, at)

    expect(session.allSubmissions()).toHaveLength(1)
    expect(session.submissionFor('g1')?.answer).toEqual({ second: true })
  })

  it('restores position and submissions from a snapshot', () => {
    const session = new GameSession(course, 'Alice')
    session.submit('g1', { done: true }, satisfied, at)
    session.advance()

    const restored = GameSession.restore(course, session.snapshot())

    expect(restored.playerName).toBe('Alice')
    expect(restored.currentGame()?.id).toBe('g2')
    expect(restored.submissionFor('g1')?.answer).toEqual({ done: true })
  })

  it('counts progress over every game of the course', () => {
    const session = new GameSession(course, 'Alice')
    session.submit('g1', {}, satisfied, at)

    expect(session.progress()).toEqual({ submitted: 1, total: 3 })
  })
})
