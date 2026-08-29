# Memory check — 2026-08-29

## Findings

| File | Finding | Evidence |
| --- | --- | --- |
| `architecture.md` | annonce que le socle « n'est pas encore ici » et que `App.tsx` est vide | `src/composition-root.ts`, `src/core/session/game-session.facade.ts`, `App.tsx` aiguille trois écrans |
| `architecture.md` | situe le câblage des jeux dans `core/registry/register-games.ts` | le fichier est `src/games/register-games.ts` ; `core/registry/` ne porte que `game-registry.ts` |
| `architecture.md` | renvoie le détail à `TECHNICAL.md` §5, dont l'API de façade a divergé | la façade expose `getVerdict()` et `auditTrail()`, pas `getGroupScore()`, `generateSummary()` ni `exportResults()` |
| `codebase-map.md` | annonce que le dépôt « ne porte que `components/ui`, `lib/`, l'entrée Vite et un test de santé » | plus de quarante fichiers sous `core/`, `features/`, `games/`, `infrastructure/`, `providers/`, `store/` |
| `codebase-map.md` | énumère les zones de `core/` sans `scoring/` | `src/core/scoring/weighted-mapping.strategy.ts` et `src/core/scoring/helpers/` |
| `codebase-map.md` | ne nomme aucune zone `providers/` | `src/providers/session-context.tsx`, le passage du câblage à React |
| `codebase-map.md` | reprend la même position erronée de `register-games.ts` | `src/games/register-games.ts` |
| `codebase-map.md` | pose le découpage atomique en règle, que le code enfreint en un point | `src/components/layout/app-layout/app-layout.tsx` n'a pas de `sections/`, alors que `group-rail/` a bien son `composites/` |
| `forms.md` | affirme qu'aucun formulaire n'est écrit | `src/features/onboarding/schema/onboarding-form.schema.ts` et `use-onboarding.hook.ts` |
| `navigation.md` | affirme que `App.tsx` ne rend rien | `App.tsx` bascule sur `useSessionStore((state) => state.screen)` entre onboarding, parcours et résumé |
| `navigation.md` | son plan d'écrans omet l'écran de refus de configuration | `InvalidConfig` dans `App.tsx`, rendu quand `composition.status === 'invalid-config'` |
| `testing.md` | ne mentionne pas le dossier de fixtures partagées | `__tests__/fixtures/memory-persistence.ts`, port de persistance en mémoire |
| `testing.md` | dit le mode replay « suite d'intégration principale » | `config/` ne porte aucun profil ; `__tests__/integration/` ne contient que `config-loading/` |
| `project-brief.md` | sa liste de fonctionnalités socle mêle le livré et le non livré | ni export, ni ingestion de dépôt, ni assistant IA sous `src/` |

## Duplicated facts

| Fact | Home | Copy |
| --- | --- | --- |
| `base: './'` interdit un routeur servant des routes imbriquées | `deployment.md` | `navigation.md` |

## Notes

- `TECHNICAL.md` — le document que la mémoire désigne comme contrat détaillé a divergé du code sur deux points au moins (position de `register-games.ts`, API de façade). Le rafraîchir est une décision produit, hors périmètre d'un check de mémoire.
- `codebase-map.md` — l'écart de `app-layout.tsx` peut se résoudre en déplaçant le fichier ou en actant l'exception. C'est un choix de code, pas de mémoire.
- `config/` — aucun profil de rejeu sur le disque. Tant qu'il n'y en a pas, la stratégie de test décrite reste une intention sur sa partie replay.
