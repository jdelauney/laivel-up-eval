import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type {
  AxisProof,
  AxisSignal,
} from '@/core/scoring/helpers/axis-proof.helper'
import { AxisProofRow } from '@/features/scoring-summary/components/composites/axis-proof-row'

const signal = (
  criterionId: string,
  weight: number,
  satisfied: boolean,
  evidence: AxisSignal['evidence'] = 'measured',
): AxisSignal => ({
  criterionId,
  gameId: 'g1',
  question: `Question ${criterionId} ?`,
  weight,
  satisfied,
  evidence,
})

const measuredProof = (): AxisProof => ({
  dimensionId: 'taille',
  label: "Taille de la plus grosse feature livrée avec l'IA",
  measurement: 'measured',
  band: 'M — complexité moyenne',
  missedBand: { label: 'L — multi-étapes' },
  earned: 5,
  possible: 6,
  held: [signal('c-heavy', 3, true), signal('c-light', 1, true)],
  missed: [signal('c-missed', 2, false)],
})

const inferredProof = (): AxisProof => ({
  dimensionId: 'harness',
  label: 'Harness monté autour du modèle',
  measurement: 'inferred',
  band: 'context engineering',
  missedBand: undefined,
  earned: 4,
  possible: 4,
  held: [signal('c1', 2, true, 'inferred'), signal('c2', 1, true, 'inferred')],
  missed: [],
})

const entirelyMissedProof = (): AxisProof => ({
  dimensionId: 'parallele',
  label: 'Chantiers menés en parallèle',
  measurement: 'measured',
  band: 'aucun',
  missedBand: { label: '1 chantier' },
  earned: 0,
  possible: 4,
  held: [],
  missed: [signal('c-heavy', 3, false), signal('c-light', 1, false)],
})

const unmeasuredProof = (): AxisProof => ({
  dimensionId: 'initiative',
  label: 'Initiative des agents',
  measurement: 'unmeasured',
  band: undefined,
  missedBand: undefined,
  earned: 0,
  possible: 0,
  held: [],
  missed: [],
})

describe('axis proof row', () => {
  it('names the reached band as the headline, in the words of the grid', () => {
    render(<AxisProofRow proof={measuredProof()} />)

    expect(screen.getByText('M — complexité moyenne')).toBeInTheDocument()
  })

  it('cites the decisive signal, the heaviest criterion held', () => {
    render(<AxisProofRow proof={measuredProof()} />)

    expect(
      screen.getByText('fixé par « Question c-heavy ? »'),
    ).toBeInTheDocument()
  })

  it('renders the observed value and the missed threshold, in the words of the grid', () => {
    render(<AxisProofRow proof={measuredProof()} />)

    expect(screen.getByText(/5 sur 6 contributions/)).toBeInTheDocument()
    expect(screen.getByText(/manqué « L — multi-étapes »/)).toBeInTheDocument()
  })

  it('never repeats the crossed threshold: it is already the headline band', () => {
    render(<AxisProofRow proof={measuredProof()} />)

    expect(screen.queryByText(/franchi/)).not.toBeInTheDocument()
  })

  it('renders no raw decimal anywhere on the row', () => {
    const { container } = render(<AxisProofRow proof={measuredProof()} />)

    expect(container.textContent).not.toMatch(/0\.\d/)
  })

  it('marks a measured axis with the visible word « mesuré »', () => {
    render(<AxisProofRow proof={measuredProof()} />)

    expect(screen.getByText('mesuré')).toBeInTheDocument()
  })

  it('marks an inferred axis with a word distinct from a measured one', () => {
    render(<AxisProofRow proof={inferredProof()} />)

    expect(screen.getByText('inféré')).toBeInTheDocument()
    expect(screen.queryByText('mesuré')).not.toBeInTheDocument()
  })

  it('explains an inferred axis with the count of indirect signals that fixed it', () => {
    render(<AxisProofRow proof={inferredProof()} />)

    expect(
      screen.getByText(/2 signaux indirects, aucune mise en situation dédiée/),
    ).toBeInTheDocument()
  })

  it('says an unmeasured axis in the headline and renders no figure at all', () => {
    render(<AxisProofRow proof={unmeasuredProof()} />)

    expect(
      screen.getByText('aucun critère ne mesure cet axe'),
    ).toBeInTheDocument()
    expect(screen.getByText('non mesuré')).toBeInTheDocument()
    expect(screen.queryByText(/contributions/)).not.toBeInTheDocument()
    expect(screen.queryByText('0')).not.toBeInTheDocument()
    expect(screen.queryByText('—')).not.toBeInTheDocument()
  })

  it('renders no percent sign anywhere on the row', () => {
    const { container } = render(<AxisProofRow proof={measuredProof()} />)

    expect(container.textContent).not.toMatch(/%/)
  })

  it('names the heaviest unanswered signal as a lack, not a cause, when nothing was held', () => {
    render(<AxisProofRow proof={entirelyMissedProof()} />)

    expect(
      screen.getByText(
        'aucun signal tenu — le plus proche resté sans réponse : « Question c-heavy ? »',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText(/^fixé par/)).not.toBeInTheDocument()
  })
})
