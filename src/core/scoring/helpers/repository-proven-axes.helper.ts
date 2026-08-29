import type { Grid } from '../../contracts/grid.schema'

/**
 * Les deux axes qu'un dépôt sait prouver sans jeton. Les quatre preuves
 * lisibles du spike — commits correctifs après ouverture de PR, PR mergées
 * sans édition humaine, branches concurrentes, commits co-signés — ne
 * portent que sur `intervention` et `parallele`. Le parcours seul mesure les
 * trois autres dimensions, avec ou sans dépôt désigné.
 */
export const REPOSITORY_PROVEN_AXIS_IDS = ['intervention', 'parallele'] as const

export type RepositoryProvenAxis = {
  id: (typeof REPOSITORY_PROVEN_AXIS_IDS)[number]
  label: string
}

/**
 * Les libellés officiels de ces axes, lus dans la grille plutôt qu'écrits
 * ici : un identifiant absent de la grille est omis, jamais remplacé par un
 * libellé de repli.
 */
export const repositoryProvenAxes = (grid: Grid): RepositoryProvenAxis[] =>
  REPOSITORY_PROVEN_AXIS_IDS.flatMap((id) => {
    const dimension = grid.dimensions.find((candidate) => candidate.id === id)
    return dimension === undefined ? [] : [{ id, label: dimension.label }]
  })
