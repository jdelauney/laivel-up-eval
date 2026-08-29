import { describe, expect, it } from 'vitest'
import {
  repositoryInputSchema,
  repositorySlugSchema,
} from '../../../../src/core/contracts/repository-slug.schema'

const refusalOf = (value: string): string => {
  const parsed = repositoryInputSchema.safeParse(value)
  expect(parsed.success).toBe(false)
  return parsed.error?.issues[0]?.message ?? ''
}

describe('repository slug', () => {
  it('accepts the reference form and nothing shaped differently', () => {
    expect(
      repositorySlugSchema.safeParse('jdelauney/laivel-up-eval').success,
    ).toBe(true)
    expect(repositorySlugSchema.safeParse('laivel-up-eval').success).toBe(false)
    expect(repositorySlugSchema.safeParse('a/b/c').success).toBe(false)
    expect(repositorySlugSchema.safeParse('a/').success).toBe(false)
    expect(repositorySlugSchema.safeParse('/b').success).toBe(false)
  })

  it('refuses a segment holding a space, or reduced to a path marker', () => {
    expect(repositorySlugSchema.safeParse('proprie taire/depot').success).toBe(
      false,
    )
    expect(repositorySlugSchema.safeParse('./depot').success).toBe(false)
    expect(repositorySlugSchema.safeParse('proprietaire/..').success).toBe(
      false,
    )
  })
})

describe('repository input', () => {
  it('keeps the slug form as it was typed', () => {
    expect(repositoryInputSchema.parse('proprietaire/depot')).toBe(
      'proprietaire/depot',
    )
  })

  it('reports no repository for an empty field, without an error', () => {
    expect(repositoryInputSchema.parse('')).toBeUndefined()
    expect(repositoryInputSchema.parse('   ')).toBeUndefined()
  })

  it('normalises every accepted url decoration to the same slug', () => {
    const forms = [
      'https://github.com/proprietaire/depot',
      'http://github.com/proprietaire/depot',
      'https://www.github.com/proprietaire/depot/',
      'https://github.com/proprietaire/depot.git',
      'github.com/proprietaire/depot',
      '  https://github.com/proprietaire/depot  ',
    ]

    for (const form of forms) {
      expect(repositoryInputSchema.parse(form)).toBe('proprietaire/depot')
    }
  })

  it('refuses a url pointing deeper than the repository itself', () => {
    expect(refusalOf('https://github.com/proprietaire/depot/pull/3')).toContain(
      'proprietaire/depot',
    )
    expect(
      repositoryInputSchema.safeParse(
        'https://github.com/proprietaire/depot/tree/main',
      ).success,
    ).toBe(false)
  })

  it('refuses another host, free text, and a lone segment', () => {
    expect(
      repositoryInputSchema.safeParse('https://gitlab.com/proprietaire/depot')
        .success,
    ).toBe(false)
    expect(repositoryInputSchema.safeParse('mon super dépôt').success).toBe(
      false,
    )
    expect(repositoryInputSchema.safeParse('depot').success).toBe(false)
  })

  it('states the expected form in french when it refuses', () => {
    const message = refusalOf('mon super dépôt')

    expect(message).toContain('proprietaire/depot')
    expect(message).toContain('https://github.com/')
    expect(message).toMatch(/dépôt/)
  })

  it('normalises twice to the same value', () => {
    const once = repositoryInputSchema.parse(
      'https://www.github.com/proprietaire/depot.git',
    )
    expect(once).toBeDefined()
    expect(repositoryInputSchema.parse(once ?? '')).toBe(once)
  })
})
