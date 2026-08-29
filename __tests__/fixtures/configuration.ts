import { parseConfiguration } from '@/core/contracts/helpers/parse-config.helper'
import type { PersistenceSessionAdapter } from '@/core/ports/persistence-session-adapter.interface'
import { WeightedMappingStrategy } from '@/core/scoring/weighted-mapping.strategy'
import { GameSessionFacade } from '@/core/session/game-session.facade'
import { buildGameRegistry } from '@/games/register-games'
import { FixedClock } from '@/infrastructure/clock/fixed.adapter'
import projectGrid from '../../config/grid.json'
import projectSignature from '../../config/signature.json'
import { MemoryPersistence } from './memory-persistence'

/**
 * Le parcours des tests unitaires, figé ici et non lu dans `config/`.
 *
 * Six fichiers de test lisaient le parcours du produit : chaque jeu ajouté en
 * cassait dix-sept. Un test unitaire a besoin d'une forme stable, pas du
 * contenu du jour. Le vrai `config/course.json` garde ses gardiens :
 * `integration/config-loading` et `unit/composition-root`, dont c'est le sujet.
 *
 * La grille et la signature viennent du produit : ce sont le référentiel
 * officiel et sa lecture complémentaire, et un verdict testé contre une
 * grille inventée ne prouverait rien.
 */
const fixtureCourse = {
  version: '0.2-banc-essai',
  groups: [
    {
      id: 'groupe-banc-essai',
      label: "Banc d'essai du moteur",
      order: 1,
      games: [
        {
          id: 'test-bench-1',
          type: 'test-bench',
          label: 'Quelles affirmations tiennent la route ?',
          config: {
            statement:
              'Une IA vous propose ces affirmations sur son propre code. Retenez celles qui sont vérifiables.',
            propositions: [
              {
                id: 'p1',
                text: 'Les dépendances citées existent et sont à jour.',
                expected: true,
              },
              {
                id: 'p2',
                text: 'Le code compile, donc il est correct.',
                expected: false,
              },
              {
                id: 'p3',
                text: 'Les cas limites sont couverts par un test.',
                expected: true,
              },
              {
                id: 'p4',
                text: "La réponse est sûre parce qu'elle est détaillée.",
                expected: false,
              },
            ],
          },
          criteria: [
            {
              id: 'c1',
              question:
                'Toutes les propositions vérifiables ont-elles été retenues ?',
              rule: {
                type: 'all-expected-selected',
              },
              mapping: [
                {
                  dimension: 'taille',
                  weight: 3,
                },
                {
                  dimension: 'harness',
                  weight: 3,
                },
                {
                  dimension: 'intervention',
                  weight: 3,
                },
                {
                  dimension: 'parallele',
                  weight: 3,
                },
                {
                  dimension: 'verification',
                  weight: 1,
                },
              ],
            },
            {
              id: 'c2',
              question:
                "Aucune proposition non vérifiable n'a-t-elle été retenue ?",
              rule: {
                type: 'no-unexpected-selected',
              },
              mapping: [
                {
                  dimension: 'taille',
                  weight: 1,
                },
                {
                  dimension: 'harness',
                  weight: 1,
                },
                {
                  dimension: 'intervention',
                  weight: 1,
                },
                {
                  dimension: 'parallele',
                  weight: 1,
                },
                {
                  dimension: 'pilotage-contexte',
                  weight: 1,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
}

export const { grid, course, signature } = parseConfiguration(
  projectGrid,
  fixtureCourse,
  projectSignature,
)

/** La composition des tests, même câblage que la production, horloge figée. */
export const buildTestFacade = (
  persistence: PersistenceSessionAdapter = new MemoryPersistence(),
): GameSessionFacade =>
  new GameSessionFacade({
    registry: buildGameRegistry(),
    scoring: new WeightedMappingStrategy(),
    persistence,
    clock: new FixedClock(),
    grid,
    course,
    signature,
  })
