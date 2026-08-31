import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useFlowOrder } from '@/games/flow-order/hooks/use-flow-order.hook'

const step = (id: string, rank: number) => ({
  id,
  label: `Libellé de ${id}.`,
  rank,
  note: `Ce qu'apporte ${id}.`,
})

const baseConfig = () => ({
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

const renderGame = (
  config: unknown = baseConfig(),
  onLock = vi.fn(),
  onAdvance = vi.fn(),
) => ({
  onLock,
  onAdvance,
  ...renderHook(() => useFlowOrder(config, onLock, onAdvance)),
})

describe('use flow order', () => {
  it("opens on the corpus's initial order, ordering phase, no announcement yet", () => {
    const { result } = renderGame()

    expect(result.current.phase).toBe('ordering')
    expect(result.current.steps.map((entry) => entry.id)).toEqual([
      's3',
      's1',
      's6',
      's2',
      's5',
      's4',
    ])
    expect(result.current.steps.map((entry) => entry.position)).toEqual([
      1, 2, 3, 4, 5, 6,
    ])
    expect(result.current.announcement).toBe('')
  })

  it('never exposes rank or note before the revelation', () => {
    const { result } = renderGame()

    const serializeVisible = () =>
      JSON.stringify(
        Object.fromEntries(
          Object.entries(result.current).filter(
            ([, value]) => typeof value !== 'function',
          ),
        ),
      )

    expect(serializeVisible()).not.toContain('rank')
    expect(serializeVisible()).not.toContain("Ce qu'apporte")

    act(() => {
      result.current.move('s3', 1)
    })

    expect(serializeVisible()).not.toContain('rank')
    expect(serializeVisible()).not.toContain("Ce qu'apporte")
  })

  it('moves a step down one notch, swapping it with its neighbour', () => {
    const { result } = renderGame()

    act(() => {
      result.current.move('s3', 1)
    })

    expect(result.current.steps.map((entry) => entry.id)).toEqual([
      's1',
      's3',
      's6',
      's2',
      's5',
      's4',
    ])
    expect(result.current.announcement).toBe('étape 2 sur 6')
  })

  it('moves a step up one notch', () => {
    const { result } = renderGame()

    act(() => {
      result.current.move('s6', -1)
    })

    expect(result.current.steps.map((entry) => entry.id)).toEqual([
      's3',
      's6',
      's1',
      's2',
      's5',
      's4',
    ])
    expect(result.current.announcement).toBe('étape 2 sur 6')
  })

  it('does nothing when moving the first step further up, or the last step further down', () => {
    const { result } = renderGame()

    act(() => {
      result.current.move('s3', -1)
    })
    expect(result.current.steps.map((entry) => entry.id)).toEqual([
      's3',
      's1',
      's6',
      's2',
      's5',
      's4',
    ])

    act(() => {
      result.current.move('s4', 1)
    })
    expect(result.current.steps.map((entry) => entry.id)).toEqual([
      's3',
      's1',
      's6',
      's2',
      's5',
      's4',
    ])
  })

  it('grabs a step on the first activation, drops it before the target on the second', () => {
    const { result } = renderGame()

    act(() => {
      result.current.activate('s4')
    })
    expect(result.current.heldId).toBe('s4')

    act(() => {
      result.current.activate('s1')
    })

    expect(result.current.heldId).toBeUndefined()
    expect(result.current.steps.map((entry) => entry.id)).toEqual([
      's3',
      's4',
      's1',
      's6',
      's2',
      's5',
    ])
    expect(result.current.announcement).toBe('étape 2 sur 6')
  })

  it('releases a grabbed step when activated a second time on itself', () => {
    const { result } = renderGame()

    act(() => {
      result.current.activate('s4')
    })
    act(() => {
      result.current.activate('s4')
    })

    expect(result.current.heldId).toBeUndefined()
    expect(result.current.steps.map((entry) => entry.id)).toEqual([
      's3',
      's1',
      's6',
      's2',
      's5',
      's4',
    ])
  })

  it('releases a grabbed step through release(), without moving it', () => {
    const { result } = renderGame()

    act(() => {
      result.current.activate('s4')
    })
    act(() => {
      result.current.release()
    })

    expect(result.current.heldId).toBeUndefined()
    expect(result.current.steps.map((entry) => entry.id)).toEqual([
      's3',
      's1',
      's6',
      's2',
      's5',
      's4',
    ])
  })

  it('a step moved by keyboard releases its pointer grab, so a later click holds the target instead of teleporting the stale grab', () => {
    const { result } = renderGame()

    act(() => {
      result.current.activate('s1')
    })
    expect(result.current.heldId).toBe('s1')

    act(() => {
      result.current.move('s1', 1)
    })
    // Le clavier prend la main : la saisie au pointeur n'a plus cours,
    // sans quoi le clic suivant serait lu comme un dépôt.
    expect(result.current.heldId).toBeUndefined()
    expect(result.current.steps.map((entry) => entry.id)).toEqual([
      's3',
      's6',
      's1',
      's2',
      's5',
      's4',
    ])

    act(() => {
      result.current.activate('s2')
    })

    // s2 est saisie à son tour ; s1 n'a pas été téléportée à son contact.
    expect(result.current.heldId).toBe('s2')
    expect(result.current.steps.map((entry) => entry.id)).toEqual([
      's3',
      's6',
      's1',
      's2',
      's5',
      's4',
    ])
  })

  it('reveals the steps in expected order only once submitted', () => {
    const { result } = renderGame()

    expect(result.current.revelations).toHaveLength(0)

    act(() => {
      result.current.submit()
    })

    expect(result.current.phase).toBe('revealed')
    expect(result.current.revelations.map((entry) => entry.id)).toEqual([
      's1',
      's2',
      's3',
      's4',
      's5',
      's6',
    ])
  })

  it('locks the played order, not the expected one, before the reveal — and only once', () => {
    const { result, onLock } = renderGame()

    act(() => {
      result.current.move('s3', 1)
    })
    act(() => {
      result.current.submit()
    })
    act(() => {
      result.current.submit()
    })

    expect(onLock).toHaveBeenCalledTimes(1)
    const answer = onLock.mock.calls[0][0] as { orderedIds: string[] }
    expect(answer.orderedIds).toEqual(['s1', 's3', 's6', 's2', 's5', 's4'])
  })

  it('advances only once, even if advance fires twice', () => {
    const { result, onAdvance } = renderGame()

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

  it('locks activate and move once revealed', () => {
    const { result } = renderGame()

    act(() => {
      result.current.submit()
    })
    act(() => {
      result.current.move('s3', 1)
    })
    act(() => {
      result.current.activate('s3')
    })

    expect(result.current.steps.map((entry) => entry.id)).toEqual([
      's3',
      's1',
      's6',
      's2',
      's5',
      's4',
    ])
  })
})

/**
 * Le pointeur déposait « juste avant » la carte visée, donc jamais après la
 * dernière : la queue de la frise était structurellement hors d'atteinte au
 * pointeur, pour toute carte. Ce test ne relit pas le code, il fait rejouer
 * les deux chemins d'entrée par la même API publique du hook et compare
 * l'état obtenu, position par position, y compris la dernière — la
 * régression que ce constat corrige.
 */
describe('pointer and keyboard reach the same positions', () => {
  it('lets every step reach every position — the last included — through either input path, with an identical resulting order', () => {
    const order = baseConfig().initialOrder
    const stepCount = order.length

    for (const movingId of order) {
      for (
        let targetPosition = 1;
        targetPosition <= stepCount;
        targetPosition++
      ) {
        // Chemin clavier : `move` pas à pas jusqu'à la position visée.
        const keyboard = renderGame()
        const positionOf = (stepId: string) =>
          keyboard.result.current.steps.find((entry) => entry.id === stepId)
            ?.position

        let guard = 0
        while (positionOf(movingId) !== targetPosition) {
          guard += 1
          if (guard > stepCount) {
            throw new Error('le chemin clavier ne converge pas')
          }
          const current = positionOf(movingId)
          if (current === undefined) {
            throw new Error(`l'étape « ${movingId} » est introuvable`)
          }
          const direction = current < targetPosition ? 1 : -1
          act(() => {
            keyboard.result.current.move(movingId, direction)
          })
        }
        const keyboardOrder = keyboard.result.current.steps.map(
          (entry) => entry.id,
        )

        // Chemin pointeur : saisir la carte, puis déposer au contact de la
        // carte qui occupe déjà la position visée avant tout geste — le
        // hook choisit lui-même le côté du dépôt selon le sens du geste.
        const pointer = renderGame()
        const startPosition = pointer.result.current.steps.find(
          (entry) => entry.id === movingId,
        )?.position
        if (startPosition === targetPosition) {
          // Rien à jouer : les deux chemins partent déjà de cet état.
          expect(pointer.result.current.steps.map((entry) => entry.id)).toEqual(
            keyboardOrder,
          )
          continue
        }

        const targetStepId = pointer.result.current.steps.find(
          (entry) => entry.position === targetPosition,
        )?.id
        if (targetStepId === undefined) {
          throw new Error(`aucune carte à la position ${targetPosition}`)
        }

        act(() => {
          pointer.result.current.activate(movingId)
        })
        act(() => {
          pointer.result.current.activate(targetStepId)
        })

        expect(pointer.result.current.steps.map((entry) => entry.id)).toEqual(
          keyboardOrder,
        )
      }
    }
  })
})
