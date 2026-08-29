import { describe, expect, it } from 'vitest'
import {
  applyBet,
  calibration,
  GameAlreadyOverError,
  initialState,
  meanStakeOn,
  replayBets,
  stakesOn,
} from '@/games/confidence-bet/helpers/run-simulation.helper'
import type { Bet } from '@/games/confidence-bet/schema/answer.schema'
import {
  type ConfidenceBetConfig,
  confidenceBetConfigSchema,
} from '@/games/confidence-bet/schema/config.schema'

const snippet = (id: string, nature: 'sound' | 'flawed' | 'undecidable') => ({
  id,
  label: id,
  language: 'ts',
  code: `const ${id} = 1`,
  nature,
  reveal: `révélation ${id}`,
})

/** Le barème du parcours, pour que les comptes du plan soient vérifiés ici. */
const buildConfig = (): ConfidenceBetConfig =>
  confidenceBetConfigSchema.parse({
    statement: 'Consigne de test.',
    stakes: [10, 30, 50, 70, 90],
    neutralStake: 50,
    startingCapital: 100,
    snippets: [
      snippet('s1', 'sound'),
      snippet('s2', 'sound'),
      snippet('f1', 'flawed'),
      snippet('f2', 'flawed'),
      snippet('u1', 'undecidable'),
      snippet('u2', 'undecidable'),
    ],
  })

const bet = (snippetId: string, stake: number): Bet => ({ snippetId, stake })

describe('confidence-bet simulation', () => {
  it('opens with the starting capital and no result', () => {
    const state = initialState(buildConfig())

    expect(state.capital).toBe(100)
    expect(state.results).toEqual([])
  })

  it('makes the highest stake the largest gain on a sound snippet', () => {
    const state = applyBet(
      buildConfig(),
      initialState(buildConfig()),
      bet('s1', 90),
    )

    expect(state.results[0].delta).toBe(40)
    expect(state.capital).toBe(140)
  })

  it('makes the same highest stake the loss of the same size on a flawed snippet', () => {
    const state = applyBet(
      buildConfig(),
      initialState(buildConfig()),
      bet('f1', 90),
    )

    expect(state.results[0].delta).toBe(-40)
    expect(state.capital).toBe(60)
  })

  it('costs nothing on an undecidable snippet when the stake is neutral', () => {
    const state = applyBet(
      buildConfig(),
      initialState(buildConfig()),
      bet('u1', 50),
    )

    expect(state.results[0].delta).toBe(0)
  })

  it('makes the two extreme stakes cost the same on an undecidable snippet, whichever side', () => {
    const config = buildConfig()
    const high = applyBet(config, initialState(config), bet('u1', 90))
    const low = applyBet(config, initialState(config), bet('u1', 10))

    expect(high.results[0].delta).toBe(-40)
    expect(low.results[0].delta).toBe(-40)
  })

  it('produces identical states on two replays of the same bets', () => {
    const config = buildConfig()
    const bets = [bet('s1', 90), bet('f1', 10)]

    expect(replayBets(config, bets)).toEqual(replayBets(config, bets))
  })

  it('refuses a bet once every snippet of the config is already played', () => {
    const config = buildConfig()
    const bets = config.snippets.map((entry) =>
      bet(entry.id, config.neutralStake),
    )
    const state = replayBets(config, bets)

    expect(() => applyBet(config, state, bet('s1', 50))).toThrow(
      GameAlreadyOverError,
    )
  })

  describe('calibration', () => {
    it('reaches 1 when every tranchable snippet received the extreme stake on the right side', () => {
      const config = buildConfig()
      const state = replayBets(config, [
        bet('s1', 90),
        bet('s2', 90),
        bet('f1', 10),
        bet('f2', 10),
        bet('u1', 50),
        bet('u2', 50),
      ])

      expect(calibration(config, state)).toBe(1)
    })

    it('reaches 0 when every stake is posed on the neutral stake', () => {
      const config = buildConfig()
      const state = replayBets(
        config,
        config.snippets.map((entry) => bet(entry.id, 50)),
      )

      expect(calibration(config, state)).toBe(0)
    })

    it('goes negative when the tranchable snippets are bet on the wrong side', () => {
      const config = buildConfig()
      const state = replayBets(config, [
        bet('s1', 10),
        bet('s2', 10),
        bet('f1', 90),
        bet('f2', 90),
        bet('u1', 50),
        bet('u2', 50),
      ])

      expect(calibration(config, state)).toBe(-1)
    })

    it('ignores undecidable snippets whatever the stake posed on them', () => {
      const config = buildConfig()
      const calm = replayBets(config, [
        bet('s1', 90),
        bet('s2', 90),
        bet('f1', 10),
        bet('f2', 10),
        bet('u1', 50),
        bet('u2', 50),
      ])
      const extreme = replayBets(config, [
        bet('s1', 90),
        bet('s2', 90),
        bet('f1', 10),
        bet('f2', 10),
        bet('u1', 90),
        bet('u2', 10),
      ])

      expect(calibration(config, calm)).toBe(calibration(config, extreme))
    })
  })

  describe('the three readings the evaluator consumes', () => {
    it('computes the mean stake on a nature', () => {
      const config = buildConfig()
      const state = replayBets(config, [bet('s1', 90), bet('s2', 70)])

      expect(meanStakeOn(state, 'sound')).toBe(80)
    })

    it('exposes the raw stakes of a nature, unaggregated', () => {
      const config = buildConfig()
      const state = replayBets(config, [bet('u1', 90), bet('u2', 10)])

      expect(stakesOn(state, 'undecidable')).toEqual([90, 10])
    })
  })
})
