import { useMemo, useRef, useState } from 'react'
import { buildFlowOrderAnswer } from '../actions/build-flow-order-answer.action'
import {
  type FlowOrderConfig,
  flowOrderConfigSchema,
} from '../schema/config.schema'

/** Les deux temps d'une lecture : ordonner, voir la révélation. */
export type FlowOrderPhase = 'ordering' | 'revealed'

/**
 * Une étape telle que l'écran la lit avant la révélation : son libellé et
 * sa position **jouée**, jamais `rank` ni `note`. Rien ne distingue la
 * place attendue de la place jouée dans cette forme — c'est précisément ce
 * que le jeu mesure.
 */
export type StepView = {
  id: string
  label: string
  // Position courante dans la frise, 1-indexée — recalculée à chaque geste.
  position: number
}

/** Une étape révélée, dans l'ordre attendu : son libellé et ce qu'elle apporte, jamais un verdict sur la frise jouée. */
export type StepRevelation = {
  id: string
  label: string
  note: string
}

/**
 * Le cycle de vie React d'une lecture, et rien d'autre. Aucune règle de
 * verdict n'y vit : les seuils sont dans le parcours, lus par l'évaluateur.
 *
 * Le verrou de soumission tient par la **phase**, jamais par une condition
 * de complétude : la frise part de `initialOrder` — une permutation
 * complète garantie par le schéma — et chaque geste ne fait que la
 * réordonner, jamais en retirer ou en ajouter une étape. `submit` est donc
 * toujours disponible en phase `'ordering'`, contrairement à `practice-map`
 * ou `ambiguity-scan` qui gardent une réserve à vider ou un premier
 * signalement à poser.
 *
 * Le hook n'expose **jamais** `rank` ni `note` avant leur heure : `steps` ne
 * porte que `id`, `label` et `position`, et `revelations` reste vide tant
 * que la phase n'est pas `'revealed'`.
 *
 * Deux chemins d'entrée, à égalité stricte de précision (`DESIGN.md`
 * §93-94) — **tous deux atteignent la dernière position de la frise**,
 * vérifié par un test qui compare l'ensemble des positions atteignables par
 * l'un et par l'autre :
 * - pointeur : `activate` saisit une carte au premier appel ; au second, elle
 *   se dépose au contact de la carte visée, avant si elle remonte, après si
 *   elle descend — sur le modèle du hold/place de `usePracticeMap`, ajusté
 *   pour que la queue de la frise reste atteignable (voir `activate`) ;
 * - clavier : `move` déplace une étape d'un cran, sans étape de saisie
 *   préalable — la carte est directement un `button` que `ArrowUp` /
 *   `ArrowDown` déplacent, `DESIGN.md` §93-94 en faisant une exigence du
 *   jeu et non d'une primitive partagée. `Escape` relâche une carte saisie
 *   au pointeur sans la déplacer, le pendant clavier de `release`.
 *
 * `announcement` porte le pendant clavier du retour visuel : la nouvelle
 * position de la dernière étape déplacée, par l'un ou l'autre chemin.
 */
export const useFlowOrder = (
  config: unknown,
  onLock: (answer: unknown) => void,
  onAdvance: () => void,
) => {
  // La config ne change pas en cours de partie : la valider à chaque rendu
  // était du travail jeté.
  const parsed: FlowOrderConfig = useMemo(
    () => flowOrderConfigSchema.parse(config),
    [config],
  )

  const stepById = useMemo(
    () => new Map(parsed.steps.map((step) => [step.id, step])),
    [parsed],
  )

  const [order, setOrder] = useState<readonly string[]>(parsed.initialOrder)
  const [heldId, setHeldId] = useState<string | undefined>(undefined)
  const [phase, setPhase] = useState<FlowOrderPhase>('ordering')
  const [announcement, setAnnouncement] = useState('')
  const lockedRef = useRef(false)
  const advancedRef = useRef(false)

  /** Annonce la position courante d'une étape dans la frise donnée, en mots comptés — jamais un nombre seul, pour rester lisible au lecteur d'écran comme au clavier. */
  const announcePosition = (
    stepId: string,
    nextOrder: readonly string[],
  ): void => {
    const position = nextOrder.indexOf(stepId) + 1
    setAnnouncement(`étape ${position} sur ${nextOrder.length}`)
  }

  /**
   * Saisit ou dépose une carte, selon ce qui est déjà saisi :
   * - rien n'est saisi → cette carte est saisie ;
   * - cette carte est déjà saisie → elle est relâchée sans bouger ;
   * - une autre carte est saisie → elle est déposée au contact de celle-ci,
   *   **avant** si la carte saisie remonte, **après** si elle descend.
   *
   * Déposer systématiquement « juste avant » la cible rendait la dernière
   * position inatteignable au pointeur : aucune carte ne se trouve jamais
   * après la dernière. Choisir le côté du dépôt selon le sens du geste — le
   * même geste qu'un glisser-déposer usuel, où l'on dépose « de l'autre
   * côté » de la cible quand on vient d'en dessous — rend au pointeur
   * exactement les états que le clavier atteint à coups de flèches : retirer
   * la carte saisie et la réinsérer à l'index visé, sans jamais toucher
   * l'ordre relatif des autres cartes.
   */
  const activate = (stepId: string): void => {
    if (phase !== 'ordering') return

    if (heldId === undefined) {
      setHeldId(stepId)
      return
    }

    if (heldId === stepId) {
      setHeldId(undefined)
      return
    }

    const grabbedId = heldId
    setOrder((current) => {
      const grabbedIndex = current.indexOf(grabbedId)
      const targetIndex = current.indexOf(stepId)
      const movingDown = grabbedIndex < targetIndex

      const withoutGrabbed = current.filter((id) => id !== grabbedId)
      const targetIndexWithoutGrabbed = withoutGrabbed.indexOf(stepId)
      const insertAt = movingDown
        ? targetIndexWithoutGrabbed + 1
        : targetIndexWithoutGrabbed

      const next = [
        ...withoutGrabbed.slice(0, insertAt),
        grabbedId,
        ...withoutGrabbed.slice(insertAt),
      ]
      announcePosition(grabbedId, next)
      return next
    })
    setHeldId(undefined)
  }

  /** Relâche la carte saisie sans la déplacer — le pendant pointeur d'Échap. */
  const release = (): void => {
    if (phase !== 'ordering') return
    setHeldId(undefined)
  }

  /**
   * Déplace une étape d'un cran, sans saisie préalable — le chemin clavier.
   *
   * Relâche aussi toute carte saisie au pointeur : sans ce relâchement, une
   * carte saisie puis déplacée aux flèches restait « saisie » en apparence,
   * et le clic suivant sur une autre carte — pensé comme une désélection —
   * était lu comme un dépôt et téléportait la carte saisie. Le clavier prend
   * la main, le geste pointeur en cours s'annule.
   */
  const move = (stepId: string, direction: 1 | -1): void => {
    if (phase !== 'ordering') return
    setHeldId(undefined)
    setOrder((current) => {
      const index = current.indexOf(stepId)
      const target = index + direction
      if (target < 0 || target >= current.length) return current

      const next = [...current]
      const swapped = next[target]
      next[target] = next[index]
      next[index] = swapped
      announcePosition(stepId, next)
      return next
    })
  }

  /**
   * Verrouille la lecture : la frise est toujours une permutation complète,
   * rien à attendre de plus. Écrit la trace immédiatement, avant de basculer
   * sur la révélation.
   */
  const submit = (): void => {
    if (phase !== 'ordering') return
    if (lockedRef.current) return
    lockedRef.current = true

    onLock(buildFlowOrderAnswer(parsed, order))
    setPhase('revealed')
  }

  /** Passe au jeu suivant, une seule fois. */
  const advance = (): void => {
    if (phase !== 'revealed') return
    if (advancedRef.current) return
    advancedRef.current = true

    onAdvance()
  }

  const steps: readonly StepView[] = order.map((id, index) => {
    const step = stepById.get(id)
    if (step === undefined) {
      throw new Error(`l'étape « ${id} » n'a pas de libellé à lire`)
    }
    return { id, label: step.label, position: index + 1 }
  })

  const revelations: readonly StepRevelation[] =
    phase === 'revealed'
      ? [...parsed.steps]
          .sort((a, b) => a.rank - b.rank)
          .map((step) => ({ id: step.id, label: step.label, note: step.note }))
      : []

  return {
    statement: parsed.statement,
    steps,
    heldId,
    phase,
    announcement,
    activate,
    release,
    move,
    submit,
    advance,
    revelations,
  }
}
