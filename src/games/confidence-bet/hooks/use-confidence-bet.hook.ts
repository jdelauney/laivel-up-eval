import { useMemo, useRef, useState } from 'react'
import { buildConfidenceBetAnswer } from '../actions/build-confidence-bet-answer.action'
import { replayBets, truthStakeFor } from '../helpers/run-simulation.helper'
import type { Bet } from '../schema/answer.schema'
import {
  confidenceBetConfigSchema,
  type SnippetNature,
} from '../schema/config.schema'

/**
 * Ce que l'écran a besoin de savoir sur un extrait déjà joué, déjà assemblé
 * pour le relevé : l'élément et le composite restent muets, ils reçoivent et
 * affichent.
 */
export type LedgerEntry = {
  snippetId: string
  label: string
  stake: number
  delta: number
}

/**
 * La révélation d'un extrait, qui n'existe qu'une fois sa mise engagée :
 * avant ce moment, aucune fonction du hook ne peut la produire.
 *
 * `truthStake` absent veut dire qu'aucune position n'était justifiable sur
 * l'échelle : la règle de la révélation ne pose alors aucun repère de vérité.
 */
export type Revelation = {
  nature: SnippetNature
  reveal: string
  delta: number
  stake: number
  truthStake: number | undefined
}

/**
 * Le cycle de vie React de la partie, et rien d'autre : le mouvement de
 * capital vit dans la simulation partagée avec l'évaluateur, jamais
 * recalculé ici.
 *
 * Les mises engagées sont en ajout seul : aucune fonction rendue par ce hook
 * ne permet de retirer ou de réécrire une mise déjà posée. C'est l'acceptance
 * première de la story, et elle se tient par l'absence du chemin, pas par une
 * garde.
 */
export const useConfidenceBet = (
  config: unknown,
  onSubmit: (answer: unknown) => void,
) => {
  // La config ne change pas d'un extrait à l'autre : la valider à chaque
  // rendu était du travail jeté.
  const parsed = useMemo(
    () => confidenceBetConfigSchema.parse(config),
    [config],
  )
  const [bets, setBets] = useState<readonly Bet[]>([])
  const [selectedStake, setSelectedStake] = useState<number | undefined>(
    undefined,
  )
  const [revealing, setRevealing] = useState(false)
  const submitted = useRef(false)

  const state = useMemo(() => replayBets(parsed, bets), [parsed, bets])

  /**
   * Tant que la révélation d'une mise engagée est à l'écran, l'extrait
   * ouvert reste celui qui vient d'être joué : c'est le passage, jamais
   * l'engagement, qui ouvre le suivant.
   */
  const openIndex = revealing ? bets.length - 1 : bets.length
  const snippet = parsed.snippets[openIndex]
  const isComplete = bets.length >= parsed.snippets.length && !revealing

  const lastResult = state.results[state.results.length - 1]
  const lastSnippet = parsed.snippets[bets.length - 1]
  const revelation: Revelation | undefined =
    revealing && lastResult !== undefined && lastSnippet !== undefined
      ? {
          nature: lastResult.nature,
          reveal: lastSnippet.reveal,
          delta: lastResult.delta,
          stake: lastResult.stake,
          truthStake: truthStakeFor(parsed, lastResult.nature),
        }
      : undefined

  const ledger: readonly LedgerEntry[] = state.results.map((result) => ({
    snippetId: result.snippetId,
    label:
      parsed.snippets.find((entry) => entry.id === result.snippetId)?.label ??
      result.snippetId,
    stake: result.stake,
    delta: result.delta,
  }))

  const selectStake = (value: number): void => {
    if (revealing || isComplete) return
    setSelectedStake(value)
  }

  /** Verrouille la mise choisie : elle ne se reprend jamais. */
  const engage = (): void => {
    if (revealing || isComplete || selectedStake === undefined) return
    if (snippet === undefined) return

    setBets((current) => [
      ...current,
      { snippetId: snippet.id, stake: selectedStake },
    ])
    setSelectedStake(undefined)
    setRevealing(true)
  }

  /** Ouvre l'extrait suivant, ou soumet au dernier, une seule fois. */
  const advance = (): void => {
    if (!revealing) return
    setRevealing(false)

    if (bets.length < parsed.snippets.length || submitted.current) return
    submitted.current = true
    onSubmit(buildConfidenceBetAnswer(parsed, bets))
  }

  return {
    statement: parsed.statement,
    snippet,
    snippetNumber: openIndex + 1,
    snippetsTotal: parsed.snippets.length,
    stakes: parsed.stakes,
    neutralStake: parsed.neutralStake,
    selectedStake,
    canEngage: !revealing && !isComplete && selectedStake !== undefined,
    revelation,
    capital: state.capital,
    ledger,
    isComplete,
    selectStake,
    engage,
    advance,
  }
}
