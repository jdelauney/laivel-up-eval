import { describe, expect, it } from 'vitest'
import { practiceMapConfigSchema } from '@/games/practice-map/schema/config.schema'

const poles = () => ({
  intensityLow: 'vous le faites',
  intensityHigh: "l'agent le fait seul",
  rigorLow: 'rien ne la vérifie',
  rigorHigh: 'un garde-fou la tient sans vous',
})

const zone = (
  intensityFrom: number,
  intensityTo: number,
  rigorFrom: number,
  rigorTo: number,
) => ({ intensityFrom, intensityTo, rigorFrom, rigorTo })

const practice = (
  id: string,
  expected: ReturnType<typeof zone>,
  overrides: Partial<{ label: string; marker: string }> = {},
) => ({
  id,
  label: overrides.label ?? `Pratique ${id}.`,
  expected,
  marker: overrides.marker ?? `Repère de ${id}.`,
})

const ordering = (
  id: string,
  axis: 'intensity' | 'rigor',
  higherId: string,
  lowerId: string,
) => ({ id, axis, higherId, lowerId })

/**
 * Quatre pratiques, zones deux à deux disjointes, chacune sous 12 % du plan,
 * réparties de part et d'autre des deux seuils, trois relations soutenues
 * par les zones : le minimum qui satisfait chaque refus du contrat à la
 * fois.
 *
 * `p1` bas-gauche (basse rigueur, basse intensité), `p2` centre, `p3`
 * haut-droite (haute rigueur, haute intensité), `p4` bas-droite (basse
 * rigueur, haute intensité).
 */
const validConfig = () => ({
  statement: 'Consigne de test.',
  highRigorFrom: 0.5,
  poles: poles(),
  practices: [
    practice('p1', zone(0, 0.2, 0, 0.2)),
    practice('p2', zone(0.3, 0.5, 0.3, 0.5)),
    practice('p3', zone(0.6, 0.8, 0.6, 0.8)),
    practice('p4', zone(0.8, 1, 0, 0.15)),
  ],
  orderings: [
    ordering('o1', 'rigor', 'p3', 'p1'),
    ordering('o2', 'rigor', 'p2', 'p1'),
    ordering('o3', 'intensity', 'p4', 'p1'),
  ],
})

const firstIssue = (config: unknown) => {
  const result = practiceMapConfigSchema.safeParse(config)
  if (result.success) throw new Error('the config should have been rejected')
  return result.error.issues[0]
}

describe('practice-map config schema', () => {
  it('accepts four practices with disjoint, capped, well-spread zones and three supported orderings', () => {
    const parsed = practiceMapConfigSchema.parse(validConfig())

    expect(parsed.practices).toHaveLength(4)
    expect(parsed.orderings).toHaveLength(3)
  })

  it('rejects a zone flat or inverted on the intensity axis', () => {
    const config = validConfig()
    config.practices[0] = practice('p1', zone(0.2, 0.2, 0, 0.2))

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['practices', 0, 'expected', 'intensityTo'])
  })

  it('rejects a zone flat or inverted on the rigor axis', () => {
    const config = validConfig()
    config.practices[0] = practice('p1', zone(0, 0.2, 0.3, 0.1))

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['practices', 0, 'expected', 'rigorTo'])
  })

  it('rejects two practices sharing the same id, naming it', () => {
    const config = validConfig()
    config.practices[1] = practice('p1', zone(0.3, 0.5, 0.3, 0.5))

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['practices', 1, 'id'])
    expect(issue.message).toContain('p1')
  })

  it('rejects two orderings sharing the same id, naming it', () => {
    const config = validConfig()
    config.orderings[1] = ordering('o1', 'rigor', 'p2', 'p1')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['orderings', 1, 'id'])
    expect(issue.message).toContain('o1')
  })

  it('rejects an ordering whose higherId is absent from the practices, naming it', () => {
    const config = validConfig()
    config.orderings[0] = ordering('o1', 'rigor', 'introuvable', 'p1')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['orderings', 0, 'higherId'])
    expect(issue.message).toContain('introuvable')
  })

  it('rejects an ordering whose lowerId is absent from the practices, naming it', () => {
    const config = validConfig()
    config.orderings[0] = ordering('o1', 'rigor', 'p3', 'introuvable')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['orderings', 0, 'lowerId'])
    expect(issue.message).toContain('introuvable')
  })

  it('rejects an ordering comparing a practice to itself', () => {
    const config = validConfig()
    config.orderings[0] = ordering('o1', 'rigor', 'p1', 'p1')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['orderings', 0, 'lowerId'])
    expect(issue.message).toContain('p1')
  })

  it('rejects two orderings carrying the same pair on the same axis, in either direction', () => {
    const config = validConfig()
    config.orderings[1] = ordering('o2', 'rigor', 'p1', 'p3')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['orderings', 1, 'id'])
    expect(issue.message).toContain('o2')
  })

  it('rejects two zones that merely touch at a single point', () => {
    const config = validConfig()
    // p4 déplacé pour ne partager avec p3 qu'un segment de bordure : même
    // plage de rigueur que p3 (0.6..0.8), et une intensité qui commence
    // exactement où celle de p3 s'arrête (0.8). Le seul point commun est
    // cette bordure, jamais une surface.
    config.practices[3] = practice('p4', zone(0.8, 1, 0.6, 0.8))

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['practices', 3, 'expected'])
    expect(issue.message).toContain('p4')
    expect(issue.message).toContain('p3')
  })

  it('rejects a zone covering more than 12% of the plane', () => {
    const config = validConfig()
    // 0.49 × 0.28 = 13,72 % du plan, sans toucher les trois autres zones.
    config.practices[0] = practice('p1', zone(0, 0.49, 0, 0.28))

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['practices', 0, 'expected'])
    expect(issue.message).toContain('p1')
  })

  /**
   * Isolée : cinq zones, chacune sous 12 % (11,56 % ou 9 %), disjointes en
   * grille, distribuées sur les deux axes, relations soutenues — seule leur
   * somme (55,24 %) dépasse le plafond d'emprise. Un plafond de zone à 12 %
   * ne peut jamais, à lui seul sur quatre zones (4 × 12 % = 48 %), dépasser
   * 50 % : ce refus n'est observable qu'à partir de cinq zones.
   */
  it('rejects zones whose total surface exceeds half the plane', () => {
    const config = validConfig()
    config.practices = [
      practice('p1', zone(0, 0.34, 0, 0.34)),
      practice('p2', zone(0.35, 0.69, 0, 0.34)),
      practice('p3', zone(0, 0.34, 0.35, 0.69)),
      practice('p4', zone(0.35, 0.69, 0.35, 0.69)),
      practice('p5', zone(0.7, 1, 0.7, 1)),
    ]
    config.orderings = [
      ordering('o1', 'rigor', 'p5', 'p1'),
      ordering('o2', 'rigor', 'p4', 'p1'),
      ordering('o3', 'intensity', 'p5', 'p1'),
    ]

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['practices'])
    expect(issue.message).toContain('%')
  })

  /**
   * Isolée : distribuée sur l'axe d'intensité, disjointe, sous les deux
   * plafonds, relations soutenues — seule la rigueur reste toute du même
   * côté (aucune zone en haute rigueur).
   */
  it('rejects zones all sitting on the same side of the high-rigor threshold', () => {
    const config = validConfig()
    config.practices = [
      practice('p1', zone(0, 0.2, 0, 0.1)),
      practice('p2', zone(0.3, 0.45, 0, 0.1)),
      practice('p3', zone(0.55, 0.75, 0, 0.1)),
      practice('p4', zone(0.8, 1, 0, 0.1)),
    ]
    config.orderings = [
      ordering('o1', 'intensity', 'p3', 'p1'),
      ordering('o2', 'intensity', 'p4', 'p2'),
      ordering('o3', 'intensity', 'p4', 'p1'),
    ]

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['practices'])
    expect(issue.message).toContain('haute rigueur')
  })

  /**
   * Isolée : distribuée sur l'axe de rigueur, disjointe, sous les deux
   * plafonds, relations soutenues — seule l'intensité reste toute du même
   * côté (aucune zone à intensité forte).
   */
  it('rejects zones all sitting on the same side of the intensity midpoint', () => {
    const config = validConfig()
    config.practices = [
      practice('p1', zone(0, 0.1, 0, 0.2)),
      practice('p2', zone(0.15, 0.25, 0.3, 0.45)),
      practice('p3', zone(0.35, 0.45, 0.55, 0.75)),
      practice('p4', zone(0.46, 0.49, 0.8, 1)),
    ]
    config.orderings = [
      ordering('o1', 'rigor', 'p3', 'p1'),
      ordering('o2', 'rigor', 'p4', 'p2'),
      ordering('o3', 'rigor', 'p4', 'p1'),
    ]

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['practices'])
    expect(issue.message).toContain("axe d'intensité")
  })

  it('rejects an ordering not supported by the zones, naming it', () => {
    const config = validConfig()
    // p1 est en bas (rigor 0..0.2) : « p1 plus haut que p3 » n'est soutenu
    // par aucune zone.
    config.orderings[0] = ordering('o1', 'rigor', 'p1', 'p3')

    const issue = firstIssue(config)
    expect(issue.path).toEqual(['orderings', 0])
    expect(issue.message).toContain('o1')
  })
})
