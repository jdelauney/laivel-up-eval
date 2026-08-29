# Testing

## Stratégie

- **Unit** (Vitest) : le domaine, le câblage et les écrans. Entities, commands, registry, scoring, façade, hooks de feature, evaluators et actions de jeu, adapters d'infrastructure. C'est là que le ratio valeur/temps est maximal.
- **Integration** (Vitest) : la validation des JSON au chargement — grille, parcours, profil de rejeu — avec les cas malformés. Le mode replay a son harnais (`run-replay.helper.ts`) mais **aucun profil sur le disque** : tant que `config/` n'en porte pas, cette part de la suite tourne sur des profils construits en mémoire.
- **E2E** (Playwright) : **prévu, pas encore amorcé**. `@playwright/test` est en dépendance et `npm run test:e2e` existe, mais aucune configuration ni aucun spec n'est committé — la commande n'est donc pas un garde-fou. La cible reste un happy path onboarding → un jeu → résumé, suffisant pour la vidéo de démo. Suivi par `aidd_docs/backlog/tasks/amorcer-la-suite-playwright-declaree.md`.

## Outils

- Vitest en environnement jsdom, setup dans `vitest.setup.ts`.
- Testing Library React et les matchers `jest-dom`.
- Playwright pour le navigateur, **exclu du run Vitest** par la config Vite. L'inverse n'est pas encore vrai : sans configuration Playwright, la commande e2e ramasse les suites Vitest.

## Conventions

- Les tests vivent dans `__tests__/` à la racine, jamais à côté du code, groupés `unit/` · `integration/` · `e2e/` puis par périmètre en miroir de `src/`.
- `__tests__/fixtures/` porte les doubles partagés. `MemoryPersistence` y implémente le port de persistance en mémoire, **avec une sérialisation réelle** : elle reproduit ce qu'un vrai stockage fait subir à l'état et attrape ce qu'un objet passé par référence masquerait.
- Un écran se teste avec une façade de test injectée par `SessionProvider`, jamais en important `composition-root`.
- Vitest ne ramasse que `__tests__/{unit,integration}/**/*.test.{ts,tsx}`.
- `__tests__/unit/health.test.tsx` teste la chaîne d'outillage, pas le produit : alias `@`, jsdom, matchers. S'il casse, c'est la configuration qui est en cause.

## Lancer

- `npm run test` · `npm run test:watch` · `npm run test:e2e`

## Browser QA

- Entrée : `npm run dev`, Vite sur `http://localhost:5173`.
- Auth : aucune. Pas de backend, pas de compte.
- État : LocalStorage. Le reset passe par `resetSession()` de la façade. Pour un temps déterministe, monter la composition sur `FixedClock` plutôt que `SystemClock`.
