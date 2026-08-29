import { Button } from '../../../../components/ui/button'
import type { GameComponentProps } from '../../../types/game-component'
import { useThreeTracks } from '../../hooks/use-three-tracks.hook'
import { TrackRegister } from './track-register'

/**
 * Le second jeu à état du parcours, sur le registre de bord : le relevé EST
 * le plateau, il n'y a pas de journal séparé. Le joueur pose son attention
 * dans la colonne ouverte, chantier par chantier, puis clôt le tour, sept
 * fois de suite.
 *
 * La clôture est toujours disponible, y compris à zéro unité posée : c'est le
 * prix de la négligence qui force l'arbitrage entre chantiers, jamais une
 * validation qui l'imposerait.
 */
export const ThreeTracksGame = ({ config, onSubmit }: GameComponentProps) => {
  const {
    statement,
    tracks,
    turnNumber,
    turnsTotal,
    maxPerTrack,
    attentionRemaining,
    isComplete,
    setAttention,
    closeTurn,
  } = useThreeTracks(config, onSubmit)

  if (isComplete) return null

  /**
   * Quand tous les chantiers sont mergés ou perdus, aucune attention ne peut
   * plus être placée nulle part : dire encore « n unités à placer » serait
   * faux, l'attention restante n'a simplement plus où aller.
   */
  const canPlaceAttention = tracks.some(
    (track) => track.status !== 'merged' && track.status !== 'lost',
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Même traitement typographique que le banc d'essai : un jeu à état
       * n'a pas droit à un contrat plus discret qu'un jeu sans état. */}
      <p className="max-w-[52ch] text-lg text-plane-foreground leading-relaxed">
        {statement}
      </p>

      <PositionLine
        turnNumber={turnNumber}
        turnsTotal={turnsTotal}
        attentionRemaining={attentionRemaining}
        canPlaceAttention={canPlaceAttention}
      />

      <TrackRegister
        tracks={tracks}
        turnNumber={turnNumber}
        turnsTotal={turnsTotal}
        maxPerTrack={maxPerTrack}
        onSetAttention={setAttention}
      />

      <div>
        <Button type="button" size="lg" onClick={closeTurn}>
          Clore le tour
        </Button>
      </div>
    </div>
  )
}

/**
 * Informe, ne conditionne rien : la clôture reste disponible quelle que soit
 * l'attention qui reste à placer. Seule région annoncée à chaque changement,
 * le registre ne réannonce rien.
 */
const attentionUnitLabel = (value: number): string =>
  value <= 1 ? 'unité' : 'unités'

const PositionLine = ({
  turnNumber,
  turnsTotal,
  attentionRemaining,
  canPlaceAttention,
}: {
  turnNumber: number
  turnsTotal: number
  attentionRemaining: number
  canPlaceAttention: boolean
}) => (
  <p
    aria-live="polite"
    className="font-medium text-plane-foreground/50 text-xs uppercase tracking-[0.14em] tabular-nums"
  >
    Tour {turnNumber} sur {turnsTotal} ·{' '}
    {canPlaceAttention
      ? `${attentionRemaining} ${attentionUnitLabel(attentionRemaining)} à placer`
      : 'aucune unité ne peut être placée'}
  </p>
)
