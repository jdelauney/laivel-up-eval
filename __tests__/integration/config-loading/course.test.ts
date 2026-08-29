import { describe, expect, it } from 'vitest'
import {
  ConfigValidationError,
  parseConfiguration,
  parseCourse,
} from '@/core/contracts/helpers/parse-config.helper'
import projectCourse from '../../../config/course.json'
import projectGrid from '../../../config/grid.json'
import projectSignature from '../../../config/signature.json'

const minimalCourse = () => ({
  version: '1.0',
  groups: [
    {
      id: 'group-1',
      label: 'Groupe 1',
      order: 1,
      games: [
        {
          id: 'game-1',
          type: 'test-bench',
          label: 'Jeu 1',
          config: { statement: 'peu importe' },
          criteria: [
            {
              id: 'c1',
              question: 'Critère 1 ?',
              rule: { type: 'test-rule' },
              mapping: [{ dimension: 'harness', weight: 1 }],
            },
          ],
        },
      ],
    },
  ],
})

const expectRejection = (run: () => unknown): ConfigValidationError => {
  try {
    run()
  } catch (error) {
    if (error instanceof ConfigValidationError) return error
    throw error
  }
  throw new Error('the course should have been rejected')
}

describe('course loading', () => {
  it('accepts the project course and exposes its groups, games and criteria', () => {
    const course = parseCourse(projectCourse)
    const group = course.groups[0]

    expect(group.games).toHaveLength(1)
    expect(group.games[0].type).toBe('test-bench')
    expect(group.games[0].criteria.map((criterion) => criterion.id)).toEqual([
      'c1',
      'c2',
    ])
  })

  it('keeps the game config opaque to the engine', () => {
    const course = parseCourse(projectCourse)

    expect(course.groups[0].games[0].config).toHaveProperty('propositions')
  })

  it('rejects a mapping weight written as text, naming the faulty field path', () => {
    const data = minimalCourse()
    data.groups[0].games[0].criteria[0].mapping[0].weight = '1' as never

    const error = expectRejection(() => parseCourse(data))

    expect(error.field).toBe('groups[0].games[0].criteria[0].mapping[0].weight')
  })

  it('rejects a group without any game', () => {
    const data = minimalCourse()
    data.groups[0].games = []

    const error = expectRejection(() => parseCourse(data))

    expect(error.field).toBe('groups[0].games')
  })

  it('rejects a criterion mapped onto a dimension absent from the grid, naming it', () => {
    const data = minimalCourse()
    data.groups[0].games[0].criteria[0].mapping[0].dimension = 'ghost-dimension'

    const error = expectRejection(() => parseConfiguration(projectGrid, data))

    expect(error.field).toBe(
      'groups[0].games[0].criteria[0].mapping[0].dimension',
    )
    expect(error.message).toContain('ghost-dimension')
  })

  it('accepts the project grid, course and signature together', () => {
    const { grid, course, signature } = parseConfiguration(
      projectGrid,
      projectCourse,
      projectSignature,
    )

    const mappedDimensions = course.groups
      .flatMap((group) => group.games)
      .flatMap((game) => game.criteria)
      .flatMap((criterion) => criterion.mapping)
      .map((mapping) => mapping.dimension)
    const known = [...grid.dimensions, ...(signature?.dimensions ?? [])]

    expect(
      mappedDimensions.every((dimension) =>
        known.some((candidate) => candidate.id === dimension),
      ),
    ).toBe(true)
  })

  it('refuses a signature dimension that shadows an axis of the grid', () => {
    const shadowing = {
      ...projectSignature,
      dimensions: [
        { ...projectSignature.dimensions[0], id: 'harness' },
        ...projectSignature.dimensions.slice(1),
      ],
    }

    const error = expectRejection(() =>
      parseConfiguration(projectGrid, projectCourse, shadowing),
    )

    expect(error.source).toBe('signature')
    expect(error.field).toBe('dimensions[0].id')
    expect(error.message).toContain('harness')
  })

  it('lets a criterion feed a signature dimension, but only once it is loaded', () => {
    const data = minimalCourse()
    data.groups[0].games[0].criteria[0].mapping[0].dimension = 'resilience'

    expect(() =>
      parseConfiguration(projectGrid, data, projectSignature),
    ).not.toThrow()

    const error = expectRejection(() => parseConfiguration(projectGrid, data))

    expect(error.message).toContain('resilience')
  })
})
