import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import type { GameSessionFacade } from '../../../../src/core/session/game-session.facade'
import { AbandonRun } from '../../../../src/features/session-restore/components/sections/abandon-run'
import { SessionProvider } from '../../../../src/providers/session-context'
import { useSessionStore } from '../../../../src/store/session.store'
import { buildTestFacade } from '../../../fixtures/configuration'
import { MemoryPersistence } from '../../../fixtures/memory-persistence'

const renderAbandon = (facade: GameSessionFacade) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider composition={{ status: 'ready', facade }}>
      {children}
    </SessionProvider>
  )

  return render(
    <AbandonRun
      triggerLabel="Abandonner cette partie"
      dialogTitle="Abandonner cette partie ?"
      consequence="Rien ne permet de revenir."
    />,
    { wrapper },
  )
}

const openRun = (persistence = new MemoryPersistence()): GameSessionFacade => {
  const facade = buildTestFacade(persistence)
  facade.start('Alice', 'alice/atelier')
  useSessionStore
    .getState()
    .openCourse(
      { playerName: 'Alice', repository: 'alice/atelier' },
      facade.getProgress(),
    )
  return facade
}

describe('abandon run', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  it('confirms the abandon and clears the storage and the store', () => {
    const persistence = new MemoryPersistence()
    const facade = openRun(persistence)

    renderAbandon(facade)

    fireEvent.click(
      screen.getByRole('button', { name: /abandonner cette partie/i }),
    )
    fireEvent.click(screen.getByRole('button', { name: /effacer/i }))

    expect(useSessionStore.getState().screen).toBe('onboarding')
    expect(useSessionStore.getState().identity).toBeUndefined()
    expect(persistence.read()).toBeUndefined()
    expect(facade.hasSession()).toBe(false)
  })

  it('leaves the run and its position intact when the abandon is cancelled', () => {
    const persistence = new MemoryPersistence()
    const facade = openRun(persistence)

    renderAbandon(facade)

    fireEvent.click(
      screen.getByRole('button', { name: /abandonner cette partie/i }),
    )
    fireEvent.click(screen.getByRole('button', { name: /annuler/i }))

    expect(useSessionStore.getState().screen).toBe('course')
    expect(useSessionStore.getState().identity?.playerName).toBe('Alice')
    expect(facade.hasSession()).toBe(true)
    expect(persistence.read()).toBeDefined()
  })

  it('states how many answers are already submitted before destroying them', () => {
    const persistence = new MemoryPersistence()
    const facade = openRun(persistence)
    facade.submitAnswer({ selected: ['p1', 'p3'] })
    useSessionStore.getState().setProgress(facade.getProgress())

    renderAbandon(facade)

    fireEvent.click(
      screen.getByRole('button', { name: /abandonner cette partie/i }),
    )

    expect(
      screen.getByText('La réponse déjà soumise sera effacée.', {
        exact: false,
      }),
    ).toBeInTheDocument()
  })
})
