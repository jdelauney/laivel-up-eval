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
  statement: 'Vous disposez de deux tours. Consigne de test.',
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

  it('shows the statement above the register, from the first turn', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)

    expect(screen.getByText(config.statement)).toBeInTheDocument()
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

  it('keeps the brief reachable in its own cell, out of the row header name', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)
    const table = screen.getByRole('table')

    const alphaHeader = within(table).getByRole('rowheader', {
      name: /Chantier Alpha/,
    })
    expect(alphaHeader).not.toHaveTextContent('brief alpha')

    expect(
      within(table).getByRole('cell', { name: /brief alpha/i }),
    ).toBeInTheDocument()
    expect(
      within(table).getByRole('cell', { name: /brief beta/i }),
    ).toBeInTheDocument()
  })

  it('offers a zero pastille, never disabled, before anything is placed', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)

    const zero = screen.getByRole('radio', {
      name: /zéro unité sur Chantier Alpha, tour 1/i,
    })
    expect(zero).not.toBeDisabled()
  })

  it('shows the digit of every pastille on screen, zero included', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)

    const zero = screen.getByRole('radio', {
      name: /zéro unité sur Chantier Alpha, tour 1/i,
    })
    const one = screen.getByRole('radio', {
      name: /une unité sur Chantier Alpha, tour 1/i,
    })
    expect(zero).toHaveTextContent('0')
    expect(one).toHaveTextContent('1')
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

describe('three tracks game, the open column names the choice', () => {
  it('shows the turn fraction on the open column header', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)
    const table = screen.getByRole('table')

    const open = within(table).getByRole('columnheader', {
      name: /tour 1 sur 2, en cours/i,
    })
    expect(open).toHaveTextContent('1/2')
    expect(open).toHaveClass('font-semibold')
  })

  /**
   * Verrouille le défaut signalé par le chef de projet : les chiffres
   * `0`, `1`, `2` des pastilles étaient visibles sans que rien ne dise ce
   * qu'ils représentent. Le nom accessible du groupe radio portait déjà
   * « attention » pour un lecteur d'écran ; un joueur voyant n'avait rien
   * d'équivalent avant ce libellé visible sur l'en-tête de la colonne.
   */
  it('names the open column as the attention one, visibly, not only for a screen reader', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)
    const table = screen.getByRole('table')

    const open = within(table).getByRole('columnheader', {
      name: /tour 1 sur 2, en cours/i,
    })
    expect(open).toHaveTextContent(/attention/i)
  })

  it('keeps as many cells per body row as column headers', () => {
    render(<ThreeTracksGame config={config} onSubmit={vi.fn()} />)
    const table = screen.getByRole('table')

    const headerCount = within(table).getAllByRole('columnheader').length
    const firstBodyRow = within(table).getAllByRole('row')[1] as HTMLElement
    const bodyCellCount =
      within(firstBodyRow).getAllByRole('cell').length +
      within(firstBodyRow).getAllByRole('rowheader').length

    expect(bodyCellCount).toBe(headerCount)
  })
})

describe('three tracks game, state legibility without color', () => {
  /** Un plafond agressif : un chantier neuf dérive puis meurt en deux tours. */
  const stateConfig = {
    statement: 'Consigne de test.',
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

  it('marks a neglected row DÉRIVE, visible without relying on color', () => {
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
    expect(alphaRow).toHaveClass('border-dashed')
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

  it('never repeats a screen-reader phrase across the barred cells of a lost row', () => {
    render(<ThreeTracksGame config={stateConfig} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))
    fireEvent.click(screen.getByRole('button', { name: /clore le tour/i }))

    const alphaRow = screen
      .getByRole('rowheader', { name: /Chantier Alpha/ })
      .closest('tr') as HTMLElement

    expect(within(alphaRow).queryByText(/hors jeu/i)).not.toBeInTheDocument()
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
