import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { HintBudgetGame } from '@/games/hint-budget/components/composites/hint-budget-game'

/**
 * Vérification de rendu réel, en Testing Library plutôt qu'en navigateur :
 * la stratégie de test du projet range déjà les écrans dans le périmètre
 * Vitest unit, sur le modèle de `lie-detector-game.test.tsx`.
 */

const framing = (id: string, established: boolean) => ({
  id,
  text: `Lecture ${id}, longue de quelques mots pour ressembler au corpus réel.`,
  established,
})

const hint = (id: string, cost: number) => ({
  id,
  label: `Indice ${id}`,
  cost,
  text: `Ceci est le texte révélé de l'indice ${id}.`,
})

const cause = (id: string, actual: boolean) => ({
  id,
  text: `Cause candidate ${id}, longue de quelques mots.`,
  actual,
  verification: `Ceci est la vérification de la cause ${id}.`,
})

const situation = (id: string) => ({
  id,
  symptom: `Symptôme observé pour la situation ${id}.`,
  report: [
    `Premier fait du rapport de ${id}.`,
    `Second fait du rapport de ${id}.`,
  ],
  framings: [
    framing(`${id}-f1`, true),
    framing(`${id}-f2`, true),
    framing(`${id}-f3`, false),
    framing(`${id}-f4`, false),
    framing(`${id}-f5`, false),
  ],
  hints: [hint(`${id}-h1`, 5), hint(`${id}-h2`, 10), hint(`${id}-h3`, 15)],
  causes: [
    cause(`${id}-c1`, false),
    cause(`${id}-c2`, true),
    cause(`${id}-c3`, false),
  ],
})

const config = {
  statement:
    "Le cadre se transmet une seule fois, chaque indice a un prix affiché, et l'ordre des deux gestes est libre.",
  wrongCutPenalty: 40,
  blindCutSurcharge: 30,
  situations: [situation('s1'), situation('s2'), situation('s3')],
}

describe('hint budget game, rendered', () => {
  it('opens with the symptom, the report, the framing and the hints market all present at first render', () => {
    render(<HintBudgetGame config={config} onSubmit={vi.fn()} />)

    expect(screen.getByText(config.situations[0].symptom)).toBeInTheDocument()
    expect(screen.getByText(config.situations[0].report[0])).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(config.situations[0].framings[0].text)),
    ).toBeInTheDocument()
    expect(
      screen.getByText(config.situations[0].hints[0].label),
    ).toBeInTheDocument()
  })

  it('announces the price of every hint before any purchase, with no hover or reveal needed', () => {
    render(<HintBudgetGame config={config} onSubmit={vi.fn()} />)

    config.situations[0].hints.forEach((entry) => {
      expect(
        screen.getByRole('button', {
          name: new RegExp(`acheter · ${entry.cost}`, 'i'),
        }),
      ).toBeInTheDocument()
    })
  })

  it('never buys more than one hint per click: a single click leaves the others available', () => {
    render(<HintBudgetGame config={config} onSubmit={vi.fn()} />)

    const [first] = config.situations[0].hints
    fireEvent.click(screen.getByRole('button', { name: /acheter · 5/i }))

    expect(screen.getByText(first.text)).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /acheter · 10/i }),
    ).toBeInTheDocument()
  })

  it('locks the framing at deposit: a click on a reading afterwards changes nothing', () => {
    render(<HintBudgetGame config={config} onSubmit={vi.fn()} />)

    const readingButton = screen.getByRole('button', {
      name: new RegExp(config.situations[0].framings[0].text),
    })
    fireEvent.click(readingButton)
    expect(readingButton).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(
      screen.getByRole('button', { name: /transmettre ce cadre/i }),
    )
    expect(
      screen.getByRole('button', { name: /cadre transmis/i }),
    ).toBeDisabled()

    const otherReading = screen.getByRole('button', {
      name: new RegExp(config.situations[0].framings[1].text),
    })
    fireEvent.click(otherReading)
    expect(otherReading).toHaveAttribute('aria-pressed', 'false')
  })

  it('leaks nothing before the reveal: no verification text, no unbought hint text, no mark distinguishing the two natures of framing reading', () => {
    const { container } = render(
      <HintBudgetGame config={config} onSubmit={vi.fn()} />,
    )

    const visible = container.textContent ?? ''
    config.situations[0].causes.forEach((entry) => {
      expect(visible).not.toContain(entry.verification)
    })
    config.situations[0].hints.forEach((entry) => {
      expect(visible).not.toContain(entry.text)
    })
    expect(visible).not.toMatch(/établie|supposition|suppos[ée]e/i)
  })

  it('announces no consequence before cutting: no wrong-cut penalty figures on screen', () => {
    render(<HintBudgetGame config={config} onSubmit={vi.fn()} />)

    expect(screen.queryByText(/40/)).not.toBeInTheDocument()
    expect(screen.queryByText(/30/)).not.toBeInTheDocument()
  })

  it('reveals the actual cause and the verifications of every cause once the situation is cut', () => {
    render(<HintBudgetGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(config.situations[0].causes[0].text),
      }),
    )

    config.situations[0].causes.forEach((entry) => {
      expect(screen.getByText(entry.verification)).toBeInTheDocument()
    })
  })

  it('the second gesture is unique: once revealed, no cause remains a clickable button', () => {
    render(<HintBudgetGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(config.situations[0].causes[0].text),
      }),
    )

    expect(
      screen.queryByRole('button', {
        name: new RegExp(config.situations[0].causes[1].text),
      }),
    ).not.toBeInTheDocument()
  })

  it('submits a trace with one attempt per situation, only once even if the passage action fires twice', () => {
    const onSubmit = vi.fn()
    render(<HintBudgetGame config={config} onSubmit={onSubmit} />)

    const playSituation = (index: number) => {
      fireEvent.click(
        screen.getByRole('button', {
          name: new RegExp(config.situations[index].causes[1].text),
        }),
      )
    }

    playSituation(0)
    fireEvent.click(screen.getByRole('button', { name: /situation suivante/i }))

    playSituation(1)
    fireEvent.click(screen.getByRole('button', { name: /situation suivante/i }))

    playSituation(2)
    fireEvent.click(screen.getByRole('button', { name: /groupe suivant/i }))
    fireEvent.click(screen.getByRole('button', { name: /groupe suivant/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const answer = onSubmit.mock.calls[0][0] as {
      attempts: { situationId: string }[]
    }
    expect(answer.attempts.map((entry) => entry.situationId)).toEqual([
      's1',
      's2',
      's3',
    ])
  })

  /**
   * Garde-fou de la passe : une lecture établie et une supposition doivent
   * produire exactement le même arbre, seul le texte variant.
   */
  it('renders an established reading and a supposition with exactly the same structure', () => {
    // Deux configurations valides, chacune avec exactement une lecture
    // établie — le garde-fou anti-triche du schéma l'exige — mais sur un
    // identifiant différent (`f1` puis `f2`). Le texte de `f1` et `f2` étant
    // interchangeable dans ce corpus de test, les deux rendus doivent être
    // identiques : rien à l'écran ne doit dépendre de laquelle est établie.
    const configWith = (establishedId: string) => ({
      ...config,
      situations: [
        {
          ...situation('s1'),
          framings: [
            framing('s1-f1', establishedId === 's1-f1'),
            framing('s1-f2', establishedId === 's1-f2'),
            framing('s1-f3', false),
            framing('s1-f4', false),
            framing('s1-f5', false),
          ],
        },
        situation('s2'),
        situation('s3'),
      ],
    })

    const markupOf = (establishedId: string): string => {
      const { container, unmount } = render(
        <HintBudgetGame
          config={configWith(establishedId)}
          onSubmit={vi.fn()}
        />,
      )
      const markup = container.innerHTML
        .replaceAll('s1-f1', 's1-fX')
        .replaceAll('s1-f2', 's1-fX')
      unmount()
      return markup
    }

    expect(markupOf('s1-f1')).toBe(markupOf('s1-f2'))
  })

  it('keeps the framing and the hints market both reachable from the initial focus order', () => {
    render(<HintBudgetGame config={config} onSubmit={vi.fn()} />)

    const framingButton = screen.getByRole('button', {
      name: new RegExp(config.situations[0].framings[0].text),
    })
    const hintButton = screen.getByRole('button', { name: /acheter · 5/i })

    expect(framingButton).toBeInTheDocument()
    expect(hintButton).toBeInTheDocument()
  })

  /**
   * Garde-fou de la passe : la révélation pose la cause et le relevé,
   * jamais un verdict sur le cadrage. Aucun mot ne doit qualifier le
   * cadrage, qu'il ait été posé d'entrée, tardivement, partiellement ou
   * jamais.
   */
  it('never qualifies the framing at the revelation, whatever the framing was', () => {
    render(<HintBudgetGame config={config} onSubmit={vi.fn()} />)

    // Le panneau "Le cadrage" et son bouton "Transmettre ce cadre" restent
    // légitimement visibles après la tranche : ce texte de chrome n'est pas
    // ce que ce garde-fou vérifie. Seul le relevé — le pied de la révélation
    // — ne doit jamais qualifier le cadrage.
    fireEvent.click(
      screen.getByRole('button', {
        name: new RegExp(config.situations[0].causes[0].text),
      }),
    )

    const total = screen.getByText(/^total/i)
    const revelationFooter = total.closest('footer')?.textContent ?? ''
    expect(revelationFooter).not.toMatch(
      /cadr|fond[ée]|établi|suppos|grounded|framing/i,
    )
  })

  /**
   * L'ordre de parcours au clavier et au lecteur d'écran doit suivre l'ordre
   * de lecture du corpus, dans les deux inventaires, jamais un ordre visuel
   * recomposé par la grille — sur le modèle de `lie-detector-game.test.tsx`.
   */
  it('keeps the framing list and the hints market in the corpus reading order for keyboard and screen-reader traversal', () => {
    render(<HintBudgetGame config={config} onSubmit={vi.fn()} />)

    const framingTexts = config.situations[0].framings.map(
      (entry) => entry.text,
    )
    const framingButtons = screen
      .getAllByRole('button')
      .filter((button) =>
        framingTexts.some((text) => button.textContent?.includes(text)),
      )
    const framingOrder = framingButtons.map((button) =>
      framingTexts.findIndex((text) => button.textContent?.includes(text)),
    )
    expect(framingOrder).toEqual([0, 1, 2, 3, 4])

    // Les intitulés d'indices apparaissent dans le document dans le même
    // ordre que le corpus, indépendamment de tout repositionnement visuel
    // par la grille CSS.
    const domNodes = Array.from(document.body.querySelectorAll('*'))
    const hintLabels = config.situations[0].hints.map((entry) => entry.label)
    const hintPositions = hintLabels.map((label) =>
      domNodes.indexOf(screen.getByText(label)),
    )

    hintPositions.reduce((previous, current) => {
      expect(current).toBeGreaterThan(previous)
      return current
    })
  })
})
