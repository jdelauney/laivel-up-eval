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

  it('marks a held geste with the visible word « acquis », not the criterion word', () => {
    render(
      <AttributionList
        attributions={[{ label: 'Revue de diff avant merge', held: true }]}
      />,
    )

    expect(screen.getByText('acquis')).toBeInTheDocument()
    expect(screen.queryByText('pas acquis')).not.toBeInTheDocument()
  })

  it('marks a missed geste with « pas acquis », distinct from a held one', () => {
    render(
      <AttributionList
        attributions={[
          { label: 'Boucle de relance sur commande', held: false },
        ]}
      />,
    )

    expect(screen.getByText('pas acquis')).toBeInTheDocument()
    expect(screen.queryByText('acquis')).not.toBeInTheDocument()
  })

  it('never confuses held and missed: both words render for a mixed list', () => {
    render(<AttributionList attributions={attributions} />)

    expect(screen.getAllByText('acquis')).toHaveLength(1)
    expect(screen.getAllByText('pas acquis')).toHaveLength(1)
  })
})
