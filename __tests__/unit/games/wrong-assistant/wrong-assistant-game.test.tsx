import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { WrongAssistantGame } from '@/games/wrong-assistant/components/composites/wrong-assistant-game'
import type { ReplyStance } from '@/games/wrong-assistant/schema/config.schema'

const reply = (
  id: string,
  stance: ReplyStance,
  nextId?: string,
  text?: string,
) => ({ id, text: text ?? `Réponse ${id}.`, stance, nextId })

const node = (
  id: string,
  flawed: boolean,
  replies: ReturnType<typeof reply>[],
  extra: { flaw?: string; consequence?: string } = {},
) => ({
  id,
  speaker: 'assistant' as const,
  message: `Message ${id}.`,
  flawed,
  replies,
  ...extra,
})

const config = {
  statement: 'Un assistant vous rend un travail. Répondez-lui.',
  rootId: 'a',
  nodes: [
    node(
      'a',
      true,
      [
        reply('a-accept', 'accept', 'consA', 'Parfait, on avance.'),
        reply('a-challenge', 'challenge', 'b', 'Vous êtes sûr de vous ?'),
        reply('a-verify', 'verify', 'b', 'Montrez-moi la preuve.'),
      ],
      { flaw: 'Ce qui cloche en a.' },
    ),
    node('b', false, [
      reply('b-1', 'accept', 'c', 'Notez ça, et voyons la suite.'),
      reply('b-2', 'challenge', 'c', 'Ça arrive souvent ?'),
      reply('b-3', 'verify', 'c', 'Montrez-moi le détail.'),
    ]),
    node(
      'c',
      true,
      [
        reply('c-accept', 'accept', 'consB', "C'est réglé."),
        reply('c-challenge', 'challenge', undefined, 'Vous en êtes certain ?'),
        reply(
          'c-reformulate',
          'reformulate',
          undefined,
          'Ajoutez un test avant de refermer ce point.',
        ),
      ],
      { flaw: 'Ce qui cloche en c.' },
    ),
    node(
      'consA',
      false,
      [
        reply('consA-2', 'verify', undefined, 'Montrez-moi le rapport.'),
        reply('consA-1', 'accept', undefined, "J'ouvre un correctif."),
        reply('consA-3', 'challenge', undefined, 'Comment est-ce arrivé ?'),
      ],
      { consequence: 'Dommage A.' },
    ),
    node(
      'consB',
      false,
      [
        reply('consB-2', 'challenge', undefined, 'On l’a su comment ?'),
        reply(
          'consB-3',
          'reformulate',
          undefined,
          'Figez la version tout de suite.',
        ),
        reply('consB-1', 'accept', undefined, 'Je corrige tout de suite.'),
      ],
      { consequence: 'Dommage B.' },
    ),
  ],
}

describe('wrong assistant game, rendered', () => {
  it('shows the statement and the root turn with its replies', () => {
    render(
      <WrongAssistantGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    expect(screen.getByText(config.statement)).toBeInTheDocument()
    expect(screen.getByText('Message a.')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Vous êtes sûr de vous ?' }),
    ).toBeInTheDocument()
  })

  it('advances the thread on a reply, keeping the earlier turn visible', () => {
    render(
      <WrongAssistantGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Vous êtes sûr de vous ?' }),
    )

    expect(screen.getByText('Message a.')).toBeInTheDocument()
    expect(screen.getByText('Vous êtes sûr de vous ?')).toBeInTheDocument()
    expect(screen.getByText('Message b.')).toBeInTheDocument()
  })

  it('treats every turn the same, flawed or not: no distinguishing mark in the DOM', () => {
    render(
      <WrongAssistantGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    const visible = document.body.textContent ?? ''
    expect(visible).not.toMatch(/flawed|flaw|défectueux|sain/i)
  })

  it('reaches the revelation on a reply with no nextId, listing what was wrong on the flawed turns met', () => {
    render(
      <WrongAssistantGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Vous êtes sûr de vous ?' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Notez ça, et voyons la suite.' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Vous en êtes certain ?' }),
    )

    expect(screen.getByText('Ce qui cloche en a.')).toBeInTheDocument()
    expect(screen.getByText('Ce qui cloche en c.')).toBeInTheDocument()
  })

  it('never shows a verdict on the player at the revelation, no score, no tally of what was caught', () => {
    render(
      <WrongAssistantGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Vous êtes sûr de vous ?' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Notez ça, et voyons la suite.' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Vous en êtes certain ?' }),
    )

    const visible = document.body.textContent ?? ''
    expect(visible).not.toMatch(/correctement|manqué|réussi|raté|score|repéré/i)
  })

  it('locks the trace as soon as the closing reply is played, before continue is even clicked', () => {
    const onLock = vi.fn()
    render(
      <WrongAssistantGame
        config={config}
        onLock={onLock}
        onAdvance={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Vous êtes sûr de vous ?' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Notez ça, et voyons la suite.' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Vous en êtes certain ?' }),
    )

    expect(onLock).toHaveBeenCalledTimes(1)
    const answer = onLock.mock.calls[0][0] as {
      steps: { nodeId: string; replyId: string }[]
    }
    expect(answer.steps).toEqual([
      { nodeId: 'a', replyId: 'a-challenge' },
      { nodeId: 'b', replyId: 'b-1' },
      { nodeId: 'c', replyId: 'c-challenge' },
    ])
  })

  it('advances only once continue is pressed at the revelation, even if pressed twice', () => {
    const onAdvance = vi.fn()
    render(
      <WrongAssistantGame
        config={config}
        onLock={vi.fn()}
        onAdvance={onAdvance}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Vous êtes sûr de vous ?' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Notez ça, et voyons la suite.' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Vous en êtes certain ?' }),
    )
    expect(onAdvance).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /continuer/i }))
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }))

    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  it('reaches out for consequence: an accepted flaw plays through to its consequence turn', () => {
    render(
      <WrongAssistantGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Parfait, on avance.' }))

    expect(screen.getByText('Message a.')).toBeInTheDocument()
    expect(screen.getByText('Message consA.')).toBeInTheDocument()
  })

  /**
   * Aucun geste bespoke ici, contrairement aux flèches de `keep-or-toss` :
   * chaque réponse est un `<button>` natif dont le clavier (Tab, Entrée,
   * Espace) et le pointeur déclenchent le même `onClick` par construction du
   * navigateur — rien à câbler à la main, donc rien de plus à diverger. Le
   * test qui compte est que chaque réponse EST bien un bouton natif,
   * atteignable par tabulation, jamais un `<div>` ou `<li>` rendu cliquable.
   */
  it('exposes every reply as a native, focusable button — the same control for pointer and keyboard', () => {
    render(
      <WrongAssistantGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    config.nodes[0].replies.forEach((entry) => {
      const button = screen.getByRole('button', { name: entry.text })
      expect(button.tagName).toBe('BUTTON')
      expect(button).not.toHaveAttribute('disabled')
    })
  })
})
