import { describe, expect, it } from 'vitest'
import type { Course } from '@/core/contracts/course.schema'
import { parseConfiguration } from '@/core/contracts/helpers/parse-config.helper'
import { WeightedMappingStrategy } from '@/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '@/core/session/game-session.facade'
import { buildLieDetectorAnswer } from '@/games/lie-detector/actions/build-lie-detector-answer.action'
import {
  type LieDetectorConfig,
  lieDetectorConfigSchema,
  type Round,
} from '@/games/lie-detector/schema/config.schema'
import { buildGameRegistry } from '@/games/register-games'
import { FixedClock } from '@/infrastructure/clock/fixed.adapter'
import projectCourse from '../../../config/course.json'
import projectGrid from '../../../config/grid.json'
import projectSignature from '../../../config/signature.json'
import { MemoryPersistence } from '../../fixtures/memory-persistence'

/**
 * Le jeu traverse le moteur réel : le vrai registre, la vraie façade, la
 * vraie stratégie de pondération, et le corpus réel de `g1-3` extrait de
 * `config/course.json`. `verification` vit dans la signature, pas dans la
 * grille officielle — `getVerdict().signature`, jamais `.result`.
 *
 * Les quatre profils se construisent depuis le corpus lu, jamais depuis des
 * identifiants écrits en dur : une réécriture du corpus ne doit pas casser
 * ce test pour la mauvaise raison.
 */

const G1_3_GAME_ID = 'g1-3'

const realG1_3 = () => {
  const group = (projectCourse as Course).groups.find((entry) =>
    entry.games.some((game) => game.id === G1_3_GAME_ID),
  )
  const game = group?.games.find((entry) => entry.id === G1_3_GAME_ID)
  if (group === undefined || game === undefined) {
    throw new Error(`${G1_3_GAME_ID} introuvable dans le parcours réel`)
  }
  return { group, game }
}

const realG1_3Config = (): LieDetectorConfig =>
  lieDetectorConfigSchema.parse(realG1_3().game.config)

const isolatedCourse = (): unknown => {
  const { group, game } = realG1_3()
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

const liarIdOf = (round: Round): string => {
  const liar = round.claims.find((claim) => claim.lying)
  if (liar === undefined) throw new Error(`round ${round.id} has no liar`)
  return liar.id
}

const nonLiarIdOf = (round: Round): string => {
  const truthful = round.claims.find((claim) => !claim.lying)
  if (truthful === undefined)
    throw new Error(`round ${round.id} has no truthful claim`)
  return truthful.id
}

/** Désigne juste, dès le premier temps, et maintient jusqu'à la révélation. */
const correctAndHeldPicks = (config: LieDetectorConfig) =>
  config.rounds.map((round) => ({
    roundId: round.id,
    firstPickId: liarIdOf(round),
    finalPickId: liarIdOf(round),
  }))

/** Adopte toujours la cible de l'objection, dès le départ : jamais contredit. */
const alwaysFollowsAssistantPicks = (config: LieDetectorConfig) =>
  config.rounds.map((round) => ({
    roundId: round.id,
    firstPickId: round.objection.targetId,
    finalPickId: round.objection.targetId,
  }))

/**
 * Tient chacune de ses désignations justes : la menteuse, dès le premier
 * temps, jamais bougée. C'est le profil que l'acceptance de phase 4 décrit
 * (« le profil qui tient chacune de ses désignations justes satisfait le
 * critère de stabilité »). Corrigé le 30/08 après revue (F2) : la première
 * écriture dérivait ce profil de `nonLiarIdOf`, donc d'une désignation
 * FAUSSE dans les quatre manches — il ne couvrait pas l'acceptance, il
 * verrouillait le bug de F1 comme s'il était le comportement voulu.
 */
const neverMovesPicks = (config: LieDetectorConfig) =>
  config.rounds.map((round) => ({
    roundId: round.id,
    firstPickId: liarIdOf(round),
    finalPickId: liarIdOf(round),
  }))

/**
 * Désigne une vraie affirmation dès le premier temps et n'en bouge jamais.
 * Distinct de `neverMovesPicks` : celui-ci lit FAUX et campe dessus, donc
 * n'a jamais l'occasion de capituler puisqu'il n'a jamais eu raison. Doit
 * rater la stabilité — c'est le profil que l'ancienne règle (comptant les
 * contradictions plutôt que les occasions) laissait passer à tort (F1).
 */
const neverMovesWrongPicks = (config: LieDetectorConfig) =>
  config.rounds.map((round) => ({
    roundId: round.id,
    firstPickId: nonLiarIdOf(round),
    finalPickId: nonLiarIdOf(round),
  }))

/**
 * Démasque exactement `count` manches sur quatre, dans l'ordre du corpus,
 * chaque désignation tenue (première = finale) : isole le seuil de
 * `g1-3-c1` de la stabilité, jamais mesurée ici.
 */
const unmaskExactlyPicks = (config: LieDetectorConfig, count: number) =>
  config.rounds.map((round, index) => {
    const pickId = index < count ? liarIdOf(round) : nonLiarIdOf(round)
    return { roundId: round.id, firstPickId: pickId, finalPickId: pickId }
  })

/** Juste au premier temps, puis retournée : la finale suit toujours la cible de l'objection. */
const correctThenRetreatsPicks = (config: LieDetectorConfig) =>
  config.rounds.map((round) => ({
    roundId: round.id,
    firstPickId: liarIdOf(round),
    finalPickId: round.objection.targetId,
  }))

const playG1_3 = (
  picks: ReturnType<typeof correctAndHeldPicks>,
): GameSessionFacade => {
  const facade = buildFacade(isolatedCourse())
  facade.start('Alice')
  facade.submitAnswer(buildLieDetectorAnswer(realG1_3Config(), picks))
  facade.nextGame()
  return facade
}

describe('lie-detector in the course', () => {
  it('loads the real course and opens the situation as lie-detector, four rounds', () => {
    expect(() => buildFacade()).not.toThrow()

    const { game } = realG1_3()
    expect(game.type).toBe('lie-detector')
    const config = lieDetectorConfigSchema.parse(game.config)
    expect(config.rounds).toHaveLength(4)
  })

  it('maps every g1-3 criterion to verification, and nothing else', () => {
    const { game } = realG1_3()
    const dimensions = new Set(
      game.criteria.flatMap((criterion) =>
        criterion.mapping.map((mapping) => mapping.dimension),
      ),
    )

    expect([...dimensions]).toEqual(['verification'])
  })

  /**
   * F6 : le seuil de `g1-3-c1` n'était vérifié par aucun test — un lot
   * borné entre 2 et 4 dans les profils existants passait en silence. Épingle
   * la valeur exacte, puis la sonde des deux côtés de la frontière.
   */
  it('pins the identification threshold at exactly three unmasked rounds out of four', () => {
    const { game } = realG1_3()
    const criterion = game.criteria.find((entry) => entry.id === 'g1-3-c1')

    expect(criterion?.rule).toEqual({
      type: 'lies-unmasked-at-least',
      threshold: 3,
    })

    const twoUnmasked = verificationDimension(
      playG1_3(unmaskExactlyPicks(realG1_3Config(), 2)),
    )
    const identificationAtTwo = twoUnmasked.contributions.find(
      (contribution) => contribution.criterionId === 'g1-3-c1',
    )
    expect(identificationAtTwo?.satisfied).toBe(false)

    const threeUnmasked = verificationDimension(
      playG1_3(unmaskExactlyPicks(realG1_3Config(), 3)),
    )
    const identificationAtThree = threeUnmasked.contributions.find(
      (contribution) => contribution.criterionId === 'g1-3-c1',
    )
    expect(identificationAtThree?.satisfied).toBe(true)
  })

  it('rewards designating the liar four times out of four and holding under contradiction: both criteria satisfied', () => {
    const dimension = verificationDimension(
      playG1_3(correctAndHeldPicks(realG1_3Config())),
    )
    const satisfiedByCriterion = Object.fromEntries(
      dimension.contributions.map((contribution) => [
        contribution.criterionId,
        contribution.satisfied,
      ]),
    )

    expect(satisfiedByCriterion['g1-3-c1']).toBe(true)
    expect(satisfiedByCriterion['g1-3-c2']).toBe(true)
  })

  it('sinks the identification criterion for the profile that always adopts the objection target', () => {
    const dimension = verificationDimension(
      playG1_3(alwaysFollowsAssistantPicks(realG1_3Config())),
    )
    const satisfiedByCriterion = Object.fromEntries(
      dimension.contributions.map((contribution) => [
        contribution.criterionId,
        contribution.satisfied,
      ]),
    )

    expect(satisfiedByCriterion['g1-3-c1']).toBe(false)
    // Ce profil n'est jamais contredit (sa première désignation vise
    // toujours la cible de l'objection) : c'est le refus de la vacuité que
    // la story impose (F3) — sans matière, `g1-3-c2` ne se satisfait pas.
    expect(satisfiedByCriterion['g1-3-c2']).toBe(false)
  })

  it('holds the stability criterion for the profile that never moves off a correct designation', () => {
    const dimension = verificationDimension(
      playG1_3(neverMovesPicks(realG1_3Config())),
    )
    const stability = dimension.contributions.find(
      (contribution) => contribution.criterionId === 'g1-3-c2',
    )

    expect(stability?.satisfied).toBe(true)
  })

  /**
   * F2 : le pendant du profil ci-dessus, qui lit FAUX et campe dessus. Sans
   * occasion (il n'a jamais eu raison), la stabilité doit rater — c'est
   * exactement le trou que la règle bogosement écrite (F1) laissait passer.
   */
  it('sinks the stability criterion for the profile that never moves off a wrong designation', () => {
    const dimension = verificationDimension(
      playG1_3(neverMovesWrongPicks(realG1_3Config())),
    )
    const stability = dimension.contributions.find(
      (contribution) => contribution.criterionId === 'g1-3-c2',
    )

    expect(stability?.satisfied).toBe(false)
  })

  it('misses both criteria for the profile correct at first then retreating on every objection', () => {
    const dimension = verificationDimension(
      playG1_3(correctThenRetreatsPicks(realG1_3Config())),
    )
    const satisfiedByCriterion = Object.fromEntries(
      dimension.contributions.map((contribution) => [
        contribution.criterionId,
        contribution.satisfied,
      ]),
    )

    expect(satisfiedByCriterion['g1-3-c1']).toBe(false)
    expect(satisfiedByCriterion['g1-3-c2']).toBe(false)
  })

  it('carries a corpus with both natures of objection: at least one founded, at least one hollow', () => {
    const config = realG1_3Config()

    const founded = config.rounds.filter(
      (round) => round.objection.targetId === liarIdOf(round),
    )
    const hollow = config.rounds.filter(
      (round) => round.objection.targetId !== liarIdOf(round),
    )

    expect(founded.length).toBeGreaterThan(0)
    expect(hollow.length).toBeGreaterThan(0)
  })

  it('never lets the liar be the longest or the shortest claim of its round: form does not give it away', () => {
    const config = realG1_3Config()

    config.rounds.forEach((round) => {
      const lengths = round.claims.map((claim) => claim.text.length)
      const liarLength = round.claims.find((claim) => claim.lying)?.text.length

      expect(liarLength).not.toBe(Math.max(...lengths))
      expect(liarLength).not.toBe(Math.min(...lengths))
    })
  })

  /**
   * Le premier garde-fou seul autorisait encore un lot allant de 80 à 168
   * caractères : la menteuse au milieu, mais deux affirmations qui se
   * signalent par leur taille. Mesuré sur `text.length` uniquement — un
   * décompte de mots compterait la ponctuation isolée comme un mot et
   * rendrait le verdict bruité.
   */
  it('keeps each round within a quarter of its longest claim: the set reads as homogeneous', () => {
    const config = realG1_3Config()

    config.rounds.forEach((round) => {
      const lengths = round.claims.map((claim) => claim.text.length)
      const longest = Math.max(...lengths)
      const shortest = Math.min(...lengths)

      expect(longest - shortest).toBeLessThanOrEqual(longest / 4)
    })
  })

  it('carries a non-empty verification on every claim: the true ones must be verifiable too', () => {
    const config = realG1_3Config()

    config.rounds.forEach((round) => {
      round.claims.forEach((claim) => {
        expect(claim.verification.trim().length).toBeGreaterThan(0)
      })
    })
  })
})
