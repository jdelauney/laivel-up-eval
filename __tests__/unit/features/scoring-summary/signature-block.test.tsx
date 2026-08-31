import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Level } from '@/core/contracts/grid.schema'
import type { AxisProof } from '@/core/scoring/helpers/axis-proof.helper'
import type { LevelVerdict } from '@/core/scoring/helpers/level-resolver.helper'
import type { SignatureReading } from '@/core/session/game-session.facade'
import { SignatureBlock } from '@/features/scoring-summary/components/composites/signature-block'

const level = (id: string, label: string, order: number): Level => ({
  id,
  label,
  order,
  conditions: [{ dimension: 'verification', min: 0.5 }],
  nextLevelHint: `Passer à ce qui suit ${label}.`,
})

const proof = (dimensionId: string, label: string): AxisProof => ({
  dimensionId,
  label,
  measurement: 'measured',
  band: 'jugement critique',
  crossed: 0.5,
  missedBand: undefined,
  earned: 3,
  possible: 4,
  held: [],
  missed: [],
})

const reachedSignature = (): SignatureReading => ({
  level: {
    level: level('aidd-en-route', 'AIDD en route', 2),
    unranked: undefined,
    satisfiedConditions: [],
    blocking: [],
    capping: undefined,
    hint: undefined,
    nextLevel: undefined,
  } satisfies LevelVerdict,
  dimensions: [],
  proof: [proof('verification', 'Jugement critique et vérification')],
})

const unrankedSignature = (): SignatureReading => ({
  level: {
    level: undefined,
    unranked: [],
    satisfiedConditions: [],
    blocking: [],
    capping: undefined,
    hint: undefined,
    nextLevel: level('vibe-coder', 'Vibe coder', 1),
  } satisfies LevelVerdict,
  dimensions: [],
  proof: [proof('verification', 'Jugement critique et vérification')],
})

describe('signature block', () => {
  it('names the label of a reached signature level under an h3', () => {
    render(<SignatureBlock signature={reachedSignature()} />)

    expect(
      screen.getByRole('heading', { level: 3, name: 'AIDD en route' }),
    ).toBeInTheDocument()
  })

  it('falls back to the shared unranked label, never a level it did not reach', () => {
    render(<SignatureBlock signature={unrankedSignature()} />)

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Aucun niveau ne peut être annoncé',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Vibe coder')).not.toBeInTheDocument()
  })

  it('writes that the signature never moves a level', () => {
    render(<SignatureBlock signature={reachedSignature()} />)

    expect(
      screen.getByText('La signature ne déplace aucun niveau.', {
        exact: false,
      }),
    ).toBeInTheDocument()
  })

  it('renders each axis through the same axis-proof-row as the official grid', () => {
    render(<SignatureBlock signature={reachedSignature()} />)

    expect(
      screen.getByText('Jugement critique et vérification'),
    ).toBeInTheDocument()
  })
})
