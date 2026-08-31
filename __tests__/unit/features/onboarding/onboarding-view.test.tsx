import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersistenceSessionAdapter } from '../../../../src/core/ports/persistence-session-adapter.interface'
import type { GameSessionFacade } from '../../../../src/core/session/game-session.facade'
import { OnboardingView } from '../../../../src/features/onboarding/components/sections/onboarding-view'
import { SessionProvider } from '../../../../src/providers/session-context'
import { useSessionStore } from '../../../../src/store/session.store'
import {
  buildTestFacade,
  buildTestFacadeWithGameCount,
  grid,
} from '../../../fixtures/configuration'
import { MemoryPersistence } from '../../../fixtures/memory-persistence'
import { SCORING_VOCABULARY } from '../../../fixtures/scoring-vocabulary'

const renderOnboarding = (
  persistence: PersistenceSessionAdapter = new MemoryPersistence(),
) => {
  const facade = buildTestFacade(persistence)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider composition={{ status: 'ready', facade }}>
      {children}
    </SessionProvider>
  )

  return render(<OnboardingView />, { wrapper })
}

const renderOnboardingWithFacade = (facade: GameSessionFacade) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider composition={{ status: 'ready', facade }}>
      {children}
    </SessionProvider>
  )

  return render(<OnboardingView />, { wrapper })
}

const fill = (label: RegExp, value: string): HTMLElement => {
  const field = screen.getByLabelText(label)
  fireEvent.change(field, { target: { value } })
  fireEvent.blur(field)
  return field
}

const submitForm = () =>
  fireEvent.click(screen.getByRole('button', { name: /commencer/i }))

const NAME = /votre nom/i
const REPOSITORY = /votre dépôt/i

const renderedTextOf = (container: HTMLElement): string =>
  (container.textContent ?? '').toLowerCase()

const wordsRenderedBy = (container: HTMLElement): string[] =>
  renderedTextOf(container).match(/\p{L}+/gu) ?? []

describe('onboarding view', () => {
  beforeEach(() => {
    useSessionStore.getState().reset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('states the accepted forms next to the repository field', () => {
    renderOnboarding()

    const help = screen.getByText(/L'URL GitHub complète/)

    expect(help).toHaveTextContent(/Rien n'est vérifié/)
    expect(screen.getByLabelText(REPOSITORY)).toHaveAttribute(
      'aria-describedby',
      'repository-aide',
    )
  })

  it('opens the course with the slug when a full url was pasted', async () => {
    renderOnboarding()

    fill(NAME, 'Alice')
    fill(REPOSITORY, 'https://github.com/alice/atelier')
    submitForm()

    await waitFor(() => {
      expect(useSessionStore.getState().screen).toBe('course')
    })
    expect(useSessionStore.getState().identity).toEqual({
      playerName: 'Alice',
      repository: 'alice/atelier',
    })
  })

  it('opens the course with no repository when the field is left empty', async () => {
    renderOnboarding()

    fill(NAME, 'Alice')
    submitForm()

    await waitFor(() => {
      expect(useSessionStore.getState().screen).toBe('course')
    })
    expect(useSessionStore.getState().identity?.repository).toBeUndefined()
    expect(screen.queryByText(/Indiquez le dépôt/)).not.toBeInTheDocument()
  })

  it('refuses another form with a message giving the expected one', async () => {
    renderOnboarding()

    fill(NAME, 'Alice')
    const field = fill(REPOSITORY, 'mon super dépôt')

    await waitFor(() => {
      expect(screen.getByText(/Indiquez le dépôt sous la forme/)).toBeVisible()
    })
    expect(field).toHaveAttribute('aria-invalid', 'true')

    submitForm()

    await waitFor(() => {
      expect(useSessionStore.getState().screen).toBe('onboarding')
    })
  })

  it('keeps the french message of a player name that is too short', async () => {
    renderOnboarding()

    fill(NAME, 'A')

    await waitFor(() => {
      expect(
        screen.getByText('Le pseudo doit faire au moins 2 caractères'),
      ).toBeVisible()
    })
  })

  it('waits for no network when entering the course with a repository', async () => {
    const fetchSpy = vi.fn()
    vi.stubGlobal('fetch', fetchSpy)
    renderOnboarding()

    fill(NAME, 'Alice')
    fill(REPOSITORY, 'alice/atelier')
    submitForm()

    await waitFor(() => {
      expect(useSessionStore.getState().screen).toBe('course')
    })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('names the rail as the shape of the course, not a progress in it', () => {
    renderOnboarding()

    expect(
      screen.getByRole('list', { name: /forme du parcours/i }),
    ).toBeInTheDocument()
  })

  it('states the frame before any input: duration, groups and situations', () => {
    renderOnboarding()

    const groupsTile = screen.getByText('Groupes').closest('div')
    const situationsTile = screen.getByText('Situations').closest('div')

    expect(groupsTile).toHaveTextContent('1')
    expect(situationsTile).toHaveTextContent('1')
    expect(screen.getByText('Estimation')).toBeInTheDocument()
    expect(screen.getByText('5 min')).toBeInTheDocument()
    expect(
      screen.getByText(/Chaque situation enregistre ce que vous faites/),
    ).toBeInTheDocument()
  })

  /**
   * L'accueil n'affiche plus jamais de carte de reprise : elle est
   * automatique, au montage de l'application. Cette ligne reste le seul
   * endroit qui annonce la reprise à un primo-arrivant.
   */
  it('says the run can be interrupted, with no resume card to show it otherwise', () => {
    renderOnboarding()

    expect(screen.queryByText('Partie en cours')).not.toBeInTheDocument()
    expect(
      screen.getByText('Une partie interrompue se reprend dans ce navigateur.'),
    ).toBeInTheDocument()
  })

  it('follows the course shape of the injected facade, not a fixed duration', () => {
    const shortRun = renderOnboardingWithFacade(buildTestFacadeWithGameCount(2))
    const shortDuration = screen
      .getByText('Estimation')
      .closest('div')?.textContent
    shortRun.unmount()

    const longRun = renderOnboardingWithFacade(buildTestFacadeWithGameCount(40))
    const longDuration = screen
      .getByText('Estimation')
      .closest('div')?.textContent
    longRun.unmount()

    expect(shortDuration).toContain('5 min')
    expect(longDuration).toContain('60 min')
    expect(longDuration).not.toBe(shortDuration)
  })

  it('never states a scoring vocabulary word anywhere on the screen', () => {
    const { container } = renderOnboarding()

    const renderedWords = wordsRenderedBy(container)

    for (const forbiddenWord of SCORING_VOCABULARY) {
      expect(renderedWords).not.toContain(forbiddenWord)
    }
  })

  /**
   * Preuve que le balayage ci-dessus n'est pas vide de sens : un texte qui
   * porte réellement un terme interdit doit se faire attraper. Sans ce cas,
   * un balayage cassé et un écran propre se ressemblent tous les deux.
   */
  it('catches a scoring vocabulary word when the rendered text states one', () => {
    const { container } = render(
      <p>
        Chaque situation vaut des points, vous serez noté sur des critères.
      </p>,
    )

    const renderedWords = wordsRenderedBy(container)
    const caught = SCORING_VOCABULARY.filter((forbiddenWord) =>
      renderedWords.includes(forbiddenWord),
    )

    expect(caught).toEqual(
      expect.arrayContaining(['points', 'noté', 'critères']),
    )
  })

  it('never restates a scoring grid dimension label anywhere on the screen', () => {
    const { container } = renderOnboarding()

    const renderedText = renderedTextOf(container)

    for (const dimension of grid.dimensions) {
      expect(renderedText).not.toContain(dimension.label.toLowerCase())
    }
  })

  /**
   * Preuve que le balayage ci-dessus n'est pas vide de sens : un texte qui
   * porte réellement un libellé du référentiel doit se faire attraper. Sans
   * ce cas, un balayage cassé et un écran propre se ressemblent tous les
   * deux.
   */
  it('catches a scoring grid dimension label when the rendered text states one', () => {
    const [firstDimension] = grid.dimensions
    const { container } = render(<p>{firstDimension.label}</p>)

    const renderedText = renderedTextOf(container)

    expect(renderedText).toContain(firstDimension.label.toLowerCase())
  })

  describe('missing repository notice', () => {
    const NOTICE = /Entrer sans dépôt est un usage prévu/

    it('is visible at opening, names both axes in ordinary words, and says no repository is read yet', () => {
      renderOnboarding()

      const notice = screen.getByText(NOTICE)

      expect(notice).toBeInTheDocument()
      expect(notice).toHaveTextContent(/du travail de l'IA/)
      expect(notice).toHaveTextContent(/chantiers que vous menez de front/)
      expect(notice).toHaveTextContent(/Aucun dépôt n'est lu pour l'instant/)
    })

    it('disappears once a repository is typed, and returns once the field is cleared', () => {
      renderOnboarding()

      fill(REPOSITORY, 'alice/atelier')
      expect(screen.queryByText(NOTICE)).not.toBeInTheDocument()

      fill(REPOSITORY, '')
      expect(screen.getByText(NOTICE)).toBeInTheDocument()
    })

    it('stays visible when only spaces are typed, since no repository is designated', () => {
      renderOnboarding()

      fill(REPOSITORY, '   ')

      expect(screen.getByText(NOTICE)).toBeInTheDocument()
    })

    it('stays absent on a refused form, leaving the field its own message alone', async () => {
      renderOnboarding()

      fill(REPOSITORY, 'mon super dépôt')

      await waitFor(() => {
        expect(
          screen.getByText(/Indiquez le dépôt sous la forme/),
        ).toBeVisible()
      })
      expect(screen.queryByText(NOTICE)).not.toBeInTheDocument()
    })
  })
})
