import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LieDetectorGame } from '@/games/lie-detector/components/composites/lie-detector-game'

/**
 * Vérification de rendu réel, en Testing Library plutôt qu'en navigateur :
 * la stratégie de test du projet range déjà les écrans dans le périmètre
 * Vitest unit, sur le modèle de `defect-hunt-game.test.tsx`.
 */

const claim = (id: string, lying: boolean) => ({
  id,
  text: `Affirmation ${id}, longue de quelques mots pour ressembler au corpus réel.`,
  lying,
  verification: `Ceci est la vérification de ${id}.`,
})

const round = (id: string, targetId: string) => ({
  id,
  prompt: `Mise en situation de la manche ${id}.`,
  claims: [
    claim(`${id}-a`, false),
    claim(`${id}-b`, true),
    claim(`${id}-c`, false),
    claim(`${id}-d`, false),
  ],
  objection: {
    targetId,
    argument: `Je pense que c'est celle-là qui ment, sur la manche ${id}.`,
  },
})

const config = {
  statement:
    "Une seule affirmation ment par manche. Votre désignation se verrouille au clic. L'assistant donnera ensuite son avis, et vous pourrez alors désigner autrement, une fois.",
  rounds: [round('r1', 'r1-b'), round('r2', 'r2-a'), round('r3', 'r3-a')],
}

const claimButton = (text: string | RegExp) =>
  screen.getByRole('button', { name: text })

describe('lie detector game, rendered', () => {
  it('opens with the statement, the current round and the four claims', () => {
    render(<LieDetectorGame config={config} onSubmit={vi.fn()} />)

    expect(screen.getByText(config.statement)).toBeInTheDocument()
    expect(screen.getByText(/manche 1 sur 3/i)).toBeInTheDocument()
    expect(screen.getByText(config.rounds[0].prompt)).toBeInTheDocument()
    expect(
      claimButton(new RegExp(config.rounds[0].claims[0].text)),
    ).toBeInTheDocument()
  })

  it('locks the first designation: a second click during the objection phase moves the final pick, and the round reveals', () => {
    render(<LieDetectorGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(claimButton(new RegExp(config.rounds[0].claims[0].text)))
    expect(
      screen.getByText(config.rounds[0].objection.argument),
    ).toBeInTheDocument()

    // Le second clic joue le second geste : la manche se révèle directement,
    // sans passer par le bouton « Je maintiens ».
    fireEvent.click(claimButton(new RegExp(config.rounds[0].claims[2].text)))

    config.rounds[0].claims.forEach((entry) => {
      expect(screen.getByText(entry.verification)).toBeInTheDocument()
    })
  })

  it('the second gesture is unique: once revealed, no claim remains a clickable button', () => {
    render(<LieDetectorGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(claimButton(new RegExp(config.rounds[0].claims[0].text)))
    fireEvent.click(claimButton(new RegExp(config.rounds[0].claims[1].text)))

    // La manche est révélée : les affirmations ne sont plus des boutons.
    expect(
      screen.queryByRole('button', {
        name: new RegExp(config.rounds[0].claims[2].text),
      }),
    ).not.toBeInTheDocument()
  })

  it('presents the objection before any reveal: the argument shows, nothing else leaks with it', () => {
    render(<LieDetectorGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(claimButton(new RegExp(config.rounds[0].claims[1].text)))

    expect(
      screen.getByText(config.rounds[0].objection.argument),
    ).toBeInTheDocument()
    expect(screen.queryByText(/menteuse/i)).not.toBeInTheDocument()
  })

  it('leaks nothing before the reveal: no verification text, no word naming the liar', () => {
    const { container } = render(
      <LieDetectorGame config={config} onSubmit={vi.fn()} />,
    )

    const visible = container.textContent ?? ''
    expect(visible).not.toContain(config.rounds[0].claims[1].verification)
    expect(visible).not.toMatch(/menteuse/i)
  })

  it('submits a trace with one entry per round, only once even if the passage action fires twice', () => {
    const onSubmit = vi.fn()
    render(<LieDetectorGame config={config} onSubmit={onSubmit} />)

    const playRound = (index: number) => {
      fireEvent.click(
        claimButton(new RegExp(config.rounds[index].claims[1].text)),
      )
      fireEvent.click(screen.getByRole('button', { name: /je maintiens/i }))
    }

    playRound(0)
    fireEvent.click(screen.getByRole('button', { name: /manche suivante/i }))

    playRound(1)
    fireEvent.click(screen.getByRole('button', { name: /manche suivante/i }))

    playRound(2)
    fireEvent.click(screen.getByRole('button', { name: /situation suivante/i }))
    fireEvent.click(screen.getByRole('button', { name: /situation suivante/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const answer = onSubmit.mock.calls[0][0] as {
      picks: { roundId: string }[]
    }
    expect(answer.picks.map((entry) => entry.roundId)).toEqual([
      'r1',
      'r2',
      'r3',
    ])
  })

  it('reveals the verdict and the verification of every claim once the round is rendered', () => {
    render(<LieDetectorGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(claimButton(new RegExp(config.rounds[0].claims[1].text)))
    fireEvent.click(screen.getByRole('button', { name: /je maintiens/i }))

    config.rounds[0].claims.forEach((entry) => {
      expect(screen.getByText(entry.verification)).toBeInTheDocument()
    })
  })

  it('walks claims by keyboard alone: each claim is a native, focusable button that designates on click', () => {
    render(<LieDetectorGame config={config} onSubmit={vi.fn()} />)

    const first = claimButton(new RegExp(config.rounds[0].claims[0].text))
    first.focus()
    expect(document.activeElement).toBe(first)

    fireEvent.click(first)
    expect(screen.getByText(/je maintiens/i)).toBeInTheDocument()
  })
})
