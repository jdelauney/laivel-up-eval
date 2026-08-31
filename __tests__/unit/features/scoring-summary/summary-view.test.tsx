import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { GameSessionFacade } from '../../../../src/core/session/game-session.facade'
import { SummaryView } from '../../../../src/features/scoring-summary/components/sections/summary-view'
import { SessionProvider } from '../../../../src/providers/session-context'
import {
  buildTestFacade,
  buildTestFacadeWithGameCount,
  buildTestFacadeWithoutSignature,
} from '../../../fixtures/configuration'

const renderSummary = (
  answer: unknown,
  buildFacade: () => GameSessionFacade = buildTestFacade,
) => {
  const facade = buildFacade()
  facade.start('Alice')
  facade.submitAnswer(answer)

  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider composition={{ status: 'ready', facade }}>
      {children}
    </SessionProvider>
  )

  return render(<SummaryView />, { wrapper })
}

const criteriaTrail = () => {
  const heading = screen.getByRole('heading', {
    name: 'Ce qui a produit ce niveau',
  })
  const section = heading.closest('section')
  if (section === null) throw new Error('section introuvable dans le test')
  return within(section)
}

describe('summary', () => {
  it('shows the level reached and the way to the next one', () => {
    renderSummary({ selected: ['p1', 'p3'] })

    expect(screen.getByText('Niveau atteint')).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { level: 2 }).textContent,
    ).not.toHaveLength(0)
  })

  it('walks down to the criteria that produced the level', () => {
    renderSummary({ selected: ['p1', 'p3'] })

    expect(
      criteriaTrail().getByText(
        'Toutes les propositions vérifiables ont-elles été retenues ?',
      ),
    ).toBeInTheDocument()
    expect(criteriaTrail().getAllByText('tenu')).toHaveLength(2)
  })

  it('marks a missed criterion as missed, not as absent', () => {
    renderSummary({ selected: ['p2'] })

    expect(criteriaTrail().getAllByText('manqué')).toHaveLength(2)
  })

  it('reads an axis in the words of the grid, never in percent', () => {
    renderSummary({ selected: ['p1', 'p3'] })

    expect(screen.getByText('XL — multi-modules')).toBeInTheDocument()
    expect(screen.getByText('3 chantiers et plus')).toBeInTheDocument()
  })

  it('renders the level and the signature as two distinct blocks, the level title staying the referential one', () => {
    renderSummary({ selected: ['p1', 'p3'] })

    const levelHeading = screen.getByRole('heading', { level: 2 })
    expect(levelHeading.textContent).toBe('🥈 Silver')

    const signatureHeading = screen.getByRole('heading', {
      level: 3,
      name: 'AIDD en route',
    })
    expect(signatureHeading).toBeInTheDocument()
    expect(levelHeading.closest('div')).not.toBe(
      signatureHeading.closest('div'),
    )
  })

  it('writes, visibly, that the signature never moves a level', () => {
    renderSummary({ selected: ['p1', 'p3'] })

    expect(
      screen.getByText('La signature ne déplace aucun niveau.', {
        exact: false,
      }),
    ).toBeInTheDocument()
  })

  it('reads a signature axis through the same axis-proof-row as the official grid', () => {
    renderSummary({ selected: ['p1', 'p3'] })

    expect(
      screen.getByText('Jugement critique et vérification'),
    ).toBeInTheDocument()
  })

  it('renders no signature block, and no mention of a missing reading, without a signature file', () => {
    const { container } = renderSummary(
      { selected: ['p1', 'p3'] },
      buildTestFacadeWithoutSignature,
    )

    expect(container.textContent).not.toMatch(/signature/i)
  })

  it('announces the same level with and without a signature', () => {
    const withSignature = renderSummary({ selected: ['p1', 'p3'] })
    const withSignatureLevel = withSignature.getByRole('heading', {
      level: 2,
    }).textContent
    withSignature.unmount()

    const withoutSignature = renderSummary(
      { selected: ['p1', 'p3'] },
      buildTestFacadeWithoutSignature,
    )
    const withoutSignatureLevel = withoutSignature.getByRole('heading', {
      level: 2,
    }).textContent

    expect(withoutSignatureLevel).toBe(withSignatureLevel)
  })

  it('names an unmeasured axis in the axis headline, never as a score of zero', () => {
    renderSummary({ selected: ['p1', 'p3'] })

    expect(screen.getAllByText('aucun critère ne mesure cet axe')).toHaveLength(
      2,
    )
  })

  it('reads the three measurement statuses as visible words, not only a color', () => {
    renderSummary({ selected: ['p1', 'p3'] })

    expect(screen.getAllByText('mesuré').length).toBeGreaterThan(0)
    expect(screen.getAllByText('non mesuré')).toHaveLength(2)
  })

  it('never renders a percent sign or a percentage value on an axis', () => {
    const { container } = renderSummary({ selected: ['p1', 'p3'] })

    expect(container.textContent).not.toMatch(/%/)
  })

  it('renders no capping section for an unranked profile, only the reason already named above', () => {
    // F2 — reproduit la sonde de la revue avec une vraie façade : le seul
    // jeu de ce parcours ne mappe que `harness`, donc `taille` reste
    // entièrement non mesurée. `taille` ne viole pas de borne `max` (un
    // score inconnu n'est ni haut ni bas), donc White reste la cible du
    // plan et `unranked`/`blocking` coïncident sur le même axe (voir
    // `level-resolver.test.ts`). L'écran ne doit pas répéter la ligne : la
    // section « Ce qui plafonne » ne se rend pas pour un profil non classé.
    renderSummary({ selected: [] }, () => buildTestFacadeWithGameCount(1))

    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Aucun niveau ne peut être annoncé',
      }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { level: 3, name: 'Ce qui plafonne' }),
    ).not.toBeInTheDocument()
  })
})
