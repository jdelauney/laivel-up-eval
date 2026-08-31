import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import type { Course } from '@/core/contracts/course.schema'
import { FlowOrderEvaluator } from '@/games/flow-order/flow-order.evaluator'
import { flowOrderConfigSchema } from '@/games/flow-order/schema/config.schema'
import projectCourse from '../../../config/course.json'

/**
 * `flow-order/schema/config.schema.ts` fige un seuil interne
 * (`DISPLACEMENT_THRESHOLD`) pour refuser au chargement un `initialOrder`
 * trop généreux. Ce seuil n'a et ne doit avoir aucun accès au
 * `maxDisplacement` que le parcours déclare pour la règle
 * `order-within-displacement` : la `config` d'un jeu et la `rule` d'un
 * critère restent opaques l'une à l'autre par construction
 * (`core/contracts/course.schema.ts`, « le moteur ne les interprète
 * jamais »). Rien n'empêche donc les deux valeurs de diverger si un auteur
 * de parcours desserre la tolérance dans `course.json` sans toucher au
 * schéma — une modification d'un seul caractère.
 *
 * Ce test ne relit pas le seuil du schéma : il fait rejouer l'évaluateur
 * réel du jeu contre le `maxDisplacement` **déclaré par le parcours réel**,
 * sur l'`initialOrder` **réel** de `config/course.json`. C'est le point où
 * les deux valeurs se rencontrent effectivement — au chargement du jeu, pas
 * à la validation du schéma — donc c'est là que la fuite se ferme. Si un
 * futur auteur écrit `maxDisplacement: 2` dans le parcours sans changer le
 * corpus, c'est ce test — pas le schéma — qui doit rougir.
 */

const criterionRuleWithThreshold = z.object({
  maxDisplacement: z.number(),
})

describe('flow-order: le seuil déclaré par le parcours ferme le geste « ne rien toucher »', () => {
  it('refuse les deux critères de g5-2 pour son propre initialOrder, au seuil que g5-2 déclare lui-même', () => {
    const course = projectCourse as Course
    const group = course.groups.find((entry) =>
      entry.games.some((game) => game.id === 'g5-2'),
    )
    const game = group?.games.find((entry) => entry.id === 'g5-2')
    if (game === undefined) {
      throw new Error('g5-2 introuvable dans le parcours réel')
    }

    const exactCriterion = game.criteria.find(
      (criterion) => criterion.rule.type === 'order-exact',
    )
    const displacementCriterion = game.criteria.find(
      (criterion) => criterion.rule.type === 'order-within-displacement',
    )
    if (exactCriterion === undefined || displacementCriterion === undefined) {
      throw new Error(
        'g5-2 doit déclarer un critère « order-exact » et un critère « order-within-displacement »',
      )
    }

    // Le seuil vient du parcours, jamais d'une constante du jeu : c'est
    // précisément la valeur que le schéma ne peut pas voir.
    const { maxDisplacement: declaredMaxDisplacement } =
      criterionRuleWithThreshold.parse(displacementCriterion.rule)
    expect(declaredMaxDisplacement).toBeGreaterThanOrEqual(0)

    const config = flowOrderConfigSchema.parse(game.config)
    const evaluator = new FlowOrderEvaluator()
    const verdict = evaluator
      .evaluate({ orderedIds: [...config.initialOrder] }, config, game.criteria)
      .reduce<Record<string, boolean>>((accumulator, result) => {
        accumulator[result.criterionId] = result.satisfied
        return accumulator
      }, {})

    expect(verdict[exactCriterion.id]).toBe(false)
    expect(verdict[displacementCriterion.id]).toBe(false)
  })
})
