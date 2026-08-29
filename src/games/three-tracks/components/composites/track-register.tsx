import type { TrackStatus } from '../../helpers/run-simulation.helper'
import { useIsNarrowViewport } from '../../hooks/use-is-narrow-viewport.hook'
import type { TrackView } from '../../hooks/use-three-tracks.hook'
import { AttentionCell } from '../elements/attention-cell'
import { WorkNotches } from '../elements/work-notches'

/**
 * Le registre a deux structures, jamais rendues ensemble : un tableau à
 * quatre colonnes fixes — Chantier, Description, le choix du tour courant,
 * Avancement — au-dessus de `md`, une liste de blocs empilés en dessous.
 * Aucune des deux ne se replie en soi ; c'est le choix entre elles qui suit
 * la largeur.
 *
 * Le tableau ne bouge pas : c'est lui qui a réglé, dans l'ordre, la
 * disparition du brief sous `md` par un repli de colonne, puis l'étranglement
 * du nom et du brief d'un chantier par une colonne par tour. Sous 390 px,
 * quatre colonnes fixes ne laissent plus que ~60 px à chacune — le nom d'un
 * chantier long y tombe sur quatre lignes, son brief sur six, sans déborder
 * mais sans rester lisible. Comprimer les colonnes plus loin aurait rouvert
 * le premier défaut par un autre chemin ; un tableau ne s'empile pas sans
 * cesser d'être un tableau, `display: block` sur `tr`/`td` casse la
 * sémantique de ligne et de cellule pour les lecteurs d'écran qui n'en
 * retiennent alors plus que du texte plat. La liste de blocs est donc une
 * structure distincte, pas le même tableau restylé.
 *
 * Le choix entre les deux passe par `useIsNarrowViewport`, en JS, jamais par
 * un CSS qui rendrait les deux et en masquerait une : un lecteur d'écran ne
 * reçoit alors que la structure de son gabarit, jamais les deux en double.
 *
 * Chaque bloc mobile porte ses propres libellés — Description, Avancement,
 * la fraction du tour et le mot Attention — puisqu'il n'y a plus d'en-tête de
 * colonne partagé pour les porter à sa place ; c'est le même texte que celui
 * du tableau, seulement relogé à côté de son contenu plutôt qu'au-dessus.
 *
 * Le prix assumé, aux deux gabarits : l'historique tour par tour n'existe
 * pas. La suite de points qui montrait une négligence s'allonger n'existe
 * plus. L'acceptance de la story — la dérive visible avant la mort — ne
 * dépendait déjà que du filet ou de la bordure du bloc et de la mention
 * `DÉRIVE`, jamais de cet historique : elle tient encore aux deux structures.
 */

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
 * Le filet décoratif d'une position hors jeu, jamais un texte : la mention
 * `MERGÉ` ou `PERDU` du libellé le dit déjà, une fois pour tout le chantier.
 * `aria-hidden` porte sur ce filet seul, jamais sur son conteneur — au
 * tableau, pour que le nombre de cellules de la ligne reste égal au nombre
 * d'en-têtes de colonne ; au bloc mobile, pour que le bloc reste un
 * conteneur muet plutôt qu'une case vide retirée de l'arbre.
 */
const BarredMarker = () => (
  <span aria-hidden="true" className="block h-px bg-plane-rule" />
)

/**
 * Une cellule hors jeu est barrée, jamais vide et jamais cachée : ni actif,
 * ni désactivé, la fiche interdit les trois autres traitements.
 */
const BarredCell = () => (
  <td className={CELL_PADDING}>
    <BarredMarker />
  </td>
)

/**
 * Le nom accessible d'une tête de ligne — tableau ou bloc mobile — vient de
 * son seul contenu visible : le libellé et la mention d'état, jamais le
 * brief. Un `aria-label` a déjà remplacé ce nom une fois par la phrase
 * entière du brief ; un lecteur d'écran la réannonçait alors à chaque
 * cellule de la ligne. Partagé entre les deux structures pour qu'elles
 * calculent exactement le même nom, mot pour mot.
 */
const TrackHeadingContent = ({ track }: { track: TrackView }) => (
  <>
    <span>{track.label}</span>
    {STATE_MENTION[track.status] === undefined ? null : (
      <span
        className={`ml-2 text-[0.6875rem] uppercase tracking-[0.12em] ${stateMentionClassName(track.status)}`}
      >
        {STATE_MENTION[track.status]}
      </span>
    )}
  </>
)

/**
 * `1/7`, plutôt que « Tour 1 sur 7 » : la colonne où le joueur agit est déjà
 * étroite, un chiffre sur plafond tient sur une ligne à toutes les largeurs.
 */
const turnFractionLabel = (turnNumber: number, turnsTotal: number): string =>
  `${turnNumber}/${turnsTotal}`

/**
 * Le nom de ce qu'on pose, sous le chiffre du tour, dans la même cellule
 * d'en-tête : un chiffre nu dans trois pastilles se lit aussi bien comme une
 * note, une priorité ou un rang que comme de l'attention. La consigne dit
 * « unités d'attention » en prose ; rien ne reliait cette phrase à la colonne
 * où elle se joue avant ce libellé, visible et pas seulement porté par le nom
 * accessible du groupe radio.
 */
const OPEN_COLUMN_CAPTION = 'Attention'

/**
 * `table-fixed` plutôt que l'auto-layout par défaut : sous auto-layout, un
 * mot insécable dans une cellule de pastilles ou de crans (ils ne se
 * cassent jamais, la ligne est `flex-nowrap`) peut forcer le tableau entier à
 * dépasser sa propre largeur — c'est ce qui débordait à 390 px. En layout
 * figé, seules ces largeurs comptent, jamais le contenu ; le texte de
 * `Chantier` et `Description` peut toujours se replier pour tenir dedans.
 *
 * `Chantier` et `Avancement` portent une largeur explicite, mesurée sur le
 * contenu qui ne se replie pas — trois pastilles ou la jauge à crans du
 * chantier le plus long (six crans). `Description` n'en a aucune : elle
 * absorbe ce qui reste, et c'est elle qui a besoin du plus de place.
 */
const TRACK_COLUMN_WIDTH = 'w-[4.25rem] md:w-32'
const OPEN_TURN_COLUMN_WIDTH = 'w-24'
const PROGRESS_COLUMN_WIDTH = 'w-[7.25rem]'
const CELL_PADDING = 'p-1.5 md:p-2'

/**
 * Un mot d'en-tête ne se replie jamais — il n'a pas d'espace où couper — donc
 * un interlettrage taillé pour la largeur d'un poste de travail déborde sur
 * la colonne voisine à 390 px. Plus compact sous `md`, comme l'était déjà
 * l'en-tête replié des tours anciens dans la version précédente de ce
 * registre.
 */
const HEADER_ROW_TYPOGRAPHY =
  'text-[10px] uppercase tracking-normal md:text-xs md:tracking-[0.1em]'

type TrackRegisterProps = {
  tracks: readonly TrackView[]
  turnNumber: number
  turnsTotal: number
  maxPerTrack: number
  onSetAttention: (trackId: string, value: number) => void
}

/**
 * Le choix de structure, en JS et jamais en CSS : voir le commentaire de tête
 * de fichier. `useIsNarrowViewport` lit la largeur réelle de la fenêtre ; par
 * défaut, en environnement de test comme au premier rendu d'un écran large,
 * elle rend le tableau — la structure historique, jamais celle qui change de
 * comportement sans qu'un test le demande explicitement.
 */
export const TrackRegister = (props: TrackRegisterProps) =>
  useIsNarrowViewport() ? (
    <MobileTrackList {...props} />
  ) : (
    <DesktopTrackTable {...props} />
  )

const DesktopTrackTable = ({
  tracks,
  turnNumber,
  turnsTotal,
  maxPerTrack,
  onSetAttention,
}: TrackRegisterProps) => (
  <table className="w-full table-fixed border-collapse text-left text-sm">
    <caption className="sr-only">
      Registre de bord des chantiers, un chantier par ligne
    </caption>
    <thead>
      <tr
        className={`border-plane-rule border-b text-plane-foreground/60 ${HEADER_ROW_TYPOGRAPHY}`}
      >
        <th
          scope="col"
          className={`font-medium ${TRACK_COLUMN_WIDTH} ${CELL_PADDING}`}
        >
          Chantier
        </th>
        {/*
         * Sans largeur fixée : c'est elle qui a le plus besoin de place, et
         * son besoin varie le plus d'un chantier à l'autre. Visible à toutes
         * les largeurs, jamais dans le nom accessible de la tête de ligne —
         * un `aria-label` la remplaçait auparavant, et un lecteur d'écran
         * réannonçait la phrase entière à chaque cellule de la ligne.
         *
         * Le mot complet ne tient pas à 390 px à côté de « Chantier » et des
         * deux colonnes bornées : abrégé à l'écran, jamais pour un lecteur
         * d'écran — `aria-label` porte le mot entier, comme la cellule
         * compacte des tours anciens de la version précédente de ce
         * registre.
         */}
        <th
          scope="col"
          aria-label="Description"
          className={`font-medium ${CELL_PADDING}`}
        >
          <span aria-hidden="true" className="md:hidden">
            Descr.
          </span>
          <span aria-hidden="true" className="hidden md:inline">
            Description
          </span>
        </th>
        <th
          scope="col"
          aria-label={`Tour ${turnNumber} sur ${turnsTotal}, en cours`}
          className={`border-plane-foreground border-b-2 text-center text-sm font-semibold text-plane-foreground tabular-nums normal-case tracking-normal ${OPEN_TURN_COLUMN_WIDTH} ${CELL_PADDING}`}
        >
          <span className="block">
            {turnFractionLabel(turnNumber, turnsTotal)}
          </span>
          <span className="mt-0.5 block whitespace-nowrap font-normal normal-case tracking-normal text-[0.5625rem] text-plane-foreground/70">
            {OPEN_COLUMN_CAPTION}
          </span>
        </th>
        <th
          scope="col"
          className={`font-medium ${PROGRESS_COLUMN_WIDTH} ${CELL_PADDING}`}
        >
          Avancement
        </th>
      </tr>
    </thead>
    <tbody>
      {tracks.map((track) => (
        <tr key={track.id} className={ROW_BORDER[track.status]}>
          <th
            scope="row"
            className={`align-top text-plane-foreground ${ROW_HEAD_WEIGHT[track.status]} ${CELL_PADDING}`}
          >
            <TrackHeadingContent track={track} />
          </th>

          <td
            className={`align-top text-plane-foreground/60 text-xs ${CELL_PADDING}`}
          >
            {track.brief}
          </td>

          {isOutOfGame(track.status) ? (
            <BarredCell />
          ) : (
            <td className={CELL_PADDING}>
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

          <td className={`align-top ${CELL_PADDING}`}>
            <WorkNotches progress={track.progress} work={track.work} />
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)

/**
 * Le libellé d'un champ de bloc, sous `md` : le même mot qu'un en-tête de
 * colonne du tableau, relogé à côté de son propre contenu puisqu'il n'y a
 * plus d'en-tête partagé pour le porter à sa place.
 */
const MOBILE_FIELD_LABEL =
  'block text-[10px] uppercase tracking-normal text-plane-foreground/60'

/**
 * Un chantier, empilé : le libellé et sa mention d'état, puis le brief, puis
 * l'avancement, puis le choix du tour — cet ordre est celui que le chef de
 * projet a tranché, et il diffère de l'ordre des colonnes du tableau
 * (Chantier, Description, choix, Avancement) parce qu'une pile place
 * naturellement l'action, la plus engageante, en dernier plutôt qu'au milieu.
 *
 * `aria-labelledby` pointe vers le même contenu — libellé et mention, jamais
 * le brief — que `TrackHeadingContent` produit pour la tête de ligne du
 * tableau : les deux structures calculent le même nom pour le même chantier.
 */
const TrackBlock = ({
  track,
  turnNumber,
  turnsTotal,
  maxPerTrack,
  onSetAttention,
}: {
  track: TrackView
  turnNumber: number
  turnsTotal: number
  maxPerTrack: number
  onSetAttention: (trackId: string, value: number) => void
}) => {
  const headingId = `track-heading-${track.id}`

  return (
    <li
      aria-labelledby={headingId}
      className={`flex flex-col gap-3 py-4 ${ROW_BORDER[track.status]}`}
    >
      <p
        id={headingId}
        className={`text-plane-foreground ${ROW_HEAD_WEIGHT[track.status]}`}
      >
        <TrackHeadingContent track={track} />
      </p>

      <p className="text-plane-foreground/60 text-xs">
        <span className={MOBILE_FIELD_LABEL}>Description</span>
        {track.brief}
      </p>

      <div>
        <span className={MOBILE_FIELD_LABEL}>Avancement</span>
        <WorkNotches progress={track.progress} work={track.work} />
      </div>

      <div>
        {isOutOfGame(track.status) ? (
          <BarredMarker />
        ) : (
          <>
            <span className={MOBILE_FIELD_LABEL}>
              {turnFractionLabel(turnNumber, turnsTotal)} ·{' '}
              {OPEN_COLUMN_CAPTION}
            </span>
            <AttentionCell
              trackId={track.id}
              trackLabel={track.label}
              turnNumber={turnNumber}
              maxPerTrack={maxPerTrack}
              value={track.pending}
              maxSelectable={track.maxSelectable}
              onChange={(value) => onSetAttention(track.id, value)}
            />
          </>
        )}
      </div>
    </li>
  )
}

const MobileTrackList = ({
  tracks,
  turnNumber,
  turnsTotal,
  maxPerTrack,
  onSetAttention,
}: TrackRegisterProps) => (
  <ul aria-label="Registre de bord des chantiers, un chantier par bloc">
    {tracks.map((track) => (
      <TrackBlock
        key={track.id}
        track={track}
        turnNumber={turnNumber}
        turnsTotal={turnsTotal}
        maxPerTrack={maxPerTrack}
        onSetAttention={onSetAttention}
      />
    ))}
  </ul>
)
