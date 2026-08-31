import { describe, expect, it } from 'vitest'
import type { Course } from '@/core/contracts/course.schema'
import { FlowOrderEvaluator } from '@/games/flow-order/flow-order.evaluator'
import { flowOrderConfigSchema } from '@/games/flow-order/schema/config.schema'
import projectCourse from '../../../../config/course.json'

/**
 * Passage en force brute obligatoire, la leçon de `lie-detector` inscrite
 * dans `BUILD-ORDER.md` : un garde-fou anti-triche se mesure, il ne se
 * déclare pas. Un test unitaire ciblé peut rester vert alors qu'un critère
 * récompense l'inverse de ce qu'il annonce — c'est le passage en force
 * brute de **l'espace complet des traces** qui l'aurait vu.
 *
 * Sept étapes dans le corpus réel de `g5-2` : `7! = 5040` permutations,
 * toutes générées et évaluées contre la configuration **du parcours**, pas
 * un fixture. Aucune permutation n'est privilégiée : chaque réordonnancement
 * des sept identifiants est une trace parfaitement valide au sens du
 * contrat.
 */

const g5_2 = (() => {
  const group = (projectCourse as Course).groups.find((entry) =>
    entry.games.some((game) => game.id === 'g5-2'),
  )
  const game = group?.games.find((entry) => entry.id === 'g5-2')
  if (game === undefined)
    throw new Error('g5-2 introuvable dans le parcours réel')
  return game
})()

const config = flowOrderConfigSchema.parse(g5_2.config)
const criteria = g5_2.criteria
const evaluator = new FlowOrderEvaluator()

/** Les identifiants des étapes, dans l'ordre attendu — l'unique permutation qui tient `c1`. */
const stepIdsByRank = [...config.steps]
  .sort((a, b) => a.rank - b.rank)
  .map((step) => step.id)

/** Générateur de toutes les permutations d'un tableau, sans dépendance externe : `n!` pour `n` éléments. */
function* permutations<T>(items: readonly T[]): Generator<T[]> {
  if (items.length <= 1) {
    yield [...items]
    return
  }
  for (let i = 0; i < items.length; i++) {
    const rest = [...items.slice(0, i), ...items.slice(i + 1)]
    for (const tail of permutations(rest)) {
      yield [items[i], ...tail]
    }
  }
}

const verdictFor = (orderedIds: string[]) =>
  evaluator
    .evaluate({ orderedIds }, config, criteria)
    .reduce<Record<string, boolean>>((acc, result) => {
      acc[result.criterionId] = result.satisfied
      return acc
    }, {})

describe('flow-order brute force over the real g5-2 corpus', () => {
  it('shapes the real corpus as seven steps', () => {
    expect(config.steps).toHaveLength(7)
    expect(stepIdsByRank).toHaveLength(7)
  })

  it('never satisfies either criterion for the initialOrder written by the corpus', () => {
    const verdict = verdictFor([...config.initialOrder])
    expect(verdict['g5-2-c1']).toBe(false)
    expect(verdict['g5-2-c2']).toBe(false)
  })

  it('satisfies both criteria for the exact order alone', () => {
    const verdict = verdictFor(stepIdsByRank)
    expect(verdict['g5-2-c1']).toBe(true)
    expect(verdict['g5-2-c2']).toBe(true)
  })

  it('satisfies c2 but misses c1 for a swap of two neighbouring steps', () => {
    const swapped = [...stepIdsByRank]
    ;[swapped[0], swapped[1]] = [swapped[1], swapped[0]]

    const verdict = verdictFor(swapped)
    expect(verdict['g5-2-c1']).toBe(false)
    expect(verdict['g5-2-c2']).toBe(true)
  })

  it('misses both criteria for the end-to-end reversal', () => {
    const reversed = [...stepIdsByRank].reverse()

    const verdict = verdictFor(reversed)
    expect(verdict['g5-2-c1']).toBe(false)
    expect(verdict['g5-2-c2']).toBe(false)
  })

  it('lets exactly one permutation among the 5040 hold c1, and keeps c2 under 1%', () => {
    let total = 0
    let c1Count = 0
    let c2Count = 0

    for (const permutation of permutations(stepIdsByRank)) {
      total++
      const verdict = verdictFor(permutation)
      if (verdict['g5-2-c1']) c1Count++
      if (verdict['g5-2-c2']) c2Count++
    }

    expect(total).toBe(5040)
    expect(c1Count).toBe(1)
    expect(c2Count / total).toBeLessThan(0.01)
  })
})
