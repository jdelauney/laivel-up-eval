import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import { usePracticeMap } from '../../hooks/use-practice-map.hook'
import { MarkerLine } from '../elements/marker-line'
import { PracticePlane } from './practice-plane'
import { PracticeTray } from './practice-tray'

/**
 * Le huitième jeu du parcours, et le second du deuxième groupe : sept
 * pratiques à situer sur un plan à deux axes continus, sans case
 * prédéfinie, avant de soumettre une lecture qui se verrouille.
 *
 * La consigne annonce le cadre — qu'il n'y a pas de case, que rien n'est
 * déclaratif, que la lecture se verrouille à la soumission — jamais ce qui
 * est noté : ni les seuils, ni ce que « haute rigueur » désigne.
 * `DESIGN.md`, « Un jeu ne dit jamais ce qu'il note. »
 *
 * Seule cette composition connaît le hook et `GameComponentProps` : les
 * éléments et les autres composites restent des vues pures.
 */
export const PracticeMapGame = ({
  config,
  onLock,
  onAdvance,
}: GameComponentProps) => {
  const {
    statement,
    poles,
    quadrants,
    legend,
    placedTokens,
    heldId,
    heldPosition,
    phase,
    canSubmit,
    markers,
    hold,
    release,
    place,
    nudge,
    submit,
    advance,
    positionLabel,
  } = usePracticeMap(config, onLock, onAdvance)

  if (phase === 'revealed') {
    return (
      <div className="flex flex-col gap-3 sm:gap-6">
        <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
          {statement}
        </p>
        <section className="border border-plane-rule bg-plane">
          <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
            Les repères
          </header>
          <div>
            {markers.map((entry) => (
              <MarkerLine
                key={entry.id}
                label={entry.label}
                marker={entry.marker}
              />
            ))}
          </div>
        </section>
        <div>
          <Button type="button" size="lg" onClick={advance}>
            Continuer
          </Button>
        </div>
      </div>
    )
  }

  // `legend` porte les sept pratiques en permanence, posées ou non : une
  // seule source pour retrouver le numéro et le libellé du jeton saisi,
  // qu'il vienne de la réserve ou du plan.
  const heldSource = legend.find((entry) => entry.id === heldId)

  const heldToken =
    heldId === undefined ||
    heldPosition === undefined ||
    heldSource === undefined
      ? undefined
      : {
          id: heldId,
          number: heldSource.number,
          label: heldSource.label,
          shortLabel: heldSource.shortLabel,
          intensity: heldPosition.intensity,
          rigor: heldPosition.rigor,
        }

  const announcement =
    heldPosition === undefined
      ? ''
      : positionLabel(heldPosition.intensity, heldPosition.rigor)

  return (
    <div className="flex flex-col gap-3 sm:gap-6">
      {/* La consigne et son annonce clavier forment un seul bloc : un
       * `gap-6` séparé de chaque côté de l'annonce — vide tant qu'aucun
       * jeton n'est saisi — creusait un vide double entre la consigne et le
       * plan, sans rien dedans. */}
      <div className="flex flex-col gap-1">
        <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
          {statement}
        </p>

        {/* Le pendant clavier du retour visuel : la position candidate,
         * annoncée en mots à chaque désignation ou déplacement. */}
        <p
          aria-live="polite"
          className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em]"
        >
          {announcement}
        </p>
      </div>

      {/* `minmax(0,1fr)`, jamais `1fr` seul : le carré du plan a un minimum
       * de contenu transféré par `aspect-square`, qui remonterait sinon
       * jusqu'à cette piste et la clouerait à la hauteur plancher du plan
       * plutôt que de lui laisser la largeur que la colonne permet — même
       * idiome que `course-view.tsx` sur sa propre colonne de contenu.
       *
       * **La réserve est revenue à `16rem`, au troisième tour.** La cible de
       * dominance du plan (`11rem`) est retirée : avec des badges numérotés,
       * la taille du plan n'est plus jugée, et la réserve, devenue légende
       * permanente de sept lignes plutôt que trois plafonnées, a bien plus
       * besoin de largeur pour ne pas s'étirer en hauteur. `16rem` reste le
       * meilleur compromis mesuré (`qa/README.md`, réserve/légende) : plus
       * étroit, chaque ligne s'enroule sur plus de lignes de texte et pousse
       * la page bien plus bas. */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_16rem] sm:gap-6">
        <PracticePlane
          placedTokens={placedTokens}
          heldToken={heldToken}
          poles={poles}
          quadrants={quadrants}
          interactive={heldId !== undefined}
          onDesignate={place}
          onNudge={nudge}
          onPlace={() => {
            if (heldPosition === undefined) return
            place(heldPosition.intensity, heldPosition.rigor)
          }}
          onRelease={release}
          onHoldToken={hold}
        />
        <PracticeTray entries={legend} heldId={heldId} onHold={hold} />
      </div>

      <div>
        <Button type="button" size="lg" disabled={!canSubmit} onClick={submit}>
          Soumettre la lecture
        </Button>
      </div>
    </div>
  )
}
