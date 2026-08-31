import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { CriterionAttribution } from '@/core/ports/game-evaluator.interface'
import { AttributionList } from '@/features/scoring-summary/components/elements/attribution-list'

const attributions: readonly CriterionAttribution[] = [
  { label: 'Revue de diff avant merge', held: true },
  { label: 'Boucle de relance sur commande', held: false },
]

describe('attribution list', () => {
  it('names every geste, one per line', () => {
    render(<AttributionList attributions={attributions} />)

    expect(screen.getByText('Revue de diff avant merge')).toBeInTheDocument()
    expect(
      screen.getByText('Boucle de relance sur commande'),
    ).toBeInTheDocument()
  })

  it('marks a held geste with the visible word « tenu »', () => {
    render(
      <AttributionList
        attributions={[{ label: 'Revue de diff avant merge', held: true }]}
      />,
    )

    expect(screen.getByText('tenu')).toBeInTheDocument()
    expect(screen.queryByText('manqué')).not.toBeInTheDocument()
  })

  it('marks a missed geste with the visible word « manqué », distinct from a held one', () => {
    render(
      <AttributionList
        attributions={[
          { label: 'Boucle de relance sur commande', held: false },
        ]}
      />,
    )

    expect(screen.getByText('manqué')).toBeInTheDocument()
    expect(screen.queryByText('tenu')).not.toBeInTheDocument()
  })

  it('never confuses held and missed: both words render for a mixed list', () => {
    render(<AttributionList attributions={attributions} />)

    expect(screen.getAllByText('tenu')).toHaveLength(1)
    expect(screen.getAllByText('manqué')).toHaveLength(1)
  })
})
