import { useEffect, useMemo, useRef, useState } from 'react'
import { buildKeepOrTossAnswer } from '../actions/build-keep-or-toss-answer.action'
import type { KeepOrTossAnswer } from '../schema/answer.schema'
import {
  type KeepOrTossConfig,
  keepOrTossConfigSchema,
} from '../schema/config.schema'
import { useCountdown } from './use-countdown.hook'

/**
 * Trois temps : `'sorting'` pendant que le joueur trie, `'frozen'` dès que
 * le temps est écoulé ou le lot est trié — plus aucun geste n'est accepté —
 * puis `'revealed'`, sur un geste du joueur, jamais automatique : il en va
 * de même partout ailleurs dans le parcours, où la révélation suit toujours
 * une action explicite, jamais une bascule silencieuse.
 */
export type KeepOrTossPhase = 'sorting' | 'frozen' | 'revealed'

/** La carte au centre de la pile, telle que l'écran la lit avant le gel : son libellé, jamais son verdict attendu. */
export type CurrentItem = { id: string; label: string }

/** Un item révélé : son libellé, le verdict attendu et le pourquoi — jamais ce que le joueur a répondu. */
export type ItemRevelation = {
  id: string
  label: string
  keep: boolean
  reason: string
}

/**
 * Le cycle de vie React d'une partie, et rien d'autre. Aucune règle de
 * verdict n'y vit : les seuils sont dans le parcours, lus par l'évaluateur.
 *
 * Le lot se présente dans l'ordre déclaré par la configuration, jamais
 * mélangé au chargement : une partie doit rendre la même trace d'un joueur
 * à l'autre pour que les seuils veuillent dire quelque chose, et le mode
 * rejeu du projet interdit l'aléatoire non semé — même décision que
 * `initialOrder` dans `flow-order`.
 *
 * **Le gel à l'expiration se déclenche par deux chemins, jamais un troisième.**
 * Le chemin passif : l'effet sur `expired`, qui bascule au tick suivant de
 * `useCountdown` (250 ms). Le chemin actif : `sort()` lui-même, qui relit le
 * temps frais à chaque geste et gèle immédiatement s'il tombe après la
 * limite — sans attendre ce tick. Les deux appellent le même `freeze()`,
 * donc un tri arrivé après la seconde limite n'entre jamais dans la trace,
 * y compris dans le quart de seconde où `phase` n'a pas encore bougé.
 * `sort()` ne fait plus rien une fois `'frozen'` atteint, et le compte à
 * rebours s'arrête le même rendu — `running` de `useCountdown` retombe à
 * `false` dès que la phase quitte `'sorting'`.
 *
 * Le hook n'expose **jamais** `keep` ni `reason` avant leur heure : la
 * carte courante ne porte que `id` et `label`, et `revelations` reste vide
 * tant que la phase n'est pas `'revealed'`. Ce qui n'est pas exposé ne peut
 * pas fuiter à l'écran.
 */
export const useKeepOrToss = (
  config: unknown,
  onSubmit: (answer: unknown) => void,
) => {
  // La config ne change pas en cours de partie : la valider à chaque rendu
  // était du travail jeté.
  const parsed: KeepOrTossConfig = useMemo(
    () => keepOrTossConfigSchema.parse(config),
    [config],
  )

  const [verdicts, setVerdicts] = useState<ReadonlyMap<string, boolean>>(
    () => new Map(),
  )
  const [phase, setPhase] = useState<KeepOrTossPhase>('sorting')
  const [frozenAnswer, setFrozenAnswer] = useState<
    KeepOrTossAnswer | undefined
  >(undefined)
  const submittedRef = useRef(false)

  // Le chronomètre tourne tant que le tri n'est pas gelé, et s'arrête net
  // au gel : `phase !== 'sorting'` retombe `running` à `false` le même
  // rendu où `'frozen'` se pose.
  const { remainingSeconds, expired, announcement, readElapsedSeconds } =
    useCountdown(parsed.durationSeconds, phase === 'sorting')

  const total = parsed.items.length
  const sortedCount = verdicts.size
  const currentItem = parsed.items[sortedCount]

  // Une ref suit les verdicts les plus frais pour le gel déclenché par
  // l'expiration : l'effet ci-dessous ne doit pas redéclarer `verdicts` en
  // dépendance, sous peine de relancer le minuteur à chaque tri.
  const verdictsRef = useRef(verdicts)
  verdictsRef.current = verdicts

  /** Fige le tri, quel que soit le déclencheur : capture la durée à l'instant de l'appel, construit la trace, bloque tout geste suivant. Le SEUL chemin vers `'frozen'`. */
  const freeze = (verdictsAtFreeze: ReadonlyMap<string, boolean>): void => {
    if (phase !== 'sorting') return

    setFrozenAnswer(
      buildKeepOrTossAnswer(parsed, verdictsAtFreeze, readElapsedSeconds()),
    )
    setPhase('frozen')
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: `freeze` et `verdictsRef` se redéfinissent à chaque rendu, mais l'effet ne doit réagir qu'au franchissement de `expired` — sur le modèle des effets minutés de `defect-hunt` et `flow-order`.
  useEffect(() => {
    if (!expired) return
    freeze(verdictsRef.current)
  }, [expired])

  // Le second et dernier chemin vers le gel : le lot entier trié. Un effet
  // qui réagit à `verdicts`, jamais un appel direct dans `sort()` — geler
  // depuis l'intérieur d'une mise à jour fonctionnelle de `setVerdicts`
  // appellerait un second `setState` pendant le calcul du premier, un motif
  // que React déconseille et qui s'exécuterait deux fois sous StrictMode.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `freeze` se redéfinit à chaque rendu ; l'effet ne doit réagir qu'au changement de `verdicts` ou de `phase`.
  useEffect(() => {
    if (phase !== 'sorting' || verdicts.size !== total) return
    freeze(verdicts)
  }, [verdicts, phase, total])

  /**
   * Trie la carte courante. Ne fait plus rien une fois `'frozen'` atteint —
   * aucun autre chemin ne rouvre le tri.
   *
   * **Se garde sur une lecture fraîche du temps, pas sur `phase`.** `phase`
   * ne bascule à `'frozen'` qu'au tick suivant de `useCountdown` (250 ms) :
   * entre l'instant où le budget expire et ce tick, `phase` vaut encore
   * `'sorting'`, et un tri déposé dans cette fenêtre entrait dans la trace
   * avant ce correctif — constat de la revue du 31/08. `readElapsedSeconds`
   * recalcule depuis `Date.now()` à l'instant de l'appel, jamais depuis
   * l'état affiché qui porte ce même quart de seconde de retard : un geste
   * arrivé après la limite gèle immédiatement le lot au lieu d'être compté.
   *
   * Passe par la forme fonctionnelle de `setVerdicts` : deux tris déclenchés
   * dans le même tick liraient sinon la même valeur figée de `verdicts` et
   * le second écraserait le premier au lieu de s'y ajouter — la même faute
   * que corrige `nudge` dans `use-practice-map.hook.ts`.
   */
  const sort = (kept: boolean): void => {
    if (phase !== 'sorting' || currentItem === undefined) return

    if (readElapsedSeconds() >= parsed.durationSeconds) {
      freeze(verdictsRef.current)
      return
    }

    const itemId = currentItem.id
    setVerdicts((current) => {
      const next = new Map(current)
      next.set(itemId, kept)
      return next
    })
  }

  /** Passe de `'frozen'` à `'revealed'` : un geste du joueur, jamais automatique. */
  const reveal = (): void => {
    if (phase !== 'frozen') return
    setPhase('revealed')
  }

  /** Transmet la trace déjà figée à la façade, une seule fois. */
  const advance = (): void => {
    if (phase !== 'revealed') return
    if (frozenAnswer === undefined || submittedRef.current) return
    submittedRef.current = true
    onSubmit(frozenAnswer)
  }

  const revelations: readonly ItemRevelation[] =
    phase === 'revealed'
      ? parsed.items.map((item) => ({
          id: item.id,
          label: item.label,
          keep: item.keep,
          reason: item.reason,
        }))
      : []

  return {
    statement: parsed.statement,
    total,
    sortedCount,
    durationSeconds: parsed.durationSeconds,
    remainingSeconds,
    announcement,
    phase,
    currentItem:
      currentItem === undefined
        ? undefined
        : { id: currentItem.id, label: currentItem.label },
    sort,
    reveal,
    advance,
    revelations,
  }
}
