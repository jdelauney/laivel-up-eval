# Review: Le jeu `hint-budget` — 4e tour

- **Verdict**: blocked
- **Diff**: `main...HEAD` (`b7e73ab`..`fcba488`, 18 commits)
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_30
- **Findings**: 1 critical, 5 warning, 5 minor

## Phases

### Phase 1 — Les contrats et la lecture pure des situations

- [x] Une situation dont toutes les lectures de cadrage sont établies est refusée au chargement, en nommant la situation — `src/games/hint-budget/schema/config.schema.ts:258-264`
- [x] Une situation à zéro ou deux causes `actual` est refusée, en nommant la situation — `config.schema.ts:226-244`
- [x] Une configuration dont la surtaxe d'aveugle n'excède pas l'indice le plus cher est refusée, en nommant les deux montants — `config.schema.ts:442-448`
- [x] Une trace qui omet une situation, tranche une cause inconnue, ou dont `afterHints` dépasse les achats, lève l'erreur nommée qui porte l'identifiant fautif — `answer.schema.ts:87-173,193-227`
- [x] Une trace qui achète deux fois le même indice dans une situation est refusée par le schéma — `answer.schema.ts:56-59`
- [x] Un cadrage exact rend `framingGrounded: true` ; en retirer une établie ou ajouter une supposée le rend `false` — `read-situations.helper.ts:83-91`
- [ ] Un cadrage exact posé après un achat rend `framingGrounded: true` et `framedFirst: false`, **donc `framedAndGrounded: false`** — le champ `framedAndGrounded` n'existe plus depuis la scission `c2`/`c3` ; les deux premiers tiers tiennent (`read-situations.helper.ts:78-91`), le troisième cite un champ supprimé. Critère périmé, déjà signalé au tour 3, non repris (voir F6)
- [x] Une tranche fausse sans indice coûte strictement plus qu'une tranche fausse après l'indice le plus cher — `config.schema.ts:442-448` + `hint-budget-run.test.ts:549`
- [x] `typecheck` et `test` passent ; `npm run lint` échoue au niveau dépôt via un worktree tiers de `.claude/worktrees/`, condition préexistante hors de cette branche — `npx biome check src __tests__ config` : « Checked 201 files in 65ms. No fixes applied. »

### Phase 2 — L'évaluateur et ses deux règles

- [x] Une trace qui achète exactement la moitié des indices ne compte pas comme frugale (inégalité stricte) — `hint-budget.evaluator.ts:56-59`
- [x] Une trace sans achat et sans bonne cause ne satisfait pas la frugalité (`solved &&`) — `hint-budget.evaluator.ts:56-59`
- [x] Un cadrage exact posé après un achat ne compte pas pour l'ordre — `read-situations.helper.ts:78-81`
- [x] Un `rule.type` inconnu lève une erreur nommée citant le type et le jeu — `hint-budget.evaluator.ts:35-40,131`
- [x] `typecheck` / `test` passent — 664 tests, 73 fichiers

### Phase 3 — Le jeu à l'écran : cadrer, acheter, trancher

- [x] Deux parties aux mêmes gestes dans des ordres différents produisent une trace identique — `use-hint-budget.hook.ts:142-147` (la trace ne porte que `retainedIds`, `afterHints`, `boughtHintIds`, `cutCauseId`)
- [x] Une fois le cadre déposé, aucune lecture ne change d'état — `use-hint-budget.hook.ts:99-106`, test `hint-budget-game.test.tsx:107`
- [x] Acheter puis déposer le cadre est accepté, `afterHints` à 1 — `use-hint-budget.hook.ts:109-115`, test `use-hint-budget.test.ts:123`
- [x] Aucune manière d'acheter plus d'un indice par appel — `use-hint-budget.hook.ts:121-124`, `hint-card.tsx:42-49`
- [x] `advance()` deux fois à la dernière situation ne soumet qu'une trace — `use-hint-budget.hook.ts:161-165`
- [x] Le rendu avant révélation ne contient ni `verification`, ni le texte d'un indice non acheté, ni marque distinguant les deux natures de lecture — `use-hint-budget.hook.ts:168-196`, tests `hint-budget-game.test.tsx:130,277`
- [x] `typecheck` / `test` passent

### Phase 4 — Le jeu dans le parcours, et son corpus

- [x] Ajouter le jeu n'a demandé que les deux blocs de câblage — `register-games.ts`, `register-components.ts`, aucun troisième fichier touché
- [x] Le parcours réel se charge sans refus, `g2-1` passe `hintBudgetConfigSchema` — `hint-budget-run.test.ts:202`
- [x] `checkpoints-run` et `three-tracks-run` traversent les sept groupes — fixture `__tests__/fixtures/hint-budget-answer.ts`
- [x] Le cadreur frugal satisfait les critères ; le demandeur pressé les manque — `hint-budget-run.test.ts:222,238`
- [x] Trancher la première cause déclarée résout au plus une situation — `hint-budget-run.test.ts:315`
- [ ] Retenir toutes les lectures ne satisfait le critère de cadrage dans **aucune** situation — faux depuis la scission : ce profil tient `c2` et manque `c3` (`hint-budget-run.test.ts:278`). Corrigé en prose dans « Amendements », jamais dans la table de critères (voir F7)
- [ ] **Le corpus ne laisse aucune politique aveugle tenir un critère** (règle 9 de la phase, `phase-4.md:74-87`) — non tenu : le complément des cibles d'indices nomme la cause réelle dans les trois situations, sans lecture ni achat (voir **F1**)
- [x] `typecheck` / `test` passent

### Phase 5 — La passe impeccable de la surface

- [x] La fiche de surface existe et nomme la stratégie retenue — `.impeccable/surfaces/…hint-budget-game-tsx.md`
- [x] L'écart de coût de geste au gabarit mobile est mesuré, nommé et assumé par écrit — `qa/README.md` Points 1, 2, 4 ; `phase-5.md:147`
- [x] Une lecture établie et une supposition sont rendues avec la même structure et le même ton — `framing-line.tsx` ne reçoit jamais `established` ; test `hint-budget-game.test.tsx:277`
- [ ] **Après cinq achats, trancher reste atteignable sans défilement aux deux gabarits** — mesuré non tenu, et dès l'ouverture : desktop 1126,75px pour 900px de viewport, mobile 1610px pour 844px (`qa/README.md` Point 3). Reporté au défaut `aidd_docs/backlog/defects/l-ouverture-de-hint-budget-pousse-le-tranchage-hors-de-l-ecran.md`, assumé par écrit, non corrigé ici
- [x] Un test échoue si la présentation d'une lecture dépend de sa nature — `hint-budget-game.test.tsx:277`
- [x] Un test échoue si la révélation qualifie le cadrage — `hint-budget-game.test.tsx:336`
- [x] La tournée aux deux gabarits est déposée dans `qa/`, mesurée à `scrollY = 0` vérifié — 16 PNG, dimensions relues à l'octet, toutes conformes à la table du `README.md`
- [x] `typecheck` / `test` passent

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🔴 | fit | 4 | `config/course.json:462-490,600,703` (les 15 `label`) vs `505`, `629`, `718` (les 3 causes réelles) · `src/games/hint-budget/schema/config.schema.ts:310-324,334-356,376-384,416-439` | **F1 — La cause réelle est le complément des cibles d'indices, et les `label` publient ce complément.** Théorème forcé par le schéma lui-même : `eliminates` de cardinalité 1 (`:48`), la cause `actual` jamais éliminée (`:310-324`), deux indices n'éliminent jamais la même cause **en lice** (`:334-356`), au moins 3 causes en lice après le rapport (`:376-384`), et un chemin frugal doit ramener le champ à **exactement 1** (`:416-439`). Ces cinq refus impliquent que toute cause en lice sauf une est visée par exactement un indice — l'unique non visée **est** la cause réelle. Vérifié sur le corpus : cibles distinctes = 4 sur 5 dans les trois situations, causes jamais visées = `s1-c-clock`, `s2-c-rounding`, `s3-c-parallel`, toutes `actual: true`. Or `phase-4.md:87` pose comme intention que « le `label` de chaque indice permet de savoir de quelle piste il parle avant de payer », et `hint-budget-game.tsx:190-199` rend les 5 `label` dès l'ouverture, à côté des 5 causes (`desktop-1-s1-ouverture.png`). Appariement lexical `label`→cause vérifié : **15/15 corrects** par simple recouvrement de radicaux, sans sémantique. **Scénario** : ouvrir `s1`, ne rien lire du rapport, ne rien cadrer, n'acheter aucun indice ; barrer les causes dont un intitulé reprend le sujet (en-tête, certificat TLS ×2, clé secrète, cache CDN) ; il reste « L'horloge du serveur de production avait pris du retard » ; trancher. Idem `s2` (« Chaque ligne arrondit son montant ») et `s3` (« Les tests s'exécutent en parallèle »). Résultat `c1` **3/3 à coût 0**, poids 2 sur 4. Strictement pire que les 25,9 % consignés en `phase-4.md:140`, et déterministe : relever le seuil de `c1` à 3/3 n'y change rien. Ce n'est pas une faiblesse de cette instance de corpus : tant que « résoudre » se définit par élimination exhaustive achetée, la réponse est le complément de ce que les intitulés annoncent | Casser le théorème, pas le corpus : abandonner l'exigence « le chemin frugal ramène le champ à **exactement 1** » au profit de « à 2, la dernière élimination venant du rapport ou du cadrage ». Deux causes en lice restent alors non visées, le balayage des intitulés ne rend qu'un pile ou face, et le geste décisif redevient la lecture. À défaut : découpler `label` de sa cible (mais l'achat devient une loterie, ce qui vide `c1` de son arbitrage) |
| 🟡 | rot | 4 | `aidd_docs/tasks/2026_08/2026_08_30_jeu-hint-budget/phase-4.md:73` | **F2 — Citation fabriquée.** La phrase cite `hint-budget-run.test.ts`, « never lets the actual cause land on the same length rank ». Cette chaîne n'existe nulle part sous `__tests__/`. Le test réel s'appelle `never lets a "cut the k-th longest cause" policy solve more than one of the three situations, for every k` (`hint-budget-run.test.ts:381`). Même classe de défaut que les tours 2 et 3 ont sanctionnée, réintroduite | Reprendre le titre exact du test, ou retirer les guillemets et décrire le garde-fou sans le citer |
| 🟡 | rot | 1 | `__tests__/unit/games/hint-budget/config.schema.test.ts:294-318` | **F3 — Le commentaire annonce une preuve que le test ne fait pas.** Le doc-comment dit « La preuve directe qu'aucun indice ne peut, à lui seul, trancher une situation ». Le test dessous (`rejects a hint that eliminates more than one cause`) pose `eliminates: ['s1-c1','s1-c3']` et n'assert que `issue.path === [...,'eliminates']` sur `issues[0]`. Vérifié : avec Zod 4.5.2 les issues de base précèdent celles du `superRefine`, donc `issues[0]` est le « Too big: expected array to have exactly 1 items ». Les deux refus partagent le même `path` : l'assertion ne peut pas les distinguer, et le test passerait à l'identique si le refus du `superRefine` était supprimé | Assert sur `issue.message`, pas seulement `issue.path`, et corriger le commentaire : ce test prouve la cardinalité, rien d'autre |
| 🟡 | rot | 1 | `src/games/hint-budget/schema/config.schema.ts:386-409` | **F4 — Refus sans pouvoir discriminant (réponse à la question D).** Preuve : si `eliminates` est de taille 1 et que `remainingAfterReport >= 3` (refus de `:376-384`), alors `remainingAfterHint >= 2` toujours. Le refus ne rejette donc jamais une configuration que les deux autres acceptent — il n'est pas seulement « inatteignable en pratique » comme le dit `phase-1.md:162`, il est sans effet de porte. Vérifié aussi qu'il n'est atteignable qu'en compagnie d'un refus déjà déclenché (le `superRefine` de Zod 4.5.2 s'exécute même après échec du `.length(1)`). Aucun test ne l'atteint seul — F3 montre que le seul qui le prétend ne le touche pas. Le tour 3 a reproché exactement ce motif (W5) | Le garder est défendable comme filet si `.length(1)` se relâche un jour, mais alors il faut le dire ainsi et non « le refus qui ferme la délégation totale » (`:386-389`, `phase-1.md:153`) — cette porte-là est fermée par la cardinalité, pas par lui. Reformuler le commentaire, ou supprimer les 24 lignes |
| 🟡 | code | 4 | `__tests__/integration/course-run/hint-budget-run.test.ts:499-533` | **F5 — Le garde-fou de recouvrement mesure la mauvaise surface.** `longestCommonSubstring(hint.text, actualText)` ne lit que `hint.text`. Or `hint.text` n'est révélé qu'après achat, tandis que `hint.label` est lisible dès l'ouverture — c'est le champ gratuit, donc le seul par lequel une fuite est offerte sans contrepartie. Le garde-fou couvre le canal payant et laisse le canal gratuit sans aucune contrainte, ni de recouvrement ni de complémentarité (F1) | Étendre la mesure à `hint.label`, et surtout ajouter le garde-fou que F1 réclame : « les causes qu'aucun `label` ne désigne sont au moins deux, dans chaque situation » |
| 🟡 | functional | 5 | `src/games/hint-budget/components/composites/hint-budget-game.tsx:126-150` | **F6 — Critère d'acceptation de phase 5 non tenu** : « Après cinq achats, l'action de trancher reste atteignable sans défilement aux deux gabarits ». Mesuré non tenu dès l'ouverture (desktop 1184px, mobile 1728px, pour 900/844px de viewport). Honnêtement mesuré et reporté au défaut de backlog, jamais dissimulé — mais le critère reste ouvert | Fermer le défaut, ou retirer le critère de la phase et le porter uniquement dans le défaut, pour que la phase ne se déclare pas `done` avec un critère qu'elle sait faux |
| 🟢 | rot | 1 | `phase-1.md:104,110,115,135` | **F7 — Champ supprimé toujours décrit comme livré.** `framedAndGrounded` n'existe plus depuis la scission `c2`/`c3`. `phase-2.md:7` porte une clause « cette page garde son contenu d'origine pour l'historique » ; `phase-1.md` ne l'a pas. Signalé au tour 3 (🟢, rot), non repris sur cette branche | Ajouter la même clause d'historique à `phase-1.md`, ou reprendre les quatre lignes |
| 🟢 | rot | 4 | `phase-4.md:184-187` | **F8 — Table de critères périmée.** « satisfait les deux critères » / « manque les deux » / « ne satisfait le critère de cadrage dans aucune » : le jeu porte trois critères depuis la scission, et le dernier énoncé est explicitement démenti par la section « Amendements » quinze lignes plus bas. La table et sa correction se contredisent dans le même fichier | Mettre la table au courant, la correction en prose devient inutile |
| 🟢 | rot | 5 | `qa/README.md:107-111` | **F9 — Affirmation « Vérifié » sans artefact cité.** Le relevé `s2` (« INDICES 0 · TRANCHE FAUSSE +40 · AVEUGLE +30 · TOTAL 70 ») n'est adossé à aucune capture : `desktop-5`/`mobile-5` montrent l'ouverture de `s2`, pas sa révélation, et la section « Ce qui n'a pas été mesuré » ne mentionne pas ce manque. Le pendant `s1` cite bien `desktop-4`/`mobile-4` et se vérifie sur l'image | Capturer la révélation de `s2`, ou déclasser l'affirmation en lecture DOM non capturée dans la section prévue |
| 🟢 | rot | 5 | `phase-5.md:147` vs `phase-5.md:107` | **F10 — Auto-citation non conforme.** Le texte cité entre guillemets, « le produit compte vingt jeux, un motif introduit pour un seul se paie ailleurs », omet le « et » de la source (`:107` : « vingt jeux, **et** un motif… »). Même fichier, écart d'un mot | Reprendre la phrase mot pour mot |
| 🟢 | rot | 4 | `config/course.json:512` (`s1-c-header`), `730` (`s3-c-timezone`) | **F11 — Séquelles de l'équilibrage de longueur dans le français du corpus.** « Le client envoie un en-tête Authorization, mal formé. » porte une virgule agrammaticale ; « Le fuseau horaire de l'agent CI diffère **bien** du poste local. » emploie un adverbe d'assertion sur une cause fausse, seul cas dans les quinze énoncés. Les deux se lisent comme du rembourrage destiné à déplacer un rang de longueur, sur des textes que le joueur lit | Réécrire les deux énoncés proprement et revérifier les rangs, plutôt que de border les rangs par la ponctuation |

**Constats corrects, vérifiés et sans réserve** (aucune ligne de finding, consignés pour que le prochain tour ne les refasse pas) :

- **Question B — le contrat dit vrai.** Les 15 `hints[].text` ont été relus un par un contre leur `eliminates` : chacun n'écarte nommément que sa cause déclarée, aucun n'en écarte une seconde par implication, et aucun ne mentionne l'horloge, l'arrondi ni le parallélisme. La bonne foi du corpus est tenue sur ce point précis.
- **Question C — l'arbitrage de seuil est caduc, ne le remontez pas.** Les 25,9 % de `phase-4.md:140` supposent un joueur qui ignore les intitulés. F1 porte la même politique à 100 %. Passer `c1` à 3/3 n'y changerait rien et coûterait la marge d'erreur pour rien. À rouvrir seulement après F1.
- **Canaux des tours 1 à 3 — refermés.** Longueur des causes, paraphrase de l'indice le plus cher, élimination par conséquence, rang de longueur, confirmation par indice non borné : aucun ne se rouvre. F1 est un canal neuf, d'une autre nature (la classe, pas l'instance).
- **Question E — la tournée QA tient.** Les 16 dimensions PNG relues à l'octet correspondent exactement à la table du `README.md`. `desktop-4` confirme visuellement « INDICES 75 · TRANCHE FAUSSE +40 · TOTAL 115 », la marque « ÉCARTÉE — TRANCHÉE » distincte des trois « ÉCARTÉE », et « CAUSE RÉELLE » sur l'horloge. `desktop-1` confirme le marché en tête sur `s1`, `desktop-5` le cadrage en tête sur `s2`. La correction de l'erreur de mesure est réelle et non cosmétique : les hauteurs documentaires annoncées (1530 / 1473 / 2280 / 2162) sont celles des fichiers.
- **Citations documentaires — 46 des 48 conformes.** Balayage automatique des chaînes entre guillemets français des sept documents de la branche, chacune recherchée littéralement dans la source citée : `DESIGN.md:67,71,74,77`, `config/signature.json`, `config/course.json`, les deux titres de tests cités par `phase-4.md:193` et `qa/README.md:115`, `lie-detector-run.test.ts:398,417`, et la sortie biome « Checked 201 files… No fixes applied » sont toutes exactes. Seules F2 et F10 s'écartent.
- **Câblage minimal.** `register-games.ts` et `register-components.ts` seuls, comme la phase 4 l'exigeait. Aucun `console.`, aucun `TODO`, aucun bloc commenté dans `src/games/hint-budget/`.

## Verification

| Metric        | Value |
| ------------- | ----- |
| Verified      | 88 % (30/34) |
| Files checked | `config/course.json`, `src/games/hint-budget/schema/config.schema.ts`, `schema/answer.schema.ts`, `helpers/read-situations.helper.ts`, `hint-budget.evaluator.ts`, `hooks/use-hint-budget.hook.ts`, `components/composites/hint-budget-game.tsx`, `components/elements/hint-card.tsx`, `src/games/register-games.ts`, `src/games/register-components.ts`, `__tests__/integration/course-run/hint-budget-run.test.ts`, `__tests__/unit/games/hint-budget/config.schema.test.ts`, `aidd_docs/tasks/2026_08/2026_08_30_jeu-hint-budget/plan.md`, `phase-1.md`, `phase-2.md`, `phase-3.md`, `phase-4.md`, `phase-5.md`, `qa/README.md`, les 16 PNG de `qa/`, `DESIGN.md`, `aidd_docs/backlog/stories/acheter-des-indices-a-contrecoeur.md` |
| Unchecked     | Phase 4 « aucune politique aveugle ne tient un critère » — **fix** (F1, critique) · Phase 5 « trancher reste atteignable sans défilement » — **fix** (F6, reporté au défaut de backlog) · Phase 1 « donc `framedAndGrounded: false` » — **fixed** (champ supprimé à la scission, énoncé périmé, F7) · Phase 4 « ne satisfait le critère de cadrage dans aucune » — **fixed** (démenti par l'amendement du même fichier, F8) |
| Unplanned     | none |
