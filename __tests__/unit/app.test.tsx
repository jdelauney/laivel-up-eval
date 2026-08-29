import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../src/App'
import type { GameSessionFacade } from '../../src/core/session/game-session.facade'
import { SessionProvider } from '../../src/providers/session-context'
import { useSessionStore } from '../../src/store/session.store'
import { buildTestFacade } from '../fixtures/configuration'

const renderApp = (facade: GameSessionFacade) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider composition={{ status: 'ready', facade }}>
      {children}
    </SessionProvider>
  )

  return render(<App />, { wrapper })
}

/** Une partie ouverte sous une identité, posée dans le store comme l'accueil le fait. */
const openRun = (): GameSessionFacade => {
  const facade = buildTestFacade()
  facade.start('Alice', 'alice/atelier')
  useSessionStore
    .getState()
    .openCourse(
      { playerName: 'Alice', repository: 'alice/atelier' },
      facade.getProgress(),
    )
  return facade
}

describe('app header across the run', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  it('keeps the entered identity readable during the course', () => {
    renderApp(openRun())

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('alice/atelier')).toBeInTheDocument()
  })

  it('keeps it readable on the verdict screen', () => {
    const facade = openRun()
    facade.submitAnswer({ selected: ['p1', 'p3'] })
    facade.nextGame()
    useSessionStore.getState().showSummary()

    renderApp(facade)

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('alice/atelier')).toBeInTheDocument()
    expect(screen.getByText('parcours terminé')).toBeInTheDocument()
  })

  it('shows nothing on the onboarding screen, where nothing was entered yet', () => {
    renderApp(buildTestFacade())

    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /commencer/i })).toBeVisible()
  })

  it('shows nothing when the configuration was refused', () => {
    useSessionStore.getState().openCourse(
      { playerName: 'Alice', repository: 'alice/atelier' },
      {
        group: undefined,
        game: undefined,
        submitted: 0,
        total: 0,
        finished: false,
      },
    )

    render(
      <SessionProvider
        composition={{
          status: 'invalid-config',
          field: 'groups',
          message: 'parcours refusé',
        }}
      >
        <App />
      </SessionProvider>,
    )

    expect(screen.queryByText('Alice')).not.toBeInTheDocument()
    expect(screen.getByText('configuration refusée')).toBeInTheDocument()
  })
})
