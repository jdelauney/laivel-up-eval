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
 * entier : 201 chemins complets couvrent tout l'espace des parties
 * possibles, comptés ci-dessous plutôt que supposés.
 *
 * **Un chemin n'est pas équiprobable à un autre.** Un joueur qui clique au
 * hasard choisit une réponse *parmi celles offertes à ce nœud*, pas un
 * chemin entier dans une liste plate : un chemin qui traverse cinq nœuds à
 * trois choix pèse `(1/3)⁵`, un chemin qui s'arrête après le premier pèse
 * `1/3`. Le « profil aveugle » ci-dessous pondère donc chaque chemin par
 * cette probabilité réelle, jamais par un compte brut de chemins.
 *
 * Reprise après la revue du 31/08
 * (`aidd_docs/tasks/2026_08/2026_08_31_jeu-wrong-assistant/review.md`,
 * constat 4) : l'ancienne sonde ne comparait que le premier mot des réponses
 * au sein d'un même nœud, un test qui ne pouvait jamais lever puisque chaque
 * nœud n'offrait qu'une réponse par camp. Elle ne couvrait ni la position ni
 * le nombre de réponses — les deux séparateurs qui, eux, partitionnaient
 * parfaitement le corpus (constats 1 et 2). Cette sonde calcule les deux sur
 * le corpus réel, plus la longueur et la ponctuation, et rejoue des profils
 * de clic aveugles nommés pour vérifier qu'aucun ne bat la pire lecture
 * honnête.
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
  correctiveRepliesCount: number
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
          correctiveRepliesCount: reading.correctiveRepliesCount,
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
  it('shapes the real corpus as 201 complete paths, probabilities summing to one', () => {
    expect(paths).toHaveLength(201)
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

  /**
   * Constats 1 et 2 de la revue, fermés au schéma
   * (`config.schema.ts`) — ce bloc vérifie que le corpus réel tient bien ces
   * deux garanties, calculées ici plutôt que citées.
   */
  describe('aucun séparateur structurel ne remplace la lecture', () => {
    it('offers the same number of replies on every node, flawed or sound', () => {
      const counts = new Set(config.nodes.map((node) => node.replies.length))
      expect(counts.size).toBe(1)
      expect(config.nodes.length).toBe(7)
    })

    it('never lets a single position carry the same stance on every node', () => {
      const maxReplies = Math.max(
        ...config.nodes.map((node) => node.replies.length),
      )

      for (let position = 0; position < maxReplies; position += 1) {
        const stancesAtPosition = new Set(
          config.nodes
            .filter((node) => node.replies.length > position)
            .map((node) => node.replies[position].stance),
        )
        expect(stancesAtPosition.size).toBeGreaterThan(1)
      }
    })

    it('never lets the longest reply in a node always be the corrective one', () => {
      const CORRECTIVE = new Set(['verify', 'reformulate'])
      const nodesWhereLongestIsCorrective = config.nodes.filter((node) => {
        const longest = [...node.replies].sort(
          (a, b) => b.text.length - a.text.length,
        )[0]
        return CORRECTIVE.has(longest.stance)
      })

      expect(nodesWhereLongestIsCorrective.length).toBeLessThan(
        config.nodes.length,
      )
    })

    it('never lets the shortest reply in a node always be the acceptance', () => {
      const nodesWhereShortestIsAccept = config.nodes.filter((node) => {
        const shortest = [...node.replies].sort(
          (a, b) => a.text.length - b.text.length,
        )[0]
        return shortest.stance === 'accept'
      })

      expect(nodesWhereShortestIsAccept.length).toBeLessThan(
        config.nodes.length,
      )
    })

    it('never lets a trailing "?" perfectly predict the challenge stance', () => {
      const challengeReplies = config.nodes.flatMap((node) =>
        node.replies.filter((reply) => reply.stance === 'challenge'),
      )
      const challengeReadingAsQuestion = challengeReplies.filter((reply) =>
        reply.text.trim().endsWith('?'),
      )

      expect(challengeReadingAsQuestion.length).toBeLessThan(
        challengeReplies.length,
      )
    })

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

  /**
   * Profils énumérés, chiffres réels épinglés. L'assertion qui compte n'est
   * pas que chaque profil aveugle échoue dans l'absolu, mais qu'**aucun ne
   * tient les deux critères** — donc, structurellement, aucun ne peut battre
   * la pire lecture honnête, qui elle non plus ne les tient pas toutes deux
   * (elle repère tout mais ne corrige jamais assez).
   */
  describe('profils nommés, joués sur le corpus réel', () => {
    it('always clicking position 1 misses c1', () => {
      const path = pathOf(
        'n1-challenge',
        'n2-accept',
        'n3-reformulate',
        'n4-challenge',
        'n5-accept',
        'c1-verify',
      )

      expect(path.c1).toBe(false)
      expect(path.c2).toBe(true)
    })

    it('always clicking position 2 misses both', () => {
      const path = pathOf('n1-accept', 'c1-accept')

      expect(path.c1).toBe(false)
      expect(path.c2).toBe(false)
    })

    it('always clicking position 3 (the last, uniformly 3 replies deep) misses both', () => {
      const path = pathOf('n1-verify', 'n2-challenge', 'n3-accept', 'c2-accept')

      expect(path.c1).toBe(false)
      expect(path.c2).toBe(false)
    })

    it('accepting systematically misses both', () => {
      const path = pathOf('n1-accept', 'c1-accept')

      expect(path.c1).toBe(false)
      expect(path.c2).toBe(false)
    })

    it('refusing accept whenever offered, without ever verifying, holds c1 and misses c2', () => {
      const path = pathOf(
        'n1-challenge',
        'n2-challenge',
        'n3-challenge',
        'n4-challenge',
        'n5-challenge',
      )

      expect(path.c1).toBe(true)
      expect(path.c2).toBe(false)
    })

    it('always clicking the longest reply misses c1', () => {
      const path = pathOf(
        'n1-verify',
        'n2-verify',
        'n3-reformulate',
        'n4-reformulate',
        'n5-accept',
        'c1-challenge',
      )

      expect(path.c1).toBe(false)
      expect(path.c2).toBe(true)
    })

    it('always clicking the shortest reply misses both', () => {
      const path = pathOf('n1-accept', 'c1-verify')

      expect(path.c1).toBe(false)
      expect(path.c2).toBe(false)
    })

    it('always clicking the reply ending in "?" holds c1 and misses c2', () => {
      const path = pathOf(
        'n1-challenge',
        'n2-challenge',
        'n3-challenge',
        'n4-challenge',
        'n5-challenge',
      )

      expect(path.c1).toBe(true)
      expect(path.c2).toBe(false)
    })

    it('the worst honest read — catches every flaw, only challenges, never corrects — holds c1 and misses c2', () => {
      const path = pathOf(
        'n1-challenge',
        'n2-accept',
        'n3-challenge',
        'n4-accept',
        'n5-challenge',
      )

      expect(path.c1).toBe(true)
      expect(path.c2).toBe(false)
      expect(path.correctiveRepliesCount).toBe(0)
    })

    it('a full-credit read — catches every flaw, verifies or reformulates twice — holds both', () => {
      const path = pathOf(
        'n1-verify',
        'n2-accept',
        'n3-reformulate',
        'n4-accept',
        'n5-challenge',
      )

      expect(path.c1).toBe(true)
      expect(path.c2).toBe(true)
      expect(path.correctiveRepliesCount).toBeGreaterThanOrEqual(2)
    })
  })

  describe('le partage aveugle contre la certitude d’une lecture correcte', () => {
    /**
     * Chiffre réel épinglé, pas un plafond mou : recalculé par énumération
     * pondérée (script jetable, `e/tmp/wa-check.mjs`, hors dépôt) sur les
     * 201 chemins du corpus reconstruit après la revue du 31/08. Un futur
     * ajustement du corpus ou du seuil qui déplace cette valeur fait
     * échouer ce test.
     */
    it('the weighted blind-click share holding both criteria stays under 25%', () => {
      const bothShare = paths
        .filter((path) => path.c1 && path.c2)
        .reduce((sum, path) => sum + path.probability, 0)

      expect(bothShare).toBeCloseTo(0.21399176954732524, 6)
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
})
