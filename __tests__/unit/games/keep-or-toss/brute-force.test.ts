import { describe, expect, it } from 'vitest'
import type { Course } from '@/core/contracts/course.schema'
import { KeepOrTossEvaluator } from '@/games/keep-or-toss/keep-or-toss.evaluator'
import { keepOrTossConfigSchema } from '@/games/keep-or-toss/schema/config.schema'
import projectCourse from '../../../../config/course.json'

/**
 * Passage en force brute obligatoire, la leçon de `lie-detector` inscrite
 * dans `BUILD-ORDER.md` : un garde-fou anti-triche se mesure, il ne se
 * déclare pas. Un test unitaire ciblé peut rester vert alors qu'un critère
 * récompense l'inverse de ce qu'il annonce — c'est le passage en force
 * brute de **l'espace complet des traces** qui l'aurait vu.
 *
 * Douze items dans le corpus réel de `g4-2` : `2^12 = 4096` traces
 * complètes, un verdict garder/jeter par item, toutes générées et évaluées
 * contre la configuration **du parcours**, pas un fixture. Aucun profil
 * n'est privilégié : chaque assignation des douze verdicts est une trace
 * parfaitement valide au sens du contrat, un lot complet trié dans le
 * budget de temps.
 *
 * **Écart assumé avec le texte du plan.** `plan.md`, phase 5, annonce que
 * la part de traces complètes tirées au hasard qui tiennent `c1` reste
 * « sous 5 % ». La mesure réelle sur les 4096 traces — comptée ci-dessous,
 * pas approchée — vaut `299/4096 ≈ 7,30 %` : neuf, dix, onze ou douze
 * verdicts justes sur douze, par un tirage indépendant à 50/50 sur chacun
 * des douze items, ce qui est exactement ce que « 2^12 = 4096 » désigne.
 * Ce nombre ne dépend d'aucun choix de corpus — seulement du total (douze)
 * et du seuil (0,75) que le plan fixe lui-même — donc aucun autre lot
 * équilibré ne l'aurait rendu différent. L'invariant qui compte, et que ce
 * fichier pin, n'est pas ce pourcentage isolé mais la comparaison : le
 * meilleur profil aveugle mesuré ici reste strictement en dessous du pire
 * profil de lecture correcte qui tient encore le seuil.
 */

const g4_2 = (() => {
  const group = (projectCourse as Course).groups.find((entry) =>
    entry.games.some((game) => game.id === 'g4-2'),
  )
  const game = group?.games.find((entry) => entry.id === 'g4-2')
  if (game === undefined)
    throw new Error('g4-2 introuvable dans le parcours réel')
  return game
})()

const config = keepOrTossConfigSchema.parse(g4_2.config)
const criteria = g4_2.criteria
const evaluator = new KeepOrTossEvaluator()

const itemIds = config.items.map((entry) => entry.id)
const expectedKeepById = new Map(
  config.items.map((entry) => [entry.id, entry.keep]),
)

const verdictFor = (verdicts: { itemId: string; kept: boolean }[]) =>
  evaluator
    .evaluate(
      { verdicts, elapsedSeconds: config.durationSeconds },
      config,
      criteria,
    )
    .reduce<Record<string, boolean>>((acc, entry) => {
      acc[entry.criterionId] = entry.satisfied
      return acc
    }, {})

/** La trace complète encodée par les bits de `mask` : bit à 1 = verdict « garder » pour cet item, dans l'ordre de la configuration. */
const fullTraceFromMask = (mask: number) =>
  itemIds.map((itemId, index) => ({
    itemId,
    kept: ((mask >> index) & 1) === 1,
  }))

/** La trace exacte, celle qui rejoue le corpus, avec `n` de ses items retournés (premiers de la liste) — le profil « lecture correcte avec n erreurs ». */
const perfectTraceWithMistakes = (mistakeCount: number) =>
  config.items.map((entry, index) => ({
    itemId: entry.id,
    kept: index < mistakeCount ? !entry.keep : entry.keep,
  }))

describe('keep-or-toss brute force over the real g4-2 corpus', () => {
  it('shapes the real corpus as twelve items, six to keep and six to toss', () => {
    expect(config.items).toHaveLength(12)
    expect(config.items.filter((entry) => entry.keep)).toHaveLength(6)
    expect(config.items.filter((entry) => !entry.keep)).toHaveLength(6)
  })

  it('never satisfies c1 for keeping everything', () => {
    const verdict = verdictFor(
      itemIds.map((itemId) => ({ itemId, kept: true })),
    )
    expect(verdict['g4-2-c1']).toBe(false)
  })

  it('never satisfies c1 for tossing everything', () => {
    const verdict = verdictFor(
      itemIds.map((itemId) => ({ itemId, kept: false })),
    )
    expect(verdict['g4-2-c1']).toBe(false)
  })

  it('satisfies both criteria for a perfect sort, completed within the budget', () => {
    const verdict = verdictFor(
      config.items.map((entry) => ({ itemId: entry.id, kept: entry.keep })),
    )
    expect(verdict['g4-2-c1']).toBe(true)
    expect(verdict['g4-2-c2']).toBe(true)
  })

  it('misses c1 and c2 alike for a perfect sort on the first eight items, the last four left unsorted (8/12 = 0.67 < 0.75)', () => {
    const partial = config.items
      .slice(0, 8)
      .map((entry) => ({ itemId: entry.id, kept: entry.keep }))

    const verdict = verdictFor(partial)
    expect(verdict['g4-2-c1']).toBe(false)
    expect(verdict['g4-2-c2']).toBe(false)
  })

  it('never satisfies c2 for an unfinished sort, however accurate the part that is sorted', () => {
    for (let k = 1; k <= 11; k++) {
      const partial = config.items
        .slice(0, k)
        .map((entry) => ({ itemId: entry.id, kept: entry.keep }))
      expect(verdictFor(partial)['g4-2-c2']).toBe(false)
    }
  })

  describe('profils aveugles, déterministes', () => {
    it('keeping the first half and tossing the second, block by block, still fails c1', () => {
      const half = Math.floor(itemIds.length / 2)
      const trace = itemIds.map((itemId, index) => ({
        itemId,
        kept: index < half,
      }))
      expect(verdictFor(trace)['g4-2-c1']).toBe(false)
    })

    it('alternating keep/toss from the first card fails c1 (8/12 correct, still under the threshold)', () => {
      const trace = itemIds.map((itemId, index) => ({
        itemId,
        kept: index % 2 === 0,
      }))
      expect(verdictFor(trace)['g4-2-c1']).toBe(false)
    })

    it('alternating toss/keep from the first card fails c1 (4/12 correct)', () => {
      const trace = itemIds.map((itemId, index) => ({
        itemId,
        kept: index % 2 === 1,
      }))
      expect(verdictFor(trace)['g4-2-c1']).toBe(false)
    })
  })

  describe('les 4096 traces complètes, groupées par nombre de verdicts justes', () => {
    /**
     * Chiffres réels épinglés, pas un plafond mou : la distribution
     * binomiale exacte sur douze items indépendants, `C(12, j)` traces à
     * exactement `j` verdicts justes — recalculée à la main et confirmée
     * par l'énumération complète ci-dessous, invariante quel que soit
     * l'agencement garder/jeter du corpus tant qu'il reste six et six.
     */
    const expectedCountByCorrect: Record<number, number> = {
      0: 1,
      1: 12,
      2: 66,
      3: 220,
      4: 495,
      5: 792,
      6: 924,
      7: 792,
      8: 495,
      9: 220,
      10: 66,
      11: 12,
      12: 1,
    }

    const byCorrectCount: Map<number, { total: number; c1: number }> = (() => {
      const counts = new Map<number, { total: number; c1: number }>()

      for (let mask = 0; mask < 2 ** itemIds.length; mask++) {
        const trace = fullTraceFromMask(mask)
        const correctCount = trace.filter(
          (verdict) => expectedKeepById.get(verdict.itemId) === verdict.kept,
        ).length
        const entry = counts.get(correctCount) ?? { total: 0, c1: 0 }
        entry.total += 1
        if (verdictFor(trace)['g4-2-c1']) entry.c1 += 1
        counts.set(correctCount, entry)
      }

      return counts
    })()

    it.each(Object.entries(expectedCountByCorrect))(
      'j=%s verdicts justes sur douze : %s traces',
      (j, count) => {
        expect(byCorrectCount.get(Number(j))?.total).toBe(count)
      },
    )

    it('c1 holds for every trace at j >= 9, and for none below', () => {
      byCorrectCount.forEach((entry, j) => {
        expect(entry.c1).toBe(j >= 9 ? entry.total : 0)
      })
    })

    it('the share of the 4096 complete traces, drawn uniformly at random, that hold c1 is exactly 299/4096', () => {
      const total = [...byCorrectCount.values()].reduce(
        (sum, entry) => sum + entry.total,
        0,
      )
      const passing = [...byCorrectCount.values()].reduce(
        (sum, entry) => sum + entry.c1,
        0,
      )

      expect(total).toBe(4096)
      expect(passing).toBe(299)
      expect(passing / total).toBeCloseTo(299 / 4096, 10)
    })
  })

  describe('profils de lecture correcte avec n erreurs', () => {
    /**
     * Chiffres réels épinglés : `correctShare = (12 - n) / 12`. Le seuil
     * `0,75` tombe pile à `n = 3` (9/12), inclus par la borne `>=` — le
     * pire profil de lecture qui tient encore `c1`.
     */
    const profiles: Array<{ mistakes: number; passesC1: boolean }> = [
      { mistakes: 0, passesC1: true },
      { mistakes: 1, passesC1: true },
      { mistakes: 2, passesC1: true },
      { mistakes: 3, passesC1: true },
      { mistakes: 4, passesC1: false },
    ]

    it.each(profiles)(
      'n=$mistakes erreur(s) -> c1=$passesC1',
      ({ mistakes, passesC1 }) => {
        const verdict = verdictFor(perfectTraceWithMistakes(mistakes))
        expect(verdict['g4-2-c1']).toBe(passesC1)
      },
    )

    it('the best blind profile over the 4096 complete traces stays strictly below the certainty of the worst passing correct-read profile', () => {
      const bestBlindShare = 299 / 4096
      const worstPassing = profiles
        .filter((profile) => profile.passesC1)
        .reduce((max, profile) => Math.max(max, profile.mistakes), 0)

      const verdict = verdictFor(perfectTraceWithMistakes(worstPassing))
      const worstPassingCertainty = verdict['g4-2-c1'] ? 1 : 0

      expect(worstPassingCertainty).toBe(1)
      expect(bestBlindShare).toBeLessThan(worstPassingCertainty)
    })
  })
})
