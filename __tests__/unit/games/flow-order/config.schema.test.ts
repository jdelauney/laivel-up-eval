import { describe, expect, it } from 'vitest'
import { flowOrderConfigSchema } from '@/games/flow-order/schema/config.schema'

const step = (id: string, rank: number) => ({
  id,
  label: `Libellé de ${id}.`,
  rank,
  note: `Ce qu'apporte ${id}.`,
})

/**
 * Six étapes, rangs `1..6` exacts. `initialOrder` déplace quatre étapes
 * (`s2`, `s3`, `s4`, `s6`) de plus d'une position — largement au-dessus du
 * plancher de deux qu'exige le contrat.
 */
const validConfig = () => ({
  statement: 'Consigne de test.',
  steps: [
    step('s1', 1),
    step('s2', 2),
    step('s3', 3),
    step('s4', 4),
    step('s5', 5),
    step('s6', 6),
  ],
  initialOrder: ['s3', 's1', 's6', 's2', 's5', 's4'],
})

const firstIssue = (config: unknown) => {
  const result = flowOrderConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues[0]
}

describe('flow-order config schema', () => {
  it('accepts six steps with exact ranks and a displaced initial order', () => {
    const parsed = flowOrderConfigSchema.parse(validConfig())

    expect(parsed.steps).toHaveLength(6)
    expect(parsed.initialOrder).toEqual(['s3', 's1', 's6', 's2', 's5', 's4'])
  })

  it('rejects fewer than six steps', () => {
    const config = validConfig()
    config.steps = config.steps.slice(0, 5)
    config.initialOrder = config.initialOrder.filter((id) => id !== 's6')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['steps'])
  })

  it('rejects two steps sharing the same id, naming it', () => {
    const config = validConfig()
    config.steps[1] = step('s1', 2)

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['steps', 1, 'id'])
    expect(issue.message).toContain('s1')
  })

  it('rejects ranks with a gap', () => {
    const config = validConfig()
    config.steps[5] = step('s6', 8)

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['steps'])
    expect(issue.message).toContain('rangs')
  })

  it('rejects ranks with a duplicate', () => {
    const config = validConfig()
    config.steps[5] = step('s6', 1)

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['steps'])
    expect(issue.message).toContain('rangs')
  })

  it('rejects an initialOrder missing a declared step', () => {
    const config = validConfig()
    config.initialOrder = ['s3', 's1', 's6', 's2', 's5']

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['initialOrder'])
    expect(issue.message).toContain('couvre pas exactement')
  })

  it('rejects an initialOrder repeating a step', () => {
    const config = validConfig()
    config.initialOrder = ['s3', 's1', 's6', 's2', 's5', 's5']

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['initialOrder'])
    expect(issue.message).toContain('couvre pas exactement')
  })

  it('rejects an initialOrder referencing an unknown step', () => {
    const config = validConfig()
    config.initialOrder = ['s3', 's1', 's6', 's2', 's5', 'introuvable']

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['initialOrder'])
    expect(issue.message).toContain('couvre pas exactement')
  })

  it('rejects the exact order as initialOrder, the trivial giveaway', () => {
    const config = validConfig()
    config.initialOrder = ['s1', 's2', 's3', 's4', 's5', 's6']

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['initialOrder'])
    expect(issue.message).toContain('marge de robustesse')
  })

  it('rejects an initialOrder that displaces only one step by more than one position, without claiming that one displaced step would be enough to pass', () => {
    const config = validConfig()
    // s1 seul avance de deux crans (position 1 → 3), le reste glisse d'un
    // cran ou reste en place : une seule étape dépasse l'écart d'un cran.
    // Cette seule étape suffirait déjà à faire échouer
    // `order-within-displacement` — le refus tient à la marge de robustesse
    // du schéma, pas à une condition nécessaire du critère.
    config.initialOrder = ['s2', 's3', 's1', 's4', 's5', 's6']

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['initialOrder'])
    expect(issue.message).toContain('marge de robustesse')
    expect(issue.message).not.toContain('aucun des deux critères')
  })
})
