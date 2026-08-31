import { fireEvent, render, screen, within } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { Course } from '@/core/contracts/course.schema'
import { PracticeMapGame } from '@/games/practice-map/components/composites/practice-map-game'
import { practiceMapConfigSchema } from '@/games/practice-map/schema/config.schema'
import projectCourse from '../../../../config/course.json'

/**
 * Vérification de rendu réel, en Testing Library plutôt qu'en navigateur,
 * sur le modèle de `hint-budget-game.test.tsx`.
 *
 * jsdom ne met jamais en page : `getBoundingClientRect` y rend toujours un
 * rectangle nul. Le plan s'appuie dessus pour convertir un clic en
 * coordonnée `[0,1]` — un geste bien réel en navigateur — donc le
 * rectangle est fixé ici une fois pour toutes.
 */
beforeAll(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    width: 100,
    height: 100,
    top: 0,
    left: 0,
    right: 100,
    bottom: 100,
    x: 0,
    y: 0,
    toJSON: () => {},
  } as DOMRect)
})

const poles = () => ({
  intensityLow: 'vous le faites',
  intensityHigh: "l'agent le fait seul",
  rigorLow: 'rien ne la vérifie',
  rigorHigh: 'un garde-fou la tient sans vous',
})

const quadrants = () => ({
  highRigorLowIntensity: 'Outillé, à la main',
  highRigorHighIntensity: 'Outillé, délégué',
  lowRigorLowIntensity: 'À la main, sans filet',
  lowRigorHighIntensity: 'Délégué, sans filet',
})

const zone = (
  intensityFrom: number,
  intensityTo: number,
  rigorFrom: number,
  rigorTo: number,
) => ({ intensityFrom, intensityTo, rigorFrom, rigorTo })

const practice = (
  id: string,
  label: string,
  shortLabel: string,
  expected: ReturnType<typeof zone>,
) => ({
  id,
  label,
  shortLabel,
  expected,
  marker: `Repère de ${id}, une phrase qui explique ce qu'elle demande réellement.`,
})

const config = {
  statement:
    "Chaque pratique se pose n'importe où sur le plan, sans case prédéfinie. Rien n'est déclaratif : la lecture se verrouille à la soumission.",
  highRigorFrom: 0.5,
  poles: poles(),
  quadrants: quadrants(),
  practices: [
    practice(
      'p1',
      'Relancer le même prompt',
      'Relance prompt',
      zone(0, 0.2, 0, 0.2),
    ),
    practice(
      'p2',
      'Relire chaque diff',
      'Relire diff',
      zone(0.3, 0.5, 0.3, 0.5),
    ),
    practice(
      'p3',
      'Brancher une boucle qui relance',
      'Boucle relance',
      zone(0.6, 0.8, 0.6, 0.8),
    ),
    practice(
      'p4',
      'Écrire le fichier de contexte',
      'Fichier contexte',
      zone(0.8, 1, 0, 0.15),
    ),
  ],
  orderings: [
    { id: 'o1', axis: 'rigor', higherId: 'p3', lowerId: 'p1' },
    { id: 'o2', axis: 'rigor', higherId: 'p2', lowerId: 'p1' },
    { id: 'o3', axis: 'intensity', higherId: 'p4', lowerId: 'p1' },
  ],
}

/** Le corpus réel de `g2-2`, sept pratiques. */
const realG2_2Config = () => {
  const group = (projectCourse as Course).groups.find((entry) =>
    entry.games.some((game) => game.id === 'g2-2'),
  )
  const game = group?.games.find((entry) => entry.id === 'g2-2')
  if (game === undefined) {
    throw new Error('g2-2 introuvable dans le parcours réel')
  }
  return practiceMapConfigSchema.parse(game.config)
}

/**
 * La légende permanente de la réserve, scopée pour distinguer sa ligne d'une
 * pratique du badge du plan qui porte le même nom accessible une fois cette
 * pratique posée — les deux boutons partagent `aria-label={label}`.
 */
const reserveSection = (): HTMLElement =>
  screen.getByText(/la réserve/i).closest('section') as HTMLElement

const plane = (): HTMLElement =>
  screen.getByRole('application', { name: /le plan des pratiques/i })

/** Saisit une pratique depuis la légende, jamais depuis le plan. */
const holdFromReserve = (label: string): void => {
  fireEvent.click(within(reserveSection()).getByRole('button', { name: label }))
}

describe('practice map game, rendered', () => {
  it('lists every practice in the permanent legend, and the submit action unavailable', () => {
    render(
      <PracticeMapGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    config.practices.forEach((entry) => {
      expect(
        within(reserveSection()).getByText(entry.label),
      ).toBeInTheDocument()
    })
    expect(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    ).toBeDisabled()
  })

  /**
   * Révision du 30/08 : la réserve devient une légende permanente. Poser une
   * pratique ne la retire plus de la liste — perdre la clé d'un numéro au
   * moment de relire son plan serait perdre ce que le jeu mesure. Seul son
   * marqueur change, et c'est une quantité (plein contre évidé), jamais une
   * teinte seule.
   */
  it('keeps a placed practice listed in the legend, its marker turned solid, rather than removing it', () => {
    render(
      <PracticeMapGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    holdFromReserve(config.practices[0].label)
    fireEvent.click(plane(), { clientX: 10, clientY: 10 })

    const row = within(reserveSection()).getByRole('button', {
      name: config.practices[0].label,
    })
    expect(row).toBeInTheDocument()
    // Le marqueur rond à gauche du numéro passe d'évidé à plein.
    const marker = row.querySelector('span[aria-hidden]')
    expect(marker?.className).toContain('bg-plane-foreground')
    expect(screen.getByText(/il reste 3 pratique/i)).toBeInTheDocument()
  })

  /**
   * Révision du 30/08 : un jeton posé n'affiche plus qu'un badge numéroté —
   * plus aucun texte de libellé en clair sur le plan. Le nom accessible du
   * bouton reste le libellé entier, jamais le numéro seul, et `shortLabel`
   * reste présent dans le DOM pour la révélation au focus.
   */
  it('shows a numbered badge on the plane once placed, keeping label as accessible name', () => {
    render(
      <PracticeMapGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    holdFromReserve(config.practices[0].label)
    fireEvent.click(plane(), { clientX: 10, clientY: 10 })

    expect(within(plane()).getByText('1')).toBeInTheDocument()
    expect(
      within(plane()).queryByText(config.practices[0].label),
    ).not.toBeInTheDocument()
    expect(screen.getByText(config.practices[0].shortLabel)).toBeInTheDocument()
    expect(
      within(plane()).getByRole('button', { name: config.practices[0].label }),
    ).toBeInTheDocument()
  })

  it('makes the submit action available once every practice is placed', () => {
    render(
      <PracticeMapGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    config.practices.forEach((entry) => {
      holdFromReserve(entry.label)
      fireEvent.click(plane(), { clientX: 10, clientY: 10 })
    })

    expect(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    ).toBeEnabled()
  })

  it('reveals a marker per practice, never the expected zone or a placement verdict', () => {
    render(
      <PracticeMapGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    config.practices.forEach((entry) => {
      holdFromReserve(entry.label)
      fireEvent.click(plane(), { clientX: 10, clientY: 10 })
    })
    fireEvent.click(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    )

    config.practices.forEach((entry) => {
      expect(screen.getByText(entry.marker)).toBeInTheDocument()
    })
    const visible = document.body.textContent ?? ''
    expect(visible).not.toMatch(/zone attendue|dans sa zone|hors zone/i)
  })

  it('locks a trace of four placements on submit, before continue is even clicked', () => {
    const onLock = vi.fn()
    render(
      <PracticeMapGame config={config} onLock={onLock} onAdvance={vi.fn()} />,
    )

    config.practices.forEach((entry) => {
      holdFromReserve(entry.label)
      fireEvent.click(plane(), { clientX: 10, clientY: 10 })
    })
    fireEvent.click(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    )

    expect(onLock).toHaveBeenCalledTimes(1)
    const answer = onLock.mock.calls[0][0] as {
      placements: { practiceId: string }[]
    }
    expect(answer.placements.map((entry) => entry.practiceId)).toEqual([
      'p1',
      'p2',
      'p3',
      'p4',
    ])
  })

  it('advances only once, even if continue fires twice', () => {
    const onAdvance = vi.fn()
    render(
      <PracticeMapGame
        config={config}
        onLock={vi.fn()}
        onAdvance={onAdvance}
      />,
    )

    config.practices.forEach((entry) => {
      holdFromReserve(entry.label)
      fireEvent.click(plane(), { clientX: 10, clientY: 10 })
    })
    fireEvent.click(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    )
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }))
    fireEvent.click(screen.getByRole('button', { name: /continuer/i }))

    expect(onAdvance).toHaveBeenCalledTimes(1)
  })

  /**
   * Le parcours au clavier seul : saisir un jeton (activation native d'un
   * bouton, équivalente à Entrée/Espace en conditions réelles), le déplacer
   * aux flèches — gérées par le gestionnaire propre du plan, indépendant de
   * tout comportement natif — et le déposer à Entrée. La position atteinte
   * est annoncée en mots dans la région `aria-live`.
   */
  it('records a placement and announces the position in words through the keyboard-only path', () => {
    render(
      <PracticeMapGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    holdFromReserve(config.practices[0].label)
    const target = plane()

    fireEvent.keyDown(target, { key: 'ArrowRight' })
    fireEvent.keyDown(target, { key: 'ArrowUp' })
    fireEvent.keyDown(target, { key: 'Enter' })

    expect(screen.getByText(/il reste 3 pratique/i)).toBeInTheDocument()
  })

  it('announces the candidate position in words, never in numbers, while a token is held and nudged', () => {
    render(
      <PracticeMapGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    holdFromReserve(config.practices[0].label)
    const target = plane()

    fireEvent.keyDown(target, { key: 'ArrowRight' })
    fireEvent.keyDown(target, { key: 'ArrowRight' })
    fireEvent.keyDown(target, { key: 'ArrowUp' })
    fireEvent.keyDown(target, { key: 'ArrowUp' })

    // La région d'annonce est le premier `aria-live` du document : celui de
    // la réserve, plus loin dans l'arbre, en porte un second.
    const [announcement] = document.querySelectorAll('[aria-live="polite"]')
    expect(announcement.textContent).toContain(',')
    expect(announcement.textContent).not.toMatch(/[0-9]/)
  })

  it('releases the held token on Escape, without recording a placement', () => {
    render(
      <PracticeMapGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    holdFromReserve(config.practices[0].label)
    const target = plane()
    fireEvent.keyDown(target, { key: 'ArrowRight' })
    fireEvent.keyDown(target, { key: 'Escape' })

    expect(screen.getByText(/il reste 4 pratique/i)).toBeInTheDocument()
  })

  it('replaces the placement when picking up an already-placed token from the plane and moving it elsewhere, with no duplicate', () => {
    const onLock = vi.fn()
    render(
      <PracticeMapGame config={config} onLock={onLock} onAdvance={vi.fn()} />,
    )

    config.practices.forEach((entry) => {
      holdFromReserve(entry.label)
      fireEvent.click(plane(), { clientX: 10, clientY: 10 })
    })

    // Reprend le premier jeton déjà posé, sur le plan cette fois — son
    // badge partage le même nom accessible que sa ligne de légende, d'où le
    // scope explicite sur le plan.
    fireEvent.click(
      within(plane()).getByRole('button', { name: config.practices[0].label }),
    )
    fireEvent.click(plane(), { clientX: 200, clientY: 20 })

    fireEvent.click(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    )

    const answer = onLock.mock.calls[0][0] as {
      placements: { practiceId: string }[]
    }

    const practiceIds = answer.placements.map((entry) => entry.practiceId)
    expect(practiceIds).toEqual(['p1', 'p2', 'p3', 'p4'])
    expect(new Set(practiceIds).size).toBe(practiceIds.length)
  })

  /**
   * La croix centrale et les quatre quadrants nommés, décidés par le chef
   * après que la première passe sans aucun repère se soit révélée
   * illisible. Révision du troisième tour : les quatre libellés viennent du
   * corpus (`quadrantsSchema`), jamais d'une combinaison des pôles — une
   * conjonction de deux phrases entières débordait toute cellule du plan.
   */
  it('renders a decorative center cross and four quadrant labels from the config, hidden from the accessibility tree', () => {
    render(
      <PracticeMapGame config={config} onLock={vi.fn()} onAdvance={vi.fn()} />,
    )

    const hiddenChildren = [...plane().children].filter(
      (child) => child.getAttribute('aria-hidden') === 'true',
    )
    // Deux traits (horizontal, vertical) et quatre libellés de quadrant.
    expect(hiddenChildren).toHaveLength(6)
    expect(
      screen.getByText(config.quadrants.highRigorLowIntensity),
    ).toBeInTheDocument()
    expect(
      screen.getByText(config.quadrants.lowRigorHighIntensity),
    ).toBeInTheDocument()
  })

  /**
   * Le dépôt reste strictement continu : aucune aimantation vers un centre
   * de quadrant, même quand le jeton tombe exactement sur le croisement.
   * `p2` du corpus réel est justement à cheval sur les deux axes — ce test
   * le vérifie sur la configuration locale, au clic pile au centre du plan.
   */
  it('places a token exactly on the crossing point, unsnapped, when dropped at the center', () => {
    const onLock = vi.fn()
    render(
      <PracticeMapGame config={config} onLock={onLock} onAdvance={vi.fn()} />,
    )

    holdFromReserve(config.practices[0].label)
    // Le mock de `getBoundingClientRect` rend un carré 100×100 à l'origine :
    // (50, 50) est exactement le centre, ni plus près d'un quadrant que
    // d'un autre.
    fireEvent.click(plane(), { clientX: 50, clientY: 50 })

    config.practices.slice(1).forEach((entry) => {
      holdFromReserve(entry.label)
      fireEvent.click(plane(), { clientX: 10, clientY: 10 })
    })
    fireEvent.click(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    )

    const answer = onLock.mock.calls[0][0] as {
      placements: { practiceId: string; intensity: number; rigor: number }[]
    }
    const centered = answer.placements.find(
      (entry) => entry.practiceId === config.practices[0].id,
    )
    expect(centered).toEqual({
      practiceId: config.practices[0].id,
      intensity: 0.5,
      rigor: 0.5,
    })
  })

  /**
   * Révision du 30/08 : la réserve n'a plus de plafond ni de repli — elle
   * est une légende permanente. Sur le corpus réel de sept pratiques, les
   * sept doivent rester listées et lisibles même une fois toutes posées,
   * puisque c'est précisément au moment de relire son plan avant de
   * soumettre que le joueur doit pouvoir résoudre chaque numéro.
   */
  it('keeps all seven practices listed in the legend, marked placed, once every practice of the real corpus is placed', () => {
    const realConfig = realG2_2Config()
    render(
      <PracticeMapGame
        config={realConfig}
        onLock={vi.fn()}
        onAdvance={vi.fn()}
      />,
    )

    realConfig.practices.forEach((entry) => {
      holdFromReserve(entry.label)
      fireEvent.click(plane(), { clientX: 10, clientY: 10 })
    })

    realConfig.practices.forEach((entry) => {
      expect(
        within(reserveSection()).getByText(entry.label),
      ).toBeInTheDocument()
    })
    expect(
      screen.getByText(/toutes les pratiques sont posées/i),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /soumettre la lecture/i }),
    ).toBeEnabled()
  })
})
