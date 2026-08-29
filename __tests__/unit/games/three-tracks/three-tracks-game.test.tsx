import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ThreeTracksGame } from '@/games/three-tracks/components/composites/three-tracks-game'

/**
 * Vérification de rendu réel, en Testing Library plutôt qu'en navigateur : le
 * jeu n'est pas encore câblé dans `config/course.json` (phase 4), et aucun
 * outil de capture de navigateur n'est disponible dans cet environnement. La
 * stratégie de test du projet range déjà les écrans dans le périmètre Vitest
 * unit — ce harnais rend donc le composite tel qu'il sera monté, sans détour
 * par un harnais de rendu jetable.
 */

const config = {
  turns: 2,
  attentionPerTurn: 2,
  maxPerTrack: 1,
  driftAfter: 3,
  diesAfter: 4,
  tracks: [
    { id: 'alpha', label: 'Chantier Alpha', brief: 'brief alpha', work: 5 },
    { id: 'beta', label: 'Chantier Beta', brief: 'brief beta', work: 5 },
  ],
}

describe('three tracks game, rendered', () => {
  it('opens on the first turn, with the full attention of the turn to place', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)

    expect(screen.getByText(/tour 1 sur 2/i)).toBeInTheDocument()
    expect(screen.getByText(/2 unités à placer/i)).toBeInTheDocument()
  })

  it('renders the register as a real table, a chantier per row header', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)

    const table = screen.getByRole('table')
    expect(
      within(table).getByRole('rowheader', { name: /Chantier Alpha/ }),
    ).toBeInTheDocument()
    expect(
      within(table).getByRole('rowheader', { name: /Chantier Beta/ }),
    ).toBeInTheDocument()
  })

  it("shows each track's brief in its row header, not just its label", () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)

    const alphaRow = screen.getByRole('rowheader', { name: /Chantier Alpha/ })
    expect(within(alphaRow).getByText('brief alpha')).toBeInTheDocument()

    const betaRow = screen.getByRole('rowheader', { name: /Chantier Beta/ })
    expect(within(betaRow).getByText('brief beta')).toBeInTheDocument()
  })

  it('offers a zero pastille, never disabled, before anything is placed', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)

    const zero = screen.getByRole('radio', {
      name: /zéro unité sur Chantier Alpha, tour 1/i,
    })
    expect(zero).not.toBeDisabled()
  })

  it('never disables the close-turn action, even at zero units placed', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)

    expect(
      screen.getByRole('button', { name: /clore le tour/i }),
    ).not.toBeDisabled()
  })

  it('updates the remaining attention when a pastille is selected', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('radio', {
        name: /une unité sur Chantier Alpha, tour 1/i,
      }),
    )

    expect(screen.getByText(/1 unité à placer/i)).toBeInTheDocument()
  })

  it('advances to the next turn on close, and loses attention left unplaced', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('radio', {
        name: /une unité sur Chantier Alpha, tour 1/i,
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))

    expect(screen.getByText(/tour 2 sur 2/i)).toBeInTheDocument()
    expect(screen.getByText(/2 unités à placer/i)).toBeInTheDocument()
  })

  it('submits once, on the last turn, and disappears once complete', () => {
    const onSubmit = vi.fn()
    render(<ThreeTracksGame config={config} onSubmit={onSubmit} />)

    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))
    expect(onSubmit).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const answer = onSubmit.mock.calls[0][0] as { turns: unknown[] }
    expect(answer.turns).toHaveLength(2)
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})

describe('three tracks game, state legibility without color', () => {
  /** Un plafond agressif : un chantier neuf dérive puis meurt en deux tours. */
  const stateConfig = {
    turns: 3,
    attentionPerTurn: 2,
    maxPerTrack: 2,
    driftAfter: 1,
    diesAfter: 2,
    tracks: [
      { id: 'alpha', label: 'Chantier Alpha', brief: 'brief alpha', work: 10 },
      { id: 'beta', label: 'Chantier Beta', brief: 'brief beta', work: 2 },
    ],
  }

  it('marks a neglected row DÉRIVE and shows a point for its idle turn', () => {
    render(<ThreeTracksGame config={stateConfig} onSubmit={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('radio', {
        name: /2 unités sur Chantier Beta, tour 1/i,
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))

    const alphaRow = screen
      .getByRole('rowheader', {
        name: /Chantier Alpha/,
      })
      .closest('tr')
    expect(alphaRow).not.toBeNull()
    expect(within(alphaRow as HTMLElement).getByText('DÉRIVE')).toBeVisible()
    expect(
      within(alphaRow as HTMLElement).getAllByText('·').length,
    ).toBeGreaterThan(0)
  })

  it('marks a merged row MERGÉ and offers no selector on its row', () => {
    render(<ThreeTracksGame config={stateConfig} onSubmit={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('radio', {
        name: /2 unités sur Chantier Beta, tour 1/i,
      }),
    )
    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))

    const betaRow = screen
      .getByRole('rowheader', {
        name: /Chantier Beta/,
      })
      .closest('tr')
    expect(betaRow).not.toBeNull()
    expect(within(betaRow as HTMLElement).getByText('MERGÉ')).toBeVisible()
    expect(within(betaRow as HTMLElement).queryAllByRole('radio')).toHaveLength(
      0,
    )
  })

  it('marks a track lost in --missed after it starves past the death threshold', () => {
    render(<ThreeTracksGame config={stateConfig} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))
    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))

    const alphaRow = screen
      .getByRole('rowheader', {
        name: /Chantier Alpha/,
      })
      .closest('tr')
    expect(alphaRow).not.toBeNull()
    const mention = within(alphaRow as HTMLElement).getByText('PERDU')
    expect(mention).toHaveClass('text-missed')
  })

  it('says no unit can be placed once every track is merged or lost', () => {
    render(<ThreeTracksGame config={stateConfig} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))
    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))

    expect(
      screen.getByText(/aucune unité ne peut être placée/i),
    ).toBeInTheDocument()
    expect(screen.queryByText(/unités? à placer/i)).not.toBeInTheDocument()
  })

  it('keeps a border on a lost row instead of leaving it bare', () => {
    render(<ThreeTracksGame config={stateConfig} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))
    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))

    const alphaRow = screen
      .getByRole('rowheader', { name: /Chantier Alpha/ })
      .closest('tr')
    expect(alphaRow).not.toBeNull()
    expect(alphaRow).toHaveClass('border-b-2')
    expect((alphaRow as HTMLElement).className.trim()).not.toBe('')
  })
})
