# Review: Comprendre le coût de l'absence de dépôt

- **Verdict**: approve
- **Diff**: `main...feat/cout-de-l-absence-de-depot` (`f4bb5b2`, `6cebeaf`, `e0e36c4`, `8fdfd5d`, `6b6fd38`, `785baf6`)
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_29
- **Findings**: 0 critical, 0 warning, 2 minor

## Phases

### Phase 1 — Nommer dans le domaine les axes que le dépôt prouve — annulée

- [ ] Les quatre critères sont `not-applicable` : phase `status: cancelled`, raison en `phase-1.md:7`, retrait vérifié — voir `Verification`

### Phase 2 — Énoncer que le parcours se joue en entier sans dépôt

- [x] Le texte dit qu'entrer sans dépôt est un usage prévu, que le parcours se joue en entier, ne recopie aucun libellé de `config/grid.json` et ne promet aucun plafond — `src/features/onboarding/components/elements/missing-repository-notice.tsx:19` ; désormais gardé par `__tests__/unit/features/onboarding/onboarding-view.test.tsx:259`, qui balaie l'accueil rendu contre chaque `grid.dimensions[].label` lu dans la vraie grille
- [x] Le texte ne contient aucune des vingt formes de `__tests__/fixtures/scoring-vocabulary.ts` — `onboarding-view.test.tsx:208`, dont le rendu monte l'annonce
- [x] À l'ouverture, sans partie enregistrée, l'annonce est visible — `src/features/onboarding/components/sections/onboarding-view.tsx:186`, `onboarding-view.test.tsx:303`
- [x] `alice/atelier` la fait disparaître, vider le champ la fait revenir, des espaces seuls la laissent visible — `onboarding-view.tsx:186`, `onboarding-view.test.tsx:312` et `:322`
- [x] Une forme refusée laisse l'annonce absente et le message du champ seul — `onboarding-view.test.tsx:330`
- [x] `npm run lint`, `npm run typecheck`, `npm run test` passent — rejoués, voir `Verification`

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🟢 | code | 2 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:271` | Le test de contrôle `catches a scoring grid dimension label…` n'emprunte pas le chemin de code du garde : il rend `<p>{label}</p>` puis réimplémente inline la même extraction et le même `toContain` sur un texte qu'il vient de construire depuis la valeur attendue. Il passerait même si le balayage de `:259` était vide. Son commentaire promet davantage — « un balayage cassé et un écran propre se ressemblent tous les deux » — alors qu'un balayage cassé n'est justement pas détecté. Il attrape bien une vacuité, celle d'un `grid.dimensions` vide, dont la déstructuration lèverait. Son jumeau du vocabulaire (`:223`) fait mieux : il exécute le vrai `wordsRenderedBy` et le vrai filtre sur un texte piégé. La différence tient à ce que le balayage des libellés n'a pas de helper à casser, d'où la sévérité basse. | Extraire l'extraction en helper à côté de `wordsRenderedBy` et le faire appeler par les deux tests, pour que le contrôle exerce vraiment le même chemin ; ou ramener le commentaire à ce que le test prouve. |
| 🟢 | rot | - | `aidd_docs/backlog/epics/onboarding-du-joueur.md:33` | L'arbitrage du plafond est inscrit sur la Story mais pas propagé à l'Epic parente, qui garde en Success Evidence « Une personne sans dépôt entre quand même, et sait déjà à ce moment-là que son verdict sera plafonné » — exactement la ligne reportée. Son hypothèse `:43`, « Dire le plafond dès l'entrée n'incite pas à saisir un dépôt qu'on ne veut pas montrer », devient sans objet puisque le plafond n'est plus dit. Non classé warning : la vérité est écrite et atteignable depuis l'Epic par sa Story fille, qui porte le report daté et son déblocage. | Aligner les deux lignes de l'Epic sur le report, en renvoyant à `voir-mon-verdict-plafonne.md` comme le fait la Story. |

## Verification

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Verified      | 100% (6/6) sur la phase 2 ; les 4 critères de la phase 1 sont `not-applicable`, phase annulée |
| Files checked | `src/features/onboarding/components/elements/missing-repository-notice.tsx`, `src/features/onboarding/components/sections/onboarding-view.tsx`, `__tests__/unit/features/onboarding/onboarding-view.test.tsx`, `aidd_docs/backlog/stories/comprendre-le-cout-de-l-absence-de-depot.md`, plus `plan.md`, `phase-1.md`, `phase-2.md` |
| Unchecked     | phase 1, quatre critères, `not-applicable` |
| Unplanned     | none |
| Commands      | `npm run lint` → 97 fichiers, aucune correction ; `npm run typecheck` → muet ; `npx vitest run` → 31 fichiers, 239 tests verts |
| Story | Les quatre lignes actives sont tenues : les deux axes nommés en mots ordinaires (`missing-repository-notice.tsx:20`, gardé par `onboarding-view.test.tsx:306`), aucun libellé de `config/grid.json` recopié (gardé par `:259`), le ton factuel sans impératif ni incitation, et la disparition à la saisie. La cinquième ligne, le plafond, est reportée le 29/08/2026 avec sa raison, son fondement dans le code et son déblocage ; la Story reste `proposed`. Le report ne déplace pas la cible : la moitié écartée est conservée mot pour mot en ligne à part, et une contrainte nouvelle a été ajoutée, pas retirée. |
| Gardes F1 et F2 | Le balayage des libellés lit `grid.dimensions` depuis `__tests__/fixtures/configuration.ts`, qui importe le vrai `config/grid.json` en `:7` : il suit la donnée, sans copie. Il autorise la paraphrase (« du travail de l'IA ») et bloque le libellé entier (« Reprise humaine du travail de l'IA »), ce que demande la ligne d'acceptation. L'assertion de contenu porte sur l'élément de l'annonce, pas sur l'écran : retirer la seconde phrase la fait échouer. Validations par mutation rapportées par le coordinateur, cohérentes avec la lecture du code. |
| Retrait phase 1 | Toujours propre : `grep` sur `src/` et `__tests__/` ne rend rien pour `repositoryProvenAxes`, `repository-proven-axes`, `RepositoryProvenAxis`. Aucun `console.`, `debugger`, `TODO`, `.only` ni `.skip` ajouté par le diff. |
| Observation | Le balayage du vocabulaire a un second cas couvrant l'accueil avec partie stockée (`:244`) ; celui des libellés n'en a pas. L'asymétrie se défend — la carte de reprise ne porte que pseudo, dépôt et progression, jamais un libellé de référentiel. Signalé, non retenu comme écart. |
| E2E           | aucun harnais Playwright committé (`aidd_docs/memory/testing.md`) ; rien dans ce diff n'exige le navigateur, la couverture jsdom est suffisante et désormais non vacuante |
