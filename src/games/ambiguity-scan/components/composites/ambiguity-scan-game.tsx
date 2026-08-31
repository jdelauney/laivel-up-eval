import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import { useAmbiguityScan } from '../../hooks/use-ambiguity-scan.hook'
import { PromptBody } from './prompt-body'

/**
 * Le neuvième jeu du parcours, et le second du sixième groupe : un prompt
 * de commande de feature s'affiche en bloc continu, chaque segment se
 * signale ou non, avant de verrouiller une lecture qui ne se corrige plus.
 *
 * La consigne annonce le cadre — que le prompt se lit dans son ensemble,
 * que la lecture se verrouille à la soumission — jamais ce qui est noté :
 * ni le nombre de segments ambigus, ni un seuil, ni un indice visuel sur
 * lequel l'est. `DESIGN.md`, « Un jeu ne dit jamais ce qu'il note. »
 *
 * Seule cette composition connaît le hook et `GameComponentProps` : le
 * composite du prompt et l'élément de segment restent des vues pures.
 */
export const AmbiguityScanGame = ({
  config,
  onLock,
  onAdvance,
}: GameComponentProps) => {
  const {
    statement,
    promptTitle,
    segments,
    flaggedCount,
    canSubmit,
    phase,
    revelations,
    toggle,
    submit,
    advance,
  } = useAmbiguityScan(config, onLock, onAdvance)

  if (phase === 'revealed') {
    // Numérote les segments ambigus dans l'ordre du prompt — celui de
    // `revelations`, qui suit déjà `parsed.segments` (hook, filtre stable) —
    // pour poser un renvoi en exposant à l'endroit exact du passage, plutôt
    // que de reconstituer la matière du prompt dans une liste à côté.
    const noteNumberById = new Map(
      revelations.map((entry, index) => [entry.id, index + 1]),
    )

    return (
      <div className="flex flex-col gap-3 sm:gap-6">
        <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
          {statement}
        </p>
        <section className="border border-plane-rule bg-plane">
          <header className="border-plane-rule border-b px-3 py-2 font-medium text-[10px] text-plane-foreground/55 uppercase tracking-[0.14em]">
            {promptTitle}
          </header>
          {/* Le même prompt qu'en lecture, jamais un extrait : un passage
           * ambigu ne se comprend qu'en le relisant dans sa phrase. Un
           * segment ambigu se distingue par un filet **pointillé** — un
           * signalement, en scan, reste plein — et par le renvoi en
           * exposant qui le relie à sa lecture plus bas : deux marques
           * structurelles, jamais une couleur seule.
           *
           * `leading-snug`, pas `leading-loose` comme en scan : l'aération
           * de `PromptBody` réserve un couloir de clic autour de chaque
           * bouton de segment, une raison qui disparaît ici — les segments
           * ne sont plus interactifs, et resserrer réduit d'autant la
           * hauteur du relevé, mesurée pousser « Continuer » hors du premier
           * écran sur mobile (voir la fiche de surface). */}
          <p className="px-3 py-2.5 text-plane-foreground text-sm leading-snug">
            {segments.flatMap((segment, index) => {
              const note = noteNumberById.get(segment.id)
              const nodes = [
                <span
                  key={`${segment.id}-text`}
                  className={
                    note === undefined
                      ? undefined
                      : 'underline decoration-2 decoration-dotted underline-offset-4'
                  }
                >
                  {segment.text}
                </span>,
              ]
              if (note !== undefined) {
                nodes.push(
                  <sup
                    key={`${segment.id}-note`}
                    className="ml-0.5 font-medium text-[10px] text-plane-foreground/70 tabular-nums"
                  >
                    <span className="sr-only">renvoi </span>
                    {note}
                  </sup>,
                )
              }
              if (index < segments.length - 1) {
                nodes.push(<span key={`${segment.id}-sep`}> </span>)
              }
              return nodes
            })}
          </p>
          {/* Les renvois, dans l'ordre où ils apparaissent dans le prompt
           * ci-dessus — jamais un verdict sur le joueur, jamais son score :
           * seulement ce que le passage laissait ouvert. */}
          <div className="border-plane-rule border-t">
            {revelations.map((entry, index) => (
              <div
                key={entry.id}
                className="flex gap-2 border-plane-rule border-b px-3 py-1.5 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="font-medium text-[10px] text-plane-foreground/55 tabular-nums"
                >
                  {index + 1}
                </span>
                <p className="text-plane-foreground/60 text-xs leading-snug">
                  {entry.reading}
                </p>
              </div>
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

  return (
    <div className="flex flex-col gap-3 sm:gap-6">
      <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
        {statement}
      </p>

      <PromptBody title={promptTitle} segments={segments} onToggle={toggle} />

      {/* Le compte dit combien de segments sont signalés, jamais combien il
       * en reste à trouver : un total à atteindre serait déjà un indice sur
       * ce que le jeu note. */}
      <p
        aria-live="polite"
        className="font-medium text-plane-foreground/50 text-xs uppercase tabular-nums tracking-[0.14em]"
      >
        {flaggedCount === 0
          ? 'Aucun segment signalé.'
          : `${flaggedCount} segment${flaggedCount > 1 ? 's' : ''} signalé${flaggedCount > 1 ? 's' : ''}.`}
      </p>

      <div>
        <Button type="button" size="lg" disabled={!canSubmit} onClick={submit}>
          Verrouiller mes signalements
        </Button>
      </div>
    </div>
  )
}
