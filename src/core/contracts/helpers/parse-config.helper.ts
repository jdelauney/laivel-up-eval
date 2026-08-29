import { z } from 'zod'
import { type Course, courseSchema } from '../course.schema'
import { type Grid, gridSchema } from '../grid.schema'
import {
  type ReplayProfile,
  replayProfileSchema,
} from '../replay-profile.schema'

/**
 * Frontière du domaine : une donnée qui n'est pas conforme à son contrat
 * n'entre pas. L'erreur nomme le champ fautif, parce que ces fichiers sont
 * édités à la main, sous pression, le jour J. Les messages restent en français,
 * ils remontent jusqu'à l'écran.
 *
 * Aucune lecture de fichier ici : la donnée arrive déjà lue, `core/` reste pur.
 */

export class ConfigValidationError extends Error {
  readonly source: string
  readonly field: string

  constructor(source: string, field: string, message: string) {
    super(message)
    this.name = 'ConfigValidationError'
    this.source = source
    this.field = field
  }
}

const fieldPath = (path: ReadonlyArray<PropertyKey>): string =>
  path.reduce<string>((acc, segment) => {
    if (typeof segment === 'number') return `${acc}[${segment}]`
    return acc === '' ? String(segment) : `${acc}.${String(segment)}`
  }, '')

const fail = (source: string, error: z.ZodError): never => {
  const first = error.issues[0]
  const field = first === undefined ? '' : fieldPath(first.path)
  const target = field === '' ? source : `${source}.${field}`
  throw new ConfigValidationError(
    source,
    field,
    `${target} — ${z.prettifyError(error)}`,
  )
}

const validate = <T>(
  schema: z.ZodType<T>,
  data: unknown,
  source: string,
): T => {
  const result = schema.safeParse(data)
  if (result.success) return result.data
  return fail(source, result.error)
}

export const parseGrid = (data: unknown): Grid =>
  validate(gridSchema, data, 'grid')

export const parseCourse = (data: unknown): Course =>
  validate(courseSchema, data, 'course')

export const parseReplayProfile = (data: unknown): ReplayProfile =>
  validate(replayProfileSchema, data, 'profile')

/**
 * La signature a la forme d'une grille — dimensions, niveaux, seuils — parce
 * qu'elle en est une : une seconde lecture des mêmes critères. Elle ne décide
 * jamais du niveau officiel, et le schéma n'a donc rien de particulier.
 */
export const parseSignature = (data: unknown): Grid =>
  validate(gridSchema, data, 'signature')

/**
 * Le maillon re-câblable entre les deux fichiers : un critère alimente des
 * dimensions de la grille. Si la grille du jour J arrive avec d'autres
 * dimensions, c'est ici que le désalignement se voit, au chargement, pas au
 * moment du verdict.
 */
export const parseConfiguration = (
  rawGrid: unknown,
  rawCourse: unknown,
  rawSignature?: unknown,
): { grid: Grid; course: Course; signature: Grid | undefined } => {
  const grid = parseGrid(rawGrid)
  const course = parseCourse(rawCourse)
  const signature =
    rawSignature === undefined ? undefined : parseSignature(rawSignature)

  const gridDimensions = new Set(
    grid.dimensions.map((dimension) => dimension.id),
  )

  /**
   * Une dimension portée par les deux fichiers rendrait le verdict ambigu :
   * le même identifiant décrirait un axe du référentiel et une lecture
   * complémentaire, avec deux échelles. On refuse au chargement.
   */
  signature?.dimensions.forEach((dimension, index) => {
    if (!gridDimensions.has(dimension.id)) return
    const field = fieldPath(['dimensions', index, 'id'])
    throw new ConfigValidationError(
      'signature',
      field,
      `signature.${field} — la dimension « ${dimension.id} » est déjà un axe de la grille`,
    )
  })

  const knownDimensions = new Set([
    ...gridDimensions,
    ...(signature?.dimensions.map((dimension) => dimension.id) ?? []),
  ])

  course.groups.forEach((group, groupIndex) => {
    group.games.forEach((game, gameIndex) => {
      game.criteria.forEach((criterion, criterionIndex) => {
        criterion.mapping.forEach((mapping, mappingIndex) => {
          if (knownDimensions.has(mapping.dimension)) return
          const field = fieldPath([
            'groups',
            groupIndex,
            'games',
            gameIndex,
            'criteria',
            criterionIndex,
            'mapping',
            mappingIndex,
            'dimension',
          ])
          throw new ConfigValidationError(
            'course',
            field,
            `course.${field} — la dimension « ${mapping.dimension} » est absente de la grille comme de la signature`,
          )
        })
      })
    })
  })

  return { grid, course, signature }
}
