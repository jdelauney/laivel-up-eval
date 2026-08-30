import { describe, expect, it } from 'vitest'
import type { Course, Game } from '@/core/contracts/course.schema'
import {
  ConfigValidationError,
  parseConfiguration,
} from '@/core/contracts/helpers/parse-config.helper'
import { WeightedMappingStrategy } from '@/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '@/core/session/game-session.facade'
import { buildCheckpointsAnswer } from '@/games/checkpoints/actions/build-checkpoints-answer.action'
import {
  type Choice,
  checkpointsConfigSchema,
} from '@/games/checkpoints/schema/config.schema'
import { buildConfidenceBetAnswer } from '@/games/confidence-bet/actions/build-confidence-bet-answer.action'
import { confidenceBetConfigSchema } from '@/games/confidence-bet/schema/config.schema'
import { buildDefectHuntAnswer } from '@/games/defect-hunt/actions/build-defect-hunt-answer.action'
import { defectHuntConfigSchema } from '@/games/defect-hunt/schema/config.schema'
import { buildGameRegistry } from '@/games/register-games'
import { buildThreeTracksAnswer } from '@/games/three-tracks/actions/build-three-tracks-answer.action'
import { threeTracksConfigSchema } from '@/games/three-tracks/schema/config.schema'
import { FixedClock } from '@/infrastructure/clock/fixed.adapter'
import projectCourse from '../../../config/course.json'
import projectGrid from '../../../config/grid.json'
import projectSignature from '../../../config/signature.json'
import { MemoryPersistence } from '../../fixtures/memory-persistence'

/**
 * Le jeu traverse le moteur de production : le vrai parcours, le vrai registre,
 * la vraie façade. Seules l'horloge et la persistance sont doublées, parce
 * qu'elles sortent du domaine — aucune branche réservée aux tests.
 */

const CHECKPOINTS_GAME_ID = 'g7-1'

const LET_IT_RIDE: Choice[] = Array.from({ length: 6 }, () => 'laisser-passer')

const EARLY_FRAMING: Choice[] = [
  'corriger',
  'corriger',
  ...LET_IT_RIDE.slice(2),
]

const FIXES_EVERYTHING: Choice[] = Array.from({ length: 6 }, () => 'corriger')

const clone = (course: unknown): Course =>
  JSON.parse(JSON.stringify(course)) as Course

const buildFacade = (
  rawCourse: unknown = projectCourse,
  persistence = new MemoryPersistence(),
): GameSessionFacade => {
  const { grid, course, signature } = parseConfiguration(
    projectGrid,
    rawCourse,
    projectSignature,
  )

  return new GameSessionFacade({
    registry: buildGameRegistry(),
    scoring: new WeightedMappingStrategy(),
    persistence,
    clock: new FixedClock(),
    grid,
    course,
    signature,
  })
}

/**
 * Ce parcours traverse tout le référentiel, y compris le groupe `three-tracks`
 * ajouté en phase 4 : une réponse conforme à son contrat est nécessaire pour
 * que la partie continue jusqu'au bout, même si ce test ne mesure que
 * `intervention`. N'importe quelle partie valide convient — ici, sept tours
 * sans la moindre allocation, la plus simple qui satisfasse
 * `parseThreeTracksTrace`.
 */
const answerFor = (game: Game, choices: readonly Choice[]): unknown => {
  if (game.type === 'three-tracks') {
    const config = threeTracksConfigSchema.parse(game.config)
    return buildThreeTracksAnswer(
      config,
      Array.from({ length: config.turns }, () => ({})),
    )
  }
  /**
   * `g1-1` porte confidence-bet depuis la phase 4 de son propre plan : ce
   * test mesure `intervention`, jamais `verification`, donc n'importe
   * quelle trace conforme suffit. Chaque extrait reçoit explicitement la
   * mise neutre — le constructeur refuse un extrait sans mise, il ne comble
   * jamais un trou.
   */
  if (game.type === 'confidence-bet') {
    const config = confidenceBetConfigSchema.parse(game.config)
    return buildConfidenceBetAnswer(
      config,
      config.snippets.map((snippet) => ({
        snippetId: snippet.id,
        stake: config.neutralStake,
      })),
    )
  }
  /**
   * `g1-2` porte defect-hunt depuis la phase 4 de son propre plan : ce test
   * mesure `intervention`, jamais `verification`, donc n'importe quelle
   * trace conforme suffit — ici, une revue qui ne marque aucune ligne,
   * rendue instantanément.
   */
  if (game.type === 'defect-hunt') {
    const config = defectHuntConfigSchema.parse(game.config)
    return buildDefectHuntAnswer(config, [], 0)
  }
  if (game.type !== 'checkpoints') return { selected: [] }
  return buildCheckpointsAnswer(
    checkpointsConfigSchema.parse(game.config),
    choices,
  )
}

const playWholeCourse = (
  choices: readonly Choice[],
  facade = buildFacade(),
): GameSessionFacade => {
  facade.start('Alice')

  let progress = facade.getProgress()
  while (progress.game !== undefined) {
    facade.submitAnswer(answerFor(progress.game, choices))
    facade.nextGame()
    progress = facade.getProgress()
  }

  return facade
}

const interventionScore = (facade: GameSessionFacade): number => {
  const dimension = facade
    .getVerdict()
    .result.dimensions.find((entry) => entry.dimensionId === 'intervention')

  if (dimension === undefined) throw new Error('intervention is not scored')
  return dimension.score
}

const checkpointsResults = (facade: GameSessionFacade) => {
  const submission = facade
    .auditTrail()
    .find((command) => command.gameId === CHECKPOINTS_GAME_ID)

  if (submission === undefined) throw new Error('the game was never submitted')
  return submission
}

describe('checkpoints in the course', () => {
  it('loads the augmented course and resolves every declared game type', () => {
    expect(() => buildFacade()).not.toThrow()
  })

  it('scores a run that frames early above a run that takes everything back', () => {
    const early = interventionScore(playWholeCourse(EARLY_FRAMING))
    const exhaustive = interventionScore(playWholeCourse(FIXES_EVERYTHING))

    expect(early).toBeGreaterThan(exhaustive)
  })

  it('scores a run that touches nothing between the two', () => {
    const early = interventionScore(playWholeCourse(EARLY_FRAMING))
    const passive = interventionScore(playWholeCourse(LET_IT_RIDE))
    const exhaustive = interventionScore(playWholeCourse(FIXES_EVERYTHING))

    expect(passive).toBeLessThan(early)
    expect(passive).toBeGreaterThan(exhaustive)
  })

  it('carries the game submission into the audit trail', () => {
    const submission = checkpointsResults(playWholeCourse(EARLY_FRAMING))

    expect(submission.results).toEqual([
      { criterionId: 'g7-1-c1', satisfied: true },
      { criterionId: 'g7-1-c2', satisfied: true },
      { criterionId: 'g7-1-c3', satisfied: true },
    ])
    expect(submission.answer).toMatchObject({ remainingBudget: 6 })
  })

  it('holds the scale the plan froze: only the good run ends in credit', () => {
    const budgetOf = (choices: readonly Choice[]) =>
      (
        checkpointsResults(playWholeCourse(choices)).answer as {
          remainingBudget: number
        }
      ).remainingBudget

    expect(budgetOf(EARLY_FRAMING)).toBe(6)
    expect(budgetOf(LET_IT_RIDE)).toBe(-2)
    expect(budgetOf(FIXES_EVERYTHING)).toBe(-12)
  })

  it('moves the verdict when the threshold moves in the JSON, with no code change', () => {
    const strict = clone(projectCourse)
    const game = strict.groups[6].games[0]
    game.criteria[2].rule.threshold = 0.9

    const relaxed = checkpointsResults(playWholeCourse(EARLY_FRAMING))
    const tightened = checkpointsResults(
      playWholeCourse(EARLY_FRAMING, buildFacade(strict)),
    )

    expect(relaxed.results[2].satisfied).toBe(true)
    expect(tightened.results[2].satisfied).toBe(false)
  })

  it('refuses at load a mapping aiming at a dimension nobody declares', () => {
    const misaimed = clone(projectCourse)
    misaimed.groups[6].games[0].criteria[0].mapping[0].dimension = 'inconnue'

    expect(() => buildFacade(misaimed)).toThrow(ConfigValidationError)
  })

  it('resumes on the same game after a reload in the middle of the group', () => {
    const persistence = new MemoryPersistence()
    const facade = buildFacade(projectCourse, persistence)
    facade.start('Alice')

    let progress = facade.getProgress()
    while (
      progress.game !== undefined &&
      progress.game.id !== CHECKPOINTS_GAME_ID
    ) {
      facade.submitAnswer(answerFor(progress.game, LET_IT_RIDE))
      facade.nextGame()
      progress = facade.getProgress()
    }

    const reloaded = buildFacade(projectCourse, persistence)

    expect(reloaded.resume()).toBe(true)
    expect(reloaded.getProgress().game?.id).toBe(CHECKPOINTS_GAME_ID)
  })
})
