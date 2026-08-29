import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AppLayout } from '../../../../src/components/layout/app-layout/app-layout'

describe('app layout header', () => {
  it('shows the player name and the designated repository', () => {
    render(
      <AppLayout
        status="2/12 situations"
        identity={{ playerName: 'Alice', repository: 'alice/atelier' }}
      >
        <p>corps</p>
      </AppLayout>,
    )

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('alice/atelier')).toBeInTheDocument()
    expect(screen.getByText('2/12 situations')).toBeInTheDocument()
  })

  it('leaves no orphan separator when no repository was designated', () => {
    render(
      <AppLayout status="2/12 situations" identity={{ playerName: 'Alice' }}>
        <p>corps</p>
      </AppLayout>,
    )

    expect(screen.getByText('Alice').closest('p')).toHaveTextContent(/^Alice$/)
  })

  it('shows no identity on a screen that has none', () => {
    render(
      <AppLayout>
        <p>corps</p>
      </AppLayout>,
    )

    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    expect(screen.getByText(/laivel/)).toBeInTheDocument()
  })

  /**
   * jsdom ne met rien en page : la tenue sur une seule bande ne s'observe pas,
   * seule sa mécanique se vérifie — l'identité se tronque, l'avancement garde
   * sa boîte et ne se fait donc pas pousser hors de l'écran.
   */
  it('truncates a long identity rather than pushing the progress out', () => {
    render(
      <AppLayout
        status="2/12 situations"
        identity={{
          playerName: 'A'.repeat(40),
          repository: 'une-organisation-au-nom-tres-long/un-depot-au-nom-long',
        }}
      >
        <p>corps</p>
      </AppLayout>,
    )

    expect(screen.getByText('A'.repeat(40)).closest('p')).toHaveClass(
      'truncate',
    )
    expect(screen.getByText('2/12 situations')).toHaveClass('shrink-0')
  })
})
