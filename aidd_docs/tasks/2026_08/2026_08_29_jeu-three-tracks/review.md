# Review: Le jeu `three-tracks`, l'allocation d'attention

- **Verdict**: changes-requested
- **Diff**: `main...HEAD` (e713cdb)
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_29
- **Findings**: 1 critical, 7 warning, 6 minor

## Phases

### Story — acceptance de `mener-plusieurs-chantiers-de-front.md`

- [x] Quatre chantiers démarrent, et chaque tour répartit une attention qui ne suffit pas pour tous — `config/course.json:1152-1156` (4 chantiers, `attentionPerTurn` 3, `maxPerTrack` 2 : au mieux 3 chantiers servis sur 4)
- [x] Un chantier laissé seul trop longtemps dérive puis meurt, et la dérive est visible avant la mort — `src/games/three-tracks/schema/config.schema.ts:64-71` (refus au chargement) · `qa/desktop-tour-3.png`, `qa/desktop-tour-5.png`
- [ ] Le cran retenu vient du nombre de chantiers menés jusqu'au merge : zéro, un, ou trois — **non tenu**. Zéro merge sans perte rend la bande « 1 chantier » (0.333), un merge sans perte rend « 2 chantiers » (0.667). Le cran vient du couple merges + continuité, pas des merges seuls. Preuve en Findings F1
- [x] La mesure prend la médiane de chantiers vivants par tour, jamais le maximum — `src/games/three-tracks/helpers/median.helper.ts:8-15` · `three-tracks.evaluator.ts:57-63`
- [x] Ouvrir quatre chantiers puis en abandonner trois ne donne pas un cran supérieur — `__tests__/unit/games/three-tracks/evaluator.test.ts:181-188` (seul `merged-at-least 1` satisfait) · `three-tracks-run.test.ts:249-256` (0.333)

### Phase 1 — Les contrats et la simulation pure

- [x] Une configuration où la mort n'arrive pas après la dérive n'ouvre pas de session et nomme le champ — `config.schema.ts:64-71` · `config.schema.test.ts:56`
- [x] Un plafond par chantier supérieur à l'attention disponible est refusé au chargement — `config.schema.ts:55-62` · `config.schema.test.ts:49`
- [x] Deux chantiers de même identifiant sont refusés au chargement — `config.schema.ts:42-53` · `config.schema.test.ts:40`
- [x] Une trace qui ne couvre pas tous les tours est refusée, et l'erreur nomme le tour manquant — `answer.schema.ts:100-105` · `answer.schema.test.ts:58-66`
- [ ] Une allocation qui dépasse l'attention du tour, ou le plafond d'un chantier, est refusée — **partiel**. Le plafond du tour tient (`answer.schema.ts:118-120`), le plafond par chantier est contournable : la vérification porte sur chaque entrée d'allocation, pas sur la somme par `trackId`. Findings F2
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
- [x] Le verdict ne change pas quand les compteurs du journal de la trace sont forgés — `three-tracks.evaluator.ts:79-87` (rejeu depuis les seules allocations) · `evaluator.test.ts:196-205`
- [x] Un chantier perdu fait manquer le critère de garde-fou, même si trois autres sont mergés — `evaluator.test.ts:172-179`
- [x] Une règle absente du jeu lève une erreur qui la nomme — `three-tracks.evaluator.ts:112-113` · `evaluator.test.ts:207-218`

### Phase 3 — Le jeu à l'écran et son câblage

- [x] Rien de l'implémentation ne contredit « Ce qu'un implémenteur ne doit pas inventer » — les neuf interdits vérifiés un à un contre `track-register.tsx`, `attention-cell.tsx`, `work-notches.tsx`, `three-tracks-game.tsx` : aucun seuil annoncé, aucun chantier mis en avant, aucun tri, aucune animation, aucun retour en arrière, aucune horloge
- [x] La trace produite suit l'ordre de la configuration, pas celui des clics — `build-three-tracks-answer.action.ts:24-27` · `build-answer.test.ts:32`
- [x] L'état final de la trace vient de la simulation, il n'est pas recalculé dans l'action — `build-three-tracks-answer.action.ts:35` · `build-answer.test.ts:51`
- [x] La configuration n'est parsée qu'une fois, pas à chaque rendu — `use-three-tracks.hook.ts:37` · `use-three-tracks.test.ts:47`
- [x] La clôture du tour est toujours disponible, y compris à zéro unité posée ; l'attention non placée est perdue sans avertissement — `use-three-tracks.hook.ts:112-123` · `use-three-tracks.test.ts:119` · `three-tracks-game.test.tsx:65`
- [x] Aucune unité ne se dépose sur un chantier mergé ou perdu — `use-three-tracks.hook.ts:88-90` · `use-three-tracks.test.ts:94`
- [x] `onSubmit` est appelé une seule fois, au dernier tour — `use-three-tracks.hook.ts:120-122` · `use-three-tracks.test.ts:134`
- [x] Aucun retour en arrière n'est possible sur un tour validé — `use-three-tracks.hook.ts:28-30` · `use-three-tracks.test.ts:153`
- [x] La jauge d'avancement est à crans, jamais une barre continue — `work-notches.tsx:22-32`
- [x] Le zéro est une pastille explicite, et le plafond par chantier est visible avant de poser — `attention-cell.tsx:29-30` · `three-tracks-game.test.tsx:56`
- [x] Le registre est un tableau sémantique — `track-register.tsx:92-96` (`caption` sr-only, `th scope="col"`, `th scope="row"`) · `three-tracks-game.test.tsx:34`
- [x] Une suite de tours sans attention se lit comme une suite de points alignés — `track-register.tsx:192,198` · `three-tracks-game.test.tsx:147`
- [x] L'état d'une ligne se lit sans la couleur, le chantier perdu compris, et sans opacité réduite — `track-register.tsx:37-48` (filet + mention) · `three-tracks-game.test.tsx:201`
- [x] Aucun chantier ne se lit comme celui qu'il faudrait servir en premier — `qa/desktop-tour-1.png`
- [x] Rien à l'écran n'annonce combien de tours d'abandon déclenchent la dérive — aucune occurrence de `driftAfter`/`diesAfter` dans les composants
- [x] Sous `md`, le registre reste jouable sans défilement horizontal — `track-register.tsx:85-89` · `qa/README.md:37` (`scrollWidth === clientWidth` à 390 et 1440)
- [x] Ajouter le jeu n'a modifié que les deux fichiers de câblage — `git diff --stat main..HEAD` : seuls `register-games.ts` et `register-components.ts` sont modifiés sous `src/`

### Phase 4 — Le jeu dans le parcours

- [x] Le groupe des axes du référentiel porte un vrai `three-tracks` à la place du banc d'essai — `config/course.json:1150-1151`
- [x] Aucun des quatre chantiers ne se lit comme le plus urgent — `config/course.json:1158-1185` · `qa/desktop-tour-1.png`
- [x] Le libellé du jeu n'annonce aucun critère — `config/course.json:1151` (« Où passez-vous votre attention ? »)
- [x] La suite entière est verte : le test d'intégration de `checkpoints` sait répondre au nouveau type de jeu — `checkpoints-run.test.ts:65-72` · `npm run test` : 40 fichiers, 321 tests, 0 échec
- [x] Les assertions chiffrées de `checkpoints-run.test.ts` sont inchangées — le diff de ce fichier n'ajoute que deux imports et une branche dans `answerFor`, aucune ligne d'assertion touchée
- [x] Les six parties du tableau rendent les six bandes qu'il annonce, au chiffre près — `three-tracks-run.test.ts:171-223`
- [x] Trois routes de jeu différentes atteignent la bande la plus haute — `three-tracks-run.test.ts:225-237`
- [x] Trois merges avec un chantier perdu n'atteignent pas la bande la plus haute — `three-tracks-run.test.ts:239-247`
- [x] Une partie qui ne place jamais rien atteint la bande la plus basse — `three-tracks-run.test.ts:202-207`
- [x] Le jeu traverse la façade de production sans branche réservée aux tests — `three-tracks-run.test.ts:38-57` (seules `FixedClock` et `MemoryPersistence` sont doublées)
- [x] `parallele` est mesuré à l'issue du parcours — `three-tracks-run.test.ts:258-263`
- [x] Un parcours dont la configuration du jeu est invalide n'ouvre pas de session et nomme le champ — `three-tracks-run.test.ts:265-278`

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🔴 | functional | 4 | `config/course.json:1203-1233` | Le cran ne vient pas du nombre de merges. `g7-2-c3` (médiane) et `g7-2-c4` (aucun abandon) pèsent 2/6 à eux deux, soit exactement une bande, et se gagnent **sans merger un seul chantier**. Rejoué sur le vrai moteur : sept tours à une unité posée en rotation (7 unités sur 21) donnent 0 mergé, 0 perdu, médiane 4 → `score 0.333`, bande **« 1 chantier »** ; un seul merge sans perte donne `score 0.667`, bande **« 2 chantiers »**. La source (`brainstorm.md:58`) et la story disent « zéro, un, ou trois — les crans de la grille », et l'épic pose « ce qui est mesuré est ce qu'il a réussi à livrer, jamais ce qu'il a tenté » | Rendre le cran fonction des merges : soit conditionner `c3`/`c4` à `merged-at-least 1` (règle composite ou seuil de merge dans la règle de continuité), soit ramener `c3`+`c4` sous une bande (poids 0.5 chacun) et redistribuer sur `merged-at-least`. Puis étendre le tableau de `phase-4.md` avec les deux parties manquantes — 0 merge / 0 perte et 1 merge / 0 perte — qui sont les cases jamais couvertes |
| 🟡 | code | 1 | `src/games/three-tracks/schema/answer.schema.ts:108-116` | Le plafond par chantier se vérifie allocation par allocation, jamais par somme sur un `trackId`. Deux entrées `{migration, 2}` et `{migration, 1}` dans le même tour passent `parseThreeTracksTrace` et `run-simulation.helper.ts:47-53` les additionne : 3 unités posées là où `maxPerTrack` vaut 2. Vérifié contre la vraie config du parcours | Agréger l'attention par `trackId` avant de comparer à `maxPerTrack`, ou refuser deux allocations du même `trackId` dans un tour avec une erreur nommée |
| 🟡 | code | 3 | `src/games/three-tracks/components/composites/track-register.tsx:28` | `aria-hidden="true"` posé sur le `<td>` lui-même retire la cellule de l'arbre d'accessibilité. Sur une ligne mergée ou perdue en desktop, jusqu'à sept cellules disparaissent : la ligne n'expose plus le même nombre de cellules que la ligne d'en-tête, et l'association `th scope="col"` de la cellule « Avancement » qui suit devient fausse | Garder le `<td>` dans l'arbre et masquer seulement son contenu : `<td className="p-2"><span aria-hidden="true" className="block h-px bg-plane-rule" /></td>` |
| 🟡 | code | 3 | `src/games/three-tracks/components/composites/track-register.tsx:176-178` | Le `brief` (une phrase entière) vit dans le `<th scope="row">`. Le nom accessible de la ligne devient « La migration de la base DÉRIVE Le schéma passe en deux temps, sans coupure de service. », réannoncé à chaque cellule parcourue — sept tours × quatre chantiers, exactement le bavardage que la fiche interdit (`.impeccable/surfaces/…:99`). Conséquence non anticipée du correctif QA n° 1 (brief non affiché) | Sortir le brief du nom accessible de la tête de ligne : le placer dans une cellule propre, ou l'exposer via un `<span>` référencé et un `aria-label` court sur le `th` |
| 🟡 | rot | 4 | `aidd_docs/tasks/2026_08/2026_08_29_jeu-three-tracks/plan.md:32` | « Deux paliers de poids 2 posent le score exactement sur les bandes 0, 0.33 et 1 de `parallele` » est faux : les deux `merged-at-least` seuls donnent 0, 2/6 = 0.333 et 4/6 = 0.667, jamais 1.000. Le 1.000 n'existe que grâce à `c3`+`c4`. C'est la décision écrite qui a masqué F1 | Réécrire la décision avec l'arithmétique réelle une fois le barème corrigé |
| 🟡 | fit | 2 | `config/course.json:1206-1219` · `three-tracks.evaluator.ts:57-63` | `median-live-tracks-at-least 3` n'apporte presque aucune discrimination sous cette config : sans perte, `liveTracksPerTurn` vaut 4 à chaque tour, donc `c4` implique `c3` ; avec une seule perte (impossible avant le tour 4, `diesAfter` 4) la médiane vaut encore 3. `c3` ne tombe qu'à partir de deux chantiers morts, cas où `c2` et `c4` sont déjà manqués. Deux critères pour un seul signal, et c'est ce doublon qui finance F1 | Soit relever le seuil de médiane à 4, soit fusionner les deux critères de continuité en un seul, soit allonger la fenêtre de mort pour que la médiane morde plus tôt |
| 🟡 | rot | 3 | `.impeccable/surfaces/tracks-components-composites-three-tracks-game-tsx.md:63` | La fiche dit chantier perdu = « creusé, **sans filet** » (formule déjà contradictoire en elle-même) ; `track-register.tsx:47` lui donne `border-b-2 [border-style:groove]` — c'est le correctif QA n° 4, et il est juste. La fiche, ajoutée dans ce même commit, n'a pas été mise à jour et fait foi sur le visuel | Corriger la ligne de la fiche en « creusé, filet conservé » : deux lignes perdues consécutives doivent rester séparées |
| 🟡 | conform | 3 | `src/games/three-tracks/components/elements/attention-cell.tsx:66` | La fiche (`…:77`) et `phase-3.md` tâche 3.3 exigent que la pastille indisponible soit « évidée, **sans anneau** » ; le code lui laisse un anneau plus pâle (`border-plane-rule`), et le commentaire du fichier (l. 14-15) reformule la règle en « un filet plus pâle » au lieu de signaler l'écart. Le choix du code est probablement meilleur — sans anneau, la pastille disparaît — mais il n'est consigné nulle part | Trancher explicitement : amender la fiche, ou revenir à la règle écrite |
| 🟡 | conform | 3 | `src/games/three-tracks/components/composites/track-register.tsx:118` | `text-[0.5625rem]` (9 px) et `tracking-normal` sur un libellé d'en-tête, là où `DESIGN.md:45` fixe les libellés d'état à `text-xs` avec interlettrage `0.12em` à `0.18em`. C'est le plus petit texte du dépôt (le suivant est à 11 px) et le commentaire argumente la dérogation au lieu de la faire remonter | Raccourcir le libellé (`+1`, `…`) pour tenir en `text-xs`, ou amender la fiche et `DESIGN.md` |
| 🟢 | rot | 4 | `__tests__/integration/course-run/three-tracks-run.test.ts:158` · `phase-4.md:149` | La fixture `OUVRE_QUATRE_EN_LACHE_TROIS` n'en lâche que **deux** (`Perdus 2` dans le tableau lui-même). Le nom promet le cas exact de la story, le test prouve un cas voisin. Le vrai cas « trois abandonnés » n'existe qu'en test unitaire | Renommer en `OUVRE_QUATRE_EN_LACHE_DEUX`, et ajouter la partie à trois abandons au tableau et au test d'intégration |
| 🟢 | code | 1 | `src/games/three-tracks/schema/answer.schema.ts:100-121` | Une trace **plus longue** que `config.turns` n'est pas refusée : la boucle ne vérifie que les `turns` premiers tours, et c'est `applyAllocations` qui finit par lever `GameAlreadyOverError` — une erreur de simulation là où les trois autres cas ont une erreur de trace nommée | Refuser `trace.turns.length !== config.turns` avec une erreur nommée, au même endroit que les autres |
| 🟢 | code | 1 | `config.schema.ts:19,24,25` · `answer.schema.ts:17` | `work`, `attentionPerTurn`, `maxPerTrack` et `attention` acceptent des décimaux alors que tout le jeu se compte en unités entières. `work-notches.tsx:16-17` compense par `Math.ceil`/`Math.floor`, ce qui est le symptôme | Passer ces quatre champs en `z.number().int()` |
| 🟢 | rot | 3 | `track-register.tsx:33` et `:185` | Deux façons d'écrire une cellule vide : le composant `EmptyCell` pour les tours à venir, un `<td>` inline pour la colonne mobile repliée | Employer `EmptyCell` aux deux endroits |
| 🟢 | conform | - | `aidd_docs/backlog/stories/mener-plusieurs-chantiers-de-front.md:3` | La story reste `status: proposed` alors que les quatre phases sont `implemented`. La story équivalente de `checkpoints` (`reprendre-la-main-aux-bons-moments.md`) est `done` | Aligner le statut sur le précédent du dépôt une fois F1 traité |

## Verification

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Verified      | 96% (49/51) |
| Files checked | `src/games/three-tracks/**` (11 fichiers), `src/games/register-games.ts`, `src/games/register-components.ts`, `config/course.json`, `config/grid.json`, `__tests__/unit/games/three-tracks/**` (7 fichiers), `__tests__/integration/course-run/three-tracks-run.test.ts`, `__tests__/integration/course-run/checkpoints-run.test.ts`, `.impeccable/surfaces/tracks-components-composites-three-tracks-game-tsx.md`, `plan.md`, `phase-1.md` à `phase-4.md`, `qa/README.md` + 6 captures |
| Unchecked     | Story « Le cran retenu vient du nombre de chantiers menés jusqu'au merge : zéro, un, ou trois » — fix ; Phase 1 « Une allocation qui dépasse … le plafond d'un chantier, est refusée » — fix |
| Unplanned     | none (les 37 fichiers du diff sont tous prévus par les quatre projections d'architecture ; `qa/` et la fiche de surface sont des livrables annoncés par `phase-3.md` tâche 0 et par la passe QA navigateur) |
