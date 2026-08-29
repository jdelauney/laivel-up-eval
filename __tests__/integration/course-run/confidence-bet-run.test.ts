import { describe, expect, it } from 'vitest'
import type { Course } from '@/core/contracts/course.schema'
import { parseConfiguration } from '@/core/contracts/helpers/parse-config.helper'
import { WeightedMappingStrategy } from '@/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '@/core/session/game-session.facade'
import { buildConfidenceBetAnswer } from '@/games/confidence-bet/actions/build-confidence-bet-answer.action'
import type { Bet } from '@/games/confidence-bet/schema/answer.schema'
import { confidenceBetConfigSchema } from '@/games/confidence-bet/schema/config.schema'
import { buildGameRegistry } from '@/games/register-games'
import { FixedClock } from '@/infrastructure/clock/fixed.adapter'
import projectCourse from '../../../config/course.json'
import projectGrid from '../../../config/grid.json'
import projectSignature from '../../../config/signature.json'
import { MemoryPersistence } from '../../fixtures/memory-persistence'

/**
 * Le jeu traverse le moteur réel : le vrai registre, la vraie façade, la
 * vraie stratégie de pondération, et le barème réel de `g1-1` extrait de
 * `config/course.json`. `verification` vit dans la signature, pas dans la
 * grille officielle — `getVerdict().signature`, jamais `.result`.
 *
 * Le tableau des huit profils tient sur `g1-1` seul, isolé dans son propre
 * parcours à un jeu : dans le parcours réel, `g1-2`, `g1-3`, `g4-1` et `g4-2`
 * visent aussi `verification`, et leur contribuer brouillerait les chiffres
 * du tableau, qui sont ceux de `g1-1` seul. Le chargement du parcours
 * complet — la config de `g1-1` passant son propre schéma, le registre
 * résolvant son type — est vérifié séparément, à la fin de ce fichier.
 */

const G1_1_GAME_ID = 'g1-1'

const realG1_1 = () => {
  const group = (projectCourse as Course).groups.find((entry) =>
    entry.games.some((game) => game.id === G1_1_GAME_ID),
  )
  const game = group?.games.find((entry) => entry.id === G1_1_GAME_ID)
  if (group === undefined || game === undefined) {
    throw new Error(`${G1_1_GAME_ID} introuvable dans le parcours réel`)
  }
  return { group, game }
}

const isolatedCourse = (): unknown => {
  const { group, game } = realG1_1()
  return {
    version: (projectCourse as Course).version,
    groups: [{ ...group, games: [game] }],
  }
}

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

const verificationDimension = (facade: GameSessionFacade) => {
  const dimension = facade
    .getVerdict()
    .signature?.dimensions.find((entry) => entry.dimensionId === 'verification')

  if (dimension === undefined) throw new Error('verification is not scored')
  return dimension
}

const bet = (snippetId: string, stake: number): Bet => ({ snippetId, stake })

const playG1_1 = (bets: readonly Bet[]): GameSessionFacade => {
  const facade = buildFacade(isolatedCourse())
  facade.start('Alice')
  facade.submitAnswer(buildConfidenceBetAnswer(realG1_1Config(), bets))
  facade.nextGame()
  return facade
}

const realG1_1Config = () =>
  confidenceBetConfigSchema.parse(realG1_1().game.config)

/**
 * Les huit profils du tableau de `phase-4.md`, en mises `s1·s2 / f1·f2 / u1·u2`
 * — les identifiants réels du corpus de `config/course.json`. Capital de
 * départ 100, mouvement maximal 40 par extrait tranchable ; ces chiffres ont
 * été vérifiés à la main contre le moteur avant d'être écrits ici.
 */
const CALIBRATED_BOTH_SIDES: Bet[] = [
  bet('s1', 90),
  bet('s2', 90),
  bet('f1', 10),
  bet('f2', 10),
  bet('u1', 50),
  bet('u2', 50),
]

const CALIBRATED_ONE_HESITATION_EACH_SIDE: Bet[] = [
  bet('s1', 90),
  bet('s2', 70),
  bet('f1', 10),
  bet('f2', 30),
  bet('u1', 50),
  bet('u2', 50),
]

const READS_CODE_CANNOT_SAY_IT_DOES_NOT_KNOW: Bet[] = [
  bet('s1', 90),
  bet('s2', 90),
  bet('f1', 10),
  bet('f2', 10),
  bet('u1', 90),
  bet('u2', 90),
]

const DISCRIMINATING_BUT_LUKEWARM: Bet[] = [
  bet('s1', 70),
  bet('s2', 70),
  bet('f1', 30),
  bet('f2', 30),
  bet('u1', 50),
  bet('u2', 50),
]

const ALL_CONFIDENT: Bet[] = [
  bet('s1', 90),
  bet('s2', 90),
  bet('f1', 90),
  bet('f2', 90),
  bet('u1', 90),
  bet('u2', 90),
]

const ALL_SUSPICIOUS: Bet[] = [
  bet('s1', 10),
  bet('s2', 10),
  bet('f1', 10),
  bet('f2', 10),
  bet('u1', 10),
  bet('u2', 10),
]

const HEDGER_NEUTRAL_EVERYWHERE: Bet[] = [
  bet('s1', 50),
  bet('s2', 50),
  bet('f1', 50),
  bet('f2', 50),
  bet('u1', 50),
  bet('u2', 50),
]

const CONFIDENT_BACKWARDS: Bet[] = [
  bet('s1', 90),
  bet('s2', 10),
  bet('f1', 90),
  bet('f2', 10),
  bet('u1', 50),
  bet('u2', 50),
]

const TABLE_FROM_PHASE_4 = [
  {
    name: 'Calibré, tranché des deux côtés',
    bets: CALIBRATED_BOTH_SIDES,
    score: 1,
    capital: 260,
  },
  {
    name: 'Calibré, une hésitation de chaque côté',
    bets: CALIBRATED_ONE_HESITATION_EACH_SIDE,
    score: 1,
    capital: 220,
  },
  {
    name: "Lit le code, ne sait pas dire qu'il ne sait pas",
    bets: READS_CODE_CANNOT_SAY_IT_DOES_NOT_KNOW,
    score: 6 / 7,
    capital: 180,
  },
  {
    name: 'Discriminant mais tiède',
    bets: DISCRIMINATING_BUT_LUKEWARM,
    score: 5 / 7,
    capital: 180,
  },
  {
    name: 'Tout confiant',
    bets: ALL_CONFIDENT,
    score: 2 / 7,
    capital: 20,
  },
  {
    name: 'Tout méfiant',
    bets: ALL_SUSPICIOUS,
    score: 2 / 7,
    capital: 20,
  },
  {
    name: 'Hédgeur, la mise neutre partout',
    bets: HEDGER_NEUTRAL_EVERYWHERE,
    score: 1 / 7,
    capital: 100,
  },
  {
    name: 'Confiant à contresens',
    bets: CONFIDENT_BACKWARDS,
    score: 1 / 7,
    capital: 100,
  },
] as const

describe('confidence-bet in the course', () => {
  it.each(TABLE_FROM_PHASE_4)(
    'scores "$name" at $score on verification',
    ({ bets, score, capital }) => {
      const dimension = verificationDimension(playG1_1(bets))
      const answer = buildConfidenceBetAnswer(realG1_1Config(), bets)

      expect(dimension.score).toBeCloseTo(score, 3)
      expect(answer.finalCapital).toBe(capital)
    },
  )

  it('holds the guard rail: reading the code well is not enough for a clean sweep', () => {
    const cleanSweep = verificationDimension(playG1_1(CALIBRATED_BOTH_SIDES))
    const missesTheGuardRail = verificationDimension(
      playG1_1(READS_CODE_CANNOT_SAY_IT_DOES_NOT_KNOW),
    )

    expect(cleanSweep.score).toBe(1)
    expect(
      missesTheGuardRail.contributions.find((c) => c.criterionId === 'g1-1-c4')
        ?.satisfied,
    ).toBe(false)
    expect(missesTheGuardRail.score).toBeLessThan(cleanSweep.score)
  })

  it('keeps both extreme profiles strictly under the first verification band', () => {
    const allConfident = verificationDimension(playG1_1(ALL_CONFIDENT))
    const allSuspicious = verificationDimension(playG1_1(ALL_SUSPICIOUS))

    expect(allConfident.score).toBeLessThan(0.4)
    expect(allSuspicious.score).toBeLessThan(0.4)
  })

  it('makes the hedger the lowest of the eight, tied with the backwards profile', () => {
    const scores = TABLE_FROM_PHASE_4.map(
      ({ bets }) => verificationDimension(playG1_1(bets)).score,
    )
    const hedger = verificationDimension(
      playG1_1(HEDGER_NEUTRAL_EVERYWHERE),
    ).score
    const backwards = verificationDimension(playG1_1(CONFIDENT_BACKWARDS)).score

    expect(hedger).toBeCloseTo(Math.min(...scores), 3)
    expect(backwards).toBeCloseTo(Math.min(...scores), 3)
  })

  it('lands the lukewarm profile exactly on the calibration threshold, and the inclusive bound lets it pass', () => {
    const dimension = verificationDimension(
      playG1_1(DISCRIMINATING_BUT_LUKEWARM),
    )

    expect(
      dimension.contributions.find((c) => c.criterionId === 'g1-1-c3')
        ?.satisfied,
    ).toBe(true)
  })

  it('loads the real course and opens the Jugement critique group on confidence-bet', () => {
    expect(() => buildFacade()).not.toThrow()

    const facade = buildFacade()
    facade.start('Alice')
    const progress = facade.getProgress()

    expect(progress.game?.id).toBe(G1_1_GAME_ID)
    expect(progress.game?.type).toBe('confidence-bet')
  })

  it('maps every g1-1 criterion to verification, and nothing else', () => {
    const { game } = realG1_1()
    const dimensions = new Set(
      game.criteria.flatMap((criterion) =>
        criterion.mapping.map((mapping) => mapping.dimension),
      ),
    )

    expect([...dimensions]).toEqual(['verification'])
  })

  it('keeps the statement silent about thresholds, the band, or the per-nature mean', () => {
    const { game } = realG1_1()
    const statement = (
      game.config as { statement: string }
    ).statement.toLowerCase()

    expect(statement).not.toMatch(/seuil|bande|moyenne|\b50\b|\b70\b|0[.,]5/)
  })

  it('validates the real g1-1 config against its own schema, the registry resolving its type', () => {
    const { game } = realG1_1()

    expect(() => confidenceBetConfigSchema.parse(game.config)).not.toThrow()
  })
})
