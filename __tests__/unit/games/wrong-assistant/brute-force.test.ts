import { describe, expect, it } from 'vitest'
import type { Course } from '@/core/contracts/course.schema'
import { readExchange } from '@/games/wrong-assistant/helpers/read-exchange.helper'
import { parseWrongAssistantTrace } from '@/games/wrong-assistant/schema/answer.schema'
import {
  type WrongAssistantConfig,
  wrongAssistantConfigSchema,
} from '@/games/wrong-assistant/schema/config.schema'
import { WrongAssistantEvaluator } from '@/games/wrong-assistant/wrong-assistant.evaluator'
import projectCourse from '../../../../config/course.json'

/**
 * Passage en force brute obligatoire, la leçon de `lie-detector` inscrite
 * dans `BUILD-ORDER.md` : un garde-fou anti-triche se mesure, il ne se
 * déclare pas. L'arbre de `g3-1` est fini et acyclique — énumérable en
 * entier, contrairement aux 65536 traces de `lie-detector` ou aux 512 de
 * `ambiguity-scan` : ici, quinze chemins couvrent tout l'espace des parties
 * possibles, comptés ci-dessous plutôt que supposés.
 *
 * **Un chemin n'est pas équiprobable à un autre.** Un joueur qui clique au
 * hasard choisit une réponse *parmi celles offertes à ce nœud*, pas un
 * chemin entier dans une liste plate de quinze : un chemin qui traverse
 * trois nœuds à trois choix pèse `(1/3)³`, un chemin qui s'arrête après le
 * premier pèse `1/3`. Le « profil aveugle » ci-dessous pondère donc chaque
 * chemin par cette probabilité réelle, jamais par un compte brut de
 * chemins — la même leçon que `ambiguity-scan/brute-force.test.ts` tenue
 * sur un arbre plutôt que sur des sous-ensembles.
 */

const g3_1 = (() => {
  const group = (projectCourse as Course).groups.find((entry) =>
    entry.games.some((game) => game.id === 'g3-1'),
  )
  const game = group?.games.find((entry) => entry.id === 'g3-1')
  if (game === undefined)
    throw new Error('g3-1 introuvable dans le parcours réel')
  return game
})()

const config: WrongAssistantConfig = wrongAssistantConfigSchema.parse(
  g3_1.config,
)
const criteria = g3_1.criteria
const evaluator = new WrongAssistantEvaluator()

type Step = { nodeId: string; replyId: string }
type PathOutcome = {
  steps: readonly Step[]
  probability: number
  flawedNodesMet: number
  acceptedAFlaw: boolean
  consequencesHit: number
  c1: boolean
  c2: boolean
}

/**
 * Énumère tous les chemins complets de `rootId` à une feuille (une réponse
 * sans `nextId`), chacun pondéré par la probabilité d'un choix uniforme
 * parmi les réponses offertes à chaque nœud traversé — jamais une moyenne
 * uniforme sur les chemins eux-mêmes.
 */
const enumeratePaths = (): readonly PathOutcome[] => {
  const nodesById = new Map(config.nodes.map((node) => [node.id, node]))
  const results: PathOutcome[] = []

  const walk = (
    nodeId: string,
    steps: readonly Step[],
    probability: number,
  ): void => {
    const node = nodesById.get(nodeId)
    if (node === undefined) throw new Error(`nœud « ${nodeId} » introuvable`)

    const branchProbability = probability / node.replies.length

    node.replies.forEach((reply) => {
      const nextSteps = [...steps, { nodeId: node.id, replyId: reply.id }]

      if (reply.nextId === undefined) {
        const trace = parseWrongAssistantTrace({ steps: nextSteps }, config)
        const reading = readExchange(config, trace)
        const verdict = evaluator
          .evaluate({ steps: nextSteps }, config, criteria)
          .reduce<Record<string, boolean>>((acc, result) => {
            acc[result.criterionId] = result.satisfied
            return acc
          }, {})

        results.push({
          steps: nextSteps,
          probability: branchProbability,
          flawedNodesMet: reading.flawedNodesMet,
          acceptedAFlaw: reading.flawedNodesCaught < reading.flawedNodesMet,
          consequencesHit: reading.consequencesHit,
          c1: verdict['g3-1-c1'],
          c2: verdict['g3-1-c2'],
        })
        return
      }

      walk(reply.nextId, nextSteps, branchProbability)
    })
  }

  walk(config.rootId, [], 1)
  return results
}

const paths = enumeratePaths()

const pathOf = (...replyIds: readonly string[]): PathOutcome => {
  const found = paths.find(
    (path) =>
      path.steps.length === replyIds.length &&
      path.steps.every((step, index) => step.replyId === replyIds[index]),
  )
  if (found === undefined) {
    throw new Error(`aucun chemin ne suit exactement ${replyIds.join(' -> ')}`)
  }
  return found
}

describe('wrong-assistant brute force over the real g3-1 corpus', () => {
  it('shapes the real corpus as fifteen complete paths, probabilities summing to one', () => {
    expect(paths).toHaveLength(15)
    const total = paths.reduce((sum, path) => sum + path.probability, 0)
    expect(total).toBeCloseTo(1, 10)
  })

  it('never has a path meeting zero flawed nodes: the root is always flawed', () => {
    paths.forEach((path) => {
      expect(path.flawedNodesMet).toBeGreaterThan(0)
    })
  })

  it('misses c1 on every path that accepts a flawed turn', () => {
    paths
      .filter((path) => path.acceptedAFlaw)
      .forEach((path) => {
        expect(path.c1).toBe(false)
      })
  })

  it('hits a consequence on every path that accepts a flawed turn', () => {
    paths
      .filter((path) => path.acceptedAFlaw)
      .forEach((path) => {
        expect(path.consequencesHit).toBeGreaterThan(0)
      })
  })

  it('never hits a consequence on a path that accepts nothing', () => {
    paths
      .filter((path) => !path.acceptedAFlaw)
      .forEach((path) => {
        expect(path.consequencesHit).toBe(0)
      })
  })

  describe('profils nommés', () => {
    it('accepting systematically misses both criteria', () => {
      const path = pathOf('n1-accept', 'c1-1')

      expect(path.c1).toBe(false)
      expect(path.c2).toBe(false)
    })

    it('refusing systematically, never verifying, holds c1 and misses c2', () => {
      const path = pathOf(
        'n1-challenge',
        'n2-1',
        'n3-challenge',
        'n4-1',
        'n5-challenge',
      )

      expect(path.c1).toBe(true)
      expect(path.c2).toBe(false)
    })

    it('a correct read — catching every flaw, verifying or reformulating twice — holds both', () => {
      const path = pathOf(
        'n1-verify',
        'n2-1',
        'n3-reformulate',
        'n4-1',
        'n5-challenge',
      )

      expect(path.c1).toBe(true)
      expect(path.c2).toBe(true)
    })
  })

  describe('le partage aveugle contre la certitude d’une lecture correcte', () => {
    /**
     * Chiffre réel épinglé, pas un plafond mou : recalculé à la main
     * (17 des 27 sous-chemins à trois choix indépendants échouent `c2`, 4
     * sur 8 configurations « lit tout sans jamais accepter » passent les
     * deux) et confirmé par l'énumération pondérée ci-dessus. Un futur
     * ajustement du corpus ou du seuil qui déplace cette valeur fait
     * échouer ce test.
     */
    it('the weighted blind-click share holding both criteria is 4/27, under the 25% ceiling the plan sets', () => {
      const bothShare = paths
        .filter((path) => path.c1 && path.c2)
        .reduce((sum, path) => sum + path.probability, 0)

      expect(bothShare).toBeCloseTo(4 / 27, 10)
      expect(bothShare).toBeLessThan(0.25)
    })

    it('stays strictly below the certainty of a passing correct read', () => {
      const bothShare = paths
        .filter((path) => path.c1 && path.c2)
        .reduce((sum, path) => sum + path.probability, 0)

      const passingReads = paths.filter((path) => path.c1 && path.c2)
      expect(passingReads.length).toBeGreaterThan(0)

      // Chaque chemin de lecture correcte tient les deux critères avec
      // certitude — 1, jamais une part — puisqu'un chemin donné rend
      // toujours le même verdict.
      expect(bothShare).toBeLessThan(1)
    })
  })

  /**
   * Aucun mot ne permet de deviner la `stance` d'une réponse sans la lire :
   * au sein d'un même nœud, les quatre camps ne partagent jamais leur
   * premier mot. Un mot répété entre deux nœuds différents ne trahit rien —
   * seul un même nœud offre au joueur la comparaison directe qui romprait le
   * jeu.
   */
  it('never lets a first word give the stance away within a single node', () => {
    const firstWord = (text: string): string =>
      (text.match(/[\p{L}'’«»]+/u)?.[0] ?? text).toLowerCase()

    config.nodes.forEach((node) => {
      const seen = new Map<string, string>()

      node.replies.forEach((reply) => {
        const word = firstWord(reply.text)
        const owner = seen.get(word)
        if (owner !== undefined && owner !== reply.stance) {
          throw new Error(
            `le nœud « ${node.id} » laisse deux réponses de camps différents (${owner}, ${reply.stance}) commencer par « ${word} »`,
          )
        }
        seen.set(word, reply.stance)
      })
    })
  })
})
