import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { GroupOutcome } from '@/core/entities/evaluation-result.entity'
import { CriteriaTrail } from '@/features/scoring-summary/components/composites/criteria-trail'

const groupWithCriterion = (
  overrides: Partial<GroupOutcome['games'][number]['criteria'][number]> = {},
): readonly GroupOutcome[] => [
  {
    groupId: 'g1',
    label: 'Groupe 1',
    score: 1,
    games: [
      {
        gameId: 'jeu-1',
        label: 'Jeu 1',
        score: 1,
        criteria: [
          {
            criterionId: 'c1',
            gameId: 'jeu-1',
            question: 'Le critère tient-il ?',
            satisfied: true,
            mapping: [],
            ...overrides,
          },
        ],
      },
    ],
  },
]

describe('criteria trail', () => {
  it('walks the trail from group to game to criterion', () => {
    render(<CriteriaTrail groups={groupWithCriterion()} />)

    expect(
      screen.getByRole('heading', { name: 'Ce qui a produit ce niveau' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Groupe 1')).toBeInTheDocument()
    expect(screen.getByText('Jeu 1')).toBeInTheDocument()
    expect(screen.getByText('Le critère tient-il ?')).toBeInTheDocument()
  })

  it('renders a criterion without attributable detail exactly as before: the word, no attribution rows', () => {
    render(
      <CriteriaTrail
        groups={groupWithCriterion({
          satisfied: false,
          attributions: undefined,
        })}
      />,
    )

    expect(screen.getByText('manqué')).toBeInTheDocument()
    // Une seule ligne : celle du critère, aucune ligne de geste dessous.
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('lists the gestes under a criterion that carries an attributable detail', () => {
    render(
      <CriteriaTrail
        groups={groupWithCriterion({
          satisfied: false,
          attributions: [
            { label: 'Boucle de relance sur commande', held: false },
            { label: 'Fichier de contexte projet', held: true },
          ],
        })}
      />,
    )

    expect(
      screen.getByText('Boucle de relance sur commande'),
    ).toBeInTheDocument()
    expect(screen.getByText('Fichier de contexte projet')).toBeInTheDocument()
    // La ligne du critère, plus une par geste.
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('renders no attribution row for an empty attributions array', () => {
    render(<CriteriaTrail groups={groupWithCriterion({ attributions: [] })} />)

    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })
})
