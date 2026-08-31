import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { GameSessionFacade } from '../../../../src/core/session/game-session.facade'
import { CourseView } from '../../../../src/features/group-navigation/components/sections/course-view'
import { SessionProvider } from '../../../../src/providers/session-context'
import { useSessionStore } from '../../../../src/store/session.store'
import { buildTestFacadeWithGroups } from '../../../fixtures/configuration'

/**
 * Un contrôle utilisable pour forcer, pour un seul test, un type de jeu
 * enregistré côté domaine mais non résolu côté interface — le seul moyen
 * d'observer « type non résolu » sans casser la construction de la façade,
 * qui exige elle un évaluateur pour chaque type déclaré.
 */
const { unresolvedGameType } = vi.hoisted(() => ({
  unresolvedGameType: { current: undefined as string | undefined },
}))

vi.mock('../../../../src/games/register-components', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('../../../../src/games/register-components')
    >()
  return {
    ...actual,
    resolveGameComponent: (gameType: string) =>
      gameType === unresolvedGameType.current
        ? undefined
        : actual.resolveGameComponent(gameType),
  }
})

const buildFacade = () => buildTestFacadeWithGroups([2, 1])

const renderCourse = (facade: GameSessionFacade) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider composition={{ status: 'ready', facade }}>
      {children}
    </SessionProvider>
  )

  return render(<CourseView />, { wrapper })
}

const openRun = (facade: GameSessionFacade): void => {
  facade.start('Alice')
  useSessionStore
    .getState()
    .openCourse(
      { playerName: 'Alice', repository: undefined },
      facade.getProgress(),
    )
}

const submitCurrent = (): void => {
  fireEvent.click(screen.getByRole('button', { name: /valider/i }))
}

const getBackControl = (): HTMLElement =>
  screen.getByRole('button', { name: /revenir en arrière/i })

describe('course view', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
    unresolvedGameType.current = undefined
  })

  it('shows a disabled back control naming its reason, on the first situation', () => {
    const facade = buildFacade()
    openRun(facade)
    renderCourse(facade)

    const backControl = getBackControl()

    expect(backControl).toHaveAttribute('aria-disabled', 'true')
    expect(backControl).not.toBeDisabled()
    backControl.focus()
    expect(backControl).toHaveFocus()
    expect(backControl).toHaveAccessibleDescription(
      /réponse soumise est définitive/i,
    )
  })

  it('changes nothing when the disabled control is activated', () => {
    const facade = buildFacade()
    openRun(facade)
    renderCourse(facade)

    fireEvent.click(getBackControl())

    expect(useSessionStore.getState().progress?.submitted).toBe(0)
    expect(useSessionStore.getState().progress?.game?.id).toBe('test-bench-1-1')
    expect(facade.auditTrail()).toHaveLength(0)
  })

  it('shows the same notice, at the same place and with the same reason, after a submission', () => {
    const facade = buildFacade()
    openRun(facade)
    renderCourse(facade)

    submitCurrent()

    const backControl = getBackControl()
    expect(backControl).toHaveAttribute('aria-disabled', 'true')
    expect(backControl).toHaveAccessibleDescription(
      /réponse soumise est définitive/i,
    )
  })

  it('shows the identical refusal after crossing into the next group', () => {
    const facade = buildFacade()
    openRun(facade)
    renderCourse(facade)

    submitCurrent()
    submitCurrent()

    expect(useSessionStore.getState().progress?.group?.id).toBe('groupe-2')
    const backControl = getBackControl()
    expect(backControl).toHaveAttribute('aria-disabled', 'true')
    expect(backControl).toHaveAccessibleDescription(
      /réponse soumise est définitive/i,
    )
  })

  it('stands the refusal next to the missing wiring message, for a game type the interface cannot resolve', () => {
    unresolvedGameType.current = 'test-bench'
    const facade = buildFacade()
    openRun(facade)

    renderCourse(facade)

    expect(getBackControl()).toHaveAttribute('aria-disabled', 'true')
    expect(
      screen.getByText(/Aucun affichage enregistré pour le type de jeu/),
    ).toBeInTheDocument()
  })

  it('names the rail as progression through the course, not just a shape', () => {
    const facade = buildFacade()
    openRun(facade)
    renderCourse(facade)

    expect(
      screen.getByRole('list', { name: /progression dans le parcours/i }),
    ).toBeInTheDocument()
  })

  it('renders no refusal when no situation is in progress', () => {
    const facade = buildFacade()

    renderCourse(facade)

    expect(screen.getByText('Aucune situation en cours.')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: /revenir en arrière/i }),
    ).not.toBeInTheDocument()
  })
})
