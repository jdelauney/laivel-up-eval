import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ConfidenceBetGame } from '@/games/confidence-bet/components/composites/confidence-bet-game'

/**
 * Vérification de rendu réel, en Testing Library plutôt qu'en navigateur : la
 * stratégie de test du projet range déjà les écrans dans le périmètre Vitest
 * unit, sur le modèle de `three-tracks-game.test.tsx`.
 */

const config = {
  statement: 'Vous jugez trois extraits. Consigne de test.',
  stakes: [10, 30, 50, 70, 90],
  neutralStake: 50,
  startingCapital: 100,
  snippets: [
    {
      id: 's1',
      label: 'Premier extrait',
      language: 'ts',
      code: 'const a = 1',
      nature: 'sound',
      reveal: 'Ce code est fiable, la dépendance existe.',
    },
    {
      id: 'f1',
      label: 'Second extrait',
      language: 'ts',
      code: 'const b = 2',
      nature: 'flawed',
      reveal: 'Ce code est défectueux, la boucle ne se termine jamais.',
    },
    {
      id: 'u1',
      label: 'Troisième extrait',
      language: 'ts',
      code: 'const c = 3',
      nature: 'undecidable',
      reveal: "Rien dans l'extrait ne dit ce que fait `runExternal`.",
    },
  ],
}

const engageStake = (stakeLabel: RegExp): void => {
  fireEvent.click(screen.getByRole('radio', { name: stakeLabel }))
  fireEvent.click(screen.getByRole('button', { name: /engager la mise/i }))
}

describe('confidence bet game, rendered', () => {
  it('opens on the first snippet, with the statement and the stake scale', () => {
    render(
      <ConfidenceBetGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    expect(screen.getByText(config.statement)).toBeInTheDocument()
    expect(screen.getByText(/extrait 1 sur 3/i)).toBeInTheDocument()
    expect(screen.getByText('Premier extrait')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('keeps the engagement disabled until a stake is chosen', () => {
    render(
      <ConfidenceBetGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: /engager la mise/i }),
    ).toBeDisabled()

    fireEvent.click(screen.getByRole('radio', { name: /mise 90/i }))

    expect(
      screen.getByRole('button', { name: /engager la mise/i }),
    ).not.toBeDisabled()
  })

  it('shows no nature, verdict or capital movement before the engagement', () => {
    render(
      <ConfidenceBetGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    expect(screen.queryByText(/code fiable/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/code défectueux/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/indécidable/i)).not.toBeInTheDocument()
  })

  it('removes the stake scale once the bet is engaged, and reveals the nature', () => {
    render(
      <ConfidenceBetGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: /mise 90/i }))
    fireEvent.click(screen.getByRole('button', { name: /engager la mise/i }))

    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
    expect(screen.getByText(/code fiable/i)).toBeInTheDocument()
    expect(
      screen.getByText('Ce code est fiable, la dépendance existe.'),
    ).toBeInTheDocument()
  })

  it('advances to the next snippet on passage, opening its own scale', () => {
    render(
      <ConfidenceBetGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: /mise 90/i }))
    fireEvent.click(screen.getByRole('button', { name: /engager la mise/i }))
    fireEvent.click(screen.getByRole('button', { name: /extrait suivant/i }))

    expect(screen.getByText(/extrait 2 sur 3/i)).toBeInTheDocument()
    expect(screen.getByText('Second extrait')).toBeInTheDocument()
    expect(screen.getByRole('radiogroup')).toBeInTheDocument()
  })

  it('locks the trace on the last snippet engaged, before the passage action is even clicked', () => {
    const onLock = vi.fn()
    render(
      <ConfidenceBetGame config={config} onLock={onLock} onAdvance={vi.fn()} />,
    )

    engageStake(/mise 90/i)
    fireEvent.click(screen.getByRole('button', { name: /extrait suivant/i }))

    engageStake(/mise 10/i)
    fireEvent.click(screen.getByRole('button', { name: /extrait suivant/i }))
    expect(onLock).not.toHaveBeenCalled()

    engageStake(/mise 50/i)

    expect(onLock).toHaveBeenCalledTimes(1)
    const answer = onLock.mock.calls[0][0] as { bets: unknown[] }
    expect(answer.bets).toHaveLength(3)
  })

  it('advances once, on the last snippet, and disappears once complete', () => {
    const onAdvance = vi.fn()
    render(
      <ConfidenceBetGame
        config={config}
        onLock={vi.fn()}
        onAdvance={onAdvance}
      />,
    )

    engageStake(/mise 90/i)
    fireEvent.click(screen.getByRole('button', { name: /extrait suivant/i }))

    engageStake(/mise 10/i)
    fireEvent.click(screen.getByRole('button', { name: /extrait suivant/i }))
    expect(onAdvance).not.toHaveBeenCalled()

    engageStake(/mise 50/i)
    fireEvent.click(screen.getByRole('button', { name: /extrait suivant/i }))

    expect(onAdvance).toHaveBeenCalledTimes(1)
    expect(screen.queryByText(config.statement)).not.toBeInTheDocument()
  })

  it('adds a played snippet to the ledger, mise and movement included, once engaged', () => {
    render(
      <ConfidenceBetGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('radio', { name: /mise 90/i }))
    fireEvent.click(screen.getByRole('button', { name: /engager la mise/i }))

    const ledger = screen.getByRole('list')
    // La règle en réduction est décorative : la mise reste portée en texte,
    // hors écran, pour que la ligne s'annonce entière au lecteur d'écran.
    expect(within(ledger).getByText(/premier extrait/i)).toBeInTheDocument()
    expect(within(ledger).getByText(/mise 90/i)).toBeInTheDocument()
    expect(within(ledger).getByText('+40')).toBeInTheDocument()
  })
})
