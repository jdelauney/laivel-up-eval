import { fireEvent, render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import { PracticeMapGame } from '@/games/practice-map/components/composites/practice-map-game'

/**
 * Vérification de rendu réel, en Testing Library plutôt qu'en navigateur,
 * sur le modèle de `hint-budget-game.test.tsx`.
 *
 * jsdom ne met jamais en page : `getBoundingClientRect` y rend toujours un
 * rectangle nul. Le plan s'appuie dessus pour convertir un clic en
 * coordonnée `[0,1]` — un geste bien réel en navigateur — donc le
 * rectangle est fixé ici une fois pour toutes.
 */
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => {},
  } as DOMRect)
})

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
  label: string,
  expected: ReturnType<typeof zone>,
) => ({
  id,
  label,
  expected,
  marker: `Repère de ${id}, une phrase qui explique ce qu'elle demande réellement.`,
})

const config = {
  statement:
    "Chaque pratique se pose n'importe où sur le plan, sans case prédéfinie. Rien n'est déclaratif : la lecture se verrouille à la soumission.",
  highRigorFrom: 0.5,
  poles: poles(),
  practices: [
    practice('p1', 'Relancer le même prompt', zone(0, 0.2, 0, 0.2)),
    practice('p2', 'Relire chaque diff', zone(0.3, 0.5, 0.3, 0.5)),
    practice('p3', 'Brancher une boucle qui relance', zone(0.6, 0.8, 0.6, 0.8)),
    practice('p4', 'Écrire le fichier de contexte', zone(0.8, 1, 0, 0.15)),
  ],
  orderings: [
    { id: 'o1', axis: 'rigor', higherId: 'p3', lowerId: 'p1' },
    { id: 'o2', axis: 'rigor', higherId: 'p2', lowerId: 'p1' },
    { id: 'o3', axis: 'intensity', higherId: 'p4', lowerId: 'p1' },
  ],
}

describe('practice map game, rendered', () => {
  it('opens with every practice in the reserve, and the submit action unavailable', () => {
    render(<PracticeMapGame config={config} onSubmit={vi.fn()} />)

    config.practices.forEach((entry) => {
      expect(screen.getByText(entry.label)).toBeInTheDocument()
    })
    expect(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    ).toBeDisabled()
  })

  it('carries a token from the reserve onto the plane, at a clicked point, and shrinks the reserve', () => {
    render(<PracticeMapGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('button', { name: config.practices[0].label }),
    )
    const plane = screen.getByRole('application', {
      name: /le plan des pratiques/i,
    })
    fireEvent.click(plane, { clientX: 10, clientY: 10 })

    expect(screen.getByText(/il reste 3 pratique/i)).toBeInTheDocument()
  })

  it('makes the submit action available once every practice is placed', () => {
    render(<PracticeMapGame config={config} onSubmit={vi.fn()} />)

    const plane = screen.getByRole('application', {
      name: /le plan des pratiques/i,
    })
    config.practices.forEach((entry) => {
      fireEvent.click(screen.getByRole('button', { name: entry.label }))
      fireEvent.click(plane, { clientX: 10, clientY: 10 })
    })

    expect(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    ).toBeEnabled()
  })

  it('reveals a marker per practice, never the expected zone or a placement verdict', () => {
    render(<PracticeMapGame config={config} onSubmit={vi.fn()} />)

    const plane = screen.getByRole('application', {
      name: /le plan des pratiques/i,
    })
    config.practices.forEach((entry) => {
      fireEvent.click(screen.getByRole('button', { name: entry.label }))
      fireEvent.click(plane, { clientX: 10, clientY: 10 })
    })
    fireEvent.click(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    )

    config.practices.forEach((entry) => {
      expect(screen.getByText(entry.marker)).toBeInTheDocument()
    })
    const visible = document.body.textContent ?? ''
    expect(visible).not.toMatch(/zone attendue|dans sa zone|hors zone/i)
  })

  it('submits a trace of four placements only once, even if continue fires twice', () => {
    const onSubmit = vi.fn()
    render(<PracticeMapGame config={config} onSubmit={onSubmit} />)

    const plane = screen.getByRole('application', {
      name: /le plan des pratiques/i,
    })
    config.practices.forEach((entry) => {
      fireEvent.click(screen.getByRole('button', { name: entry.label }))
      fireEvent.click(plane, { clientX: 10, clientY: 10 })
    })
    fireEvent.click(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    )
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }))
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const answer = onSubmit.mock.calls[0][0] as {
      placements: { practiceId: string }[]
    }
    expect(answer.placements.map((entry) => entry.practiceId)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
    ])
  })

  /**
   * Le parcours au clavier seul : saisir un jeton (activation native d'un
   * bouton, équivalente à Entrée/Espace en conditions réelles), le déplacer
   * aux flèches — gérées par le gestionnaire propre du plan, indépendant de
   * tout comportement natif — et le déposer à Entrée. La position atteinte
   * est annoncée en mots dans la région `aria-live`.
   */
  it('records a placement and announces the position in words through the keyboard-only path', () => {
    render(<PracticeMapGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('button', { name: config.practices[0].label }),
    )
    const plane = screen.getByRole('application', {
      name: /le plan des pratiques/i,
    })

    fireEvent.keyDown(plane, { key: 'ArrowRight' })
    fireEvent.keyDown(plane, { key: 'ArrowUp' })
    fireEvent.keyDown(plane, { key: 'Enter' })

    expect(screen.getByText(/il reste 3 pratique/i)).toBeInTheDocument()
  })

  it('announces the candidate position in words, never in numbers, while a token is held and nudged', () => {
    render(<PracticeMapGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('button', { name: config.practices[0].label }),
    )
    const plane = screen.getByRole('application', {
      name: /le plan des pratiques/i,
    })

    fireEvent.keyDown(plane, { key: 'ArrowRight' })
    fireEvent.keyDown(plane, { key: 'ArrowRight' })
    fireEvent.keyDown(plane, { key: 'ArrowUp' })
    fireEvent.keyDown(plane, { key: 'ArrowUp' })

    // La région d'annonce est le premier `aria-live` du document : celui de
    // la réserve, plus loin dans l'arbre, en porte un second.
    const [announcement] = document.querySelectorAll('[aria-live="polite"]')
    expect(announcement.textContent).toContain(',')
    expect(announcement.textContent).not.toMatch(/[0-9]/)
  })

  it('releases the held token on Escape, without recording a placement', () => {
    render(<PracticeMapGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('button', { name: config.practices[0].label }),
    )
    const plane = screen.getByRole('application', {
      name: /le plan des pratiques/i,
    })
    fireEvent.keyDown(plane, { key: 'ArrowRight' })
    fireEvent.keyDown(plane, { key: 'Escape' })

    expect(screen.getByText(/il reste 4 pratique/i)).toBeInTheDocument()
  })

  it('replaces the placement when picking up an already-placed token and moving it elsewhere, with no duplicate', () => {
    const onSubmit = vi.fn()
    render(<PracticeMapGame config={config} onSubmit={onSubmit} />)

    const plane = screen.getByRole('application', {
      name: /le plan des pratiques/i,
    })
    config.practices.forEach((entry) => {
      fireEvent.click(screen.getByRole('button', { name: entry.label }))
      fireEvent.click(plane, { clientX: 10, clientY: 10 })
    })

    // Reprend le premier jeton déjà posé, sur le plan cette fois, et le
    // déplace ailleurs.
    fireEvent.click(
      screen.getByRole('button', { name: config.practices[0].label }),
    )
    fireEvent.click(plane, { clientX: 200, clientY: 20 })

    fireEvent.click(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    )

    const answer = (() => {
      fireEvent.click(screen.getByRole('button', { name: /continuer/i }))
      return onSubmit.mock.calls[0][0] as {
        placements: { practiceId: string }[]
      }
    })()

    const practiceIds = answer.placements.map((entry) => entry.practiceId)
    expect(practiceIds).toEqual(['p1', 'p2', 'p3', 'p4'])
    expect(new Set(practiceIds).size).toBe(practiceIds.length)
  })

  it('never renders a quadrant line: the plane carries no dividing rule element', () => {
    const { container } = render(
      <PracticeMapGame config={config} onSubmit={vi.fn()} />,
    )

    const plane = screen.getByRole('application', {
      name: /le plan des pratiques/i,
    })
    // Le plan lui-même ne porte qu'un seul enfant direct par jeton posé,
    // jamais un élément de séparation supplémentaire au repos.
    expect(plane.children).toHaveLength(0)
    expect(container.querySelectorAll('hr')).toHaveLength(0)
  })
})
