import { describe, expect, it } from 'vitest'
import { median } from '@/games/three-tracks/helpers/median.helper'

describe('median helper', () => {
  it('returns the middle value of an odd number of values', () => {
    expect(median([4, 1, 3])).toBe(3)
  })

  it('averages the two middle values of an even number of values', () => {
    expect(median([4, 1, 3, 2])).toBe(2.5)
  })

  it('sorts before measuring, regardless of the input order', () => {
    expect(median([1, 4, 4, 1])).toBe(median([4, 1, 1, 4]))
  })

  it('does not mutate the sequence passed in', () => {
    const values = [4, 1, 3, 2]

    median(values)

    expect(values).toEqual([4, 1, 3, 2])
  })
})
