import { useMemo, useRef, useState } from 'react'
import { buildPracticeMapAnswer } from '../actions/build-practice-map-answer.action'
import {
  type PracticeMapConfig,
  practiceMapConfigSchema,
} from '../schema/config.schema'

/** Les deux temps d'une lecture : poser, voir la révélation. */
export type PracticeMapPhase = 'placing' | 'revealed'

/**
 * Une entrée de la légende permanente de la réserve : les sept pratiques y
 * restent toujours listées, posées ou non — perdre la clé des numéros au
 * moment de relire son placement serait perdre exactement ce que le jeu
 * mesure. `number` est l'index de la pratique dans la configuration (1 à
 * sept), jamais un champ de corpus : une source de vérité de plus à tenir
 * synchronisée pour rien. `label` reste le nom accessible du jeton partout.
 */
export type LegendEntry = {
  id: string
  number: number
  label: string
  shortLabel: string
  placed: boolean
}

/** Une pratique posée, avec sa coordonnée : jamais `expected`. */
export type PlacedToken = {
  id: string
  number: number
  label: string
  shortLabel: string
  intensity: number
  rigor: number
}

/** Une coordonnée, sur les deux axes, dans `[0,1]`. */
export type Position = { intensity: number; rigor: number }

/** Une pratique révélée : son repère, jamais sa place attendue. */
export type Marker = { id: string; label: string; marker: string }

/**
 * Le clavier parcourt chaque axe en crans entiers : onze positions, de `0`
 * à `1`. Le compte est la source, le pas en dérive — l'inverse laisserait
 * l'arrondi de `snapToStep` sans treillis entier où retomber.
 */
const STEPS_PER_AXIS = 10

/** Un pas de déplacement au clavier, identique sur les deux axes. */
const NUDGE_STEP = 1 / STEPS_PER_AXIS

/**
 * Le milieu géométrique du plan, sur les deux axes. C'est là — et nulle
 * part ailleurs — que l'annonce en mots bascule d'un pôle à l'autre, parce
 * que c'est là que la croix est tracée à l'écran. Le seuil de notation
 * (`highRigorFrom`) ne doit jamais servir à formuler ce que le joueur lit
 * ou entend : il est localisable en deux flèches sinon.
 *
 * **Cette valeur est littérale, et le reste.** La seconde revue a relevé
 * qu'elle vaut la même chose qu'`INTENSITY_MIDPOINT` dans
 * `config.schema.ts`, sans que rien ne les lie. C'est voulu : l'une dit où
 * le plan est coupé en deux à l'écran, l'autre sert à valider qu'un corpus
 * répartit ses zones des deux côtés d'un axe. Deux notions distinctes qui
 * coïncident. Les unifier ferait suivre à l'annonce une valeur de
 * validation — la fuite du 31/08 sous une autre forme, et symétrique cette
 * fois, donc invisible au test de régression qui garde la première.
 */
const PLANE_MIDPOINT = 0.5

const clamp01 = (value: number): number => Math.min(1, Math.max(0, value))

/**
 * Ramène une coordonnée sur le treillis du pas clavier. `0.1` n'a pas de
 * représentation binaire exacte : l'accumuler fait dériver la coordonnée,
 * et deux chemins vers la même position n'y arrivent pas à la même valeur.
 * Ne s'applique qu'au clavier — un dépôt au pointeur reste continu au pixel
 * près, comme le veut l'absence de case prédéfinie.
 *
 * L'arrondi passe par le **compte entier de crans**, jamais par une
 * remultiplication par le pas : `Math.round(v / 0.1) * 0.1` laisse `0.3` et
 * `0.7` dérivés, parce que `3 * 0.1 !== 0.3` en binaire. Diviser par le
 * nombre de crans retombe sur la même valeur que la littérale.
 */
const snapToStep = (value: number): number =>
  Math.round(value * STEPS_PER_AXIS) / STEPS_PER_AXIS

/**
 * Le cycle de vie React d'une lecture, et rien d'autre. Aucune règle de
 * verdict n'y vit : les seuils sont dans le parcours, lus par l'évaluateur.
 *
 * Le verrou de soumission tient par l'**absence de chemin** : `submit` ne
 * fait rien tant que la réserve n'est pas vide, et `hold` / `place` / `nudge`
 * ne font plus rien une fois la phase `'revealed'` atteinte.
 *
 * Le hook n'expose **jamais** `expected` ni `marker` avant leur heure : les
 * jetons rendus à l'écran ne portent que `id`, `number`, `label` et
 * `shortLabel`, et les repères n'apparaissent dans la valeur de retour qu'en
 * phase `'revealed'`. Ce qui n'est pas exposé ne peut pas fuiter à l'écran.
 *
 * **`legend` est permanente : elle porte les sept pratiques, posées ou
 * non.** Une pratique posée n'en disparaît plus — seul son champ `placed`
 * change — parce que le badge d'un jeton posé sur le plan n'affiche qu'un
 * numéro : le joueur doit pouvoir résoudre ce numéro à tout instant,
 * particulièrement au moment de relire son placement avant de soumettre.
 */
export const usePracticeMap = (
  config: unknown,
  onSubmit: (answer: unknown) => void,
) => {
  // La config ne change pas en cours de partie : la valider à chaque rendu
  // était du travail jeté.
  const parsed: PracticeMapConfig = useMemo(
    () => practiceMapConfigSchema.parse(config),
    [config],
  )

  const [placements, setPlacements] = useState<ReadonlyMap<string, Position>>(
    new Map(),
  )
  const [heldId, setHeldId] = useState<string | undefined>(undefined)
  const [heldPosition, setHeldPosition] = useState<Position | undefined>(
    undefined,
  )
  const [phase, setPhase] = useState<PracticeMapPhase>('placing')
  const submittedRef = useRef(false)

  /**
   * La saisie courante, doublée en référence.
   *
   * Un glisser attache ses gestionnaires **à l'appui**, et ceux-ci vivent
   * jusqu'au lâcher sans qu'aucun rendu ne les remplace : ils liraient la
   * valeur d'état d'avant la saisie — `undefined` — et chaque promenade
   * comme chaque dépôt serait refusé par sa propre garde. La référence dit
   * ce qui est saisi *maintenant*, l'état dit ce que l'écran affiche ; les
   * deux ne changent jamais l'un sans l'autre, `holdToken` en est le seul
   * chemin.
   */
  const heldIdRef = useRef<string | undefined>(undefined)

  const holdToken = (practiceId: string | undefined): void => {
    heldIdRef.current = practiceId
    setHeldId(practiceId)
  }

  /** Saisit un jeton, en réserve ou déjà posé, à sa position courante ou au centre du plan. */
  const hold = (practiceId: string): void => {
    if (phase !== 'placing') return
    const existing = placements.get(practiceId)
    holdToken(practiceId)
    setHeldPosition(existing ?? { intensity: 0.5, rigor: 0.5 })
  }

  /** Repose le jeton saisi sans le placer. */
  const release = (): void => {
    if (phase !== 'placing') return
    holdToken(undefined)
    setHeldPosition(undefined)
  }

  /**
   * Promène le jeton saisi jusqu'à cette coordonnée, bornée dans `[0,1]`,
   * sans le poser : l'aperçu suit le pointeur pendant un glisser, et la
   * position n'est acquise qu'au lâcher.
   *
   * **Aucun arrondi sur le treillis du pas clavier**, contrairement à
   * `nudge` : un geste au pointeur reste continu au pixel près, comme le
   * veut l'absence de case prédéfinie.
   */
  const designate = (intensity: number, rigor: number): void => {
    if (phase !== 'placing' || heldIdRef.current === undefined) return
    setHeldPosition({ intensity: clamp01(intensity), rigor: clamp01(rigor) })
  }

  /**
   * Pose le jeton saisi à cette coordonnée, bornée dans `[0,1]`, et le
   * relâche. Remplace tout placement déjà existant pour cette pratique :
   * jamais un second placement pour la même pratique, la trace n'en porte
   * qu'un par construction et non par filtrage.
   *
   * Passe par la forme fonctionnelle de `setPlacements` pour la même raison
   * que `designate` lit `heldIdRef` : un dépôt au lâcher part d'un
   * gestionnaire créé à l'appui, dont la copie de `placements` date d'avant
   * le geste.
   */
  const place = (intensity: number, rigor: number): void => {
    const practiceId = heldIdRef.current
    if (phase !== 'placing' || practiceId === undefined) return
    setPlacements((current) => {
      const next = new Map(current)
      next.set(practiceId, {
        intensity: clamp01(intensity),
        rigor: clamp01(rigor),
      })
      return next
    })
    holdToken(undefined)
    setHeldPosition(undefined)
  }

  /**
   * Déplace le jeton saisi d'un pas fixe sur un axe, borné dans `[0,1]` et
   * **ramené sur le treillis du pas**.
   *
   * Passe par la forme fonctionnelle de `setHeldPosition` : deux nudges
   * déclenchés dans le même tick — une flèche diagonale, ou deux touches
   * pressées avant le prochain rendu — liraient sinon la même valeur figée
   * de `heldPosition` et le second écraserait le premier.
   *
   * **L'arrondi n'est pas cosmétique.** Correction du 31/08, sur constat de
   * la seconde revue indépendante. Sans lui, l'accumulation de `0.1` en
   * binaire produisait vingt-cinq valeurs distinctes pour onze positions,
   * et la coordonnée dépendait du **chemin** parcouru plutôt que de la case
   * visée. Deux trajets vers la même colonne ne notaient pas pareil :
   *
   * ```
   * p5, zone d'intensité [0.8, 1] :
   *   trois fois Droite depuis le centre        → 0.7999999999999999  hors zone
   *   sept fois Droite (buté à 1) puis deux Gauche → 0.8               en zone
   * ```
   *
   * Les deux annonçaient les mêmes mots et rendaient deux verdicts. Cinq
   * bords de zone du corpus réel étaient touchés, et le joueur à la souris
   * n'avait pas l'équivalent — c'est exactement l'inégalité entre les deux
   * chemins d'entrée que le reste du jeu s'attache à éviter.
   */
  const nudge = (axis: 'intensity' | 'rigor', direction: 1 | -1): void => {
    if (phase !== 'placing' || heldIdRef.current === undefined) return
    setHeldPosition((current) =>
      current === undefined
        ? current
        : {
            ...current,
            [axis]: snapToStep(clamp01(current[axis] + direction * NUDGE_STEP)),
          },
    )
  }

  /** Verrouille la lecture : ne fait rien tant qu'une pratique reste en réserve. */
  const submit = (): void => {
    if (phase !== 'placing') return
    if (placements.size < parsed.practices.length) return
    setPhase('revealed')
  }

  /** Transmet la trace à la façade, une seule fois. */
  const advance = (): void => {
    if (phase !== 'revealed') return
    if (submittedRef.current) return
    submittedRef.current = true

    onSubmit(
      buildPracticeMapAnswer(
        parsed,
        parsed.practices.map((practice) => {
          const placement = placements.get(practice.id)
          if (placement === undefined) {
            throw new Error(
              `la pratique « ${practice.id} » n'a pas de placement`,
            )
          }
          return { practiceId: practice.id, ...placement }
        }),
      ),
    )
  }

  // Une seule liste ordonnée, source à la fois du numéro de badge (l'index
  // dans la configuration, stable qu'une pratique soit posée ou non) et de
  // la légende comme des jetons du plan.
  const indexed = parsed.practices.map((practice, index) => ({
    id: practice.id,
    number: index + 1,
    label: practice.label,
    shortLabel: practice.shortLabel,
  }))

  const legend: readonly LegendEntry[] = indexed.map((entry) => ({
    ...entry,
    placed: placements.has(entry.id),
  }))

  const placedTokens: readonly PlacedToken[] = indexed.flatMap((entry) => {
    const placement = placements.get(entry.id)
    if (placement === undefined) return []
    return [{ ...entry, ...placement }]
  })

  const canSubmit = placements.size === parsed.practices.length

  const markers: readonly Marker[] =
    phase === 'revealed'
      ? parsed.practices.map((practice) => ({
          id: practice.id,
          label: practice.label,
          marker: practice.marker,
        }))
      : []

  /**
   * La position en mots : deux crans nommés par axe, tirés des pôles de la
   * configuration, jamais un nombre — un joueur au clavier ne doit pas
   * obtenir une précision que le joueur à la souris n'a pas.
   *
   * **Les deux axes basculent au milieu géométrique du plan, `0.5`, et
   * jamais à `highRigorFrom`.** Correction du 31/08, sur constat critique
   * de la revue indépendante. L'axe d'intensité basculait déjà à `0.5` ;
   * l'axe de rigueur basculait au seuil de notation, ce qui le rendait
   * localisable au clavier en deux flèches depuis le centre — le mot
   * changeait entre `0.6` et `0.7` alors que la croix est tracée à `0.5`.
   * La revue a chiffré l'exploit sur le corpus réel : sept jetons alignés
   * à une rigueur de `0.75`, intensités étalées, sans lire un libellé,
   * tiennent `c2` dans 47,7 % des cas contre 13,3 % au hasard — au-dessus
   * même des 43,75 % que `plan.md` cite comme le coût inacceptable de
   * vraies cellules de dépôt.
   *
   * L'annonce dit désormais exactement ce que la croix montre, et rien de
   * plus : `DESIGN.md`, « Un jeu ne dit jamais ce qu'il note. » Le seuil
   * de notation ne sort d'aucune surface visible ni audible.
   */
  const positionLabel = (intensity: number, rigor: number): string => {
    const intensityWord =
      intensity < PLANE_MIDPOINT
        ? parsed.poles.intensityLow
        : parsed.poles.intensityHigh
    const rigorWord =
      rigor < PLANE_MIDPOINT ? parsed.poles.rigorLow : parsed.poles.rigorHigh
    return `${intensityWord}, ${rigorWord}`
  }

  return {
    statement: parsed.statement,
    poles: parsed.poles,
    quadrants: parsed.quadrants,
    legend,
    placedTokens,
    heldId,
    heldPosition,
    phase,
    canSubmit,
    markers,
    hold,
    release,
    designate,
    place,
    nudge,
    submit,
    advance,
    positionLabel,
  }
}
