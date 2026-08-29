# Review: Le cadre énoncé avant la première situation

- **Verdict**: changes-requested
- **Diff**: `main...feat/cadre-avant-de-commencer` (4 commits, correctif `1aae5ed`)
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_29
- **Findings**: 0 critical, 1 warning, 6 minor

## Phases

### Phase 1 — La durée, calculée et énoncée

- [x] Vingt situations rendent trente minutes — `__tests__/unit/features/onboarding/estimate-course-minutes.test.ts:5`
- [x] Un nombre de situations dont le produit tombe entre deux multiples de cinq rend le multiple le plus proche — `estimate-course-minutes.test.ts:9` (9 → 15) et `:13` (7 → 10)
- [x] Un parcours non vide ne rend jamais zéro minute — `src/features/onboarding/helpers/estimate-course-minutes.helper.ts:28`
- [x] Un parcours sans situation rend zéro (branche défensive, inatteignable en production) — `estimate-course-minutes.helper.ts:22`, `src/core/contracts/course.schema.ts:39` et `:44`, `src/App.tsx:47`
- [x] Le hook rend un total de situations et une durée qui suivent le parcours de la façade injectée — `src/features/onboarding/hooks/use-onboarding.hook.ts:23`, `use-onboarding.test.ts:118`
- [x] La vue ne contient plus aucun calcul — `src/features/onboarding/components/sections/onboarding-view.tsx:25`
- [x] Avant toute saisie, l'accueil affiche la durée indicative, le nombre de groupes et le nombre de situations — `onboarding-view.tsx:69`, `onboarding-view.test.tsx:161`
- [ ] Le bandeau tient sur quatre tuiles sans casser ses libellés sur petit écran — tenu de 830 à 1920 px et sous 768 px ; rompu dans la bande **768–825 px** (portrait tablette). Remesuré au navigateur tous les 10 px de 760 à 960 px
- [x] L'accueil affiche la phrase disant que la mesure porte sur ce qui est fait — `onboarding-view.tsx:64`
- [x] Aucun terme de la liste de notation n'apparaît dans le texte rendu par l'accueil — `onboarding-view.test.tsx:190` (écran) et `__tests__/integration/config-loading/course.test.ts:135` (sept libellés réels), avec contrôle positif `onboarding-view.test.tsx:207`
- [x] Le cadre reste énoncé quand une partie enregistrée est présente — `onboarding-view.test.tsx:245`

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🟡 | functional | 1 | `src/features/onboarding/components/sections/onboarding-view.tsx:69-104` | Le défaut a changé de nature, pas disparu. De 830 à 1920 px la rangée est correcte : quatre `dt` sur une ligne, quatre `dd` au même `offsetTop`. Dans la bande 768–825 px, la valeur `30 min` passe sur deux lignes (768→805) et les intitulés `SITUATIONS` et `ESTIMATION`, mots insécables plus larges que les 71 px utiles, débordent leur tuile de 14 à 16 px et chevauchent le filet voisin (768→825). `main` est propre à ces mêmes largeurs, en trois colonnes : la bande est introduite par le passage à quatre. 768 et 820 px sont des portraits de tablette courants | Repousser la bascule quatre colonnes de `md:` à `lg:` (1024 px) : la bande disparaît et la rangée à quatre reste intacte au-delà |
| 🟢 | code | 1 | `src/features/onboarding/components/sections/onboarding-view.tsx:86-91` | Le commentaire, réécrit, est exact sur ce qui cassait mais affirme que « Estimation » tient sur une seule ligne. C'est vrai à ≥830 px seulement : entre 768 et 825 px l'intitulé tient sur une ligne **en débordant** sa boîte de 16 px. Troisième version du même commentaire qui décrit le comportement à une largeur au lieu de la plage | Nommer la plage tenue plutôt que le comportement, une fois le point ci-dessus corrigé |
| 🟢 | code | 1 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:52-53` | `wordsRenderedBy` lit `container.textContent`, qui ignore la copie portée par un attribut (`placeholder`, `aria-label`, `title`). L'écran porte déjà un `placeholder` (`onboarding-view.tsx:149`). Non traité par le correctif | Concaténer au balayage les attributs textuels des nœuds rendus |
| 🟢 | code | 1 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:164-168` | `toHaveTextContent('1')` compare en sous-chaîne, et la fixture rend 1 groupe et 1 situation : les deux tuiles restent indiscernables, un échange de liaison passerait. Non traité par le correctif, alors que `buildTestFacadeWithGameCount` fournit désormais de quoi le faire | Monter la fixture à un nombre de situations différent du nombre de groupes et asserter sur le `dd` |
| 🟢 | code | 1 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:207-218` | Le contrôle positif rend un `<p>` isolé : il prouve que `SCORING_VOCABULARY` et `wordsRenderedBy` attrapent une phrase interdite, pas que le `container` du balayage d'écran couvre bien tout l'accueil. Utile, mais il ne contrôle qu'une moitié du dispositif | Faire porter le contrôle sur l'accueil réel, via un enfant injecté ou un libellé de fixture délibérément fautif |
| 🟢 | rot | 1 | `aidd_docs/tasks/.../phase-1.md:15`, `:106`, `:107`, `:137` | Le renommage `totalGames` → `totalSituations` est complet dans `src/` et `__tests__/`, mais le plan cite encore `totalGames` en quatre endroits, dont le critère d'acceptation 2. Le plan contredit maintenant le code qu'il a planifié | Renommer dans `phase-1.md` |
| 🟢 | rot | 1 | `aidd_docs/tasks/.../phase-1.md:20` | La projection d'architecture annonce toujours que `onboarding-view.test.tsx` couvre « le ton ». Aucune tâche ne le demande, aucun test ne le fait. Signalé à la revue précédente, non traité | Retirer « le ton » de la projection, ou ajouter la tâche et le test |
| — | fit | — | `src/features/onboarding/hooks/use-onboarding.hook.ts:22` | **Réserve, hors périmètre assumé** : `l-accueil-marque-le-premier-groupe-comme-courant.md` reste ouvert, le groupe 1 s'affiche toujours en courant au repos. Le diff ne l'aggrave ni n'empiète dessus | Hors de cette branche, par décision |

## Verification

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Verified      | 91% (10/11)                                        |
| Files checked | `src/features/onboarding/components/sections/onboarding-view.tsx`, `src/features/onboarding/hooks/use-onboarding.hook.ts`, `src/features/onboarding/helpers/estimate-course-minutes.helper.ts`, `__tests__/fixtures/scoring-vocabulary.ts`, `__tests__/fixtures/configuration.ts`, `__tests__/unit/features/onboarding/onboarding-view.test.tsx`, `__tests__/unit/features/onboarding/use-onboarding.test.ts`, `__tests__/unit/features/onboarding/estimate-course-minutes.test.ts`, `__tests__/integration/config-loading/course.test.ts`, `aidd_docs/tasks/2026_08/2026_08_29_cadre-avant-de-commencer/phase-1.md`, `aidd_docs/memory/testing.md` |
| Unchecked     | Le bandeau tient sur quatre tuiles sans casser ses libellés sur petit écran — fix (bande 768–825 px) |
| Unplanned     | `aidd_docs/memory/testing.md` et `aidd_docs/backlog/tasks/amorcer-la-suite-playwright-declaree.md` (levée E2E) ; `__tests__/fixtures/scoring-vocabulary.ts`, `__tests__/fixtures/configuration.ts:148-213` et `__tests__/integration/config-loading/course.test.ts:129-144` (gardes issues de la revue précédente, sans critère au plan) |
