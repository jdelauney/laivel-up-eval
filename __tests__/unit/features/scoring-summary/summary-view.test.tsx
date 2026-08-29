import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import projectCourse from '../../../../config/course.json'
import projectGrid from '../../../../config/grid.json'
import projectSignature from '../../../../config/signature.json'
import { parseConfiguration } from '../../../../src/core/contracts/helpers/parse-config.helper'
import { WeightedMappingStrategy } from '../../../../src/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '../../../../src/core/session/game-session.facade'
import { SummaryView } from '../../../../src/features/scoring-summary/components/sections/summary-view'
import { buildGameRegistry } from '../../../../src/games/register-games'
import { FixedClock } from '../../../../src/infrastructure/clock/fixed.adapter'
import { SessionProvider } from '../../../../src/providers/session-context'
import { MemoryPersistence } from '../../../fixtures/memory-persistence'

const { grid, course, signature } = parseConfiguration(
  projectGrid,
  projectCourse,
  projectSignature,
)

const renderSummary = (answer: unknown) => {
  const facade = new GameSessionFacade({
    registry: buildGameRegistry(),
    scoring: new WeightedMappingStrategy(),
    persistence: new MemoryPersistence(),
    clock: new FixedClock(),
    grid,
    course: course,
    signature,
  })
  facade.start('Alice')
  facade.submitAnswer(answer)

  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider composition={{ status: 'ready', facade }}>
      {children}
    </SessionProvider>
  )

  return render(<SummaryView />, { wrapper })
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
      screen.getByText(
        'Toutes les propositions vérifiables ont-elles été retenues ?',
      ),
    ).toBeInTheDocument()
    expect(screen.getAllByText('tenu')).toHaveLength(2)
  })

  it('marks a missed criterion as missed, not as absent', () => {
    renderSummary({ selected: ['p2'] })

    expect(screen.getAllByText('manqué')).toHaveLength(2)
  })

  it('reads a dimension in the words of the grid, not only in percent', () => {
    renderSummary({ selected: ['p1', 'p3'] })

    expect(screen.getByText('XL — multi-modules')).toBeInTheDocument()
    expect(screen.getByText('3 chantiers et plus')).toBeInTheDocument()
  })

  it('shows the complementary reading without letting it claim the level', () => {
    renderSummary({ selected: ['p1', 'p3'] })

    expect(screen.getByText('Lecture complémentaire')).toBeInTheDocument()
    expect(screen.getByText('AIDD en route')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(
      '🥈 Silver',
    )
  })

  it('names an unmeasured dimension instead of scoring it zero', () => {
    renderSummary({ selected: ['p1', 'p3'] })

    expect(
      screen.getAllByText('aucun critère ne mesure cette dimension'),
    ).toHaveLength(2)
  })
})
