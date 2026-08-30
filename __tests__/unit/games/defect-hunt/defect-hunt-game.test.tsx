import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DefectHuntGame } from '@/games/defect-hunt/components/composites/defect-hunt-game'

/**
 * Vérification de rendu réel, en Testing Library plutôt qu'en navigateur : la
 * stratégie de test du projet range déjà les écrans dans le périmètre Vitest
 * unit, sur le modèle de `confidence-bet-game.test.tsx`.
 */

const config = {
  statement:
    'Cinq défauts se cachent dans cet extrait. Leur nature n’est dite nulle part, aucune liste ne vous est proposée.',
  snippet: {
    label: 'Extrait de test',
    language: 'ts',
    code: [
      "import { leftpad } from 'left-pad-string-safe'",
      'export function handler(req, res) {',
      `  const query = \`SELECT * FROM t WHERE id = '\${req.query.id}'\``,
      '  return db.run(query)',
      '  const page = Number(req.query.page)',
      '}',
    ].join('\n'),
  },
  timeLimitSeconds: 180,
  defects: [
    {
      id: 'd1',
      line: 1,
      kind: 'hallucinated-dependency',
      reveal: 'Ce paquet n’existe pas.',
    },
    { id: 'd2', line: 3, kind: 'security', reveal: 'Injection SQL directe.' },
    {
      id: 'd3',
      line: 4,
      kind: 'resource',
      reveal: 'La ressource ne se referme jamais.',
    },
    {
      id: 'd4',
      line: 5,
      kind: 'logic',
      reveal: 'La page décalée saute le premier élément.',
    },
  ],
}

/**
 * Une ligne n'est pas un bouton : c'est une option d'une liste à sélection
 * multiple. Vingt-cinq boutons feraient vingt-cinq arrêts de tabulation, et un
 * joueur au clavier devrait traverser tout le code pour atteindre le rendu.
 */
const lineOption = (lineNumber: number) =>
  screen.getByRole('option', { name: new RegExp(`^ligne ${lineNumber}`, 'i') })

const lineList = () => screen.getByRole('listbox')

afterEach(() => {
  vi.useRealTimers()
})

describe('defect hunt game, rendered', () => {
  it('opens with the statement and the extract lines', () => {
    render(<DefectHuntGame config={config} onSubmit={vi.fn()} />)

    expect(screen.getByText(config.statement)).toBeInTheDocument()
    expect(lineOption(1)).toBeInTheDocument()
    expect(lineOption(6)).toBeInTheDocument()
  })

  /**
   * Le joueur n'a aucune règle d'arrêt : il décide lui-même quand sa revue
   * est finie. Lui donner le nombre de défauts, sous n'importe quelle forme,
   * lui rendrait cette règle et changerait ce que le jeu mesure.
   */
  it('never tells how many defects the extract carries before the review is rendered', () => {
    render(<DefectHuntGame config={config} onSubmit={vi.fn()} />)

    expect(screen.queryByText(/à trouver/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/sur 4/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/4 défauts/i)).not.toBeInTheDocument()
  })

  /**
   * L'acceptance dure de la surface : un extrait de vingt-cinq lignes ne doit
   * pas coûter vingt-cinq arrêts de tabulation. Un seul descendant de la liste
   * porte `tabIndex=0`, les autres sont hors du parcours de tabulation.
   */
  it('costs a single tab stop for the whole sheet', () => {
    render(<DefectHuntGame config={config} onSubmit={vi.fn()} />)

    const focusable = screen
      .getAllByRole('option')
      .filter((option) => option.getAttribute('tabindex') === '0')

    expect(focusable).toHaveLength(1)
    expect(screen.getAllByRole('option')).toHaveLength(6)
  })

  it('reveals no defect nature, no faulty line and no threshold before the review is rendered', () => {
    render(<DefectHuntGame config={config} onSubmit={vi.fn()} />)

    expect(screen.queryByText(/sécurité/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/dépendance hallucinée/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/trouvé/i)).not.toBeInTheDocument()
  })

  it('marks a line on click, and unmarks it on a second click', () => {
    render(<DefectHuntGame config={config} onSubmit={vi.fn()} />)

    const line = lineOption(3)
    expect(line).toHaveAttribute('aria-selected', 'false')

    fireEvent.click(line)
    expect(line).toHaveAttribute('aria-selected', 'true')

    fireEvent.click(line)
    expect(line).toHaveAttribute('aria-selected', 'false')
  })

  it('walks the sheet and marks a line by keyboard alone: arrows move, space marks', () => {
    render(<DefectHuntGame config={config} onSubmit={vi.fn()} />)

    lineOption(1).focus()

    // Deux flèches descendent jusqu'à la ligne 3, et le focus suit vraiment le
    // nœud : sans cela, un lecteur d'écran resterait sur la première ligne
    // pendant que la sélection avance ailleurs.
    fireEvent.keyDown(lineList(), { key: 'ArrowDown' })
    fireEvent.keyDown(lineList(), { key: 'ArrowDown' })
    expect(document.activeElement).toBe(lineOption(3))

    fireEvent.keyDown(lineList(), { key: ' ' })
    expect(lineOption(3)).toHaveAttribute('aria-selected', 'true')

    // `Fin` saute au bas de la feuille sans traverser les lignes une à une.
    fireEvent.keyDown(lineList(), { key: 'End' })
    expect(document.activeElement).toBe(lineOption(6))
  })

  it('shows the count found, missed, and submits the marked lines with the elapsed duration', () => {
    const onSubmit = vi.fn()
    render(<DefectHuntGame config={config} onSubmit={onSubmit} />)

    fireEvent.click(lineOption(1))
    fireEvent.click(lineOption(3))
    fireEvent.click(lineOption(2)) // ligne saine : marque posée à côté

    fireEvent.click(screen.getByRole('button', { name: /rendre ma revue/i }))

    // Deux bonnes réponses, une mauvaise : le total de défauts n'apparaît
    // qu'ici, et le score net porte son signe.
    expect(
      screen.getByText(/2 trouvés sur 4 · 1 marque à côté/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/\+1 point/i)).toBeInTheDocument()
    expect(screen.getByText('Ce paquet n’existe pas.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /situation suivante/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
    const answer = onSubmit.mock.calls[0][0] as { markedLines: number[] }
    expect(answer.markedLines).toEqual([1, 2, 3])
  })

  it('does not carry a mark toggled off before the review is rendered', () => {
    const onSubmit = vi.fn()
    render(<DefectHuntGame config={config} onSubmit={onSubmit} />)

    fireEvent.click(lineOption(4))
    fireEvent.click(lineOption(4))
    fireEvent.click(lineOption(1))

    fireEvent.click(screen.getByRole('button', { name: /rendre ma revue/i }))
    fireEvent.click(screen.getByRole('button', { name: /situation suivante/i }))

    const answer = onSubmit.mock.calls[0][0] as { markedLines: number[] }
    expect(answer.markedLines).toEqual([1])
  })

  it('locks the review at render: no more clickable line, the reported count unchanged', () => {
    render(<DefectHuntGame config={config} onSubmit={vi.fn()} />)

    fireEvent.click(lineOption(1))
    fireEvent.click(screen.getByRole('button', { name: /rendre ma revue/i }))

    expect(screen.getByText(/1 trouvé sur 4/i)).toBeInTheDocument()

    // La feuille rendue n'est plus un contrôle du tout : ni liste, ni options,
    // ni arrêt de tabulation. Le verrou se voit dans l'arbre d'accessibilité.
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    expect(screen.queryAllByRole('option')).toHaveLength(0)
  })

  it('submits the trace only once, even if the passage action fires twice', () => {
    const onSubmit = vi.fn()
    render(<DefectHuntGame config={config} onSubmit={onSubmit} />)

    fireEvent.click(lineOption(1))
    fireEvent.click(screen.getByRole('button', { name: /rendre ma revue/i }))
    fireEvent.click(screen.getByRole('button', { name: /situation suivante/i }))
    fireEvent.click(screen.getByRole('button', { name: /situation suivante/i }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  /**
   * Le cadran ne ment pas sur l'état de la partie : une fois la revue rendue,
   * il cesse d'annoncer un temps « restant » — la partie ne court plus — et
   * bascule sur la durée qu'elle a prise, figée.
   */
  it('freezes the dial on the duration the review took once it is rendered', () => {
    vi.useFakeTimers()
    render(<DefectHuntGame config={config} onSubmit={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(1500)
    })

    fireEvent.click(lineOption(1))
    fireEvent.click(screen.getByRole('button', { name: /rendre ma revue/i }))

    expect(screen.queryByText(/restant/i)).not.toBeInTheDocument()
    const dial = screen.getByText(/rendue en/i).parentElement
    const frozen = dial?.textContent

    act(() => {
      vi.advanceTimersByTime(5000)
    })

    expect(screen.getByText(/rendue en/i).parentElement?.textContent).toBe(
      frozen,
    )
  })

  it('keeps the review playable and names the overrun once the time budget is spent', () => {
    vi.useFakeTimers()
    render(
      <DefectHuntGame
        config={{ ...config, timeLimitSeconds: 1 }}
        onSubmit={vi.fn()}
      />,
    )

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(screen.getByText(/dépassé de/i)).toBeInTheDocument()

    const line = lineOption(1)
    fireEvent.click(line)
    expect(line).toHaveAttribute('aria-selected', 'true')
  })
})
