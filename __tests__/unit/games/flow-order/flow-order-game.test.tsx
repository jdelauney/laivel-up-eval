import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { FlowOrderGame } from '@/games/flow-order/components/composites/flow-order-game'

const step = (id: string, label: string, rank: number, note: string) => ({
  id,
  label,
  rank,
  note,
})

const config = {
  statement: 'Remettez ces étapes dans leur ordre réel.',
  steps: [
    step('cadrage', 'Le besoin se traduit en objectif.', 1, 'Note du cadrage.'),
    step('plan', 'Le travail se découpe en phases.', 2, 'Note du plan.'),
    step('code', 'Le code répond aux critères.', 3, 'Note du code.'),
    step(
      'tests',
      'Les vérifications confirment le résultat.',
      4,
      'Note des tests.',
    ),
    step(
      'revue',
      'Un regard indépendant confronte le résultat au plan.',
      5,
      'Note de la revue.',
    ),
    step(
      'merge',
      'Le code rejoint la branche principale.',
      6,
      'Note du merge.',
    ),
  ],
  initialOrder: ['code', 'cadrage', 'merge', 'plan', 'revue', 'tests'],
}

describe('flow order game, rendered', () => {
  it("lists every step as a button in the corpus's initial order, position on the left", () => {
    render(<FlowOrderGame config={config} onSubmit={vi.fn()} />)

    const buttons = screen.getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual([
      `1${config.steps[2].label}`,
      `2${config.steps[0].label}`,
      `3${config.steps[5].label}`,
      `4${config.steps[1].label}`,
      `5${config.steps[4].label}`,
      `6${config.steps[3].label}`,
      'Verrouiller la frise',
    ])
  })

  it('never reveals a note before the frieze is locked', () => {
    render(<FlowOrderGame config={config} onSubmit={vi.fn()} />)

    const visible = document.body.textContent ?? ''
    expect(visible).not.toMatch(/Note du|Note de|Note des/)
  })

  it('moves a step down one notch on ArrowDown, and announces its new position', () => {
    render(<FlowOrderGame config={config} onSubmit={vi.fn()} />)

    const firstCard = screen.getByRole('button', {
      name: `Position 1 : ${config.steps[2].label}`,
    })
    fireEvent.keyDown(firstCard, { key: 'ArrowDown' })

    expect(screen.getByText('étape 2 sur 6')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons[0].textContent).toBe(`1${config.steps[0].label}`)
    expect(buttons[1].textContent).toBe(`2${config.steps[2].label}`)
  })

  it('grabs a card on the first click, drops it before the target on the second', () => {
    render(<FlowOrderGame config={config} onSubmit={vi.fn()} />)

    const grabbed = screen.getByRole('button', {
      name: `Position 6 : ${config.steps[3].label}`,
    })
    fireEvent.click(grabbed)
    expect(grabbed).toHaveAttribute('aria-pressed', 'true')

    const target = screen.getByRole('button', {
      name: `Position 2 : ${config.steps[0].label}`,
    })
    fireEvent.click(target)

    const buttons = screen.getAllByRole('button')
    expect(buttons[0].textContent).toBe(`1${config.steps[2].label}`)
    expect(buttons[1].textContent).toBe(`2${config.steps[3].label}`)
    expect(buttons[2].textContent).toBe(`3${config.steps[0].label}`)
  })

  it('grabs a card and drops it after the last card when moving down, reaching the last position', () => {
    render(<FlowOrderGame config={config} onSubmit={vi.fn()} />)

    // 'cadrage' joue en position 2 ; on la saisit et on la dépose au contact
    // de la dernière carte, 'tests' en position 6 — un dépôt vers le bas
    // doit l'y placer après, en position 7, la dernière de la frise.
    const grabbed = screen.getByRole('button', {
      name: `Position 2 : ${config.steps[0].label}`,
    })
    fireEvent.click(grabbed)

    const last = screen.getByRole('button', {
      name: `Position 6 : ${config.steps[3].label}`,
    })
    fireEvent.click(last)

    const buttons = screen.getAllByRole('button')
    expect(buttons[5].textContent).toBe(`6${config.steps[0].label}`)
  })

  it('releases a grabbed card on Escape, without moving it', () => {
    render(<FlowOrderGame config={config} onSubmit={vi.fn()} />)

    const grabbed = screen.getByRole('button', {
      name: `Position 6 : ${config.steps[3].label}`,
    })
    fireEvent.click(grabbed)
    expect(grabbed).toHaveAttribute('aria-pressed', 'true')

    fireEvent.keyDown(grabbed, { key: 'Escape' })

    expect(grabbed).toHaveAttribute('aria-pressed', 'false')
    const buttons = screen.getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual([
      `1${config.steps[2].label}`,
      `2${config.steps[0].label}`,
      `3${config.steps[5].label}`,
      `4${config.steps[1].label}`,
      `5${config.steps[4].label}`,
      `6${config.steps[3].label}`,
      'Verrouiller la frise',
    ])
  })

  it('exposes the played position in the accessible name, and the frieze as an ordered list', () => {
    render(<FlowOrderGame config={config} onSubmit={vi.fn()} />)

    expect(
      screen.getByRole('button', {
        name: `Position 1 : ${config.steps[2].label}`,
      }),
    ).toBeInTheDocument()

    const list = screen.getByRole('list')
    const items = screen.getAllByRole('listitem')
    expect(items).toHaveLength(config.steps.length)
    expect(list).toContainElement(items[0])
  })

  it('reveals every step in expected order with its note, never a verdict on the player', () => {
    render(<FlowOrderGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('button', { name: /verrouiller la frise/i }),
    )

    config.steps.forEach((entry) => {
      expect(screen.getByText(entry.label)).toBeInTheDocument()
      expect(screen.getByText(entry.note)).toBeInTheDocument()
    })
    const visible = document.body.textContent ?? ''
    expect(visible).not.toMatch(/correctement|manqué|réussi|raté|score|exact/i)
  })

  it('submits the played order only once, even if continue fires twice', () => {
    const onSubmit = vi.fn()
    render(<FlowOrderGame config={config} onSubmit={onSubmit} />)

    fireEvent.click(
      screen.getByRole('button', { name: /verrouiller la frise/i }),
    )
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }))
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const answer = onSubmit.mock.calls[0][0] as { orderedIds: string[] }
    expect(answer.orderedIds).toEqual(config.initialOrder)
  })
})
