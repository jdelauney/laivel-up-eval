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
 * un fixture.
 *
 * **Pourquoi une moyenne sur les 5040 permutations ne suffit pas.** La
 * première version de ce fichier s'arrêtait à une moyenne uniforme
 * (`c2Count / total < 1 %`) sur les 5040 permutations tirées à poids égal.
 * `BUILD-ORDER.md:147` exige le passage de l'espace complet **« profil par
 * profil »**, sur le modèle du réécrit de `ambiguity-scan/brute-force.test.ts`
 * (commit `9b05f11`) : une moyenne uniforme est dominée par des permutations
 * qu'aucun joueur ne produit — sept cartes entièrement rebattues au hasard —
 * et elle est structurellement incapable de voir qu'un joueur qui pousse
 * quelques cartes depuis l'ordre de présentation, sans lire une ligne,
 * tient `c2` plus souvent que le seuil qu'elle annonçait.
 *
 * Sept profils, nommés par la revue indépendante
 * (`aidd_docs/tasks/2026_08/2026_08_31_jeu-flow-order/review.md`, constat
 * « Le passage en force brute s'arrête à la moyenne uniforme ») :
 * ne rien toucher, inverser deux voisines, tout renverser, déplacer une
 * seule carte, décaler d'un cran deux étapes disjointes, une permutation au
 * hasard (les 5040), et le tripotage depuis `initialOrder` à `N` gestes.
 *
 * Le dernier profil — « `N` gestes au hasard » — est calculé en
 * **distribution exacte**, pas en tirage Monte Carlo : chaque geste choisit
 * une des sept cartes et une direction parmi deux, uniformément (`ArrowUp`
 * / `ArrowDown`, sans effet si la carte est déjà en bout de frise), et la
 * probabilité de chaque état atteignable après `N` gestes se propage par
 * calcul sur la distribution, jamais par échantillonnage. C'est exact,
 * reproductible sans graine aléatoire, et moins coûteux qu'un tirage à
 * 20 000 essais pour le même résultat.
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

const stepCount = stepIdsByRank.length

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

/** Compte, sur un ensemble de traces, combien tiennent `c1` et `c2`. */
const tally = (traces: Iterable<string[]>) => {
  let total = 0
  let c1 = 0
  let c2 = 0
  for (const trace of traces) {
    total++
    const verdict = verdictFor(trace)
    if (verdict['g5-2-c1']) c1++
    if (verdict['g5-2-c2']) c2++
  }
  return { total, c1, c2 }
}

/** Les six permutations d'une inversion entre deux voisines dans l'ordre attendu, une par paire adjacente. */
function* neighbourSwaps(): Generator<string[]> {
  for (let i = 0; i < stepCount - 1; i++) {
    const swapped = [...stepIdsByRank]
    ;[swapped[i], swapped[i + 1]] = [swapped[i + 1], swapped[i]]
    yield swapped
  }
}

/**
 * Toutes les permutations obtenues en retirant une seule carte de l'ordre
 * attendu et en la réinsérant ailleurs, l'ordre relatif des six autres
 * restant intact — exactement ce qu'un joueur qui « déplace une carte »
 * produit, quel que soit le chemin d'entrée. Dédupliquées : retirer la
 * carte en position `p` pour la réinsérer juste à côté produit la même
 * permutation que le geste symétrique parti de la carte voisine.
 */
function* singleCardMoved(): Generator<string[]> {
  const seen = new Set<string>()
  const identity = stepIdsByRank.join(',')
  for (let source = 0; source < stepCount; source++) {
    const withoutSource = [
      ...stepIdsByRank.slice(0, source),
      ...stepIdsByRank.slice(source + 1),
    ]
    for (let slot = 0; slot <= withoutSource.length; slot++) {
      const candidate = [
        ...withoutSource.slice(0, slot),
        stepIdsByRank[source],
        ...withoutSource.slice(slot),
      ]
      const key = candidate.join(',')
      if (key === identity || seen.has(key)) continue
      seen.add(key)
      yield candidate
    }
  }
}

/**
 * Deux échanges de voisines qui ne partagent aucune carte — « un cran de
 * travers sur deux étapes », distinct de `neighbourSwaps` qui n'en bouge
 * qu'une paire. Les `stepCount - 1` positions d'échange possibles sont
 * combinées deux par deux, en écartant les paires qui partagent une carte
 * (positions consécutives).
 */
function* twoDisjointNeighbourSwaps(): Generator<string[]> {
  const slots = Array.from({ length: stepCount - 1 }, (_, index) => index)
  for (let i = 0; i < slots.length; i++) {
    for (let j = i + 1; j < slots.length; j++) {
      if (Math.abs(slots[i] - slots[j]) < 2) continue
      const arr = [...stepIdsByRank]
      ;[arr[slots[i]], arr[slots[i] + 1]] = [arr[slots[i] + 1], arr[slots[i]]]
      ;[arr[slots[j]], arr[slots[j] + 1]] = [arr[slots[j] + 1], arr[slots[j]]]
      yield arr
    }
  }
}

/**
 * Distribution exacte de probabilité sur les états atteignables depuis
 * `initialOrder` après `moveCount` gestes au hasard — une carte et une
 * direction choisies uniformément à chaque geste, sans effet si la carte
 * est déjà en bout de frise. Rend la part de probabilité qui tient `c1` et
 * celle qui tient `c2`, calculée par propagation, jamais par tirage.
 */
const randomTinkeringShares = (
  moveCount: number,
): { c1Share: number; c2Share: number } => {
  let distribution = new Map<string, number>([
    [[...config.initialOrder].join(','), 1],
  ])

  for (let step = 0; step < moveCount; step++) {
    const next = new Map<string, number>()
    for (const [key, probability] of distribution) {
      const order = key.split(',')
      const eachGestureProbability = probability / (stepCount * 2)

      for (const stepId of stepIdsByRank) {
        for (const direction of [-1, 1] as const) {
          const index = order.indexOf(stepId)
          const target = index + direction
          const resultOrder =
            target < 0 || target >= order.length
              ? order
              : order.map((id, position) => {
                  if (position === index) return order[target]
                  if (position === target) return order[index]
                  return id
                })
          const resultKey = resultOrder.join(',')
          next.set(
            resultKey,
            (next.get(resultKey) ?? 0) + eachGestureProbability,
          )
        }
      }
    }
    distribution = next
  }

  let c1Share = 0
  let c2Share = 0
  for (const [key, probability] of distribution) {
    const verdict = verdictFor(key.split(','))
    if (verdict['g5-2-c1']) c1Share += probability
    if (verdict['g5-2-c2']) c2Share += probability
  }
  return { c1Share, c2Share }
}

describe('flow-order brute force over the real g5-2 corpus', () => {
  it('shapes the real corpus as seven steps', () => {
    expect(config.steps).toHaveLength(7)
    expect(stepIdsByRank).toHaveLength(7)
  })

  describe('profil par profil, sur le corpus réel', () => {
    /**
     * Chiffres réels épinglés, pas un plafond mou : chacun recalculé
     * indépendamment (`e:/tmp/flow-order-profiles.mjs`, hors dépôt) puis
     * confirmé par l'évaluateur du jeu lui-même via `tally`/`randomTinkeringShares`
     * ci-dessus. Un futur ajustement du corpus ou du seuil qui déplace
     * n'importe laquelle de ces valeurs fait échouer ce test.
     */
    it('P0 — ne rien toucher : ne tient ni c1 ni c2', () => {
      const verdict = verdictFor([...config.initialOrder])
      expect(verdict['g5-2-c1']).toBe(false)
      expect(verdict['g5-2-c2']).toBe(false)
    })

    it('P1 — une permutation au hasard parmi les 5040 : exactement une tient c1, 21 tiennent c2', () => {
      const { total, c1, c2 } = tally(permutations(stepIdsByRank))
      expect(total).toBe(5040)
      expect(c1).toBe(1)
      expect(c2).toBe(21)
    })

    it('P2 — inverser deux voisines (les 6 paires adjacentes) : aucune ne tient c1, toutes tiennent c2', () => {
      const { total, c1, c2 } = tally(neighbourSwaps())
      expect(total).toBe(6)
      expect(c1).toBe(0)
      expect(c2).toBe(6)
    })

    it('P3 — renverser tout : ne tient ni c1 ni c2', () => {
      const verdict = verdictFor([...stepIdsByRank].reverse())
      expect(verdict['g5-2-c1']).toBe(false)
      expect(verdict['g5-2-c2']).toBe(false)
    })

    it('P4 — déplacer une seule carte (36 arrangements distincts) : aucune ne tient c1, une sur six tient c2', () => {
      const { total, c1, c2 } = tally(singleCardMoved())
      expect(total).toBe(36)
      expect(c1).toBe(0)
      expect(c2).toBe(6)
    })

    it('P5 — décaler d’un cran deux étapes disjointes (10 combinaisons) : aucune ne tient c1, toutes tiennent c2', () => {
      const { total, c1, c2 } = tally(twoDisjointNeighbourSwaps())
      expect(total).toBe(10)
      expect(c1).toBe(0)
      expect(c2).toBe(10)
    })

    it.each([
      // Fractions exactes (numérateur / 14^N), recalculées indépendamment
      // par comptage entier (`BigInt`) plutôt que par accumulation de
      // probabilités flottantes — aucune perte de précision à épingler.
      { moveCount: 1, c1Share: 0 / 14, c2Share: 0 / 14 },
      { moveCount: 2, c1Share: 0 / 196, c2Share: 8 / 196 },
      { moveCount: 3, c1Share: 0 / 2744, c2Share: 136 / 2744 },
      { moveCount: 5, c1Share: 800 / 537824, c2Share: 30016 / 537824 },
    ])(
      'P6 — tripotage depuis initialOrder, $moveCount geste(s) au hasard, distribution exacte',
      ({ moveCount, c1Share, c2Share }) => {
        const shares = randomTinkeringShares(moveCount)
        expect(shares.c1Share).toBeCloseTo(c1Share, 9)
        expect(shares.c2Share).toBeCloseTo(c2Share, 9)
      },
    )
  })

  it('satisfies both criteria for the exact order alone', () => {
    const verdict = verdictFor(stepIdsByRank)
    expect(verdict['g5-2-c1']).toBe(true)
    expect(verdict['g5-2-c2']).toBe(true)
  })

  /**
   * L'assertion qui compte, calculée plutôt que recopiée : le meilleur
   * profil aveugle (P1 sur les 5040, ou le pire cran de `randomTinkeringShares`
   * aux `N` mesurés) reste strictement en dessous de la certitude — `1` —
   * qu'un lecteur qui se trompe d'un cran (P2, P5 : `c2` à 100 %) tient
   * toujours. Le rapport mesuré tourne autour de 18 pour 1 ; ce test ne fige
   * pas ce rapport exact, il garantit l'ordre strict qui le rend vrai.
   */
  it('the best blind profile stays strictly below the certainty of a passing neighbour-off reading', () => {
    const blindShares = [
      tally(permutations(stepIdsByRank)).c2 / 5040,
      randomTinkeringShares(1).c2Share,
      randomTinkeringShares(2).c2Share,
      randomTinkeringShares(3).c2Share,
      randomTinkeringShares(5).c2Share,
    ]
    const bestBlindShare = Math.max(...blindShares)

    const readingCertainty = 1 // P2 et P5 tiennent c2 à coup sûr : 6/6 et 10/10.
    expect(bestBlindShare).toBeLessThan(readingCertainty)
    expect(bestBlindShare).toBeLessThan(0.06)
  })
})
