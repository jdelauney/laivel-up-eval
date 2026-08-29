# Review: Le cadre énoncé avant la première situation

- **Verdict**: approve
- **Diff**: `main...feat/cadre-avant-de-commencer` (6 commits, correctifs `1aae5ed` et `0522608`)
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_29
- **Findings**: 0 critical, 0 warning, 3 minor

## Phases

### Phase 1 — La durée, calculée et énoncée

- [x] Vingt situations rendent trente minutes — `__tests__/unit/features/onboarding/estimate-course-minutes.test.ts:5`
- [x] Un nombre de situations dont le produit tombe entre deux multiples de cinq rend le multiple le plus proche — `estimate-course-minutes.test.ts:9` (9 → 15) et `:13` (7 → 10)
- [x] Un parcours non vide ne rend jamais zéro minute — `src/features/onboarding/helpers/estimate-course-minutes.helper.ts:28`
- [x] Un parcours sans situation rend zéro, branche défensive inatteignable en production — `estimate-course-minutes.helper.ts:22`, `src/core/contracts/course.schema.ts:39` et `:44`, `src/App.tsx:47`
- [x] Le hook rend un total de situations et une durée qui suivent le parcours de la façade injectée — `src/features/onboarding/hooks/use-onboarding.hook.ts:23`, `use-onboarding.test.ts:118`
- [x] La vue ne contient plus aucun calcul : elle lit `totalSituations` et `estimatedMinutes` du hook — `src/features/onboarding/components/sections/onboarding-view.tsx:25`
- [x] Avant toute saisie, l'accueil affiche la durée indicative, le nombre de groupes et le nombre de situations — `onboarding-view.tsx:69-118`, `onboarding-view.test.tsx:161`
- [x] De 360 à 1920 px, chaque intitulé et chaque valeur tient sur une ligne sans déborder sa tuile, et les valeurs d'une même rangée partagent leur ligne de base — remesuré au navigateur, 157 largeurs, pas de 10 px : **157 propres, 0 cassée**. Métrique contrôlée non creuse : géométrie `md:` d'origine réimposée en `style` inline (grille et paddings), le défaut est réattrapé à 768, 790, 820 et 830 px
- [x] L'accueil affiche la phrase disant que la mesure porte sur ce qui est fait — `onboarding-view.tsx:64`
- [x] Aucun terme de la liste de notation n'apparaît dans le texte rendu par l'accueil — `onboarding-view.test.tsx:190` (écran) et `__tests__/integration/config-loading/course.test.ts:135` (sept libellés réels), contrôle positif `onboarding-view.test.tsx:207`
- [x] Le cadre reste énoncé quand une partie enregistrée est présente — `onboarding-view.test.tsx:245`

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🟢 | code | 1 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:52-53` | `wordsRenderedBy` lit `container.textContent`, qui ignore la copie portée par un attribut (`placeholder`, `aria-label`, `title`). L'écran porte déjà un `placeholder` (`onboarding-view.tsx:167`). Ouvert depuis la première revue, sans conséquence aujourd'hui | Concaténer au balayage les attributs textuels des nœuds rendus |
| 🟢 | code | 1 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:164-168` | `toHaveTextContent('1')` compare en sous-chaîne, et la fixture rend 1 groupe et 1 situation : les tuiles Groupes et Situations restent indiscernables, un échange de liaison passerait. `buildTestFacadeWithGameCount` fournit désormais de quoi le lever | Monter une fixture dont le nombre de situations diffère du nombre de groupes, et asserter sur le `dd` |
| 🟢 | code | 1 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:207-218` | Le contrôle positif rend un `<p>` isolé : il prouve que `SCORING_VOCABULARY` et `wordsRenderedBy` attrapent une phrase interdite, pas que le `container` du balayage d'écran couvre tout l'accueil | Faire porter le contrôle sur l'accueil réel, via un enfant injecté ou un libellé de fixture délibérément fautif |
| — | fit | — | `src/features/onboarding/hooks/use-onboarding.hook.ts:22` | **Réserves hors périmètre, décidées** : le défaut `l-accueil-marque-le-premier-groupe-comme-courant.md` reste ouvert ; la rampe dit « jeux » quand le bandeau dit « Situations » ; « Locales » ne dit pas que rien ne quitte le navigateur ; le plafond sans dépôt n'est pas énoncé | Hors de cette branche, par décision |

## Verification

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Verified      | 100% (11/11)                                       |
| Files checked | `src/features/onboarding/components/sections/onboarding-view.tsx`, `src/features/onboarding/hooks/use-onboarding.hook.ts`, `src/features/onboarding/helpers/estimate-course-minutes.helper.ts`, `src/composition-root.ts`, `__tests__/fixtures/scoring-vocabulary.ts`, `__tests__/fixtures/configuration.ts`, `__tests__/unit/features/onboarding/onboarding-view.test.tsx`, `__tests__/unit/features/onboarding/use-onboarding.test.ts`, `__tests__/unit/features/onboarding/estimate-course-minutes.test.ts`, `__tests__/integration/config-loading/course.test.ts`, `aidd_docs/tasks/2026_08/2026_08_29_cadre-avant-de-commencer/phase-1.md`, `aidd_docs/backlog/tasks/amorcer-la-suite-playwright-declaree.md`, `aidd_docs/memory/testing.md` |
| Unchecked     | none |
| Unplanned     | `aidd_docs/memory/testing.md` et `aidd_docs/backlog/tasks/amorcer-la-suite-playwright-declaree.md` (levée E2E et ses deux specs cibles) ; `__tests__/fixtures/scoring-vocabulary.ts`, `__tests__/fixtures/configuration.ts:148-213` et `__tests__/integration/config-loading/course.test.ts:129-144` (gardes issues des revues, sans critère au plan) |
