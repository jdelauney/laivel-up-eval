import type { Decision } from '../schema/answer.schema'
import type { CheckpointsConfig, Choice, Stage } from '../schema/config.schema'

/**
 * L'avancée de la partie, en une seule implémentation. La même fonction fait
 * avancer le jeu à l'écran et rejoue la trace au scoring : deux implémentations
 * auraient divergé au premier ajustement de coût, et le verdict n'aurait plus
 * décrit la partie jouée.
 *
 * Aucune horloge, aucun aléa, aucun accès extérieur : la fonction ne dépend que
 * de ses arguments, et deux parties aux mêmes choix rendent la même trace.
 */

export type PendingDefect = {
  id: string
  stageId: string
  burstsAt: string
  cost: number
}

export type Burst = {
  defectId: string
  stageId: string
  cost: number
}

export type SimulationState = {
  stageIndex: number
  budget: number
  pendingDefects: readonly PendingDefect[]
  decisions: readonly Decision[]
  bursts: readonly Burst[]
}

export class GameAlreadyOverError extends Error {
  constructor() {
    super('les six étapes du jeu checkpoints sont déjà tranchées')
    this.name = 'GameAlreadyOverError'
  }
}

export const initialState = (config: CheckpointsConfig): SimulationState => ({
  stageIndex: 0,
  budget: config.budget,
  pendingDefects: [],
  decisions: [],
  bursts: [],
})

export const currentStage = (
  config: CheckpointsConfig,
  state: SimulationState,
): Stage | undefined => config.stages[state.stageIndex]

export const isFinished = (
  config: CheckpointsConfig,
  state: SimulationState,
): boolean => state.stageIndex >= config.stages.length

/**
 * Le surcoût d'un défaut est le prix de sa correction à la source, multiplié
 * par son facteur : le joueur qui laisse courir paie plus tard, et plus cher,
 * exactement ce qu'il a refusé de payer tôt.
 */
const sowDefect = (
  carried: readonly PendingDefect[],
  stage: Stage,
): readonly PendingDefect[] => {
  if (stage.defect === undefined) return carried

  return [
    ...carried,
    {
      id: stage.defect.id,
      stageId: stage.id,
      burstsAt: stage.defect.burstsAt,
      cost: stage.defect.factor * stage.costs.corriger,
    },
  ]
}

/** `corriger` traite l'étape courante, `re-cadrer` reprend aussi l'amont. */
const treatDefects = (
  carried: readonly PendingDefect[],
  stage: Stage,
  choice: Choice,
): readonly PendingDefect[] => {
  if (choice === 're-cadrer') return []
  if (choice === 'corriger') {
    return carried.filter((defect) => defect.stageId !== stage.id)
  }
  return carried
}

export const applyChoice = (
  config: CheckpointsConfig,
  state: SimulationState,
  choice: Choice,
): SimulationState => {
  const stage = currentStage(config, state)
  if (stage === undefined) throw new GameAlreadyOverError()

  const carried = treatDefects(
    sowDefect(state.pendingDefects, stage),
    stage,
    choice,
  )
  const bursting = carried.filter((defect) => defect.burstsAt === stage.id)
  const cost = stage.costs[choice]
  const burstCost = bursting.reduce((sum, defect) => sum + defect.cost, 0)

  return {
    stageIndex: state.stageIndex + 1,
    /** Le budget n'est jamais borné : le dépassement se lit, il n'arrête rien. */
    budget: state.budget - cost - burstCost,
    /**
     * Un défaut laissé passer reste dans le livrable : son éclatement en
     * prélève le prix, il ne le répare pas. Seule une reprise à la source, ou
     * un re-cadrage qui reprend l'amont, le retire.
     */
    pendingDefects: carried,
    decisions: [...state.decisions, { stageId: stage.id, choice, cost }],
    bursts: [
      ...state.bursts,
      ...bursting.map((defect) => ({
        defectId: defect.id,
        stageId: stage.id,
        cost: defect.cost,
      })),
    ],
  }
}

/**
 * Le rejeu ne lit que les choix : les coûts de la trace sont un journal, pas
 * une source. L'évaluateur passe par ici plutôt que de refaire l'avancée, et
 * une trace dont les coûts auraient été forgés ne change aucun verdict.
 */
export const replayTrace = (
  config: CheckpointsConfig,
  decisions: readonly { choice: Choice }[],
): SimulationState =>
  decisions.reduce<SimulationState>(
    (state, decision) => applyChoice(config, state, decision.choice),
    initialState(config),
  )
