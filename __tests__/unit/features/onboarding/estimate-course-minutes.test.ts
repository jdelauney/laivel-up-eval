import { describe, expect, it } from 'vitest'
import { estimateCourseMinutes } from '../../../../src/features/onboarding/helpers/estimate-course-minutes.helper'

describe('estimateCourseMinutes', () => {
  it('turns twenty situations into thirty minutes', () => {
    expect(estimateCourseMinutes(20)).toBe(30)
  })

  it('rounds up to the nearest multiple of five', () => {
    expect(estimateCourseMinutes(9)).toBe(15)
  })

  it('rounds down to the nearest multiple of five', () => {
    expect(estimateCourseMinutes(7)).toBe(10)
  })

  it('never announces zero minutes for a non-empty course', () => {
    expect(estimateCourseMinutes(1)).toBe(5)
  })

  it('announces zero for a course without any situation', () => {
    expect(estimateCourseMinutes(0)).toBe(0)
  })
})
