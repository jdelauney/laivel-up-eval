# Review: Comprendre le coût de l'absence de dépôt

- **Verdict**: changes-requested
- **Diff**: `main...feat/cout-de-l-absence-de-depot` (neuf commits, de `f4bb5b2` à `a1782a3`)
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_29
- **Findings**: 0 critical, 1 warning, 2 minor

## Phases

### Phase 1 — Nommer dans le domaine les axes que le dépôt prouve — annulée

- [ ] Les quatre critères sont `not-applicable` : phase `status: cancelled`, raison en `phase-1.md:7`, retrait toujours vérifié — voir `Verification`

### Phase 2 — Énoncer que le parcours se joue en entier sans dépôt

- [x] Le texte dit l'usage prévu et le parcours entier, ne recopie aucun libellé de `config/grid.json`, ne promet aucun plafond — `src/features/onboarding/components/elements/missing-repository-notice.tsx:24`, gardé par `__tests__/unit/features/onboarding/onboarding-view.test.tsx:262`
- [x] Le texte dit au présent qu'aucun dépôt n'est lu, et ne sous-entend aucun effet du dépôt sur le verdict — `missing-repository-notice.tsx:25` (« se mesurent ici, dépôt ou pas »), gardé par `onboarding-view.test.tsx:314` ; vérifié contre le code, `grep` sur `src/core/scoring/`, `evaluation-result.entity.ts` et `src/features/scoring-summary/` ne rend aucune occurrence de `repository`
- [x] Le texte ne contient aucune des vingt formes de `__tests__/fixtures/scoring-vocabulary.ts` — `onboarding-view.test.tsx:211`
- [x] À l'ouverture, sans partie enregistrée, l'annonce est visible — `src/features/onboarding/components/sections/onboarding-view.tsx:187`, `onboarding-view.test.tsx:306`
- [x] `alice/atelier` la fait disparaître, vider le champ la fait revenir, des espaces seuls la laissent visible — `onboarding-view.tsx:187`, `onboarding-view.test.tsx:318` et `:328`
- [x] Une forme refusée laisse l'annonce absente et le message du champ seul — `onboarding-view.test.tsx:336`
- [x] Le test de contrôle du garde des libellés exerce la même extraction que le garde, via `renderedTextOf` — `onboarding-view.test.tsx:53`, appelé en `:265` et `:282`
- [x] `npm run lint`, `npm run typecheck`, `npm run test` passent — rejoués, voir `Verification`

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🟡 | rot | 2 | `src/features/onboarding/components/elements/missing-repository-notice.tsx:25` | Deux énoncés quasi synonymes vivent à quatre lignes d'écart : l'aide du champ dit « Rien n'est vérifié à cet instant. » (`onboarding-view.tsx:181`) et l'annonce dit « Aucun dépôt n'est lu pour l'instant ». Pour un lecteur profane c'est la même information, écrite deux fois. Pire, les deux n'ont pas la même portée d'affichage : l'aide est toujours visible, l'annonce disparaît dès que le champ porte autre chose que du blanc (`onboarding-view.tsx:187`). La clause d'honnêteté est donc retirée à la seule personne qu'elle concerne vraiment, celle qui vient de saisir un dépôt et dont la saisie n'est lue par rien. Le texte a changé de sujet — il parle désormais de l'outil, pas du dépôt manquant du joueur — mais sa règle d'affichage est restée celle d'une annonce sur le dépôt manquant, comme le nom du composant. Honnêteté asymétrique, et duplication. | Porter la clause d'honnêteté une seule fois, dans l'aide du champ qui est toujours visible et qui dit déjà presque cela, et ne laisser à l'annonce que ce qui est propre au champ vide. |
| 🟢 | fit | 2 | `src/features/onboarding/components/elements/missing-repository-notice.tsx:25` | Une fois le sous-entendu levé, plus rien à l'écran ne donne de raison de remplir le champ : « facultatif », « Rien n'est vérifié à cet instant », « Aucun dépôt n'est lu pour l'instant », « dépôt ou pas » — quatre négations de son utilité en une quarantaine de mots, aucune affirmation. La seule motivation vraie et présentable est écrite dans l'Epic depuis `c0021a3` — « le champ collecte pour l'Epic `preuves-du-depot-git.md`, qui l'exploitera » — et n'apparaît nulle part à l'écran. Cette branche n'a pas créé le trou, elle l'a rendu visible en devenant honnête ; le champ lui est antérieur (`saisir-son-identite-et-son-depot.md`). Hors périmètre de cette Story, d'où la sévérité basse. | Décision produit à porter en backlog : dire à l'écran que la saisie est conservée pour une lecture à venir, ou retirer le champ jusqu'à l'Epic 4 — ce que le brief de surface autorise explicitement, « each must earn its place … one that does not, goes ». |
| 🟢 | rot | 2 | `src/features/onboarding/components/elements/missing-repository-notice.tsx:24` | La première phrase perd sa raison d'être à côté de la seconde : « Entrer sans dépôt est un usage prévu » rassure sur un choix que la phrase suivante déclare sans effet (« dépôt ou pas »). Rassurer sur une décision dont on vient de dire qu'elle ne change rien tourne à vide. | Fusionner les deux idées en une phrase, ou garder la première seule tant que la seconde n'a pas d'enjeu à porter. |

## Verification

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Verified      | 100% (8/8) sur la phase 2 ; les 4 critères de la phase 1 sont `not-applicable`, phase annulée |
| Files checked | `src/features/onboarding/components/elements/missing-repository-notice.tsx`, `src/features/onboarding/components/sections/onboarding-view.tsx`, `__tests__/unit/features/onboarding/onboarding-view.test.tsx`, `aidd_docs/backlog/stories/comprendre-le-cout-de-l-absence-de-depot.md`, `aidd_docs/backlog/epics/onboarding-du-joueur.md`, plus `plan.md`, `phase-1.md`, `phase-2.md` |
| Unchecked     | phase 1, quatre critères, `not-applicable` |
| Unplanned     | none |
| Commands      | `npm run lint` → 97 fichiers, aucune correction ; `npm run typecheck` → muet ; `npx vitest run` → 31 fichiers, 239 tests verts |
| Sous-entendu levé | Oui, et vérifiable. « Se mesurent ici, dépôt ou pas » est une affirmation au présent, sans clause de futur, qui correspond exactement à l'état du code : aucun fichier de `src/core/scoring/`, `evaluation-result.entity.ts` ou `src/features/scoring-summary/` ne lit `repository`. Le deal breaker de la passe précédente est clos. |
| Mineurs passe 3 | Les deux sont traités. `renderedTextOf` est extrait et appelé par le garde comme par son contrôle : une extraction cassée fait désormais échouer les deux. L'arbitrage est propagé à l'Epic — Success Evidence, hypothèse marquée sans objet, et une ligne de fait ajoutée. L'affirmation fausse du Context sur le niveau White est corrigée avec sa réfutation par le code, au-delà de ce que j'avais demandé. |
| Retrait phase 1 | Toujours propre : aucun symbole orphelin pour `repositoryProvenAxes`, `repository-proven-axes`, `RepositoryProvenAxis`. Aucun `console.`, `debugger`, `TODO`, `.only` ni `.skip` dans le diff. |
| E2E           | aucun harnais Playwright committé (`aidd_docs/memory/testing.md`) ; rien dans ce diff n'exige le navigateur |
