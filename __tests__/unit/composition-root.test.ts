import { describe, expect, it } from 'vitest'
import projectCourse from '../../config/course.json'
import projectGrid from '../../config/grid.json'
import projectSignature from '../../config/signature.json'
import { composeFrom } from '../../src/composition-root'

/**
 * Le chemin du jour J : si la grille officielle arrive hors contrat, l'écran
 * doit nommer le champ fautif plutôt que rester blanc.
 */
describe('composition root', () => {
  it('wires a facade when the three files hold their contract', () => {
    const composition = composeFrom(
      projectGrid,
      projectCourse,
      projectSignature,
    )

    expect(composition.status).toBe('ready')
  })

  it('wires a facade without a signature, the level being complete on its own', () => {
    const composition = composeFrom(projectGrid, {
      ...projectCourse,
      groups: projectCourse.groups.map((group) => ({
        ...group,
        games: group.games.map((game) => ({
          ...game,
          criteria: game.criteria.map((criterion) => ({
            ...criterion,
            mapping: criterion.mapping.filter((mapping) =>
              projectGrid.dimensions.some(
                (dimension) => dimension.id === mapping.dimension,
              ),
            ),
          })),
        })),
      })),
    })

    expect(composition.status).toBe('ready')
  })

  it('refuses a signature that shadows an axis of the grid', () => {
    const composition = composeFrom(projectGrid, projectCourse, {
      ...projectSignature,
      dimensions: [
        { ...projectSignature.dimensions[0], id: 'taille' },
        ...projectSignature.dimensions.slice(1),
      ],
    })

    expect(composition).toMatchObject({
      status: 'invalid-config',
      field: 'dimensions[0].id',
    })
  })

  it('refuses a malformed grid, naming the faulty field', () => {
    const composition = composeFrom(
      { ...projectGrid, levels: [] },
      projectCourse,
    )

    expect(composition).toMatchObject({
      status: 'invalid-config',
      field: 'levels',
    })
    if (composition.status !== 'invalid-config') throw new Error('unreachable')
    expect(composition.message).toContain('levels')
  })

  it('refuses a criterion mapped onto a dimension absent from the grid', () => {
    const ghostCourse = {
      ...projectCourse,
      groups: projectCourse.groups.map((group) => ({
        ...group,
        games: group.games.map((game) => ({
          ...game,
          criteria: game.criteria.map((criterion) => ({
            ...criterion,
            mapping: [{ dimension: 'ghost-dimension', weight: 1 }],
          })),
        })),
      })),
    }

    const composition = composeFrom(projectGrid, ghostCourse, projectSignature)

    expect(composition.status).toBe('invalid-config')
    if (composition.status !== 'invalid-config') throw new Error('unreachable')
    expect(composition.message).toContain('ghost-dimension')
  })

  it('refuses a course declaring a game type nothing implements', () => {
    const unknownTypeCourse = {
      ...projectCourse,
      groups: projectCourse.groups.map((group) => ({
        ...group,
        games: group.games.map((game) => ({ ...game, type: 'ghost-game' })),
      })),
    }

    const composition = composeFrom(
      projectGrid,
      unknownTypeCourse,
      projectSignature,
    )

    expect(composition).toMatchObject({
      status: 'invalid-config',
      field: 'ghost-game',
    })
  })

  it('opens no session when the configuration is refused', () => {
    const composition = composeFrom(
      { version: '1.0' },
      projectCourse,
      projectSignature,
    )

    expect(composition).not.toHaveProperty('facade')
  })
})
