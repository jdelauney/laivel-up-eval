# Review: Le jeu `lie-detector`, désigner la menteuse puis tenir sa ligne

- **Verdict**: approve
- **Diff**: `main...3af90e2`
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_30
- **Findings**: 0 critical, 0 warning, 2 minor
- **Passe**: 5 (11 constats en passe 1, 4 en passe 2-3, 2 deal breakers au challenge — tous re-vérifiés résolus ; 2 nits restants, aucun bloquant)

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
| 🟢 | conform | 2 | `config/course.json` (`g1-3-c2`) et `src/games/lie-detector/lie-detector.evaluator.ts:64` | `no-capitulation` est la seule règle paramétrée du parcours dont le nom n'annonce pas son paramètre. Inventaire des 18 types de règles : 14 portent un paramètre, et 13 l'encodent dans leur nom — `*-at-least` (6 règles à seuil), `*-below` / `*-above`, `*-before` / `*-after` (étape), `*-including` (liste), `stake-within-band-on-undecidable` (bornes). `no-capitulation` porte désormais `minOpportunities: 2` sans que rien dans son nom ne le laisse deviner. L'argument de l'exécuteur tient — la règle ne tolère toujours aucune capitulation, seul le plancher d'admissibilité a bougé — mais un lecteur du `switch` de l'évaluateur ne peut pas savoir qu'elle lit un seuil, alors que ses treize sœurs le disent | Renommer sur la convention du dépôt (`held-chances-at-least`, ou `no-capitulation-over`), avec la migration d'un seul critère dans `course.json`. Ou consigner l'exception et sa raison, pour qu'elle ne se lise pas comme un oubli |
| 🟢 | fit | - | `aidd_docs/backlog/stories/demasquer-l-affirmation-qui-ment.md`, section « Pourquoi `g1-3-c1` se lit sur la première désignation » | La raison donnée au coût assumé ne couvre qu'une manche sur quatre. La story justifie ainsi : « Dans la manche à objection fondée, se corriger revient à suivre l'assistant qui vient de donner la réponse. » Vrai pour `r2`, la seule objection fondée du corpus. Sur `r1`, `r3` et `r4` l'objection est creuse : elle pointe une affirmation vraie, donc un joueur qui se corrige vers la menteuse va là où l'assistant n'a pas pointé — c'est une relecture indépendante, pas une obéissance. La décision reste bonne, c'est son motif qui généralise à partir du quart du corpus | Adosser le coût au motif qui tient sur les quatre manches : `c1` mesure la lecture **non assistée**, et le second temps est assisté par construction puisqu'un avis a été montré. Ce motif ne dépend pas de la nature de l'objection |

## Note de vérification — la nouvelle notation

Les deux affirmations du chef, reprises en force brute sur le corpus réel :

- **Un lecteur parfait garde `c1` quoi qu'il fasse au second geste** : vérifié sur les **256** seconds gestes possibles, `c1` tenu dans les 256. `unmasked` ne lit que `firstPickId` (`read-rounds.helper.ts:59`), donc le second geste est structurellement hors de `c1`.
- **Un joueur au hasard qui ne bouge jamais décroche `c2` dans 15,6 %** : vérifié, **40/256** = 15,625 %, contre 57,8 % au seuil précédent.

Invariant trouvé et vérifié, qui répond au risque d'effet de bord : **satisfaire `c1` implique au moins 2 occasions**, minimum observé exactement 2 sur toutes les parties satisfaisant `c1`. Zéro joueur satisfaisant `c1` et tenant toutes ses occasions n'échoue sur `c2`. Corollaire à consigner : `minOpportunities: 2` est la valeur maximale sûre — à 3, des lecteurs légitimes tomberaient faute de matière, pas faute de tenue.

Coût connu, mesuré et testé : le joueur qui lit mal puis se corrige seul vers la menteuse perd `c1` à partir de **deux** corrections (une seule reste sous le seuil). Couvert par un test nommé.

Dilution du bruit résiduel, revendiquée par la story et vérifiée : `verification` est alimentée par **5 situations**, poids total **24**, dont `g1-3` porte **4** (16,7 %). Le 15,6 % de chance résiduelle porte sur les 2 points de `c2`, soit 8,3 % de la dimension.

## Verification

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Verified      | 100% (36/36)                                      |
| Files checked | `src/games/lie-detector/**`, `src/features/group-navigation/components/sections/course-view.tsx` (confirmé intact), `config/course.json`, `__tests__/unit/games/lie-detector/**`, `__tests__/integration/course-run/**`, `__tests__/fixtures/lie-detector-answer.ts`, `.impeccable/surfaces/…lie-detector-game-tsx.md`, `aidd_docs/backlog/stories/demasquer-l-affirmation-qui-ment.md`, `aidd_docs/backlog/defects/la-revelation-pousse-l-action-hors-de-l-ecran.md`, `aidd_docs/tasks/2026_08/2026_08_30_jeu-lie-detector/{plan,phase-1..5}.md` + `qa/` (11 captures relues, README) |
| Unchecked     | none |
| Unplanned     | none. Le second correctif est projeté en phase 5 tâche 6 ; `course-view.tsx` n'est pas touché (`git diff` vide sur `src/features/group-navigation/`) |
