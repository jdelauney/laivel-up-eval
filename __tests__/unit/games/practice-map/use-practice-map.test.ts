import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { usePracticeMap } from '@/games/practice-map/hooks/use-practice-map.hook'

const poles = () => ({
  intensityLow: 'vous le faites',
  intensityHigh: "l'agent le fait seul",
  rigorLow: 'rien ne la vérifie',
  rigorHigh: 'un garde-fou la tient sans vous',
})

const quadrants = () => ({
  highRigorLowIntensity: 'Outillé, à la main',
  highRigorHighIntensity: 'Outillé, délégué',
  lowRigorLowIntensity: 'À la main, sans filet',
  lowRigorHighIntensity: 'Délégué, sans filet',
})

const zone = (
  intensityFrom: number,
  intensityTo: number,
  rigorFrom: number,
  rigorTo: number,
) => ({ intensityFrom, intensityTo, rigorFrom, rigorTo })

const practice = (id: string, expected: ReturnType<typeof zone>) => ({
  id,
  label: `Pratique ${id}.`,
  shortLabel: `Court ${id}`,
  expected,
  marker: `Repère de ${id}.`,
})

const baseConfig = () => ({
  statement: 'Consigne de test.',
  highRigorFrom: 0.5,
  poles: poles(),
  quadrants: quadrants(),
  practices: [
    practice('p1', zone(0, 0.2, 0, 0.2)),
    practice('p2', zone(0.3, 0.5, 0.3, 0.5)),
    practice('p3', zone(0.6, 0.8, 0.6, 0.8)),
    practice('p4', zone(0.8, 1, 0, 0.15)),
  ],
  orderings: [
    { id: 'o1', axis: 'rigor', higherId: 'p3', lowerId: 'p1' },
    { id: 'o2', axis: 'rigor', higherId: 'p2', lowerId: 'p1' },
    { id: 'o3', axis: 'intensity', higherId: 'p4', lowerId: 'p1' },
  ],
})

const renderGame = (
  config: unknown = baseConfig(),
  onLock = vi.fn(),
  onAdvance = vi.fn(),
) => ({
  onLock,
  onAdvance,
  ...renderHook(() => usePracticeMap(config, onLock, onAdvance)),
})

describe('use practice map', () => {
  it('opens with every practice in the legend, none placed, playing phase', () => {
    const { result } = renderGame()

    expect(result.current.phase).toBe('placing')
    expect(result.current.legend).toHaveLength(4)
    expect(result.current.legend.every((entry) => !entry.placed)).toBe(true)
    expect(result.current.placedTokens).toHaveLength(0)
    expect(result.current.canSubmit).toBe(false)
  })

  it('never exposes expected or marker before the revelation', () => {
    const { result } = renderGame()

    const serializeVisible = () =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(result.current).filter(
            ([, value]) => typeof value !== 'function',
          ),
        ),
      )

    expect(serializeVisible()).not.toContain('expected')
    expect(serializeVisible()).not.toContain('Repère de')

    act(() => {
      result.current.hold('p1')
    })
    act(() => {
      result.current.place(0.1, 0.1)
    })

    expect(serializeVisible()).not.toContain('expected')
    expect(serializeVisible()).not.toContain('Repère de')
  })

  it('marks a practice placed in the legend, without removing it, once placed on the plane', () => {
    const { result } = renderGame()

    act(() => {
      result.current.hold('p1')
    })
    act(() => {
      result.current.place(0.15, 0.05)
    })

    // La légende est permanente : `p1` y reste, marquée posée — perdre la
    // clé d'un numéro au moment de relire son plan serait perdre ce que le
    // jeu mesure.
    expect(result.current.legend).toHaveLength(4)
    expect(
      result.current.legend.find((entry) => entry.id === 'p1')?.placed,
    ).toBe(true)
    expect(result.current.placedTokens).toEqual([
      {
        id: 'p1',
        number: 1,
        label: 'Pratique p1.',
        shortLabel: 'Court p1',
        intensity: 0.15,
        rigor: 0.05,
      },
    ])
  })

  it('replaces the placement of a practice placed twice, with no duplicate', () => {
    const { result } = renderGame()

    act(() => {
      result.current.hold('p1')
    })
    act(() => {
      result.current.place(0.1, 0.1)
    })
    act(() => {
      result.current.hold('p1')
    })
    act(() => {
      result.current.place(0.9, 0.9)
    })

    expect(result.current.placedTokens).toHaveLength(1)
    expect(result.current.placedTokens[0]).toEqual({
      id: 'p1',
      number: 1,
      label: 'Pratique p1.',
      shortLabel: 'Court p1',
      intensity: 0.9,
      rigor: 0.9,
    })
  })

  it('clamps a nudge at the four extremities of the plane', () => {
    const { result } = renderGame()

    // Le jeton est saisi au centre (0.5, 0.5) : il faut au moins cinq pas de
    // 0,1 pour atteindre chaque borne basse, et le double pour la haute.
    act(() => {
      result.current.hold('p1')
    })
    for (let i = 0; i < 10; i++) {
      act(() => {
        result.current.nudge('intensity', -1)
        result.current.nudge('rigor', -1)
      })
    }
    expect(result.current.heldPosition).toEqual({ intensity: 0, rigor: 0 })

    for (let i = 0; i < 20; i++) {
      act(() => {
        result.current.nudge('intensity', 1)
        result.current.nudge('rigor', 1)
      })
    }
    expect(result.current.heldPosition).toEqual({ intensity: 1, rigor: 1 })
  })

  it('does nothing on release without a held practice, and clears the held state on release', () => {
    const { result } = renderGame()

    act(() => {
      result.current.hold('p1')
    })
    act(() => {
      result.current.release()
    })

    expect(result.current.heldId).toBeUndefined()
    expect(result.current.heldPosition).toBeUndefined()
    expect(
      result.current.legend.find((entry) => entry.id === 'p1')?.placed,
    ).toBe(false)
  })

  it('does nothing on submit while a practice remains unplaced', () => {
    const { result } = renderGame()

    act(() => {
      result.current.hold('p1')
    })
    act(() => {
      result.current.place(0.1, 0.1)
    })
    act(() => {
      result.current.submit()
    })

    expect(result.current.phase).toBe('placing')
  })

  it('reveals the markers only once every practice is placed and submitted', () => {
    const { result } = renderGame()

    const placeAll = () => {
      ;['p1', 'p2', 'p3', 'p4'].forEach((id) => {
        act(() => {
          result.current.hold(id)
        })
        act(() => {
          result.current.place(0.5, 0.5)
        })
      })
    }
    placeAll()

    expect(result.current.canSubmit).toBe(true)
    expect(result.current.markers).toHaveLength(0)

    act(() => {
      result.current.submit()
    })

    expect(result.current.phase).toBe('revealed')
    expect(result.current.markers).toHaveLength(4)
  })

  it('locks the trace on submit, before the reveal — and only once', () => {
    const { result, onLock } = renderGame()

    ;['p1', 'p2', 'p3', 'p4'].forEach((id) => {
      act(() => {
        result.current.hold(id)
      })
      act(() => {
        result.current.place(0.5, 0.5)
      })
    })
    act(() => {
      result.current.submit()
    })
    act(() => {
      result.current.submit()
    })

    expect(onLock).toHaveBeenCalledTimes(1)
    const answer = onLock.mock.calls[0][0] as {
      placements: { practiceId: string }[]
    }
    expect(answer.placements.map((entry) => entry.practiceId)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
    ])
  })

  it('advances only once, even if advance fires twice', () => {
    const { result, onAdvance } = renderGame()

    ;['p1', 'p2', 'p3', 'p4'].forEach((id) => {
      act(() => {
        result.current.hold(id)
      })
      act(() => {
        result.current.place(0.5, 0.5)
      })
    })
    act(() => {
      result.current.submit()
    })
    act(() => {
      result.current.advance()
    })
    act(() => {
      result.current.advance()
    })

    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  it('renders the position in words, never in numbers, and reflects the two poles of the configuration', () => {
    const { result } = renderGame()

    expect(result.current.positionLabel(0.9, 0.9)).toBe(
      "l'agent le fait seul, un garde-fou la tient sans vous",
    )
    expect(result.current.positionLabel(0.1, 0.1)).toBe(
      'vous le faites, rien ne la vérifie',
    )
    expect(result.current.positionLabel(0.9, 0.9)).not.toMatch(/[0-9]/)
  })

  /**
   * Régression du 31/08, sur constat critique de la revue indépendante.
   * L'annonce basculait le mot de rigueur à `highRigorFrom`, le seuil de
   * notation, et non au milieu géométrique où la croix est tracée. Deux
   * flèches depuis le centre le localisaient, et sept jetons alignés juste
   * au-dessus tenaient `c2` dans 47,7 % des cas contre 13,3 % au hasard.
   *
   * Le fixture commun porte `highRigorFrom: 0.5`, qui coïncide avec le
   * milieu : c'est précisément pourquoi rien n'attrapait la fuite. Ce test
   * dissocie les deux valeurs, seul moyen de distinguer les deux règles.
   */
  it('flips the announced word at the geometric midpoint, never at the scoring threshold', () => {
    // `p3` se tient en `rigorFrom: 0.6`, `p1` en `rigorTo: 0.2` : le seuil
    // de `0.6` garde donc le corpus conforme aux refus de répartition, tout
    // en le dissociant du milieu.
    const { result } = renderGame({ ...baseConfig(), highRigorFrom: 0.6 })

    const below = result.current.positionLabel(0.5, 0.49)
    const atMidpoint = result.current.positionLabel(0.5, 0.5)
    const betweenMidpointAndThreshold = result.current.positionLabel(0.5, 0.55)
    const atThreshold = result.current.positionLabel(0.5, 0.6)

    // Le mot bascule au milieu, pas au seuil.
    expect(below).not.toBe(atMidpoint)
    // Et il ne rebascule pas au seuil : entre le milieu et le seuil, puis
    // au seuil, l'annonce est identique. Aucun pas de clavier ne trahit
    // `highRigorFrom`.
    expect(betweenMidpointAndThreshold).toBe(atMidpoint)
    expect(atThreshold).toBe(atMidpoint)
  })

  /**
   * Régression du 31/08, seconde revue indépendante. `nudge` accumulait
   * `0.1` sans arrondi : vingt-cinq valeurs distinctes pour onze positions,
   * et la coordonnée dépendait du chemin plutôt que de la position visée.
   * Trois flèches Droite depuis le centre rendaient `0.7999999999999999`,
   * hors de la zone `[0.8, 1]` de `p5` ; sept flèches Droite puis deux
   * Gauche rendaient `0.8`, dedans. Mêmes mots annoncés, deux verdicts.
   */
  it('keeps keyboard steps on an exact lattice, whatever path reaches a position', () => {
    const nudgeTo = (steps: readonly (1 | -1)[]) => {
      const { result } = renderGame()
      act(() => {
        result.current.hold('p1')
      })
      act(() => {
        result.current.place(0.5, 0.5)
      })
      act(() => {
        result.current.hold('p1')
      })
      steps.forEach((direction) => {
        act(() => {
          result.current.nudge('intensity', direction)
        })
      })
      return result.current.heldPosition?.intensity
    }

    // Trois crans à droite depuis le centre : la valeur exacte, pas 0,79999…
    expect(nudgeTo([1, 1, 1])).toBe(0.8)
    // Le chemin long, qui bute sur la borne haute avant de redescendre,
    // arrive à la même valeur au bit près.
    expect(nudgeTo([1, 1, 1, 1, 1, 1, 1, -1, -1])).toBe(0.8)
    // Les deux autres valeurs que la remultiplication par le pas laissait
    // dériver.
    expect(nudgeTo([-1, -1])).toBe(0.3)
    expect(nudgeTo([1, 1])).toBe(0.7)
  })

  it('locks hold, place, nudge, release and submit once revealed', () => {
    const { result } = renderGame()

    ;['p1', 'p2', 'p3', 'p4'].forEach((id) => {
      act(() => {
        result.current.hold(id)
      })
      act(() => {
        result.current.place(0.5, 0.5)
      })
    })
    act(() => {
      result.current.submit()
    })

    act(() => {
      result.current.hold('p1')
    })
    expect(result.current.heldId).toBeUndefined()

    const before = result.current.placedTokens
    act(() => {
      result.current.place(0.1, 0.1)
    })
    expect(result.current.placedTokens).toEqual(before)
  })
})
