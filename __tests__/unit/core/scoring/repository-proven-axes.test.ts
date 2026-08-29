import { describe, expect, it } from 'vitest'
import type { Grid } from '../../../../src/core/contracts/grid.schema'
import { repositoryProvenAxes } from '../../../../src/core/scoring/helpers/repository-proven-axes.helper'
import { grid } from '../../../fixtures/configuration'

describe('repository proven axes', () => {
  it('names the two axes in order, with the label the product grid carries', () => {
    expect(repositoryProvenAxes(grid)).toEqual([
      { id: 'intervention', label: "Reprise humaine du travail de l'IA" },
      { id: 'parallele', label: 'Chantiers menés en parallèle' },
    ])
  })

  it('omits an axis the grid no longer carries, without inventing a label', () => {
    const amputatedGrid: Grid = {
      ...grid,
      dimensions: grid.dimensions.filter(
        (dimension) => dimension.id !== 'parallele',
      ),
    }

    expect(repositoryProvenAxes(amputatedGrid)).toEqual([
      { id: 'intervention', label: "Reprise humaine du travail de l'IA" },
    ])
  })

  it('names nothing when the grid carries neither axis', () => {
    const strippedGrid: Grid = {
      ...grid,
      dimensions: grid.dimensions.filter(
        (dimension) =>
          dimension.id !== 'intervention' && dimension.id !== 'parallele',
      ),
    }

    expect(repositoryProvenAxes(strippedGrid)).toEqual([])
  })
})
