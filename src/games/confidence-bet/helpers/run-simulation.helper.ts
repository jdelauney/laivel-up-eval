import type { Bet } from '../schema/answer.schema'
import { UnknownSnippetError } from '../schema/answer.schema'
import type {
  ConfidenceBetConfig,
  SnippetNature,
} from '../schema/config.schema'

/**
 * Le mouvement de capital, en une seule implémentation. La même fonction fait
 * avancer le jeu à l'écran et rejoue la trace au scoring : deux
 * implémentations auraient divergé au premier ajustement de barème, et le
 * verdict n'aurait plus décrit la partie jouée.
 *
 * Aucune horloge, aucun aléa, aucun accès extérieur : la fonction ne dépend
 * que de ses arguments, et deux parties aux mêmes mises rendent le même état.
 */

export type BetResult = {
  snippetId: string
  nature: SnippetNature
  stake: number
  delta: number
}

export type SimulationState = {
  played: number
  capital: number
  results: readonly BetResult[]
}

export class GameAlreadyOverError extends Error {
  constructor() {
    super('les extraits de la partie confidence-bet sont déjà tous joués')
    this.name = 'GameAlreadyOverError'
  }
}

/**
 * Rendre `0` sur une nature absente des résultats rouvrirait, par vacuité,
 * exactement le trou que `confidenceBetConfigSchema` ferme au chargement :
 * un critère `mean-stake-on-*` verrait `0 < seuil` réussir sans qu'aucune
 * mise n'ait jamais été posée. Le garde de configuration rend la branche
 * inatteignable en jeu ; l'erreur nommée la ferme aussi côté code.
 */
export class NoStakeForNatureError extends Error {
  readonly nature: SnippetNature

  constructor(nature: SnippetNature) {
    super(`aucune mise n'a été posée sur un extrait « ${nature} »`)
    this.name = 'NoStakeForNatureError'
    this.nature = nature
  }
}

export const initialState = (config: ConfidenceBetConfig): SimulationState => ({
  played: 0,
  capital: config.startingCapital,
  results: [],
})

const natureOf = (
  config: ConfidenceBetConfig,
  snippetId: string,
): SnippetNature => {
  const snippet = config.snippets.find((entry) => entry.id === snippetId)
  if (snippet === undefined) {
    throw new UnknownSnippetError(snippetId)
  }
  return snippet.nature
}

/**
 * Le mouvement de capital d'une mise : `stake − neutralStake` sur un
 * extrait sain, `neutralStake − stake` sur un défectueux. Sur un extrait
 * indécidable, rien ne permet de trancher une direction : seul
 * l'éloignement du doute se paie, `−|stake − neutralStake|`. Un extrait
 * indécidable qui ne coûterait rien inviterait l'extrémité, un extrait
 * indécidable qui paierait récompenserait la devinette — c'est la seule
 * forme qui s'annonce honnêtement dans la consigne sans dire ce qui est
 * noté.
 */
const deltaFor = (
  nature: SnippetNature,
  stake: number,
  neutralStake: number,
): number => {
  if (nature === 'sound') return stake - neutralStake
  if (nature === 'flawed') return neutralStake - stake

  // `-Math.abs(0)` vaudrait `-0` : un coût de zéro doit rester `0`, pas une
  // négation qui ne change rien à la valeur mais brouille l'égalité et
  // l'affichage signé du mouvement de capital.
  const distanceFromNeutral = Math.abs(stake - neutralStake)
  return distanceFromNeutral === 0 ? 0 : -distanceFromNeutral
}

/**
 * La position que la mise aurait dû prendre sur l'échelle, autrement dit
 * celle qui maximise le mouvement de capital pour cette nature. Elle vit ici,
 * collée à `deltaFor`, pour que le repère montré à la révélation et le barème
 * qui le paie ne puissent pas diverger.
 *
 * Sur un extrait indécidable, il n'y a pas de position juste : la fonction ne
 * rend rien, et l'écran n'a donc aucun repère à poser.
 */
export const truthStakeFor = (
  config: ConfidenceBetConfig,
  nature: SnippetNature,
): number | undefined => {
  if (nature === 'sound') return Math.max(...config.stakes)
  if (nature === 'flawed') return Math.min(...config.stakes)
  return undefined
}

export const applyBet = (
  config: ConfidenceBetConfig,
  state: SimulationState,
  bet: Bet,
): SimulationState => {
  if (state.played >= config.snippets.length) throw new GameAlreadyOverError()

  const nature = natureOf(config, bet.snippetId)
  const delta = deltaFor(nature, bet.stake, config.neutralStake)

  return {
    played: state.played + 1,
    capital: state.capital + delta,
    results: [
      ...state.results,
      { snippetId: bet.snippetId, nature, stake: bet.stake, delta },
    ],
  }
}

/**
 * Le rejeu ne lit que les mises : le journal d'une trace (le capital final)
 * n'est jamais une source. L'évaluateur passe par ici plutôt que de refaire
 * le mouvement, et une trace dont le journal aurait été forgé ne change
 * aucun verdict. Accepte un préfixe : l'écran s'en sert pour l'état courant.
 */
export const replayBets = (
  config: ConfidenceBetConfig,
  bets: readonly Bet[],
): SimulationState =>
  bets.reduce<SimulationState>(
    (state, bet) => applyBet(config, state, bet),
    initialState(config),
  )

export const stakesOn = (
  state: SimulationState,
  nature: SnippetNature,
): readonly number[] =>
  state.results
    .filter((result) => result.nature === nature)
    .map((result) => result.stake)

export const meanStakeOn = (
  state: SimulationState,
  nature: SnippetNature,
): number => {
  const stakes = stakesOn(state, nature)
  if (stakes.length === 0) throw new NoStakeForNatureError(nature)

  return stakes.reduce((sum, stake) => sum + stake, 0) / stakes.length
}

/**
 * La discrimination entre extraits tranchables, dans `[-1, 1]` par
 * construction de la symétrie de l'échelle. Ignore les indécidables : leur
 * `delta` maximal atteignable est nul, les compter ferait décroître la
 * calibration sans rien mesurer. Le capital porte les deux, la calibration
 * ne lit que la discrimination, le garde-fou (`stakesOn('undecidable')`) ne
 * lit que la retenue.
 */
export const calibration = (
  config: ConfidenceBetConfig,
  state: SimulationState,
): number => {
  const decidable = state.results.filter(
    (result) => result.nature !== 'undecidable',
  )
  if (decidable.length === 0) return 0

  const maxDeltaPerSnippet = Math.max(...config.stakes) - config.neutralStake
  const denominator = decidable.length * maxDeltaPerSnippet
  if (denominator === 0) return 0

  const sumDelta = decidable.reduce((sum, result) => sum + result.delta, 0)
  return sumDelta / denominator
}
