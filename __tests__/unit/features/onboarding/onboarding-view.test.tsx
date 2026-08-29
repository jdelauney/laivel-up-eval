import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PersistenceSessionAdapter } from '../../../../src/core/ports/persistence-session-adapter.interface'
import { OnboardingView } from '../../../../src/features/onboarding/components/sections/onboarding-view'
import { SessionProvider } from '../../../../src/providers/session-context'
import { useSessionStore } from '../../../../src/store/session.store'
import { buildTestFacade } from '../../../fixtures/configuration'
import { MemoryPersistence } from '../../../fixtures/memory-persistence'

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

/**
 * Vocabulaire de notation, nommé terme par terme plutôt qu'en motif large :
 * un faux échec se corrige en lisant la liste. La comparaison porte sur des
 * mots entiers, pas des sous-chaînes : « Jugement critique » reste un
 * libellé de groupe légitime.
 */
const SCORING_VOCABULARY = [
  'note',
  'notation',
  'score',
  'point',
  'barème',
  'coefficient',
  'critère',
  'seuil',
]

const wordsRenderedBy = (container: HTMLElement): string[] =>
  (container.textContent ?? '').toLowerCase().match(/\p{L}+/gu) ?? []

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

  it('shows the repository of a stored run on its resume card', () => {
    const persistence = new MemoryPersistence()
    const played = buildTestFacade(persistence)
    played.start('Alice', 'alice/atelier')

    renderOnboarding(persistence)

    expect(screen.getByText('Partie en cours')).toBeInTheDocument()
    expect(screen.getByText('alice/atelier')).toBeInTheDocument()
  })

  it('states the frame before any input: duration, groups and situations', () => {
    renderOnboarding()

    const groupsTile = screen.getByText('Groupes').closest('div')
    const situationsTile = screen.getByText('Situations').closest('div')

    expect(groupsTile).toHaveTextContent('1')
    expect(situationsTile).toHaveTextContent('1')
    expect(screen.getByText('Durée estimée')).toBeInTheDocument()
    expect(screen.getByText('5 min')).toBeInTheDocument()
    expect(
      screen.getByText(/Chaque situation enregistre ce que vous faites/),
    ).toBeInTheDocument()
  })

  it('follows the course shape of the injected facade, not a fixed duration', () => {
    renderOnboarding()

    expect(screen.getByText('5 min')).toBeInTheDocument()
    expect(screen.queryByText('30 min')).not.toBeInTheDocument()
  })

  it('never states a scoring vocabulary word anywhere on the screen', () => {
    const { container } = renderOnboarding()

    const renderedWords = wordsRenderedBy(container)

    for (const forbiddenWord of SCORING_VOCABULARY) {
      expect(renderedWords).not.toContain(forbiddenWord)
    }
  })

  /**
   * La carte de reprise fait partie de l'accueil : elle porte du texte que le
   * premier balayage ne voit pas, faute de partie enregistrée.
   */
  it('never states a scoring vocabulary word next to a stored run either', () => {
    const persistence = new MemoryPersistence()
    const played = buildTestFacade(persistence)
    played.start('Alice', 'alice/atelier')

    const { container } = renderOnboarding(persistence)
    const renderedWords = wordsRenderedBy(container)

    expect(screen.getByText('Partie en cours')).toBeInTheDocument()
    for (const forbiddenWord of SCORING_VOCABULARY) {
      expect(renderedWords).not.toContain(forbiddenWord)
    }
  })

  it('keeps the frame stated above the resume card of a stored run', () => {
    const persistence = new MemoryPersistence()
    const played = buildTestFacade(persistence)
    played.start('Alice')

    renderOnboarding(persistence)

    const frameDuration = screen.getByText('Durée estimée')
    const resumeCard = screen.getByText('Partie en cours')

    expect(
      frameDuration.compareDocumentPosition(resumeCard) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })
})
