import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import {
  GroupRail,
  type RailGroup,
} from '../../../../src/components/group-rail/composites/group-rail'

/**
 * La rampe seule, sans façade ni store : sept groupes d'étendues inégales,
 * le troisième courant. Aucun jeu réel n'entre en jeu, la rampe ne lit que
 * la forme littérale qu'on lui donne.
 */
const sevenGroups: RailGroup[] = [
  { id: 'g1', label: 'Groupe 1', gameCount: 2, state: 'done' },
  { id: 'g2', label: 'Groupe 2', gameCount: 2, state: 'done' },
  { id: 'g3', label: 'Groupe 3', gameCount: 3, state: 'current' },
  { id: 'g4', label: 'Groupe 4', gameCount: 2, state: 'pending' },
  { id: 'g5', label: 'Groupe 5', gameCount: 1, state: 'pending' },
  { id: 'g6', label: 'Groupe 6', gameCount: 1, state: 'pending' },
  { id: 'g7', label: 'Groupe 7', gameCount: 1, state: 'pending' },
]

describe('group rail', () => {
  it('names the list with the accessible name it is given', () => {
    render(
      <GroupRail
        groups={sevenGroups}
        accessibleName="Progression dans le parcours"
      />,
    )

    expect(
      screen.getByRole('list', { name: /progression dans le parcours/i }),
    ).toBeInTheDocument()
  })

  it('renders one tab per declared group', () => {
    render(
      <GroupRail
        groups={sevenGroups}
        accessibleName="Progression dans le parcours"
      />,
    )

    expect(screen.getAllByRole('listitem')).toHaveLength(7)
  })

  it('names the current tab with its group and its state, whatever the width simulated', () => {
    render(
      <GroupRail
        groups={sevenGroups}
        accessibleName="Progression dans le parcours"
      />,
    )

    expect(
      screen.getByRole('listitem', { name: /groupe 3, 3 jeux, en cours/i }),
    ).toBeInTheDocument()
  })

  it('names a crossed tab as finished', () => {
    render(
      <GroupRail
        groups={sevenGroups}
        accessibleName="Progression dans le parcours"
      />,
    )

    expect(
      screen.getByRole('listitem', { name: /groupe 1, 2 jeux, terminé/i }),
    ).toBeInTheDocument()
  })

  it('names an upcoming tab as upcoming', () => {
    render(
      <GroupRail
        groups={sevenGroups}
        accessibleName="Progression dans le parcours"
      />,
    )

    expect(
      screen.getByRole('listitem', { name: /groupe 4, 2 jeux, à venir/i }),
    ).toBeInTheDocument()
  })

  it('grows a three-game tab three times more than a one-game tab', () => {
    render(
      <GroupRail
        groups={sevenGroups}
        accessibleName="Progression dans le parcours"
      />,
    )

    const threeGameTab = screen.getByRole('listitem', {
      name: /groupe 3, 3 jeux, en cours/i,
    })
    const oneGameTab = screen.getByRole('listitem', {
      name: /groupe 5, 1 jeu, à venir/i,
    })

    expect(threeGameTab.style.flexGrow).toBe('3')
    expect(oneGameTab.style.flexGrow).toBe('1')
  })

  it('exposes no interactive role on any tab', () => {
    render(
      <GroupRail
        groups={sevenGroups}
        accessibleName="Progression dans le parcours"
      />,
    )

    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.queryAllByRole('tab')).toHaveLength(0)
    expect(screen.queryAllByRole('link')).toHaveLength(0)
  })

  describe('no run open', () => {
    const restingGroups: RailGroup[] = [
      { id: 'g1', label: 'Groupe 1', gameCount: 2, state: 'pending' },
      { id: 'g2', label: 'Groupe 2', gameCount: 1, state: 'pending' },
    ]

    it('names no tab as current, every one as upcoming', () => {
      render(
        <GroupRail groups={restingGroups} accessibleName="Forme du parcours" />,
      )

      const list = screen.getByRole('list')
      const tabs = within(list).getAllByRole('listitem')

      for (const tab of tabs) {
        expect(tab).toHaveAccessibleName(/à venir/i)
      }
      expect(screen.queryByText(/en cours/i)).not.toBeInTheDocument()
    })
  })

  describe('a single group', () => {
    const oneGroup: RailGroup[] = [
      { id: 'g1', label: 'Seul groupe', gameCount: 4, state: 'current' },
    ]

    it('renders it alone, current, with no neighbour', () => {
      render(
        <GroupRail
          groups={oneGroup}
          accessibleName="Progression dans le parcours"
        />,
      )

      expect(screen.getAllByRole('listitem')).toHaveLength(1)
      expect(
        screen.getByRole('listitem', {
          name: /seul groupe, 4 jeux, en cours/i,
        }),
      ).toBeInTheDocument()
    })
  })
})
