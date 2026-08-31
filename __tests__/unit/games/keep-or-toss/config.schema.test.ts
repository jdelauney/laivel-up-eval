import { describe, expect, it } from 'vitest'
import { keepOrTossConfigSchema } from '@/games/keep-or-toss/schema/config.schema'

const item = (id: string, keep: boolean) => ({
  id,
  label: `Libellé de ${id}.`,
  keep,
  reason: `Pourquoi ${id}.`,
})

/** Huit items, quatre à garder, quatre à jeter — un équilibre strict, sous le plafond des deux tiers. */
const validConfig = () => ({
  statement: 'Consigne de test.',
  durationSeconds: 10,
  items: [
    item('p1', true),
    item('p2', false),
    item('p3', true),
    item('p4', false),
    item('p5', true),
    item('p6', false),
    item('p7', true),
    item('p8', false),
  ],
})

const firstIssue = (config: unknown) => {
  const result = keepOrTossConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues[0]
}

describe('keep-or-toss config schema', () => {
  it('accepts eight items, balanced, under the per-item time cap', () => {
    const parsed = keepOrTossConfigSchema.parse(validConfig())

    expect(parsed.items).toHaveLength(8)
    expect(parsed.durationSeconds).toBe(10)
  })

  it('rejects fewer than eight items', () => {
    const config = validConfig()
    config.items = config.items.slice(0, 7)

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['items'])
  })

  it('rejects two items sharing the same id, naming it', () => {
    const config = validConfig()
    config.items[1] = item('p1', false)

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['items', 1, 'id'])
    expect(issue.message).toContain('p1')
  })

  it('rejects a lot that keeps everything, no toss verdict represented', () => {
    const config = validConfig()
    config.items = config.items.map((entry) => ({ ...entry, keep: true }))

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['items'])
    expect(issue.message).toContain('deux verdicts')
  })

  it('rejects a lot that tosses everything, no keep verdict represented', () => {
    const config = validConfig()
    config.items = config.items.map((entry) => ({ ...entry, keep: false }))

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['items'])
    expect(issue.message).toContain('deux verdicts')
  })

  it('rejects a verdict share strictly above two thirds of the lot', () => {
    const config = validConfig()
    // Douze items, neuf à garder : 9/12 = 0,75 > 2/3.
    config.items = [
      item('p1', true),
      item('p2', true),
      item('p3', true),
      item('p4', true),
      item('p5', true),
      item('p6', true),
      item('p7', true),
      item('p8', true),
      item('p9', true),
      item('p10', false),
      item('p11', false),
      item('p12', false),
    ]

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['items'])
    expect(issue.message).toContain('dépasser')
  })

  it('accepts a verdict share exactly at two thirds of the lot, the inclusive boundary', () => {
    // Douze items, huit à garder : 8/12 = 2/3 exactement.
    const config = {
      statement: 'Consigne de test.',
      durationSeconds: 10,
      items: [
        item('p1', true),
        item('p2', true),
        item('p3', true),
        item('p4', true),
        item('p5', true),
        item('p6', true),
        item('p7', true),
        item('p8', true),
        item('p9', false),
        item('p10', false),
        item('p11', false),
        item('p12', false),
      ],
    }

    expect(() => keepOrTossConfigSchema.parse(config)).not.toThrow()
  })

  it('rejects durationSeconds at or above the two-seconds-per-item cap', () => {
    const config = validConfig()
    // Huit items : le plafond est 16, strictement.
    config.durationSeconds = 16

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['durationSeconds'])
    expect(issue.message).toContain('secondes par item')
  })

  it('accepts durationSeconds one second under the per-item cap', () => {
    const config = validConfig()
    config.durationSeconds = 15

    expect(() => keepOrTossConfigSchema.parse(config)).not.toThrow()
  })

  it('rejects a non-positive durationSeconds before the cap check even runs', () => {
    const config = validConfig()
    config.durationSeconds = 0

    const result = keepOrTossConfigSchema.safeParse(config)
    expect(result.success).toBe(false)
  })
})
