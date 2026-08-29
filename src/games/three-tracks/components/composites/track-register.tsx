import type { TrackStatus } from '../../helpers/run-simulation.helper'
import type { TrackView } from '../../hooks/use-three-tracks.hook'
import { AttentionCell } from '../elements/attention-cell'
import { WorkNotches } from '../elements/work-notches'

/**
 * Le registre, un vrai tableau : lignes = chantiers dans l'ordre du parcours,
 * colonnes = tours. Le relevé EST le plateau, il n'y a pas de journal séparé.
 *
 * Sous `md`, seuls les trois derniers tours écoulés et la colonne ouverte
 * restent visibles ; les tours plus anciens et à venir se replient plutôt que
 * de forcer un défilement horizontal. C'est le nombre de colonnes qui tombe,
 * jamais leur lisibilité.
 */

/** Au-delà, la ligne la plus ancienne pousserait le tour ouvert hors de l'écran mobile. */
const VISIBLE_RECENT_TURNS = 3

const olderTurnsLabel = (count: number): string =>
  count > 1 ? `${count} tours plus anciens` : `${count} tour plus ancien`

/**
 * Une cellule non écoulée d'un chantier hors jeu est barrée, jamais vide et
 * jamais cachée : ni actif, ni désactivé, la fiche interdit les trois autres
 * traitements.
 *
 * `aria-hidden` porte sur le filet décoratif seul, jamais sur la cellule : un
 * `<td>` retiré de l'arbre d'accessibilité désaligne le nombre de cellules de
 * la ligne par rapport à l'en-tête, et l'association de « Avancement » à sa
 * colonne devient fausse. La cellule annonce donc ce qu'elle est — un
 * chantier hors jeu à ce tour — par un texte réservé aux lecteurs d'écran.
 */
const BarredCell = ({ className = '' }: { className?: string }) => (
  <td className={`p-2 ${className}`}>
    <span aria-hidden="true" className="block h-px bg-plane-rule" />
    <span className="sr-only">Chantier hors jeu à ce tour</span>
  </td>
)

const EmptyCell = ({ className = '' }: { className?: string }) => (
  <td className={`p-2 ${className}`} />
)

const ROW_BORDER: Record<TrackStatus, string> = {
  open: 'border-plane-rule border-b',
  drifting: 'border-plane-rule border-b border-dashed',
  merged: 'border-plane-foreground border-b-2',
  /**
   * « Creusé », pas absent : une ligne perdue garde un filet qui sépare
   * visuellement deux lignes perdues consécutives, sans reprendre le plein
   * de l'ouvert, le pointillé de la dérive ni l'épais du mergé, et sans
   * opacité réduite.
   */
  lost: 'border-plane-rule border-b-2 [border-style:groove]',
}

const ROW_HEAD_WEIGHT: Record<TrackStatus, string> = {
  open: 'font-normal',
  drifting: 'font-normal',
  merged: 'font-semibold',
  lost: 'font-normal',
}

const STATE_MENTION: Partial<Record<TrackStatus, string>> = {
  drifting: 'DÉRIVE',
  merged: 'MERGÉ',
  lost: 'PERDU',
}

const stateMentionClassName = (status: TrackStatus): string =>
  status === 'lost' ? 'text-missed' : 'text-plane-foreground/70'

const isOutOfGame = (status: TrackStatus): boolean =>
  status === 'merged' || status === 'lost'

/**
 * Le nom accessible de la tête de ligne : le libellé du chantier, suivi de sa
 * mention d'état quand il y en a une. Le brief n'y figure jamais — c'est une
 * phrase entière, elle réannoncerait à chaque cellule parcourue de la ligne,
 * sept tours × quatre chantiers. Il reste lisible à l'écran, seulement sorti
 * du nom : `aria-label` sur le `th` remplace le nom calculé depuis son
 * contenu, la mention d'état doit donc y être répétée pour rester annoncée.
 */
const rowAccessibleName = (track: TrackView): string => {
  const mention = STATE_MENTION[track.status]
  return mention === undefined ? track.label : `${track.label}, ${mention}`
}

export const TrackRegister = ({
  tracks,
  turnNumber,
  turnsTotal,
  maxPerTrack,
  onSetAttention,
}: {
  tracks: readonly TrackView[]
  turnNumber: number
  turnsTotal: number
  maxPerTrack: number
  onSetAttention: (trackId: string, value: number) => void
}) => {
  const allTurns = Array.from({ length: turnsTotal }, (_, index) => index + 1)
  const elapsedTurns = allTurns.filter((turn) => turn < turnNumber)
  const futureTurns = allTurns.filter((turn) => turn > turnNumber)
  const recentElapsedTurns = elapsedTurns.slice(-VISIBLE_RECENT_TURNS)
  const olderElapsedTurns = elapsedTurns.slice(
    0,
    elapsedTurns.length - recentElapsedTurns.length,
  )

  return (
    <table className="w-full border-collapse text-left text-sm">
      <caption className="sr-only">
        Registre de bord des chantiers, un chantier par ligne, un tour par
        colonne
      </caption>
      <thead>
        <tr className="border-plane-rule border-b text-plane-foreground/60 text-xs uppercase tracking-[0.1em]">
          <th scope="col" className="p-2 font-medium">
            Chantier
          </th>
          {olderElapsedTurns.length === 0 ? null : (
            <th
              scope="col"
              className="px-1 py-2 font-medium tabular-nums md:hidden"
            >
              {/*
               * En `text-[0.5625rem]` sans interlettrage supplémentaire, sur
               * une seule ligne forcée et un padding horizontal réduit : à
               * `text-xs` avec le suivi de lettres hérité du thead, la phrase
               * se repliait sur trois lignes et devenait la colonne la plus
               * large de l'écran, sans qu'aucune cellule dessous ne porte
               * d'information. Un en-tête compact est le remède retenu par la
               * fiche : porter une donnée dans ces cellules n'en est pas une,
               * les tours qu'elles résument n'ont pas de valeur unique à
               * afficher.
               */}
              <span className="block whitespace-nowrap text-[0.5625rem] tracking-normal">
                {olderTurnsLabel(olderElapsedTurns.length)}
              </span>
            </th>
          )}
          {olderElapsedTurns.map((turn) => (
            <th
              key={turn}
              scope="col"
              className="hidden min-w-8 p-2 text-center font-medium tabular-nums md:table-cell"
            >
              {turn}
            </th>
          ))}
          {recentElapsedTurns.map((turn) => (
            <th
              key={turn}
              scope="col"
              className="min-w-8 p-2 text-center font-medium tabular-nums"
            >
              {turn}
            </th>
          ))}
          <th
            scope="col"
            className="min-w-8 p-2 text-center font-medium tabular-nums"
          >
            {turnNumber}
          </th>
          {futureTurns.map((turn) => (
            <th
              key={turn}
              scope="col"
              className="hidden min-w-8 p-2 text-center font-medium tabular-nums md:table-cell"
            >
              {turn}
            </th>
          ))}
          <th scope="col" className="hidden p-2 font-medium md:table-cell">
            Avancement
          </th>
        </tr>
      </thead>
      <tbody>
        {tracks.map((track) => (
          <tr key={track.id} className={ROW_BORDER[track.status]}>
            <th
              scope="row"
              aria-label={rowAccessibleName(track)}
              className={`p-2 align-top text-plane-foreground ${ROW_HEAD_WEIGHT[track.status]}`}
            >
              <span>{track.label}</span>
              {STATE_MENTION[track.status] === undefined ? null : (
                <span
                  className={`ml-2 text-[0.6875rem] uppercase tracking-[0.12em] ${stateMentionClassName(track.status)}`}
                >
                  {STATE_MENTION[track.status]}
                </span>
              )}
              <span className="mt-0.5 block font-normal text-plane-foreground/60 text-xs">
                {track.brief}
              </span>
              <span className="mt-1 block md:hidden">
                <WorkNotches progress={track.progress} work={track.work} />
              </span>
            </th>

            {olderElapsedTurns.length === 0 ? null : (
              <td className="p-2 text-center tabular-nums md:hidden" />
            )}
            {olderElapsedTurns.map((turn) => (
              <td
                key={turn}
                className="hidden p-2 text-center tabular-nums md:table-cell"
              >
                {track.elapsedAllocations[turn - 1] || '·'}
              </td>
            ))}
            {recentElapsedTurns.map((turn) => (
              <td key={turn} className="p-2 text-center tabular-nums">
                {track.elapsedAllocations[turn - 1] || '·'}
              </td>
            ))}

            {isOutOfGame(track.status) ? (
              <BarredCell />
            ) : (
              <td className="p-2">
                <AttentionCell
                  trackId={track.id}
                  trackLabel={track.label}
                  turnNumber={turnNumber}
                  maxPerTrack={maxPerTrack}
                  value={track.pending}
                  maxSelectable={track.maxSelectable}
                  onChange={(value) => onSetAttention(track.id, value)}
                />
              </td>
            )}

            {futureTurns.map((turn) =>
              isOutOfGame(track.status) ? (
                <BarredCell key={turn} className="hidden md:table-cell" />
              ) : (
                <EmptyCell key={turn} className="hidden md:table-cell" />
              ),
            )}

            <td className="hidden p-2 md:table-cell">
              <WorkNotches progress={track.progress} work={track.work} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
