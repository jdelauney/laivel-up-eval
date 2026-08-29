# Testing

## Stratégie

- **Unit** (Vitest) : evaluators, helpers, actions, entities — tout ce qui est pur et hors React. C'est là que le ratio valeur/temps est maximal ; chaque evaluator couvre ses cas OUI et NON.
- **Integration** (Vitest) : le **mode replay est la suite d'intégration principale** — un profil fictif est un cas `profil → pipeline complet → niveau attendu`. S'y ajoute la validation des JSON malformés.
- **E2E** (Playwright) : volontairement minimal, un happy path onboarding → un jeu → résumé, suffisant pour la vidéo de démo. Le reste du budget va aux units et au replay.

## Outils

- Vitest en environnement jsdom, setup dans `vitest.setup.ts`.
- Testing Library React et les matchers `jest-dom`.
- Playwright pour le navigateur, **exclu du run Vitest** par la config Vite.

## Conventions

- Les tests vivent dans `__tests__/` à la racine, jamais à côté du code, groupés `unit/` · `integration/` · `e2e/` puis par périmètre en miroir de `src/`.
- Vitest ne ramasse que `__tests__/{unit,integration}/**/*.test.{ts,tsx}`.
- `__tests__/unit/health.test.tsx` teste la chaîne d'outillage, pas le produit : alias `@`, jsdom, matchers. S'il casse, c'est la configuration qui est en cause.

## Lancer

- `npm run test` · `npm run test:watch` · `npm run test:e2e`

## Browser QA

- Entrée : `npm run dev`, Vite sur `http://localhost:5173`.
- Auth : aucune. Pas de backend, pas de compte.
- État : LocalStorage. Le reset passe par `resetSession()` de la façade ; le mode replay fournit les fixtures déterministes.
