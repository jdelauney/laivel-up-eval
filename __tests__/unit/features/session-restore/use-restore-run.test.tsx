import { render } from '@testing-library/react'
import { StrictMode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRestoreRun } from '../../../../src/features/session-restore/hooks/use-restore-run.hook'
import { SessionProvider } from '../../../../src/providers/session-context'
import { useSessionStore } from '../../../../src/store/session.store'
import { buildTestFacade } from '../../../fixtures/configuration'
import { MemoryPersistence } from '../../../fixtures/memory-persistence'

/**
 * Un composant sonde plutôt qu'un `renderHook` : la reprise se déclenche par
 * effet, au montage, et le comportement sous `StrictMode` — qui monte
 * l'application deux fois — ne s'observe qu'en rendant un vrai arbre.
 */
const RestoreProbe = () => {
  useRestoreRun()
  return null
}

const renderRestore = (
  facade: ReturnType<typeof buildTestFacade>,
  wrapInStrictMode = false,
) => {
  const tree = (
    <SessionProvider composition={{ status: 'ready', facade }}>
      <RestoreProbe />
    </SessionProvider>
  )

  return render(wrapInStrictMode ? <StrictMode>{tree}</StrictMode> : tree)
}

describe('restore run on mount', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  it('opens the course at the game following the last submission', () => {
    const persistence = new MemoryPersistence()
    const played = buildTestFacade(persistence)
    played.start('Alice', 'alice/atelier')
    played.submitAnswer({ selected: ['p1', 'p3'] })

    renderRestore(buildTestFacade(persistence))

    const state = useSessionStore.getState()
    expect(state.screen).toBe('course')
    expect(state.identity?.playerName).toBe('Alice')
    expect(state.identity?.repository).toBe('alice/atelier')
    expect(state.progress?.submitted).toBe(1)
  })

  it('shows the verdict when the stored run is already finished', () => {
    const persistence = new MemoryPersistence()
    const played = buildTestFacade(persistence)
    played.start('Alice')
    played.submitAnswer({ selected: ['p1', 'p3'] })
    played.nextGame()

    renderRestore(buildTestFacade(persistence))

    expect(useSessionStore.getState().screen).toBe('summary')
  })

  it('leaves the onboarding screen in place on an empty persistence', () => {
    renderRestore(buildTestFacade(new MemoryPersistence()))

    expect(useSessionStore.getState().screen).toBe('onboarding')
  })

  it('leaves the onboarding screen in place on a snapshot outside its contract, without throwing', () => {
    const persistence = new MemoryPersistence()
    persistence.write({ not: 'a session snapshot' })

    expect(() => renderRestore(buildTestFacade(persistence))).not.toThrow()
    expect(useSessionStore.getState().screen).toBe('onboarding')
  })

  it('resumes only once under StrictMode, without moving the position', () => {
    const persistence = new MemoryPersistence()
    const played = buildTestFacade(persistence)
    played.start('Alice')
    played.submitAnswer({ selected: ['p1', 'p3'] })

    const facade = buildTestFacade(persistence)
    const resumeSpy = vi.spyOn(facade, 'resume')

    renderRestore(facade, true)

    expect(resumeSpy).toHaveBeenCalledTimes(1)
    expect(useSessionStore.getState().progress?.submitted).toBe(1)
  })
})
