# Review: Le cadre énoncé avant la première situation

- **Verdict**: changes-requested
- **Diff**: `main...feat/cadre-avant-de-commencer`
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_29
- **Findings**: 0 critical, 5 warning, 9 minor

## Phases

### Phase 1 — La durée, calculée et énoncée

- [x] Vingt situations rendent trente minutes — `__tests__/unit/features/onboarding/estimate-course-minutes.test.ts:5`, vert dans `npm run test` (230/230)
- [x] Un nombre de situations dont le produit tombe entre deux multiples de cinq rend le multiple le plus proche — `estimate-course-minutes.test.ts:9` (9 → 15) et `:13` (7 → 10)
- [x] Un parcours non vide ne rend jamais zéro minute — `src/features/onboarding/helpers/estimate-course-minutes.helper.ts:28` (`Math.max`), `estimate-course-minutes.test.ts:17`
- [x] Un parcours sans situation rend zéro — `estimate-course-minutes.helper.ts:22`, `estimate-course-minutes.test.ts:21`
- [x] Le hook rend un total de situations et une durée qui suivent le parcours de la façade injectée — `src/features/onboarding/hooks/use-onboarding.hook.ts:23`, `__tests__/unit/features/onboarding/use-onboarding.test.ts:118`
- [x] La vue ne contient plus aucun calcul : elle lit `totalGames` et `estimatedMinutes` du hook — `src/features/onboarding/components/sections/onboarding-view.tsx:25`
- [x] Avant toute saisie, l'accueil affiche la durée indicative, le nombre de groupes et le nombre de situations — `onboarding-view.tsx:69`, `__tests__/unit/features/onboarding/onboarding-view.test.tsx:163`
- [ ] Le bandeau tient sur quatre tuiles sans casser ses libellés sur petit écran — tenu sous 768 px (deux colonnes), rompu **au-dessus** : mesuré au navigateur à 768, 820, 900, 1024, 1280 et 1440 px, `Durée estimée` est le seul `dt` à passer sur deux lignes, et son `dd` descend de 16 px sous ceux de Groupes / Situations / Données
- [x] L'accueil affiche la phrase disant que la mesure porte sur ce qui est fait et non sur ce qui est déclaré — `onboarding-view.tsx:64`, `onboarding-view.test.tsx:172`
- [x] Aucun terme de la liste de notation n'apparaît dans le texte rendu par l'accueil — `onboarding-view.test.tsx:185` et `:199` ; recontrôlé hors test sur l'écran réel (`config/course.json`, sept libellés) : aucun terme de la liste
- [x] Le cadre reste énoncé quand une partie enregistrée est présente — `onboarding-view.test.tsx:213` (`compareDocumentPosition`)

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🟡 | functional | 1 | `src/features/onboarding/components/sections/onboarding-view.tsx:91-97` | À quatre colonnes la tuile fait 135 px (103 px utiles après `md:px-4`) ; `DURÉE ESTIMÉE` en 12 px capitales avec `tracking-[0.12em]` n'y tient pas et passe sur deux lignes de 768 à 1440 px. Le `dd` « 30 min » tombe 16 px sous les trois autres chiffres : la rangée du bandeau n'a plus de ligne de base commune | Raccourcir le libellé à `Durée` et porter l'estimation dans la valeur, ou réserver deux lignes au `dt` (`min-h`) pour que les quatre `dd` restent alignés |
| 🟡 | code | 1 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:43-52` | La liste est comparée en mots entiers, donc toute forme fléchie passe. Vérifié : « Les scores sont calculés », « Chaque situation vaut des points » et « Vous serez noté » ne déclenchent aucun terme de `SCORING_VOCABULARY` — ce sont les formulations les plus probables d'une copie de notation | Ajouter les pluriels et participes (`notes`, `noté`, `notés`, `scores`, `points`, `barèmes`, `critères`, `seuils`), ou comparer sur un radical préfixe plutôt que sur le mot entier |
| 🟡 | code | 1 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:185-212` | Le balayage tourne sur `buildTestFacade` (parcours fixture, un groupe « Banc d'essai du moteur »). Les sept libellés réels de `config/course.json` rendus par la rampe ne sont jamais lus, alors que le plan justifie la comparaison en mots entiers par « Jugement critique », un libellé que le test ne voit pas | Balayer aussi les libellés du parcours réel, dans la suite `integration/config-loading` qui a déjà `config/course.json` pour sujet |
| 🟡 | code | 1 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:178-183` | Le test nommé « follows the course shape of the injected facade, not a fixed duration » n'assère que la présence de `5 min` et l'absence de `30 min` : un `5 min` écrit en dur dans le JSX le laisserait vert. Il ne prouve pas ce que son nom annonce | Rendre deux façades de formes différentes et vérifier que la valeur suit, ou renommer le test pour ce qu'il couvre réellement |
| 🟡 | rot | 1 | `src/features/onboarding/components/sections/onboarding-view.tsx:86-90` | Le commentaire justifie de porter l'estimation dans l'intitulé parce que « Environ 30 min » en corps de chiffre déborderait la tuile. La mesure dit l'inverse : la valeur `30 min` (75 px) tient dans les 103 px utiles, c'est l'intitulé allongé qui casse. Le commentaire documente une décision que le résultat contredit | Réécrire ou retirer le commentaire en même temps que le correctif de mise en page |
| 🟢 | code | 1 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:54-55` | `wordsRenderedBy` lit `container.textContent`, qui ignore la copie portée par un attribut (`placeholder`, `aria-label`, `title`). L'écran porte déjà un `placeholder` (`onboarding-view.tsx:149`) | Concaténer au balayage les attributs textuels des nœuds rendus |
| 🟢 | code | 1 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:166-170` | `toHaveTextContent('1')` compare en sous-chaîne, et la fixture rend 1 groupe et 1 situation : les deux tuiles sont indiscernables, un échange de liaison passerait | Une fixture à deux valeurs distinctes, et une assertion sur le `dd` plutôt que sur la tuile |
| 🟢 | code | 1 | `src/features/onboarding/components/sections/onboarding-view.tsx:69` | À 768 px pile (la borne `md`), les quatre tuiles tombent à 103 px et `Locales` déborde sa boîte de 3 px (`scrollWidth` 90 pour 87 px utiles). Marginal, mais introduit par le passage de trois à quatre colonnes | Repousser la bascule à quatre colonnes à `lg`, ou réduire le `tracking` des `dt` |
| 🟢 | code | 1 | `src/features/onboarding/helpers/estimate-course-minutes.helper.ts:22` | La branche zéro est inatteignable en production : `src/core/contracts/course.schema.ts:39` et `:44` imposent `min(1)` groupes et `min(1)` jeux, et `src/App.tsx:47` rend `InvalidConfig` sinon. « 0 min » ne peut donc pas s'afficher | Rien à corriger dans le code ; c'est un contrat de fonction pure. À noter dans le commentaire du helper pour que la branche ne se lise pas comme un cas d'écran |
| 🟢 | rot | 1 | `aidd_docs/tasks/2026_08/2026_08_29_cadre-avant-de-commencer/phase-1.md` (Test Scope, ligne « Edge case - arrondi ») | Le Test Scope exige « jamais zéro » là où la table d'acceptation du même fichier exige « Un parcours sans situation rend zéro ». Le code et le test suivent la table ; le Test Scope les contredit | Aligner le Test Scope sur la table d'acceptation |
| 🟢 | rot | 1 | `aidd_docs/tasks/2026_08/2026_08_29_cadre-avant-de-commencer/phase-1.md` (Architecture projection) | La projection annonce que `onboarding-view.test.tsx` couvre « le ton ». Aucune tâche ne le demande, aucun test ne le fait. L'acceptation 3 de la story (vouvoiement, phrases courtes, aucun encouragement) reste sans garde — elle tient de fait, la copie concernée étant antérieure au diff | Retirer « le ton » de la projection, ou ajouter la tâche et le test correspondants |
| 🟢 | conform | 1 | `src/features/onboarding/hooks/use-onboarding.hook.ts:23` | `totalGames` nomme le mécanisme (`games` dans `config/course.json`) alors que l'écran et la story disent « situations » — `onboarding-view.tsx:80` rend `totalGames` sous le libellé `Situations`. `CLAUDE.md` : « Name by intention, not mechanism » | `totalSituations`, ou assumer `games` comme vocabulaire de domaine et le dire une fois dans le commentaire du hook |
| 🟢 | conform | - | `aidd_docs/memory/testing.md:7` | La levée du garde-fou E2E est correctement consignée, mais elle retire la seule vérification capable d'attraper le constat de mise en page ci-dessus : jsdom ne calcule aucune boîte. La levée reste acceptable pour le helper et le hook, pas pour la tuile | Vérifier la rangée au navigateur avant de fermer le lot, ou traiter `amorcer-la-suite-playwright-declaree.md` avant le prochain lot touchant une mise en page |
| 🟢 | fit | - | `src/features/onboarding/hooks/use-onboarding.hook.ts:22` | Le diff n'aggrave ni n'empiète sur `aidd_docs/backlog/defects/l-accueil-marque-le-premier-groupe-comme-courant.md` : `buildRail(facade.courseShape(), 0)` est inchangé, aucun nouveau test ne fige l'état de la rampe. Mais l'écran livré affiche toujours le groupe 1 en courant, ce qui contredit l'objet même du lot : dire la forme du parcours au repos | Traiter le défaut avant de clore la story ; il porte sur le même écran et la même ligne |

## Verification

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Verified      | 91% (10/11)                                        |
| Files checked | `src/features/onboarding/helpers/estimate-course-minutes.helper.ts`, `src/features/onboarding/hooks/use-onboarding.hook.ts`, `src/features/onboarding/components/sections/onboarding-view.tsx`, `__tests__/unit/features/onboarding/estimate-course-minutes.test.ts`, `__tests__/unit/features/onboarding/use-onboarding.test.ts`, `__tests__/unit/features/onboarding/onboarding-view.test.tsx`, `aidd_docs/memory/testing.md`, `aidd_docs/backlog/tasks/amorcer-la-suite-playwright-declaree.md` |
| Unchecked     | Le bandeau tient sur quatre tuiles sans casser ses libellés sur petit écran — fix |
| Unplanned     | `aidd_docs/memory/testing.md` et `aidd_docs/backlog/tasks/amorcer-la-suite-playwright-declaree.md` (correction de la mémoire projet et suivi de la levée E2E, hors critères du plan) ; `onboarding-view.test.tsx:178` et `:199`, deux cas issus du Test Scope sans critère dans la table d'acceptation |
