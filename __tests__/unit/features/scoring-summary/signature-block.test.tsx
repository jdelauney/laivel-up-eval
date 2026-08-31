import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { Level } from '@/core/contracts/grid.schema'
import type { AxisProof } from '@/core/scoring/helpers/axis-proof.helper'
import type { LevelVerdict } from '@/core/scoring/helpers/level-resolver.helper'
import type { PlanStep } from '@/core/scoring/helpers/progression-plan.helper'
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
  missedBand: undefined,
  earned: 3,
  possible: 4,
  held: [],
  missed: [],
})

/**
 * Le profil que la revue signale comme atteignable : `verification = 0.6` ne
 * tient ni `vibe-coder` (max 0.4) ni `aidd-en-route` (min 0.4 sur
 * `verification`, min 0.35 sur `pilotage-contexte`, ici absent).
 */
const unrankedStep = (): PlanStep => ({
  dimensionId: 'verification',
  label: 'Jugement critique et vérification',
  measurement: 'measured',
  target: { label: 'vérifie après coup', from: 0.4 },
  action: undefined,
  proof: undefined,
  observed: 0.6,
  required: 0.4,
  observedBand: "accepte ce que l'IA affirme",
})

const reachedSignature = (): SignatureReading => ({
  level: {
    level: level('aidd-en-route', 'AIDD en route', 2),
    unranked: undefined,
    satisfiedConditions: [],
    blocking: [],
    hint: undefined,
    nextLevel: undefined,
    noNextLevelReason: 'summit',
  } satisfies LevelVerdict,
  dimensions: [],
  proof: [proof('verification', 'Jugement critique et vérification')],
  unrankedReason: undefined,
})

const unrankedSignature = (): SignatureReading => ({
  level: {
    level: undefined,
    unranked: [],
    satisfiedConditions: [],
    blocking: [],
    hint: undefined,
    nextLevel: level('vibe-coder', 'Vibe coder', 1),
    noNextLevelReason: undefined,
  } satisfies LevelVerdict,
  dimensions: [],
  proof: [proof('verification', 'Jugement critique et vérification')],
  unrankedReason: [unrankedStep()],
})

describe('signature block', () => {
  it('names the label of a reached signature level under an h3', () => {
    render(<SignatureBlock signature={reachedSignature()} />)

    expect(
      screen.getByRole('heading', { level: 3, name: 'AIDD en route' }),
    ).toBeInTheDocument()
  })

  it('explains why the signature reads no level, instead of staying silent', () => {
    // DB-1 du second passage (SUG-5 rappelé) : `verification = 0.6,
    // pilotage-contexte` absent est atteignable et ne tenait ni vibe-coder
    // ni aidd-en-route. Le bloc doit nommer la raison, comme le fait
    // `LevelBlock` pour le verdict officiel — jamais rester muet.
    render(<SignatureBlock signature={unrankedSignature()} />)

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Aucun niveau ne peut être annoncé',
      }),
    ).toBeInTheDocument()
    expect(screen.queryByText('Vibe coder')).not.toBeInTheDocument()
    expect(
      screen.getByText(
        "Jugement critique et vérification — actuellement « accepte ce que l'IA affirme », la condition demande « vérifie après coup »",
      ),
    ).toBeInTheDocument()
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
