import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import { useDefectHunt } from '../../hooks/use-defect-hunt.hook'
import { DefectReveal } from '../elements/defect-reveal'
import { ReviewSheet } from './review-sheet'

/**
 * Le quatrième jeu à état du parcours, sur le registre de la planche de
 * relecture : une épreuve imprimée, sa marge, et un chronomètre en cadran.
 * Seul le nombre de défauts est annoncé, jamais leur nature, et aucune liste
 * de choix n'est offerte. Le joueur balaie l'extrait, frappe la marge, rend sa
 * revue — elle se verrouille, le chronomètre s'arrête — puis la vérité vient
 * se tamponner sur la feuille qu'il vient de lire.
 *
 * La consigne annonce le cadre du jeu — le nombre de défauts, l'absence de
 * liste, le coût d'une marque posée à côté, le temps qui court sans
 * interrompre la partie — jamais ce qui est noté : ni les seuils, ni le fait
 * que la dépendance hallucinée porte son propre critère. `DESIGN.md`, « Un jeu
 * ne dit jamais ce qu'il note. »
 */
export const DefectHuntGame = ({ config, onSubmit }: GameComponentProps) => {
  const {
    statement,
    snippet,
    lines,
    markedLines,
    announcedCount,
    timeLimitSeconds,
    elapsedSeconds,
    submitted,
    toggleLine,
    submitReview,
    advance,
    lineVerdict,
    reading,
    revelations,
  } = useDefectHunt(config, onSubmit)

  return (
    <div className="flex flex-col gap-6">
      {/* Même traitement typographique que les autres jeux, et même mesure :
       * la consigne se lit d'un bloc, elle ne repousse pas la feuille sous la
       * ligne de flottaison. */}
      <p className="max-w-[54ch] text-lg text-plane-foreground leading-relaxed">
        {statement}
      </p>

      <ReviewSheet
        label={snippet.label}
        language={snippet.language}
        announcedCount={announcedCount}
        elapsedSeconds={elapsedSeconds}
        timeLimitSeconds={timeLimitSeconds}
        lines={lines}
        markedLines={markedLines}
        lineVerdict={lineVerdict}
        locked={submitted}
        onToggleLine={submitted ? undefined : toggleLine}
        foot={
          submitted && reading !== undefined ? (
            <Readout
              found={reading.found.length}
              announcedCount={announcedCount}
              falsePositives={reading.falsePositiveLines.length}
            />
          ) : (
            <>
              {/* Seule région annoncée de l'écran : le compte de marques.
               * Le cadran vit dans le bandeau de tête, hors du flux annoncé —
               * un lecteur d'écran ne doit pas subir chaque battement. */}
              <p
                aria-live="polite"
                className="font-medium text-plane-foreground/60 text-xs uppercase tracking-[0.14em] tabular-nums"
              >
                {markedLines.size} ligne{markedLines.size === 1 ? '' : 's'}{' '}
                marquée{markedLines.size === 1 ? '' : 's'}
              </p>
              <Button type="button" size="lg" onClick={submitReview}>
                Rendre ma revue
              </Button>
            </>
          )
        }
      />

      {submitted && revelations !== undefined ? (
        <div className="flex flex-col gap-6">
          <section className="border border-plane-rule bg-plane">
            <h3 className="px-4 py-3 font-medium text-[10px] text-plane-foreground/45 uppercase tracking-[0.18em]">
              Ce que chaque défaut était
            </h3>
            {revelations.map((revelation, index) => (
              <DefectReveal
                key={revelation.line}
                order={index}
                line={revelation.line}
                kind={revelation.kind}
                reveal={revelation.reveal}
                found={revelation.found}
              />
            ))}
          </section>

          <div>
            <Button type="button" size="lg" onClick={advance}>
              Situation suivante
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/**
 * Le pied de la feuille une fois la revue rendue : des faits, jamais un seuil.
 * Le joueur lit ce qu'il a produit, pas la note qu'il en tire.
 *
 * La durée n'y figure pas : le cadran de tête la porte déjà, et deux endroits
 * pour le même fait, c'est un endroit de trop.
 */
const Readout = ({
  found,
  announcedCount,
  falsePositives,
}: {
  found: number
  announcedCount: number
  falsePositives: number
}) => (
  <p className="font-medium text-plane-foreground/70 text-xs uppercase tracking-[0.14em] tabular-nums">
    {found} trouvé{found === 1 ? '' : 's'} sur {announcedCount} ·{' '}
    {falsePositives} marque{falsePositives === 1 ? '' : 's'} à côté
  </p>
)
