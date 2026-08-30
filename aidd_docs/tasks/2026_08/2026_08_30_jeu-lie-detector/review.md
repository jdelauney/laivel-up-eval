# Review: Le jeu `lie-detector`, désigner la menteuse puis tenir sa ligne

- **Verdict**: changes-requested
- **Diff**: `main...9230ffd`
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_30
- **Findings**: 0 critical, 1 warning, 1 minor
- **Passe**: 3 (les 11 constats de la passe 1 et les 4 de la passe 2 sont tous re-vérifiés résolus ; 2 constats neufs)

## Phases

### Phase 1 — Les contrats et la lecture pure des manches

- [x] Une configuration dont toutes les objections pointent une affirmation vraie est refusée au chargement, en nommant le corpus — `src/games/lie-detector/schema/config.schema.ts:125-136`, testé `config.schema.test.ts:119-138`
- [x] Une manche à zéro ou deux menteuses est refusée, en nommant la manche — `config.schema.ts:97-113`, testé `config.schema.test.ts:78-107`
- [x] Une trace qui omet une manche, ou qui désigne une affirmation absente du lot, lève l'erreur nommée qui porte l'identifiant fautif — `answer.schema.ts:108,116-121`, testé `answer.schema.test.ts:59,85`
- [x] La lecture d'une manche où le joueur a désigné exactement la cible de l'objection rend `contradicted: false` et `capitulated: false` — `read-rounds.helper.ts:53,55-56`, testé `read-rounds.test.ts:112`
- [x] La lecture d'une manche où une désignation juste est abandonnée sous contradiction rend `capitulated: true` et `unmasked: false` — `read-rounds.helper.ts:55-56`, testé `read-rounds.test.ts:81`
- [x] La lecture d'une manche où une désignation fausse est corrigée vers la menteuse rend `capitulated: false` et `unmasked: true` — `read-rounds.test.ts:85`
- [x] `npm run lint`, `npm run typecheck` et `npm run test` passent — rejoués : `biome check .` 181 fichiers, `tsc -b --noEmit` muet, 65 fichiers / 564 tests

### Phase 2 — L'évaluateur et ses deux règles

- [x] Une trace de quatre manches démasquées sans capitulation satisfait les deux critères — `evaluator.test.ts:83-95`
- [x] Une trace dont aucune manche n'a été contredite fait ressortir `no-capitulation` manqué — `lie-detector.evaluator.ts:68-71`, testé `evaluator.test.ts:120-131` et désormais sur le corpus réel `lie-detector-run.test.ts:240-256`
- [x] Une règle absente du jeu lève `UnknownRuleError` en nommant la règle et le jeu — `lie-detector.evaluator.ts:27-32`, testé `evaluator.test.ts:133-147`
- [x] Le registre résout `lie-detector` vers son évaluateur et ses deux schémas — `register-games.ts:59-63`, testé `evaluator.test.ts:75-81`
- [x] `npm run lint`, `npm run typecheck` et `npm run test` passent — rejoués

### Phase 3 — Le jeu à l'écran, sa désignation et son objection

- [x] La trace soumise porte une entrée par manche, dans l'ordre de la configuration — `build-lie-detector-answer.action.ts:29-35`, testé `build-answer.test.ts:40`
- [x] Cliquer une seconde affirmation en phase `picking` ne déplace pas la désignation — tenu par l'absence de chemin, `use-lie-detector.hook.ts:64-74`, testé `use-lie-detector.test.ts:62-77`
- [x] Après le second geste, aucune fonction exposée ne change plus la désignation — `use-lie-detector.test.ts:106-123`
- [x] Deux appels à `advance()` sur la dernière manche ne soumettent qu'une fois — `use-lie-detector.hook.ts:109-111`, testé `use-lie-detector.test.ts:163-203`
- [x] Avant la révélation, le texte rendu ne contient aucune vérification et ne nomme pas la menteuse — les quatre vérifications sont désormais bouclées (`lie-detector-game.test.tsx`, F8) et la garde du hook rejouée en phase `objection` (`use-lie-detector.test.ts`, F8)
- [x] L'état d'une affirmation se lit sans la couleur : un signe et un libellé le portent — `claim-card.tsx:46-80`, testé `lie-detector-game.test.tsx:177-185`
- [x] Le parcours résout `lie-detector` vers son composant — `register-components.ts:24`
- [x] `npm run lint`, `npm run typecheck` et `npm run test` passent — rejoués

### Phase 4 — Le jeu dans le parcours, et son corpus

- [x] Le parcours réel se charge sans refus, avec `g1-3` en `lie-detector` — `lie-detector-run.test.ts:140-147`
- [x] Aucun critère de `g1-3` ne mappe un axe du référentiel officiel — `lie-detector-run.test.ts:149-158`
- [x] Le profil qui adopte la cible de chaque objection ressort sous le seuil d'identification — `lie-detector-run.test.ts:240-256`, et `g1-3-c2` y est désormais asserté manqué (F3)
- [x] Le profil qui tient chacune de ses **désignations justes** satisfait le critère de stabilité — `neverMovesPicks` dérive maintenant de `liarIdOf` (`lie-detector-run.test.ts:113-125`), profil miroir `neverMovesWrongPicks` asserté manqué (`:268-281`). F2 résolu
- [x] Le profil juste puis retourné à chaque objection rate les deux critères — `lie-detector-run.test.ts:283-296`
- [x] Un corpus réécrit avec des objections d'une seule nature fait échouer le test — `lie-detector-run.test.ts` (garde des deux natures)
- [x] Dans chaque manche, la menteuse n'est ni la plus longue ni la plus courte, et le lot ne s'étale pas de plus d'un quart — tests de longueur au vert sur le corpus réécrit (`r3-c` remplacée, F10)
- [x] `npm run lint`, `npm run typecheck` et `npm run test` passent — rejoués

### Phase 5 — La passe impeccable de la surface

- [x] La fiche de surface existe et nomme la stratégie retenue pour ce jeu — `.impeccable/surfaces/…lie-detector-game-tsx.md`
- [x] Les quatre affirmations d'une manche se comparent sans défilement au premier temps — **desktop** : tenu, cartes à 484–817 sur 900. **Mobile** : tenu à `r2`/`r3`/`r4`, vérifié moi-même sur `qa/mobile-5-r2-scrolly0-corrige.png` — le chrome du parcours est dans le cadre (bannière, rampe, « SITUATION 1 SUR 20 », titre), les quatre cartes et le verrou tiennent sous 844. `r1` exceptée, exception jugée légitime (cf. note d'arbitrage). F12 résolu
- [x] Une objection fondée et une objection creuse sont rendues avec exactement la même structure et le même ton — `objection-note.tsx:18`, testé sur `container.innerHTML`, confirmé au rendu réel
- [x] Un test échoue si la présentation de l'objection dépend de sa nature — comparaison sur l'écran entier
- [x] `npm run lint`, `npm run typecheck` et `npm run test` passent — rejoués
- [x] La tournée aux deux gabarits est déposée dans `qa/` — 11 captures, aucun doublon (md5 tous distincts), tableau du README conforme
- [x] Sur `390×844`, à la deuxième manche et aux suivantes, les quatre affirmations et le verrou tiennent sans défilement — la ligne de la tâche 5 est marquée **invalidée** au lieu d'être effacée, et reprise en tâche 6
- [x] Sur `390×844`, à `scrollY = 0` vérifié, `r2`/`r3`/`r4` tiennent sous 844 — mesuré (417/515/612/710, verrou 807–835, marge 9px). Extrapolation à `r3`/`r4` fondée : `r2` porte le plus gros volume de texte des trois (somme 471 contre 438 et 454, max 133 contre 115 et 121)
- [x] `npm run lint`, `npm run typecheck` et `npm run test` passent, aucune régression — 564/564

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🟡 | rot | 5 | `aidd_docs/backlog/defects/la-revelation-pousse-l-action-hors-de-l-ecran.md:33` | Le défaut porte une mesure que la même branche a depuis invalidée, et contredit le fichier de preuve qu'il cite. Sa table dit « 390 × 844 → 185 px », or `qa/README.md` (point 3) mesure désormais **597 px** à `scrollY = 0` et explique que les 185 px souffraient de la même contamination de défilement que le point 1. `git log` confirme que le fichier n'a pas été retouché depuis `69facee`. Ce n'est pas qu'un chiffre : la section `Impact` argumente « Modéré […] d'où la sévérité basse » — un dépassement de 597 px, soit 71 % d'une hauteur de viewport sous la ligne de flottaison au lieu de 22 %, remet ce classement en jeu. Le défaut est dans le périmètre de `main..HEAD`, et c'est l'artefact qui pilotera la correction future | Porter 597 px dans la table, dater la correction, et relire la ligne `Impact` : la sévérité basse tenait en partie à l'ampleur annoncée |
| 🟢 | fit | 5 | `config/course.json` (corpus `g1-3`) et `__tests__/integration/course-run/lie-detector-run.test.ts` | La tenue mobile repose sur 9 px de marge qu'aucun test ne protège. Les deux garde-fous de longueur existants mesurent l'**écart intra-manche** (anti-indice de forme), jamais une longueur absolue. Or à 390 px de large, `text-sm` en `leading-snug`, une affirmation passe de 3 à 4 lignes autour de 135 caractères et coûte ~19 px — plus du double de la marge. Un corpus réécrit en respectant le quart d'écart réglementaire peut donc casser la tenue mobile en silence, sans qu'aucune suite ne rougisse | Ajouter au test d'intégration une borne haute sur `claim.text.length` (~135), commentée comme un budget de mise en page mobile et non comme une règle de rédaction |

## Note d'arbitrage — l'exception `r1` sur mobile

Jugée **légitime**, pas une capitulation déguisée. Quatre vérifications :

- **La contrainte est réelle et mesurée.** L'écart `r1`/`r2` (606 contre 417) vaut ~190 px, exactement la consigne dépliée. Les cartes sont déjà à `p-2 gap-1 leading-snug` sous `sm` ; le chrome restant (285 px) appartient à `course-view.tsx`, partagé par les vingt jeux et hors périmètre — non touché, vérifié.
- **La hiérarchie est la bonne pour un outil de mesure.** Comparabilité de la mesure avant ergonomie de comparaison : un joueur qui ignore que le clic verrouille et qu'une seule redésignation est offerte ne joue pas la même `r1` que les autres. Le risque est réel et propre à `r1` — aux manches suivantes le cadre est connu.
- **Le coût est énoncé sans arrondi** et le critère est marqué non atteint là plutôt que redéfini pour coller au résultat. La mesure invalidée est marquée invalidée, pas effacée, et la capture du défaut est conservée comme preuve.
- **Réserve, non bloquante** : une troisième voie n'est pas nommée dans les alternatives écartées — un écran de règles avant `r1`, qui satisferait les deux. Elle introduirait un motif d'interface pour un seul jeu, ce que la branche refuse déjà par ailleurs pour la barre d'action collante ; le refus serait donc cohérent, mais il gagnerait à être écrit pour que le choix reste révisable.

## Verification

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Verified      | 100% (36/36)                                      |
| Files checked | `src/games/lie-detector/**`, `src/features/group-navigation/components/sections/course-view.tsx` (confirmé intact), `config/course.json`, `__tests__/unit/games/lie-detector/**`, `__tests__/integration/course-run/**`, `__tests__/fixtures/lie-detector-answer.ts`, `.impeccable/surfaces/…lie-detector-game-tsx.md`, `aidd_docs/backlog/stories/demasquer-l-affirmation-qui-ment.md`, `aidd_docs/backlog/defects/la-revelation-pousse-l-action-hors-de-l-ecran.md`, `aidd_docs/tasks/2026_08/2026_08_30_jeu-lie-detector/{plan,phase-1..5}.md` + `qa/` (11 captures relues, README) |
| Unchecked     | none |
| Unplanned     | none. Le second correctif est projeté en phase 5 tâche 6 ; `course-view.tsx` n'est pas touché (`git diff` vide sur `src/features/group-navigation/`) |
