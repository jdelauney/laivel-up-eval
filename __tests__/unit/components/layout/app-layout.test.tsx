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
   * La tenue de l'en-tête sur une seule bande avec un pseudo long ne s'observe
   * pas sous jsdom, qui ne met rien en page. Elle appartient au QA navigateur ;
   * l'assiéger sur des noms de classes Tailwind ne prouvait que le mécanisme.
   */
  it('shows a long identity without losing the progress', () => {
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

    expect(screen.getByText('A'.repeat(40))).toBeInTheDocument()
    expect(screen.getByText('2/12 situations')).toBeInTheDocument()
  })
})
