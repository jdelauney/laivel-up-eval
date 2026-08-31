import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { KeepOrTossGame } from '@/games/keep-or-toss/components/composites/keep-or-toss-game'

const item = (id: string, label: string, keep: boolean, reason: string) => ({
  id,
  label,
  keep,
  reason,
})

const config = {
  statement: 'Triez ces pratiques sous le chronomètre.',
  durationSeconds: 10,
  items: [
    item('p1', 'Chiffrer les secrets au repos.', true, 'Pourquoi p1.'),
    item('p2', 'Stocker le mot de passe dans le dépôt.', false, 'Pourquoi p2.'),
    item('p3', 'Valider les entrées côté serveur.', true, 'Pourquoi p3.'),
    item(
      'p4',
      'Désactiver la vérification TLS en test.',
      false,
      'Pourquoi p4.',
    ),
    item('p5', "Faire tourner les clés d'API.", true, 'Pourquoi p5.'),
    item('p6', "Partager un jeton d'accès unique.", false, 'Pourquoi p6.'),
    item(
      'p7',
      "Limiter les droits d'un compte de service.",
      true,
      'Pourquoi p7.',
    ),
    item('p8', 'Concaténer des chaînes en SQL.', false, 'Pourquoi p8.'),
  ],
}

afterEach(() => {
  vi.useRealTimers()
})

const sortAll = (keep: boolean[]) => {
  keep.forEach((decision, index) => {
    const button = screen.getByRole('button', {
      name: decision ? /garder/i : /jeter/i,
    })
    fireEvent.click(button)
    if (index < keep.length - 1) {
      // La carte suivante doit être visible après chaque tri.
      expect(
        screen.getByText(config.items[index + 1].label),
      ).toBeInTheDocument()
    }
  })
}

describe('keep or toss game, rendered', () => {
  it('opens on the first card, no feedback, no counted-justes, no keep or reason visible', () => {
    render(<KeepOrTossGame config={config} onSubmit={vi.fn()} />)

    expect(screen.getByText(config.statement)).toBeInTheDocument()
    expect(screen.getByText(config.items[0].label)).toBeInTheDocument()
    expect(screen.getByText(/0 sur 8/)).toBeInTheDocument()

    const visible = document.body.textContent ?? ''
    expect(visible).not.toContain('Pourquoi')
    expect(visible).not.toMatch(/juste|correct|score/i)
  })

  it('advances to the next card and increments the sorted count on Garder', () => {
    render(<KeepOrTossGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /garder/i }))

    expect(screen.getByText(config.items[1].label)).toBeInTheDocument()
    expect(screen.getByText(/1 sur 8/)).toBeInTheDocument()
  })

  it('advances to the next card on Jeter too, the same way as Garder', () => {
    render(<KeepOrTossGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /jeter/i }))

    expect(screen.getByText(config.items[1].label)).toBeInTheDocument()
    expect(screen.getByText(/1 sur 8/)).toBeInTheDocument()
  })

  it('reaches the exact same state through ArrowLeft as through a click on Garder', () => {
    const { unmount } = render(
      <KeepOrTossGame config={config} onSubmit={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /garder/i }))
    const afterClick = screen.getByText(config.items[1].label).textContent
    unmount()

    render(<KeepOrTossGame config={config} onSubmit={vi.fn()} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /garder/i }), {
      key: 'ArrowLeft',
    })
    const afterArrow = screen.getByText(config.items[1].label).textContent

    expect(afterArrow).toBe(afterClick)
  })

  it('reaches the exact same state through ArrowRight as through a click on Jeter', () => {
    const { unmount } = render(
      <KeepOrTossGame config={config} onSubmit={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /jeter/i }))
    const afterClick = screen.getByText(/1 sur 8/).textContent
    unmount()

    render(<KeepOrTossGame config={config} onSubmit={vi.fn()} />)
    fireEvent.keyDown(screen.getByRole('button', { name: /jeter/i }), {
      key: 'ArrowRight',
    })
    const afterArrow = screen.getByText(/1 sur 8/).textContent

    expect(afterArrow).toBe(afterClick)
  })

  /**
   * Constat 4 de la revue du 31/08 : un clic sur la carte — un `<div>` non
   * focusable — retirait le focus vers `<body>`, et la flèche suivante ne
   * faisait plus rien, silencieusement. L'ancien test envoyait `keyDown`
   * directement sur le bouton, ce qui présupposait le focus au lieu de le
   * vérifier ; celui-ci part du geste réel — un clic sur la carte — puis
   * interroge `document.activeElement`, jamais un élément choisi d'avance.
   *
   * `jsdom` ne rejoue pas le comportement natif d'un vrai navigateur qui
   * retire le focus au `mousedown` sur un élément non focusable — un simple
   * `fireEvent.click` n'y suffit pas à reproduire la panne. Le focus est
   * donc explicitement retiré au bouton d'abord (`blur()`), ce qui rejoue
   * l'état exact que la panne laissait derrière elle en navigateur réel ;
   * sans le correctif de `SortingDeck` (le clic sur la carte replaçant le
   * focus), ce test échouerait.
   */
  it('restores focus to Garder when the card itself is clicked, so the arrow keys keep working', () => {
    render(<KeepOrTossGame config={config} onSubmit={vi.fn()} />)

    const keepButton = screen.getByRole('button', { name: /garder/i })
    keepButton.blur()
    expect(document.activeElement).not.toBe(keepButton)

    fireEvent.click(screen.getByText(config.items[0].label))

    expect(document.activeElement).toBe(keepButton)
  })

  it('reaches the exact same state through ArrowLeft as through a click on Garder, even after a stray click on the card', () => {
    const { unmount } = render(
      <KeepOrTossGame config={config} onSubmit={vi.fn()} />,
    )
    fireEvent.click(screen.getByRole('button', { name: /garder/i }))
    const afterClick = screen.getByText(config.items[1].label).textContent
    unmount()

    render(<KeepOrTossGame config={config} onSubmit={vi.fn()} />)
    // Le geste naturel qui tuait le clavier avant le correctif : cliquer la
    // carte, pas le bouton.
    fireEvent.click(screen.getByText(config.items[0].label))
    fireEvent.keyDown(document.activeElement as Element, { key: 'ArrowLeft' })
    const afterArrow = screen.getByText(config.items[1].label).textContent

    expect(afterArrow).toBe(afterClick)
  })

  it('announces the current card label in an aria-live region, so a screen reader hears the next card without leaving the button', () => {
    render(<KeepOrTossGame config={config} onSubmit={vi.fn()} />)

    const card = screen.getByText(config.items[0].label)
    expect(card.closest('[aria-live]')).toHaveAttribute('aria-live', 'polite')

    fireEvent.click(screen.getByRole('button', { name: /garder/i }))

    const nextCard = screen.getByText(config.items[1].label)
    expect(nextCard.closest('[aria-live]')).toHaveAttribute(
      'aria-live',
      'polite',
    )
  })

  it('freezes after the last card, showing neither the verdict nor a running score, then reveals on request', () => {
    render(<KeepOrTossGame config={config} onSubmit={vi.fn()} />)

    sortAll([true, false, true, false, true, false, true, false])

    expect(screen.getByText(/le tri est figé/i)).toBeInTheDocument()
    const frozenVisible = document.body.textContent ?? ''
    expect(frozenVisible).not.toMatch(/juste|correct|score/i)

    fireEvent.click(screen.getByRole('button', { name: /voir la révélation/i }))

    config.items.forEach((entry) => {
      expect(screen.getByText(entry.label)).toBeInTheDocument()
      expect(screen.getByText(entry.reason)).toBeInTheDocument()
    })
    // Deux camps, chacun son titre — plus de chip « à garder »/« à jeter »
    // par ligne depuis la refonte de la révélation (constat 5).
    expect(screen.getByText('Gardées')).toBeInTheDocument()
    expect(screen.getByText('Jetées')).toBeInTheDocument()
  })

  it('never reveals what the player answered, only the expected verdict and reason', () => {
    render(<KeepOrTossGame config={config} onSubmit={vi.fn()} />)

    // Trie tout à l'envers de la réponse attendue.
    sortAll([false, true, false, true, false, true, false, true])
    fireEvent.click(screen.getByRole('button', { name: /voir la révélation/i }))

    const visible = document.body.textContent ?? ''
    expect(visible).not.toMatch(/manqué|raté|faux|score/i)
  })

  it('submits the frozen trace only once, even if continue fires twice', () => {
    const onSubmit = vi.fn()
    render(<KeepOrTossGame config={config} onSubmit={onSubmit} />)

    sortAll([true, false, true, false, true, false, true, false])
    fireEvent.click(screen.getByRole('button', { name: /voir la révélation/i }))
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }))
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const answer = onSubmit.mock.calls[0][0] as { verdicts: unknown[] }
    expect(answer.verdicts).toHaveLength(8)
  })
})
