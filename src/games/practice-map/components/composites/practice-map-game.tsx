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
export const PracticeMapGame = ({ config, onSubmit }: GameComponentProps) => {
  const {
    statement,
    poles,
    tray,
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
  } = usePracticeMap(config, onSubmit)

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

  const heldLabel = [...tray, ...placedTokens].find(
    (token) => token.id === heldId,
  )?.label

  const heldToken =
    heldId === undefined ||
    heldPosition === undefined ||
    heldLabel === undefined
      ? undefined
      : {
          id: heldId,
          label: heldLabel,
          intensity: heldPosition.intensity,
          rigor: heldPosition.rigor,
        }

  const announcement =
    heldPosition === undefined
      ? ''
      : positionLabel(heldPosition.intensity, heldPosition.rigor)

  return (
    <div className="flex flex-col gap-3 sm:gap-6">
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_16rem] sm:gap-6">
        <PracticePlane
          placedTokens={placedTokens}
          heldToken={heldToken}
          poles={poles}
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
        <PracticeTray tokens={tray} heldId={heldId} onHold={hold} />
      </div>

      <div>
        <Button type="button" size="lg" disabled={!canSubmit} onClick={submit}>
          Soumettre la lecture
        </Button>
      </div>
    </div>
  )
}
