import { fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { parseConfiguration } from '@/core/contracts/helpers/parse-config.helper'
import type { PersistenceSessionAdapter } from '@/core/ports/persistence-session-adapter.interface'
import { WeightedMappingStrategy } from '@/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '@/core/session/game-session.facade'
import { CourseView } from '@/features/group-navigation/components/sections/course-view'
import { buildGameRegistry } from '@/games/register-games'
import { FixedClock } from '@/infrastructure/clock/fixed.adapter'
import { SessionProvider } from '@/providers/session-context'
import { useSessionStore } from '@/store/session.store'
import projectGrid from '../../../config/grid.json'
import projectSignature from '../../../config/signature.json'
import { MemoryPersistence } from '../../fixtures/memory-persistence'

/**
 * Le défaut corrigé ici :
 * `aidd_docs/backlog/defects/la-revelation-precede-le-verrou-donc-un-rechargement-la-rejoue.md`.
 *
 * Reprend exactement `g6-2` du parcours réel — le jeu où la révélation rend
 * le corrigé complet, le cas le plus grave de la table d'impact du défaut —
 * dans un parcours à un seul jeu : ce test mesure le câblage
 * verrou/avance, pas la traversée du parcours entier, déjà couverte
 * ailleurs (`checkpoints-run.test.ts`).
 */
const AMBIGUITY_SCAN_GAME = {
  id: 'g6-2',
  type: 'ambiguity-scan',
  label: "Qu'est-ce qui est ambigu ici ?",
  config: {
    statement:
      "Un chef de produit vous transmet cette demande de fonctionnalité, telle quelle. Repérez les segments qui laissent une marge d'interprétation à l'IA qui l'exécutera — sans savoir combien il y en a.",
    promptTitle: 'La demande transmise',
    segments: [
      {
        id: 's1',
        text: 'Ajoute une notification par email envoyée au client',
        ambiguous: false,
      },
      {
        id: 's2',
        text: 'dès que la commande passe au statut « payée » dans Stripe,',
        ambiguous: false,
      },
      {
        id: 's3',
        text: 'avec un contenu qui reprend le ton habituel de la marque,',
        ambiguous: true,
        reading:
          '« Le ton habituel » ne fixe ni gabarit, ni champs, ni longueur.',
      },
      {
        id: 's4',
        text: 'un lien vers la facture PDF déjà générée par le module de facturation,',
        ambiguous: false,
      },
      {
        id: 's5',
        text: 'sur un design similaire aux autres emails transactionnels,',
        ambiguous: true,
        reading: '« Similaire » ne désigne aucun gabarit précis.',
      },
      {
        id: 's6',
        text: "avec une relance en cas d'échec d'envoi,",
        ambiguous: true,
        reading:
          'Ni le nombre de relances, ni le délai, ni ce qui compte comme un échec ne sont fixés.',
      },
      {
        id: 's7',
        text: 'limité aux commandes de plus de dix euros,',
        ambiguous: false,
      },
    ],
  },
  criteria: [
    {
      id: 'g6-2-c1',
      question:
        'Une fois retranchés les segments clairs signalés à tort, la part des segments ambigus repérés reste-t-elle suffisante ?',
      rule: { type: 'ambiguity-net-share-at-least', threshold: 0.5 },
      mapping: [{ dimension: 'pilotage-contexte', weight: 2 }],
    },
    {
      id: 'g6-2-c2',
      question: 'Les segments clairs ont-ils été laissés tranquilles ?',
      rule: { type: 'clear-segments-spared-at-least', threshold: 0.8 },
      mapping: [{ dimension: 'pilotage-contexte', weight: 1 }],
    },
  ],
}

const singleGameCourse = {
  version: '0.2-verrou-avant-reveal',
  groups: [
    {
      id: 'groupe-verrou',
      label: 'Verrou avant révélation',
      order: 1,
      games: [AMBIGUITY_SCAN_GAME],
    },
  ],
}

const buildFacade = (
  persistence: PersistenceSessionAdapter,
): GameSessionFacade => {
  const { grid, course, signature } = parseConfiguration(
    projectGrid,
    singleGameCourse,
    projectSignature,
  )

  return new GameSessionFacade({
    registry: buildGameRegistry(),
    scoring: new WeightedMappingStrategy(),
    persistence,
    clock: new FixedClock(),
    grid,
    course,
    signature,
  })
}

const openRun = (facade: GameSessionFacade): void => {
  facade.start('Alice')
  useSessionStore
    .getState()
    .openCourse(
      { playerName: 'Alice', repository: undefined },
      facade.getProgress(),
    )
}

const renderCourse = (facade: GameSessionFacade) => {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SessionProvider composition={{ status: 'ready', facade }}>
      {children}
    </SessionProvider>
  )

  return render(<CourseView />, { wrapper })
}

describe('ambiguity-scan: the lock precedes the reveal', () => {
  afterEach(() => {
    useSessionStore.getState().reset()
  })

  it('stays submitted after a reload caught between the lock and the reveal being dismissed', () => {
    const persistence = new MemoryPersistence()
    const facade = buildFacade(persistence)
    openRun(facade)

    const { unmount } = renderCourse(facade)

    // Signale un seul segment ambigu, puis verrouille — reproduction exacte
    // de la fiche de défaut, étapes 1 à 3.
    fireEvent.click(
      screen.getByRole('button', { name: /ton habituel de la marque/i }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: /verrouiller mes signalements/i }),
    )

    // La révélation est affichée — le corrigé complet, quatre segments.
    expect(
      screen.getByRole('button', { name: /continuer/i }),
    ).toBeInTheDocument()

    // Rechargement : **sans** cliquer « Continuer », l'écran est démonté et
    // une session neuve reprend depuis le même stockage — exactement ce
    // qu'un rechargement de page fait subir à l'application.
    unmount()
    const reloaded = buildFacade(persistence)

    expect(reloaded.resume()).toBe(true)

    // Le jeu est déjà soumis : la trace a survécu au rechargement, alors que
    // le bouton « Continuer » n'a jamais été cliqué. Avant le correctif,
    // rien n'était encore écrit à cet instant — `submitted` valait 0 et
    // `auditTrail()` était vide, ce qui reposait le joueur sur un `g6-2`
    // vierge, le corrigé encore en tête.
    const progress = reloaded.getProgress()
    expect(progress.submitted).toBe(1)
    expect(reloaded.auditTrail()).toHaveLength(1)
    expect(reloaded.auditTrail()[0]?.gameId).toBe('g6-2')
    const answer = reloaded.auditTrail()[0]?.answer as {
      flaggedIds: string[]
    }
    expect(answer.flaggedIds).toEqual(['s3'])
  })
})
