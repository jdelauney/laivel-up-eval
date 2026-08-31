import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../../src/App'
import type { GameSessionFacade } from '../../src/core/session/game-session.facade'
import { SessionProvider } from '../../src/providers/session-context'
import { useSessionStore } from '../../src/store/session.store'
import { buildTestFacade } from '../fixtures/configuration'
import { MemoryPersistence } from '../fixtures/memory-persistence'

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

  it('shows no abandon action on the onboarding screen', () => {
    renderApp(buildTestFacade())

    expect(
      screen.queryByRole('button', { name: /abandonner cette partie/i }),
    ).not.toBeInTheDocument()
  })

  it('shows the abandon action during the course', () => {
    renderApp(openRun())

    expect(
      screen.getByRole('button', { name: /abandonner cette partie/i }),
    ).toBeInTheDocument()
  })

  it('shows the abandon action on the verdict screen, worded for a verdict', () => {
    const facade = openRun()
    facade.submitAnswer({ selected: ['p1', 'p3'] })
    facade.nextGame()
    useSessionStore.getState().showSummary()

    renderApp(facade)

    expect(
      screen.getByRole('button', { name: /effacer ce verdict/i }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /abandonner cette partie/i }),
    ).not.toBeInTheDocument()
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

/**
 * L'aiguillage part désormais d'un instantané persisté, pas seulement d'un
 * store déjà rempli à la main : une application montée sur une persistance
 * réelle doit se retrouver au bon écran sans qu'aucun clic n'ait eu lieu.
 */
describe('app routing from a persisted snapshot', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  it('opens the course at the game following the last submission, on mount alone', () => {
    const persistence = new MemoryPersistence()
    const played = buildTestFacade(persistence)
    played.start('Alice', 'alice/atelier')
    played.submitAnswer({ selected: ['p1', 'p3'] })

    renderApp(buildTestFacade(persistence))

    expect(screen.getByText('Alice')).toBeInTheDocument()
    expect(screen.getByText('1/1 situations')).toBeInTheDocument()
  })

  it('shows the verdict for a snapshot whose situations are all submitted', () => {
    const persistence = new MemoryPersistence()
    const played = buildTestFacade(persistence)
    played.start('Alice')
    played.submitAnswer({ selected: ['p1', 'p3'] })
    played.nextGame()

    renderApp(buildTestFacade(persistence))

    expect(screen.getByText('parcours terminé')).toBeInTheDocument()
  })

  it('shows the onboarding screen on an empty persistence', () => {
    renderApp(buildTestFacade(new MemoryPersistence()))

    expect(screen.getByRole('button', { name: /commencer/i })).toBeVisible()
  })

  it('shows the onboarding screen, without throwing, on a snapshot outside its contract', () => {
    const persistence = new MemoryPersistence()
    persistence.write({ not: 'a session snapshot' })

    expect(() => renderApp(buildTestFacade(persistence))).not.toThrow()
    expect(screen.getByRole('button', { name: /commencer/i })).toBeVisible()
  })
})
