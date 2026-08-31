import { describe, expect, it } from 'vitest'
import type { Course } from '@/core/contracts/course.schema'
import { AmbiguityScanEvaluator } from '@/games/ambiguity-scan/ambiguity-scan.evaluator'
import { ambiguityScanConfigSchema } from '@/games/ambiguity-scan/schema/config.schema'
import projectCourse from '../../../../config/course.json'

/**
 * Passage en force brute obligatoire, la leçon de `lie-detector` inscrite
 * dans `BUILD-ORDER.md` : un garde-fou anti-triche se mesure, il ne se
 * déclare pas. Un test unitaire ciblé peut rester vert alors qu'un critère
 * récompense l'inverse de ce qu'il annonce — c'est le passage en force
 * brute de **l'espace complet des traces** qui l'aurait vu.
 *
 * Neuf segments dans le corpus réel de `g6-2` : `2^9 = 512` sous-ensembles,
 * un par trace possible, contre la configuration **du parcours**, pas un
 * fixture. Aucun profil n'est privilégié : chaque sous-ensemble de segments
 * signalés est une trace parfaitement valide au sens du contrat.
 */

const g6_2 = (() => {
  const group = (projectCourse as Course).groups.find((entry) =>
    entry.games.some((game) => game.id === 'g6-2'),
  )
  const game = group?.games.find((entry) => entry.id === 'g6-2')
  if (game === undefined)
    throw new Error('g6-2 introuvable dans le parcours réel')
  return game
})()

const config = ambiguityScanConfigSchema.parse(g6_2.config)
const criteria = g6_2.criteria
const evaluator = new AmbiguityScanEvaluator()

const segmentIds = config.segments.map((segment) => segment.id)
const ambiguousIds = config.segments
  .filter((segment) => segment.ambiguous)
  .map((segment) => segment.id)

/** Le sous-ensemble encodé par les bits de `mask`, dans l'ordre de la configuration. */
const subsetFromMask = (mask: number): string[] =>
  segmentIds.filter((_, index) => (mask & (1 << index)) !== 0)

const verdictFor = (flaggedIds: string[]) =>
  evaluator
    .evaluate({ flaggedIds }, config, criteria)
    .reduce<Record<string, boolean>>((acc, result) => {
      acc[result.criterionId] = result.satisfied
      return acc
    }, {})

describe('ambiguity-scan brute force over the real g6-2 corpus', () => {
  it('shapes the real corpus as nine segments, four ambiguous and five clear', () => {
    expect(segmentIds).toHaveLength(9)
    expect(ambiguousIds).toHaveLength(4)
  })

  it('never satisfies c1 for the trace that flags every segment', () => {
    const verdict = verdictFor(segmentIds)
    expect(verdict['g6-2-c1']).toBe(false)
  })

  it('never satisfies c1 for the trace that flags nothing', () => {
    const verdict = verdictFor([])
    expect(verdict['g6-2-c1']).toBe(false)
  })

  it('satisfies both criteria for the perfect trace, the four ambiguous segments alone', () => {
    const verdict = verdictFor(ambiguousIds)
    expect(verdict['g6-2-c1']).toBe(true)
    expect(verdict['g6-2-c2']).toBe(true)
  })

  it('keeps the share of random traces holding both criteria under 10%', () => {
    const totalSubsets = 2 ** segmentIds.length
    let bothSatisfied = 0

    for (let mask = 0; mask < totalSubsets; mask++) {
      const verdict = verdictFor(subsetFromMask(mask))
      if (verdict['g6-2-c1'] && verdict['g6-2-c2']) bothSatisfied++
    }

    const share = bothSatisfied / totalSubsets
    expect(share).toBeLessThan(0.1)
  })
})
