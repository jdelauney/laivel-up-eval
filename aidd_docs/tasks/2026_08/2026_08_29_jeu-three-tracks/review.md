# Review: Le jeu `three-tracks`, l'allocation d'attention

- **Verdict**: changes-requested
- **Diff**: `main...HEAD` (`e6d0861` + `a92c16e`)
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_29
- **Findings**: 0 critical, 3 warning, 8 minor

## Phases

### Passe de notation — les six points du verdict précédent

- [x] **1. Le cran ne venait pas des merges — résolu.** Poids `merged-at-least` 2 → 3 (`config/course.json:1197,1211`), total possible 8. Rejoué au-delà des neuf fixtures, y compris un cas que le tableau ne couvre pas — deux pertes dont une tardive, médiane 3 — qui rend `0.5` / « 1 chantier ». L'invariant tient sur tout l'espace atteignable : max sans merge `2/8 = 0.250`, min avec un merge `3/8 = 0.375`
- [x] **2. Plafond par chantier contournable — résolu.** `answer.schema.ts:107-129` agrège par `trackId` avant comparaison ; `answer.schema.test.ts:95-105` couvre les deux allocations du même chantier
- [ ] **3. Bavardage du nom accessible — partiellement résolu.** Le nom est bien court (`aria-label` sur le `th`, vérifié : `queryAllByRole('rowheader', { name: /brief alpha/ })` rend `0`), mais le brief sort du nom accessible sans être exposé ailleurs. En navigation de tableau et sous JAWS, une cellule est annoncée par son nom accessible : le lecteur d'écran retrouve les quatre noms nus que le correctif QA n° 1 avait justement supprimés. Findings N1
- [x] **4. `aria-hidden` sur les `<td>` — résolu.** `track-register.tsx:32-37` porte `aria-hidden` sur le filet décoratif seul. Vérifié : 9 cellules par ligne sur les cinq lignes d'un plateau 4 chantiers × 7 tours au tour 3, en-tête comprise. Le texte `sr-only` ajouté par-dessus est de trop, cf. Findings N2
- [x] **5. Documents faux — résolu.** `plan.md:32` porte l'arithmétique réelle et passe `pending` → `implemented` ; `.impeccable/surfaces/…:63` dit « creusé, filet conservé » ; `phase-4.md` passe à neuf lignes, met à jour les poids du bloc JSON et ajoute la propriété dominante comme cinquième preuve
- [ ] **6. Captures — partiellement résolu.** `desktop-tour-3.png` et `desktop-tour-5.png` remplacées. Mais `qa/README.md` n'a pas bougé : il date la passe du 29/08 sur les cinq défauts d'origine, ne mentionne pas la seconde passe, et aucun artefact versionné ne porte la vérification Chromium annoncée pour les correctifs 3 et 4. Findings N3

### Story — acceptance de `mener-plusieurs-chantiers-de-front.md`

- [x] Quatre chantiers démarrent, et chaque tour répartit une attention qui ne suffit pas pour tous — `config/course.json:1152-1156`
- [x] Un chantier laissé seul trop longtemps dérive puis meurt, et la dérive est visible avant la mort — `config.schema.ts:64-71` · `qa/desktop-tour-3.png`, `qa/desktop-tour-5.png`
- [x] Le cran retenu vient du nombre de chantiers menés jusqu'au merge : zéro, un, ou trois — **tenu depuis `a92c16e`**. 0 merge → au mieux 0.250 « aucun » ; 1 ou 2 merges → 0.375 à 0.625, « 1 chantier » ; 3 merges → 0.875 ou 1.000. La continuité ne module plus qu'à l'intérieur d'un cran, elle n'en fait plus franchir un — `three-tracks-run.test.ts:303-315`
- [x] La mesure prend la médiane de chantiers vivants par tour, jamais le maximum — `median.helper.ts:8-15` · `three-tracks.evaluator.ts:57-63`
- [x] Ouvrir quatre chantiers puis en abandonner trois ne donne pas un cran supérieur — `evaluator.test.ts:181-188` · `three-tracks-run.test.ts:197-207` (0.375, « 1 chantier », et le cas à trois pertes réelles est désormais joué)

### Phase 1 — Les contrats et la simulation pure

- [x] Une configuration où la mort n'arrive pas après la dérive n'ouvre pas de session et nomme le champ — `config.schema.ts:64-71` · `config.schema.test.ts:56`
- [x] Un plafond par chantier supérieur à l'attention disponible est refusé au chargement — `config.schema.ts:55-62` · `config.schema.test.ts:49`
- [x] Deux chantiers de même identifiant sont refusés au chargement — `config.schema.ts:42-53` · `config.schema.test.ts:40`
- [x] Une trace qui ne couvre pas tous les tours est refusée, et l'erreur nomme le tour manquant — `answer.schema.ts:100-105` · `answer.schema.test.ts:58-66`
- [x] Une allocation qui dépasse l'attention du tour, ou le plafond d'un chantier, est refusée — **tenu depuis `a92c16e`** : `answer.schema.ts:107-129` somme par `trackId` · `answer.schema.test.ts:95-105`
- [x] Un chantier laissé sans attention est en dérive avant d'être perdu, jamais l'inverse — `run-simulation.helper.ts:82-87` · `run-simulation.test.ts:72`
- [x] La première unité posée sur un chantier en dérive ne fait avancer aucun travail — `run-simulation.helper.ts:74-75` · `run-simulation.test.ts:83`
- [x] Un chantier mergé ignoré jusqu'à la fin reste mergé — `run-simulation.helper.ts:67` · `run-simulation.test.ts:102`
- [x] Le relevé de vivants compte les chantiers mergés — `run-simulation.helper.ts:117` · `run-simulation.test.ts:116`
- [x] Deux rejeux des mêmes allocations rendent le même état final — `run-simulation.test.ts:137`

### Phase 2 — L'évaluateur et ses quatre règles

- [x] La médiane d'un nombre pair de valeurs est la moyenne des deux du milieu — `median.helper.ts:14` · `median.test.ts:9`
- [x] La suite passée n'est pas mutée — `median.helper.ts:9` · `median.test.ts:17`
- [x] Un joueur qui ouvre quatre chantiers et n'en mène qu'un au merge ne satisfait que le palier d'un chantier — `evaluator.test.ts:181-188`
- [x] Un pic de quatre chantiers vivants sur deux tours ne satisfait pas le critère de médiane — `evaluator.test.ts:190-194`
- [x] Le verdict ne change pas quand les compteurs du journal de la trace sont forgés — `three-tracks.evaluator.ts:79-87` · `evaluator.test.ts:196-205`
- [x] Un chantier perdu fait manquer le critère de garde-fou, même si trois autres sont mergés — `evaluator.test.ts:172-179`
- [x] Une règle absente du jeu lève une erreur qui la nomme — `three-tracks.evaluator.ts:112-113` · `evaluator.test.ts:207-218`

### Phase 3 — Le jeu à l'écran et son câblage

- [x] Rien de l'implémentation ne contredit « Ce qu'un implémenteur ne doit pas inventer » — les neuf interdits revérifiés après `a92c16e` : aucun seuil annoncé, aucun chantier mis en avant, aucun tri, aucune animation, aucun retour en arrière, aucune horloge, et le `sr-only` ajouté dit « hors jeu », jamais pourquoi
- [x] La trace produite suit l'ordre de la configuration, pas celui des clics — `build-three-tracks-answer.action.ts:24-27` · `build-answer.test.ts:32`
- [x] L'état final de la trace vient de la simulation, il n'est pas recalculé dans l'action — `build-three-tracks-answer.action.ts:35` · `build-answer.test.ts:51`
- [x] La configuration n'est parsée qu'une fois, pas à chaque rendu — `use-three-tracks.hook.ts:37` · `use-three-tracks.test.ts:47`
- [x] La clôture du tour est toujours disponible, y compris à zéro unité posée ; l'attention non placée est perdue sans avertissement — `use-three-tracks.hook.ts:112-123` · `use-three-tracks.test.ts:119`
- [x] Aucune unité ne se dépose sur un chantier mergé ou perdu — `use-three-tracks.hook.ts:88-90` · `use-three-tracks.test.ts:94`
- [x] `onSubmit` est appelé une seule fois, au dernier tour — `use-three-tracks.hook.ts:120-122` · `use-three-tracks.test.ts:134`
- [x] Aucun retour en arrière n'est possible sur un tour validé — `use-three-tracks.hook.ts:28-30` · `use-three-tracks.test.ts:153`
- [x] La jauge d'avancement est à crans, jamais une barre continue — `work-notches.tsx:22-32`
- [x] Le zéro est une pastille explicite, et le plafond par chantier est visible avant de poser — `attention-cell.tsx:29-30` · `three-tracks-game.test.tsx:56`
- [x] Le registre est un tableau sémantique — `track-register.tsx:112-116` · `three-tracks-game.test.tsx:34`
- [x] Une suite de tours sans attention se lit comme une suite de points alignés — `track-register.tsx:212,218` · `three-tracks-game.test.tsx:147`
- [x] L'état d'une ligne se lit sans la couleur, le chantier perdu compris, et sans opacité réduite — `track-register.tsx:44-55` · `three-tracks-game.test.tsx:201`
- [x] Aucun chantier ne se lit comme celui qu'il faudrait servir en premier — `qa/desktop-tour-1.png`
- [x] Rien à l'écran n'annonce combien de tours d'abandon déclenchent la dérive — aucune occurrence de `driftAfter`/`diesAfter` dans les composants
- [x] Sous `md`, le registre reste jouable sans défilement horizontal — `track-register.tsx:105-109` · `qa/README.md:37`
- [x] Ajouter le jeu n'a modifié que les deux fichiers de câblage — `git diff --stat main..HEAD` : sous `src/`, seuls `register-games.ts` et `register-components.ts` sont modifiés

### Phase 4 — Le jeu dans le parcours

- [x] Le groupe des axes du référentiel porte un vrai `three-tracks` à la place du banc d'essai — `config/course.json:1150-1151`
- [x] Aucun des quatre chantiers ne se lit comme le plus urgent — `config/course.json:1158-1185` · `qa/desktop-tour-1.png`
- [x] Le libellé du jeu n'annonce aucun critère — `config/course.json:1151`
- [x] La suite entière est verte — `npm run test` : 40 fichiers, 326 tests, 0 échec ; `biome check` et `tsc -b --noEmit` sortent à 0
- [x] Les assertions chiffrées de `checkpoints-run.test.ts` sont inchangées — le fichier n'a pas été retouché par `a92c16e` ; son seul diff depuis `main` reste deux imports et une branche dans `answerFor`
- [x] Les neuf parties du tableau rendent les bandes qu'il annonce, au chiffre près — `three-tracks-run.test.ts:172-272`, exécuté
- [x] Trois routes de jeu différentes atteignent la bande la plus haute — `three-tracks-run.test.ts:288-300`
- [x] Trois merges avec un chantier perdu n'atteignent pas la bande la plus haute — `three-tracks-run.test.ts:315-325`
- [x] Une partie qui ne place jamais rien atteint la bande la plus basse — `three-tracks-run.test.ts:184-189`
- [x] Le jeu traverse la façade de production sans branche réservée aux tests — `three-tracks-run.test.ts:38-57`
- [x] `parallele` est mesuré à l'issue du parcours — `three-tracks-run.test.ts:334-339`
- [x] Un parcours dont la configuration du jeu est invalide n'ouvre pas de session et nomme le champ — `three-tracks-run.test.ts:341-354`

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🟡 | code | 3 | `src/games/three-tracks/components/composites/track-register.tsx:186` | **Effet de bord du correctif 3.** `aria-label` sur le `th` remplace le nom calculé depuis le contenu : le brief en sort et n'est exposé nulle part ailleurs. Vérifié : le nom d'une ligne est exactement « Chantier Alpha », et `queryAllByRole('rowheader', { name: /brief alpha/ })` rend `0`. En navigation de tableau (NVDA `Ctrl+Alt+flèches`) et sous JAWS, une cellule s'annonce par son nom accessible : l'utilisateur de lecteur d'écran retrouve les quatre noms nus, c'est-à-dire exactement le défaut que le correctif QA n° 1 avait ouvert le lot pour supprimer. Le brief reste dans le DOM, donc lisible en mode document, mais l'accès devient dépendant du mode | Ne pas nommer le `th` à la main : y laisser le seul libellé du chantier (nom calculé), et sortir le brief dans sa propre cellule sous un `th scope="col"` dédié. La colonne se replie sous `md` comme les autres. Le brief s'annonce alors une fois, quand on visite sa cellule, et jamais comme en-tête de ligne |
| 🟡 | conform | 3 | `src/games/three-tracks/components/elements/attention-cell.tsx:66` | *(reporté, assumé par l'équipe)* La fiche `…:77` et `phase-3.md` tâche 3.3 exigent la pastille indisponible « évidée, sans anneau » ; le code lui laisse un anneau plus pâle et le commentaire reformule la règle au lieu de signaler l'écart | Assumé en l'état. Le jour où la fiche est retouchée, y consigner que l'anneau pâle l'emporte |
| 🟡 | conform | 3 | `src/games/three-tracks/components/composites/track-register.tsx:138` | *(reporté, assumé par l'équipe)* `text-[0.5625rem]` (9 px) et `tracking-normal` là où `DESIGN.md:45` fixe les libellés d'état à `text-xs` et `0.12em`–`0.18em`. Plus petit texte du dépôt | Assumé en l'état |
| 🟢 | code | 3 | `src/games/three-tracks/components/composites/track-register.tsx:36` | **Effet de bord du correctif 4.** Le `sr-only` « Chantier hors jeu à ce tour » est ajouté à *chaque* cellule barrée. Mesuré sur un plateau 4 chantiers × 7 tours au tour 3, tous perdus : **20 occurrences**, 5 par ligne, la ligne annonçant « Chantier Alpha PERDU … hors jeu à ce tour ×5 ». L'information est déjà portée par la mention `PERDU` de la tête de ligne, et la fiche `…:99` dit « le registre ne réannonce rien : sept tours × quatre chantiers feraient un bavardage ». Le défaut corrigé était la cellule absente de l'arbre, pas la cellule muette | Retirer le `sr-only` : un `<td>` présent avec son seul filet `aria-hidden` suffit à rétablir l'alignement, et c'est l'alignement qui était en cause |
| 🟢 | rot | 4 | `aidd_docs/tasks/2026_08/2026_08_29_jeu-three-tracks/qa/README.md` | **Correctif 6 incomplet.** Deux captures desktop remplacées, mais le README n'a pas bougé : il date la passe du 29/08, décrit les cinq défauts d'origine, annonce « les six captures ci-dessous sont postérieures à la correction » sans distinguer les deux passes. La vérification Chromium annoncée pour les correctifs 3 et 4 (nom de ligne, 9/9 et 10/10 cellules) n'a aucun artefact versionné — c'est le seul point du lot dont la preuve ne survit pas à la conversation, alors que le dépôt a déjà la convention pour la porter | Ajouter au README une section « seconde passe » : la date, les deux captures remplacées, et le relevé d'arbre d'accessibilité qui justifie les correctifs 3 et 4 |
| 🟢 | fit | 4 | `config/course.json:1206-1233` | `median-live-tracks-at-least 3` reste impliqué par `no-abandoned-track` : sans perte, `liveTracksPerTurn` vaut 4 partout. Deux critères pour un signal très proche. Le nouveau barème en réduit fortement la portée — les deux ne pèsent plus que `2/8 = 0.25`, sous la largeur d'une bande — donc ce n'est plus qu'une redondance, sans effet sur le cran | Fusionner les deux critères de continuité, ou relever le seuil de médiane à 4, quand le barème sera retouché pour une autre raison |
| 🟢 | rot | 4 | `__tests__/integration/course-run/three-tracks-run.test.ts:158` | La fixture `OUVRE_QUATRE_EN_LACHE_TROIS` n'en lâche toujours que **deux**. Le cas à trois abandons réels est désormais couvert par `UN_MERGE_TROIS_PERTES`, donc la lacune de fond est comblée ; il ne reste que le nom qui promet autre chose que ce qu'il joue | Renommer en `OUVRE_QUATRE_EN_LACHE_DEUX`, dans le test et dans la ligne correspondante de `phase-4.md` |
| 🟢 | code | 1 | `src/games/three-tracks/schema/answer.schema.ts:100-129` | *(reporté)* Une trace plus longue que `config.turns` n'est pas refusée ; c'est `applyAllocations` qui lève `GameAlreadyOverError`, une erreur de simulation là où les quatre autres cas ont une erreur de trace nommée | Refuser `trace.turns.length !== config.turns` au même endroit que les autres |
| 🟢 | code | 1 | `config.schema.ts:19,24,25` · `answer.schema.ts:17` | *(reporté)* `work`, `attentionPerTurn`, `maxPerTrack` et `attention` acceptent des décimaux dans un jeu qui se compte en unités entières | `z.number().int()` sur les quatre champs |
| 🟢 | rot | 3 | `track-register.tsx:40` et `:205` | *(reporté)* Deux façons d'écrire une cellule vide : le composant `EmptyCell`, et un `<td>` inline pour la colonne mobile repliée | Employer `EmptyCell` aux deux endroits |
| 🟢 | conform | - | `aidd_docs/backlog/stories/mener-plusieurs-chantiers-de-front.md:3` | *(reporté)* La story reste `status: proposed` alors que `plan.md` est passé à `implemented` et que les quatre phases le sont. La story équivalente de `checkpoints` est `done` | Aligner le statut sur le précédent du dépôt |

## Verification

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Verified      | 100% (51/51) |
| Files checked | `src/games/three-tracks/**`, `src/games/register-games.ts`, `src/games/register-components.ts`, `config/course.json`, `config/grid.json`, `__tests__/unit/games/three-tracks/**`, `__tests__/integration/course-run/three-tracks-run.test.ts`, `__tests__/integration/course-run/checkpoints-run.test.ts`, `.impeccable/surfaces/tracks-components-composites-three-tracks-game-tsx.md`, `plan.md`, `phase-1.md` à `phase-4.md`, `qa/README.md` + 6 captures |
| Unchecked     | none — les deux critères manqués au tour précédent (story « le cran vient des merges », phase 1 « plafond par chantier ») sont tenus et rejoués |
| Unplanned     | none |
