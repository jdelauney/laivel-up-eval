import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import { useDefectHunt } from '../../hooks/use-defect-hunt.hook'
import { DefectReveal } from '../elements/defect-reveal'
import { ReviewSheet } from './review-sheet'

/**
 * Le quatrième jeu à état du parcours, sur le registre de la planche de
 * relecture : une épreuve imprimée, sa marge, et un chronomètre en cadran. Le
 * joueur balaie l'extrait, frappe la marge, rend sa revue — elle se
 * verrouille, le chronomètre s'arrête — puis la vérité vient se tamponner sur
 * la feuille qu'il vient de lire.
 *
 * **Rien ne lui dit combien de défauts chercher.** Ni le nombre, ni la nature,
 * ni aucune liste : il n'a aucune règle d'arrêt et décide lui-même quand sa
 * revue est finie. Ce qui remplace le compte, c'est le barème — un point par
 * ligne fautive marquée, un de moins par ligne saine marquée, rien pour une
 * ligne laissée de côté. Marquer au hasard se paie mécaniquement, et ne pas
 * savoir n'est jamais puni : seule l'affirmation fausse l'est.
 *
 * La consigne annonce ce cadre et ce barème — `DESIGN.md` veut le coût d'un
 * geste annoncé — jamais ce qui est noté : ni les seuils, ni le fait que la
 * dépendance hallucinée porte son propre critère. « Un jeu ne dit jamais ce
 * qu'il note. »
 */
export const DefectHuntGame = ({
  config,
  onLock,
  onAdvance,
}: GameComponentProps) => {
  const {
    statement,
    snippet,
    lines,
    markedLines,
    timeLimitSeconds,
    elapsedSeconds,
    submitted,
    toggleLine,
    submitReview,
    advance,
    lineVerdict,
    reading,
    revelations,
  } = useDefectHunt(config, onLock, onAdvance)

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
              total={reading.found.length + reading.missed.length}
              falsePositives={reading.falsePositiveLines.length}
              netScore={reading.netScore}
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
 * Le total de défauts n'apparaît qu'**ici**, une fois la revue verrouillée :
 * avant le rendu, le connaître donnerait au joueur la règle d'arrêt que le jeu
 * lui refuse.
 *
 * La durée n'y figure pas : le cadran de tête la porte déjà, et deux endroits
 * pour le même fait, c'est un endroit de trop.
 */
const Readout = ({
  found,
  total,
  falsePositives,
  netScore,
}: {
  found: number
  total: number
  falsePositives: number
  netScore: number
}) => (
  <p className="font-medium text-plane-foreground/70 text-xs uppercase tracking-[0.14em] tabular-nums">
    {found} trouvé{found === 1 ? '' : 's'} sur {total} · {falsePositives} marque
    {falsePositives === 1 ? '' : 's'} à côté ·{' '}
    <span
      className={`font-semibold ${netScore < 0 ? 'text-missed' : 'text-plane-foreground'}`}
    >
      {netScore > 0 ? `+${netScore}` : netScore} point
      {Math.abs(netScore) === 1 ? '' : 's'}
    </span>
  </p>
)
