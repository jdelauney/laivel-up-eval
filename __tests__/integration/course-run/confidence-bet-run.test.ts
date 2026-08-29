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
 * Le tableau des neuf profils tient sur `g1-1` seul, isolé dans son propre
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
 * Les neuf profils du tableau de `phase-4.md`, en mises `x1`…`x6` — les
 * identifiants neutres du corpus réel de `config/course.json`
 * (`x1` flawed, `x2` undecidable, `x3` sound, `x4` flawed, `x5` sound,
 * `x6` undecidable). Capital de départ 100, mouvement maximal 40 par
 * extrait tranchable ; ces chiffres ont été vérifiés à la main contre le
 * moteur avant d'être écrits ici.
 */
const CALIBRATED_BOTH_SIDES: Bet[] = [
  bet('x1', 10),
  bet('x2', 50),
  bet('x3', 90),
  bet('x4', 10),
  bet('x5', 90),
  bet('x6', 50),
]

const CALIBRATED_ONE_HESITATION_EACH_SIDE: Bet[] = [
  bet('x1', 10),
  bet('x2', 50),
  bet('x3', 90),
  bet('x4', 30),
  bet('x5', 70),
  bet('x6', 50),
]

const READS_CODE_CANNOT_SAY_IT_DOES_NOT_KNOW: Bet[] = [
  bet('x1', 10),
  bet('x2', 90),
  bet('x3', 90),
  bet('x4', 10),
  bet('x5', 90),
  bet('x6', 90),
]

const DISCRIMINATING_BUT_LUKEWARM: Bet[] = [
  bet('x1', 30),
  bet('x2', 50),
  bet('x3', 70),
  bet('x4', 30),
  bet('x5', 70),
  bet('x6', 50),
]

const ALL_CONFIDENT: Bet[] = [
  bet('x1', 90),
  bet('x2', 90),
  bet('x3', 90),
  bet('x4', 90),
  bet('x5', 90),
  bet('x6', 90),
]

const ALL_SUSPICIOUS: Bet[] = [
  bet('x1', 10),
  bet('x2', 10),
  bet('x3', 10),
  bet('x4', 10),
  bet('x5', 10),
  bet('x6', 10),
]

const HEDGER_NEUTRAL_EVERYWHERE: Bet[] = [
  bet('x1', 50),
  bet('x2', 50),
  bet('x3', 50),
  bet('x4', 50),
  bet('x5', 50),
  bet('x6', 50),
]

const CONFIDENT_BACKWARDS: Bet[] = [
  bet('x1', 90),
  bet('x2', 50),
  bet('x3', 90),
  bet('x4', 10),
  bet('x5', 10),
  bet('x6', 50),
]

/**
 * Le neuvième profil, seul à se noter extrait par extrait plutôt que par
 * nature : il lit honnêtement les trois premiers extraits déclarés
 * (`x1` flawed, `x2` undecidable, `x3` sound) puis répète leur maille
 * 10·50·90 sur les trois derniers sans les lire. Sur un corpus rangé par
 * nature, ce même joueur aurait décroché 7/7 en n'ayant lu que la moitié
 * du corpus ; l'entrelacement des natures dans `config/course.json` ferme
 * ce raccourci.
 */
const DEDUCES_THE_PATTERN_INSTEAD_OF_READING: Bet[] = [
  bet('x1', 10),
  bet('x2', 50),
  bet('x3', 90),
  bet('x4', 10),
  bet('x5', 50),
  bet('x6', 90),
]

const TABLE_FROM_PHASE_4 = [
  {
    name: 'Calibré, tranché des deux côtés',
    bets: CALIBRATED_BOTH_SIDES,
    satisfied: { c1: true, c2: true, c3: true, c4: true },
    score: 1,
    capital: 260,
  },
  {
    name: 'Calibré, une hésitation de chaque côté',
    bets: CALIBRATED_ONE_HESITATION_EACH_SIDE,
    satisfied: { c1: true, c2: true, c3: true, c4: true },
    score: 1,
    capital: 220,
  },
  {
    name: "Lit le code, ne sait pas dire qu'il ne sait pas",
    bets: READS_CODE_CANNOT_SAY_IT_DOES_NOT_KNOW,
    satisfied: { c1: true, c2: true, c3: true, c4: false },
    score: 6 / 7,
    capital: 180,
  },
  {
    name: 'Discriminant mais tiède',
    bets: DISCRIMINATING_BUT_LUKEWARM,
    satisfied: { c1: true, c2: false, c3: true, c4: true },
    score: 5 / 7,
    capital: 180,
  },
  {
    name: 'Tout confiant',
    bets: ALL_CONFIDENT,
    satisfied: { c1: false, c2: true, c3: false, c4: false },
    score: 2 / 7,
    capital: 20,
  },
  {
    name: 'Tout méfiant',
    bets: ALL_SUSPICIOUS,
    satisfied: { c1: true, c2: false, c3: false, c4: false },
    score: 2 / 7,
    capital: 20,
  },
  {
    name: 'Hédgeur, la mise neutre partout',
    bets: HEDGER_NEUTRAL_EVERYWHERE,
    satisfied: { c1: false, c2: false, c3: false, c4: true },
    score: 1 / 7,
    capital: 100,
  },
  {
    name: 'Confiant à contresens',
    bets: CONFIDENT_BACKWARDS,
    satisfied: { c1: false, c2: false, c3: false, c4: true },
    score: 1 / 7,
    capital: 100,
  },
  {
    name: 'Lit les trois premiers, répète la maille sur les trois derniers',
    bets: DEDUCES_THE_PATTERN_INSTEAD_OF_READING,
    satisfied: { c1: true, c2: false, c3: true, c4: false },
    score: 4 / 7,
    capital: 180,
  },
] as const

describe('confidence-bet in the course', () => {
  it.each(TABLE_FROM_PHASE_4)(
    'scores "$name" at $score on verification',
    ({ bets, satisfied, score, capital }) => {
      const dimension = verificationDimension(playG1_1(bets))
      const answer = buildConfidenceBetAnswer(realG1_1Config(), bets)

      const satisfiedByCriterion = Object.fromEntries(
        dimension.contributions.map((contribution) => [
          contribution.criterionId,
          contribution.satisfied,
        ]),
      )

      expect(satisfiedByCriterion['g1-1-c1']).toBe(satisfied.c1)
      expect(satisfiedByCriterion['g1-1-c2']).toBe(satisfied.c2)
      expect(satisfiedByCriterion['g1-1-c3']).toBe(satisfied.c3)
      expect(satisfiedByCriterion['g1-1-c4']).toBe(satisfied.c4)
      expect(dimension.score).toBeCloseTo(score, 3)
      expect(answer.finalCapital).toBe(capital)
    },
  )

  it('keeps the pattern-guessing profile strictly under the profile that read all the code', () => {
    const deducesThePattern = verificationDimension(
      playG1_1(DEDUCES_THE_PATTERN_INSTEAD_OF_READING),
    )
    const readsAllTheCode = verificationDimension(
      playG1_1(READS_CODE_CANNOT_SAY_IT_DOES_NOT_KNOW),
    )

    expect(deducesThePattern.score).toBeLessThan(readsAllTheCode.score)
  })

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

  it('makes the hedger the lowest of the nine, tied with the backwards profile', () => {
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

  /**
   * Le défaut critique de la première revue : un corpus rangé par nature
   * offrait sa seconde moitié à qui déduisait la maille sur la première. Le
   * profil 9 ne protège l'entrelacement que par accident — ses mises sont
   * figées sur l'ordre actuel, et un réordonnancement le ferait échouer sur
   * un écart de score sans jamais nommer l'invariant. Celui-ci le nomme.
   */
  it('never runs two snippets of the same nature back to back', () => {
    const { snippets } = realG1_1Config()
    const runs = snippets
      .slice(1)
      .filter((snippet, index) => snippet.nature === snippets[index].nature)
      .map((snippet) => snippet.id)

    expect(runs).toEqual([])
  })

  /** Un identifiant qui encode sa nature la donne à l'inspecteur du
   * navigateur, avant tout engagement, par le `name` du groupe radio. */
  it('never encodes a snippet nature in its identifier', () => {
    const { snippets } = realG1_1Config()

    expect(
      snippets.filter((snippet) =>
        /^(sound|flawed|undecidable|[sfu]\d)/i.test(snippet.id),
      ),
    ).toEqual([])
  })
})
