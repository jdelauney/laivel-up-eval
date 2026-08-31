import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ThreeTracksGame } from '@/games/three-tracks/components/composites/three-tracks-game'

/**
 * Verrouille la structure mobile du registre : sous `md`, le tableau à quatre
 * colonnes cède la place à une liste de blocs empilés, jamais les deux à la
 * fois. `useIsNarrowViewport` lit `window.innerWidth`, pas `matchMedia` —
 * absent de jsdom — donc chaque test fixe la largeur avant le rendu et la
 * restaure après, pour ne pas faire fuir un gabarit mobile dans un test
 * voisin qui n'en demande pas.
 */

const NARROW_WIDTH = 390
const WIDE_WIDTH = 1440

const setViewportWidth = (width: number): void => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
}

const config = {
  statement: 'Vous disposez de deux tours. Consigne de test.',
  turns: 2,
  attentionPerTurn: 2,
  maxPerTrack: 1,
  driftAfter: 3,
  diesAfter: 4,
  tracks: [
    {
      id: 'alpha',
      label: 'La migration de la base',
      brief: 'brief alpha, plus long que le libellé lui-même',
      work: 5,
    },
    { id: 'beta', label: 'Chantier Beta', brief: 'brief beta', work: 5 },
  ],
}

describe('three tracks register, narrow viewport', () => {
  beforeEach(() => setViewportWidth(NARROW_WIDTH))
  afterEach(() => setViewportWidth(WIDE_WIDTH))

  it('renders a list of blocks instead of a table, under md', () => {
    render(
      <ThreeTracksGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    const list = screen.getByRole('list', {
      name: /registre de bord des chantiers/i,
    })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
  })

  it('keeps the brief out of the first block accessible name', () => {
    render(
      <ThreeTracksGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    const list = screen.getByRole('list', {
      name: /registre de bord des chantiers/i,
    })
    const [firstBlock] = within(list).getAllByRole('listitem')

    expect(firstBlock).toHaveAccessibleName('La migration de la base')
    expect(firstBlock).not.toHaveAccessibleName(
      /brief alpha, plus long que le libellé/i,
    )
  })

  it('keeps the brief reachable in its own text, inside the block', () => {
    render(
      <ThreeTracksGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    const list = screen.getByRole('list', {
      name: /registre de bord des chantiers/i,
    })
    const [firstBlock] = within(list).getAllByRole('listitem')

    expect(
      within(firstBlock).getByText(/brief alpha, plus long que le libellé/i),
    ).toBeInTheDocument()
  })

  it('shows the current turn and what the pastilles mean, per block', () => {
    render(
      <ThreeTracksGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    const list = screen.getByRole('list', {
      name: /registre de bord des chantiers/i,
    })
    const [firstBlock] = within(list).getAllByRole('listitem')

    expect(firstBlock).toHaveTextContent('1/2')
    expect(firstBlock).toHaveTextContent(/attention/i)
  })

  it('offers the same zero-to-plafond pastilles as the table, in the block', () => {
    render(
      <ThreeTracksGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    const zero = screen.getByRole('radio', {
      name: /zéro unité sur La migration de la base, tour 1/i,
    })
    const one = screen.getByRole('radio', {
      name: /une unité sur La migration de la base, tour 1/i,
    })
    expect(zero).toHaveTextContent('0')
    expect(one).toHaveTextContent('1')
  })

  it('shows the progress gauge inside the block', () => {
    render(
      <ThreeTracksGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    const list = screen.getByRole('list', {
      name: /registre de bord des chantiers/i,
    })
    const [firstBlock] = within(list).getAllByRole('listitem')

    expect(firstBlock).toHaveTextContent('0 / 5')
  })
})

describe('three tracks register, wide viewport', () => {
  beforeEach(() => setViewportWidth(WIDE_WIDTH))

  it('still renders the four-column table, unchanged, at or above md', () => {
    render(
      <ThreeTracksGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })
})
