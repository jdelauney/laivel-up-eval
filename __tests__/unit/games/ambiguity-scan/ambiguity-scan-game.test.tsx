import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AmbiguityScanGame } from '@/games/ambiguity-scan/components/composites/ambiguity-scan-game'

const segment = (
  id: string,
  text: string,
  ambiguous: boolean,
  reading?: string,
) => ({
  id,
  text,
  ambiguous,
  ...(ambiguous ? { reading: reading ?? `Lecture de ${id}.` } : {}),
})

const config = {
  statement: 'Un chef de produit vous transmet cette demande, telle quelle.',
  promptTitle: 'La demande transmise',
  segments: [
    segment('s1', 'Ajoute une notification par email', false),
    segment('s2', "dès qu'une commande est validée,", false),
    segment('s3', 'avec un ton qui correspond à la marque,', true),
    segment('s4', 'un design proche des autres emails,', true),
    segment('s5', "en cas d'échec, on relance,", true),
    segment('s6', 'limité aux commandes de plus de dix euros.', false),
  ],
}

describe('ambiguity scan game, rendered', () => {
  it('lists every segment as an unpressed toggle, and the lock action unavailable', () => {
    render(
      <AmbiguityScanGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    config.segments.forEach((entry) => {
      expect(screen.getByRole('button', { name: entry.text })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })
    expect(
      screen.getByRole('button', { name: /verrouiller mes signalements/i }),
    ).toBeDisabled()
    expect(screen.getByText(/aucun segment signalé/i)).toBeInTheDocument()
  })

  it('flags a segment on click, without revealing which segments are ambiguous', () => {
    render(
      <AmbiguityScanGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: config.segments[0].text }),
    )

    expect(
      screen.getByRole('button', { name: config.segments[0].text }),
    ).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText(/1 segment signalé/i)).toBeInTheDocument()
    const visible = document.body.textContent ?? ''
    expect(visible).not.toMatch(/Lecture de/)
  })

  it('makes the lock action available as soon as one segment is flagged', () => {
    render(
      <AmbiguityScanGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: config.segments[2].text }),
    )

    expect(
      screen.getByRole('button', { name: /verrouiller mes signalements/i }),
    ).toBeEnabled()
  })

  it('reveals the ambiguous segments and their reading, never a verdict on the player', () => {
    render(
      <AmbiguityScanGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: config.segments[2].text }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: /verrouiller mes signalements/i }),
    )

    config.segments
      .filter((entry) => entry.ambiguous)
      .forEach((entry) => {
        expect(screen.getByText(entry.text)).toBeInTheDocument()
        expect(screen.getByText(entry.reading as string)).toBeInTheDocument()
      })
    const visible = document.body.textContent ?? ''
    expect(visible).not.toMatch(/correctement|manqué|réussi|raté|score/i)
  })

  it('shows the whole prompt again at reveal, clear segments included, not a detached extract of the ambiguous ones', () => {
    render(
      <AmbiguityScanGame
        config={config}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: config.segments[2].text }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: /verrouiller mes signalements/i }),
    )

    config.segments
      .filter((entry) => !entry.ambiguous)
      .forEach((entry) => {
        expect(screen.getByText(entry.text)).toBeInTheDocument()
      })
  })

  it('locks a trace of the flagged segments on lock, before continue is even clicked', () => {
    const onLock = vi.fn()
    render(
      <AmbiguityScanGame config={config} onLock={onLock} onAdvance={vi.fn()} />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: config.segments[4].text }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: config.segments[2].text }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: /verrouiller mes signalements/i }),
    )

    expect(onLock).toHaveBeenCalledTimes(1)
    const answer = onLock.mock.calls[0][0] as { flaggedIds: string[] }
    // La trace suit l'ordre de la configuration (s3 avant s5), jamais celui
    // dans lequel le joueur a cliqué.
    expect(answer.flaggedIds).toEqual(['s3', 's5'])
  })

  it('advances only once, even if continue fires twice', () => {
    const onAdvance = vi.fn()
    render(
      <AmbiguityScanGame
        config={config}
        onLock={vi.fn()}
        onAdvance={onAdvance}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: config.segments[4].text }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: /verrouiller mes signalements/i }),
    )
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }))
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }))

    expect(onAdvance).toHaveBeenCalledTimes(1)
  })
})
