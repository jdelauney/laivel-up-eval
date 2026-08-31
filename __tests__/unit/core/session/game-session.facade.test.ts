import { beforeEach, describe, expect, it } from 'vitest'
import type { Course } from '../../../../src/core/contracts/course.schema'
import type { PersistenceSessionAdapter } from '../../../../src/core/ports/persistence-session-adapter.interface'
import { UnknownGameTypeError } from '../../../../src/core/registry/game-registry'
import { WeightedMappingStrategy } from '../../../../src/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '../../../../src/core/session/game-session.facade'
import { buildGameRegistry } from '../../../../src/games/register-games'
import { FixedClock } from '../../../../src/infrastructure/clock/fixed.adapter'
import {
  buildTestFacade,
  course,
  grid,
  signature,
} from '../../../fixtures/configuration'
import { MemoryPersistence } from '../../../fixtures/memory-persistence'

const buildFacade = (
  persistence: PersistenceSessionAdapter = new MemoryPersistence(),
) => buildTestFacade(persistence)

const goodAnswer = { selected: ['p1', 'p3'] }
const badAnswer = { selected: ['p2', 'p4'] }

describe('game session facade', () => {
  let facade: GameSessionFacade

  beforeEach(() => {
    facade = buildFacade()
    facade.start('Alice')
  })

  it('opens a session on the first game of the course', () => {
    const progress = facade.getProgress()

    expect(progress.game?.id).toBe('test-bench-1')
    expect(progress.group?.label).toBe("Banc d'essai du moteur")
    expect(progress.submitted).toBe(0)
    expect(progress.total).toBe(1)
  })

  it('turns a good answer into a level, with the chain that explains it', () => {
    facade.submitAnswer(goodAnswer)

    const { result, level } = facade.getVerdict()

    expect(result.dimension('taille')?.score).toBe(1)
    expect(result.dimension('harness')?.score).toBe(1)
    expect(result.groups[0].games[0].criteria).toHaveLength(2)
    expect(level.level?.id).toBeDefined()
    expect(level.hint).toBe(level.level?.nextLevelHint)
  })

  it('drops the level when the answer misses every criterion', () => {
    facade.submitAnswer(badAnswer)

    const { result, level } = facade.getVerdict()

    expect(result.dimension('taille')?.score).toBe(0)
    expect(level.level?.id).toBe('white')
  })

  it('leaves an unmeasured dimension out of the score, without failing', () => {
    facade.submitAnswer(goodAnswer)

    expect(
      facade.getVerdict().result.dimension('initiative')?.measurement,
    ).toBe('unmeasured')
  })

  it('refuses an answer outside the game contract, leaving no trace', () => {
    expect(() => facade.submitAnswer({ selected: 'p1' })).toThrow()
    expect(facade.auditTrail()).toHaveLength(0)
    expect(facade.getProgress().submitted).toBe(0)
  })

  it('stacks one command per submitted answer', () => {
    facade.submitAnswer(goodAnswer)

    expect(facade.auditTrail()).toHaveLength(1)
    expect(facade.auditTrail()[0].gameId).toBe('test-bench-1')
  })

  it('stamps each submission with the injected clock', () => {
    facade.submitAnswer(goodAnswer)

    expect(facade.auditTrail()[0].submittedAt).toBe('2026-01-01T00:00:00.000Z')
  })

  it('keeps the audit trail identical across two runs of the same answers', () => {
    facade.submitAnswer(goodAnswer)

    const other = buildFacade()
    other.start('Alice')
    other.submitAnswer(goodAnswer)

    expect(other.auditTrail()).toEqual(facade.auditTrail())
  })

  it('carries the stored timestamp through a resume, it does not restamp', () => {
    const persistence = new MemoryPersistence()
    const first = buildFacade(persistence)
    first.start('Alice')
    first.submitAnswer(goodAnswer)
    const stamped = first.auditTrail()[0].submittedAt

    const second = buildFacade(persistence)
    second.resume()

    expect(second.auditTrail()[0].submittedAt).toBe(stamped)
  })

  it('reaches the end of the course once the last game is submitted', () => {
    facade.submitAnswer(goodAnswer)
    facade.nextGame()

    expect(facade.getProgress().finished).toBe(true)
  })

  it('resumes a stored session, position and answers included', () => {
    const persistence = new MemoryPersistence()
    const first = buildFacade(persistence)
    first.start('Alice')
    first.submitAnswer(goodAnswer)

    const second = buildFacade(persistence)

    expect(second.resume()).toBe(true)
    expect(second.getProgress().submitted).toBe(1)
    expect(second.auditTrail()).toHaveLength(1)
    expect(second.getVerdict().result.dimension('taille')?.score).toBe(1)
  })

  it('reports nothing to resume when the store is empty', () => {
    expect(buildFacade().resume()).toBe(false)
  })

  it('describes the course shape before any session exists', () => {
    const shape = buildFacade().courseShape()

    expect(shape).toEqual([
      {
        id: 'groupe-banc-essai',
        label: "Banc d'essai du moteur",
        gameCount: 1,
      },
    ])
  })

  it('ignores a stored state that is readable but out of contract', () => {
    const persistence = new MemoryPersistence()
    persistence.write({ playerName: 'Alice' })

    const facade = buildFacade(persistence)

    expect(() => facade.resume()).not.toThrow()
    expect(facade.resume()).toBe(false)
  })

  it('ignores a stored submission whose shape does not hold', () => {
    const persistence = new MemoryPersistence()
    persistence.write({
      playerName: 'Alice',
      groupIndex: 0,
      gameIndex: 0,
      submissions: [{ gameId: 'test-bench-1' }],
    })

    expect(buildFacade(persistence).resume()).toBe(false)
  })

  it('clears the store on reset', () => {
    const persistence = new MemoryPersistence()
    const running = buildFacade(persistence)
    running.start('Alice')
    running.submitAnswer(goodAnswer)
    running.resetSession()

    expect(persistence.read()).toBeUndefined()
    expect(running.hasSession()).toBe(false)
  })

  it('produces the same verdict on two runs of the same answers', () => {
    facade.submitAnswer(goodAnswer)
    const first = facade.getVerdict()

    const other = buildFacade()
    other.start('Alice')
    other.submitAnswer(goodAnswer)

    expect(other.getVerdict()).toEqual(first)
  })

  it('reports no designated repository until one is given', () => {
    expect(facade.designatedRepository()).toBeUndefined()
  })

  it('opens a session under a repository and finds it again on resume', () => {
    const persistence = new MemoryPersistence()
    const played = buildFacade(persistence)
    played.start('Alice', 'alice/atelier')
    played.submitAnswer(goodAnswer)

    const resumed = buildFacade(persistence)

    expect(resumed.resume()).toBe(true)
    expect(resumed.designatedRepository()).toBe('alice/atelier')
    expect(resumed.playerName()).toBe('Alice')
  })

  it('resumes a run stored before the repository field existed', () => {
    const persistence = new MemoryPersistence()
    persistence.write({
      playerName: 'Alice',
      groupIndex: 0,
      gameIndex: 0,
      submissions: [],
    })

    const facadeOnOldStore = buildFacade(persistence)

    expect(facadeOnOldStore.resume()).toBe(true)
    expect(facadeOnOldStore.designatedRepository()).toBeUndefined()
  })

  it('ignores a stored repository that is not normalised', () => {
    const persistence = new MemoryPersistence()
    persistence.write({
      playerName: 'Alice',
      repository: 'https://github.com/alice/atelier',
      groupIndex: 0,
      gameIndex: 0,
      submissions: [],
    })

    const facadeOnBadStore = buildFacade(persistence)

    expect(facadeOnBadStore.resume()).toBe(false)
  })

  it('scores the same verdict with and without a designated repository', () => {
    facade.submitAnswer(goodAnswer)

    const withRepository = buildFacade()
    withRepository.start('Alice', 'alice/atelier')
    withRepository.submitAnswer(goodAnswer)

    expect(withRepository.getVerdict()).toEqual(facade.getVerdict())
  })

  it('refuses a course declaring a game type absent from the registry', () => {
    const ghostCourse: Course = {
      ...course,
      groups: [
        {
          ...course.groups[0],
          games: [{ ...course.groups[0].games[0], type: 'ghost-game' }],
        },
      ],
    }

    expect(
      () =>
        new GameSessionFacade({
          registry: buildGameRegistry(),
          scoring: new WeightedMappingStrategy(),
          persistence: new MemoryPersistence(),
          clock: new FixedClock(),
          grid,
          course: ghostCourse,
          signature,
        }),
    ).toThrow(UnknownGameTypeError)
  })
})
