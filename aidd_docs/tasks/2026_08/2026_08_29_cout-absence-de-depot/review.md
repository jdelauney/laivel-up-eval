# Review: Comprendre le coût de l'absence de dépôt

- **Verdict**: changes-requested
- **Diff**: `main...feat/cout-de-l-absence-de-depot` (`f4bb5b2`, `6cebeaf`, `e0e36c4`)
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_29
- **Findings**: 0 critical, 3 warning, 2 minor

## Phases

### Phase 1 — Nommer dans le domaine les axes que le dépôt prouve — annulée

- [ ] Les quatre critères de cette phase sont `not-applicable` : la phase porte `status: cancelled`, sa raison est inscrite en `phase-1.md:7`, et le diff net contre `main` ne touche plus le domaine. Retrait vérifié — voir `Verification`

### Phase 2 — Énoncer que le parcours se joue en entier sans dépôt

- [x] Le texte dit qu'entrer sans dépôt est un usage prévu, que le parcours se joue en entier, ne recopie aucun libellé de `config/grid.json` et ne promet aucun plafond — `src/features/onboarding/components/elements/missing-repository-notice.tsx:18` ; aucun garde ne protège la seconde moitié du critère, voir F1
- [x] Le texte ne contient aucune des vingt formes de `__tests__/fixtures/scoring-vocabulary.ts` — vérifié par lecture du texte et couvert par le balayage existant de `__tests__/unit/features/onboarding/onboarding-view.test.tsx:208`, dont le rendu monte l'annonce
- [x] À l'ouverture, sans partie enregistrée, l'annonce est visible — `src/features/onboarding/components/sections/onboarding-view.tsx:186`, `onboarding-view.test.tsx:277`
- [x] `alice/atelier` la fait disparaître, vider le champ la fait revenir, des espaces seuls la laissent visible — `onboarding-view.tsx:186` (`field.state.value.trim() === ''`), `onboarding-view.test.tsx:283` et `:293`
- [x] Une forme refusée laisse l'annonce absente et le message du champ seul — `onboarding-view.test.tsx:301`
- [x] `npm run lint`, `npm run typecheck`, `npm run test` passent — rejoués, voir `Verification`

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🟡 | code | 2 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:275` | La décision produit centrale de la branche — ne pas recopier les libellés de `config/grid.json`, `plan.md:35`, érigée en critère d'acceptation en `phase-2.md:138` — n'a aucun garde. Réinsérer « Reprise humaine du travail de l'IA » dans l'annonce laisse passer les 237 tests : le libellé ne porte aucune des vingt formes du vocabulaire de notation, seule barrière en place. Le critère jumeau de la même table (`phase-2.md:139`) est gardé, lui, par le balayage de `:208` : le dépôt a déjà le patron sous la main. | Étendre le balayage existant, ou en ajouter un à côté, qui assure qu'aucun `grid.dimensions[].label` n'apparaît dans l'accueil rendu. `__tests__/fixtures/configuration.ts:7` importe le vrai `config/grid.json`, donc le garde suit la donnée au lieu d'en recopier une liste. |
| 🟡 | code | 2 | `__tests__/unit/features/onboarding/onboarding-view.test.tsx:275` | `NOTICE = /Entrer sans dépôt est un usage prévu/` ne filtre que la première phrase, et les quatre tests du bloc s'y accrochent tous. Supprimer entièrement la seconde phrase laisse les 237 tests verts — or c'est elle qui porte toute la substance restante de la Story, les deux axes dits en mots ordinaires. La révision précédente assurait bien les deux axes (`is visible at opening and names both axes`) ; cette assertion est partie avec les libellés sans être remplacée. Les tests prouvent désormais la présence de l'annonce, pas son contenu. | Assurer dans le test d'ouverture les deux tournures ordinaires (« du travail de l'IA », « chantiers que vous menez de front »), pour que la moitié survivante de la ligne d'acceptation ait un garde. |
| 🟡 | rot | - | `aidd_docs/backlog/stories/comprendre-le-cout-de-l-absence-de-depot.md:17` | La Story n'est pas touchée par la branche (`git diff main..HEAD -- aidd_docs/backlog/` est vide). Elle garde `status: proposed` et sa ligne 1 inchangée, « l'accueil annonce que le verdict sera plafonné et nomme les axes concernés », alors que la moitié « plafonné » a été arbitrée hors périmètre. La décision ne vit que dans `plan.md:36` et `phase-2.md:7`. Qui lit le backlog voit une Story ouverte sans trace de l'arbitrage ni de ce qui la débloquerait. | Inscrire dans la Story qu'elle reste ouverte sur sa première ligne, avec le renvoi à la décision et à `voir-mon-verdict-plafonne.md`, qui doit atterrir avant que la ligne puisse être tenue. |
| 🟢 | rot | 2 | `src/features/onboarding/components/sections/onboarding-view.tsx:165` | Le conteneur ajouté porte `flex max-w-sm flex-col gap-2`, chaîne identique à celle que `src/features/onboarding/components/elements/text-field.tsx:44` rend déjà : la contrainte est désormais imbriquée dans elle-même et la borne intérieure est morte. Non trivialement supprimable — `TextField` est partagé et le champ du pseudo dépend encore de sa propre borne. | Acceptable en l'état. Si la duplication gêne, déplacer la largeur de `TextField` vers ses sites d'appel, ce qui la rend explicite pour les deux champs. |
| 🟢 | fit | 2 | `src/features/onboarding/components/elements/missing-repository-notice.tsx:20` | « ne reposeront que sur ce seul parcours » cumule `ne … que` et « seul », qui disent la même restriction deux fois. Le sujet composé fait par ailleurs trente mots avant son verbe, et « le nombre de chantiers … ne reposera sur un parcours » demande au lecteur de comprendre que c'est la connaissance qu'en a l'outil qui repose là, pas le nombre. | Alléger, par exemple « … reposeront sur ce seul parcours », et envisager de couper le sujet en deux propositions. |

## Verification

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Verified      | 100% (6/6) sur la phase 2 ; les 4 critères de la phase 1 sont `not-applicable`, phase annulée |
| Files checked | `src/features/onboarding/components/elements/missing-repository-notice.tsx`, `src/features/onboarding/components/sections/onboarding-view.tsx`, `__tests__/unit/features/onboarding/onboarding-view.test.tsx`, plus `plan.md`, `phase-1.md`, `phase-2.md` |
| Unchecked     | phase 1, quatre critères, `not-applicable` |
| Unplanned     | none — les trois fichiers touchés figurent dans la projection d'architecture de `phase-2.md:18` |
| Commands      | `npm run lint` → 97 fichiers, aucune correction ; `npm run typecheck` → muet ; `npx vitest run` → 31 fichiers, 237 tests verts |
| Retrait phase 1 | Propre. `grep` sur `src/` et `__tests__/` ne rend rien pour `repositoryProvenAxes`, `repository-proven-axes`, `RepositoryProvenAxis`, `REPOSITORY_PROVEN`. `game-session.facade.ts` et `use-onboarding.hook.ts` sont absents du diff net, donc identiques à `main`. `src/core/scoring/helpers/` ne garde que `dimension-band` et `level-resolver` ; `components/composites/` ne garde que `resume-run.tsx`. Les compteurs concordent : 99 → 97 fichiers lintés pour deux sources supprimées, 32 → 31 fichiers de test et 243 → 237 tests pour un fichier retiré et six tests (3 aide, 1 façade, 1 hook, 1 doublon d'écran). |
| Résidus | `.impeccable/hook.cache.json` référence encore les deux fichiers supprimés — cache d'outillage, se régénère, sans effet. `phase-1.md` conserve la description de ce qui avait été construit puis retiré, ce que son en-tête annonce en `:18`. Ni l'un ni l'autre n'est un écart. |
| Décidés non traités | `aria-describedby` non câblé sur l'annonce, et `text-plane-foreground/70` : écartés par décision, hors findings. |
| E2E           | aucun harnais Playwright committé (`aidd_docs/memory/testing.md`) ; rien dans ce diff n'exige le navigateur, la couverture jsdom suffit une fois F1 et F2 posés |
