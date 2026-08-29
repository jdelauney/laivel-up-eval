import { describe, expect, it } from 'vitest'
import {
  ConfigValidationError,
  parseReplayProfile,
} from '@/core/contracts/helpers/parse-config.helper'

const minimalProfile = () => ({
  id: 'low-profile',
  meta: { label: 'Profil bas', expectedLevel: 'vibe-coder' },
  answers: [{ gameId: 'test-bench-1', answer: { selected: ['p2'] } }],
})

const expectRejection = (data: unknown): ConfigValidationError => {
  try {
    parseReplayProfile(data)
  } catch (error) {
    if (error instanceof ConfigValidationError) return error
    throw error
  }
  throw new Error('the profile should have been rejected')
}

describe('replay profile loading', () => {
  it('accepts a conforming profile and exposes its expected level', () => {
    const profile = parseReplayProfile(minimalProfile())

    expect(profile.meta.expectedLevel).toBe('vibe-coder')
    expect(profile.answers[0].gameId).toBe('test-bench-1')
  })

  it('keeps the answer opaque, it belongs to the game contract', () => {
    const profile = parseReplayProfile(minimalProfile())

    expect(profile.answers[0].answer).toHaveProperty('selected')
  })

  it('rejects a profile without an expected level, naming the missing field', () => {
    const data = minimalProfile()
    Reflect.deleteProperty(data.meta, 'expectedLevel')

    const error = expectRejection(data)

    expect(error.field).toBe('meta.expectedLevel')
  })

  it('rejects a profile without any answer', () => {
    const data = minimalProfile()
    data.answers = []

    const error = expectRejection(data)

    expect(error.field).toBe('answers')
  })
})
