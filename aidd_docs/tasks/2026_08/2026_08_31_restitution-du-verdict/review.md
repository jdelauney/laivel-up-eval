---
type: review
target: "feat/comprendre-mon-verdict — 2496b26 · 48defa9"
spec: ./spec.md
verdict: approved
score: 88/100
passes:
  - { date: 2026-08-31, commit: 2496b26, verdict: changes-requested, score: 72 }
  - { date: 2026-08-31, commit: 48defa9, verdict: approved, score: 88 }
---

> **Deux passages.** Le premier, sur `2496b26`, est conservé intégralement ci-dessous —
> il porte les constats. Le second, sur `48defa9`, est en fin de document et **fait foi**
> pour le verdict global et le tableau d'acceptance.

# Review: La restitution du verdict

## Verdict global

**`changes-requested`.**

Le socle est solide et honnête : le repli menteur sur `❖ White` a disparu, le statut ternaire est porté par la donnée et pas par le code, les dix-sept actions vivent bien dans `config/grid.json`, et la chaîne de production du verdict est purement déterministe. Les trois preuves de validation annoncées sont exactes (vérifiées ci-dessous).

Ce qui bloque tient en trois points, tous sur le trajet de lecture le plus exposé :

1. **A3 n'est pas tenue.** L'axe qui plafonne est nommé, mais jamais avec la borne qu'il aurait fallu atteindre — la phase 1 la demandait explicitement, et le code porte encore le commentaire qui reporte le travail « à la phase suivante ». La phase suivante est passée.
2. **Le profil « creux du référentiel », que la spec anticipe nommément en D2, lit une phrase incohérente et un plan qui lui demande de régresser.** C'est un profil très atteignable au jour J.
3. **Un axe mesuré mais entièrement raté n'affiche aucun signal**, alors que `AxisProof.missed` est calculé pour ça et jeté. C'est exactement le lecteur le plus sur la défensive qui reçoit le moins d'explication.

S'y ajoute une absence de test sur trois surfaces livrées (`capping-axis.tsx`, `signature-block.tsx`, `condition-gap-text.helper.ts`), dont celle qui porte l'acceptance non tenue.

---

## Acceptances A1 → A12

| # | Statut | Preuve |
| --- | --- | --- |
| **A1** — libellé officiel du niveau atteint | **tenue** | `src/features/scoring-summary/components/composites/level-block.tsx:28-31` rend `level.level.label` en `h2`. Tests : `__tests__/unit/features/scoring-summary/level-block.test.tsx:71`, `__tests__/unit/features/scoring-summary/summary-view.test.tsx:72` (`heading level 2` = `🥈 Silver`). |
| **A2** — aucun niveau annonçable dit et expliqué, jamais « White » par défaut | **partielle** | Le repli est bien mort : `src/core/scoring/helpers/level-resolver.helper.ts:127-142` rend `level: undefined` sans `?? byOrder[0]`. Tests `__tests__/unit/core/scoring/level-resolver.test.ts:91` et `:103`, `level-block.test.tsx:80` (« never announces White by default »). **Mais** la raison rendue est incohérente sur une borne `max`, qui est l'une des deux causes que D2 nomme — voir DB-2. La phase 1 demandait en outre « chaque axe en cause, **sa borne exigée** » : la borne n'est jamais écrite. |
| **A3** — l'axe qui plafonne est nommé **avec la borne qu'il aurait fallu atteindre** | **non tenue** | `src/features/scoring-summary/components/composites/capping-axis.tsx:18-20` délègue à `describeConditionGap`, qui rend « … la condition demande un cran plus haut » — direction, jamais borne ni cran visé (`src/features/scoring-summary/helpers/condition-gap-text.helper.ts:24-28`). Aucun test ne couvre `CappingAxis` (`grep -rn "plafonne\|CappingAxis" __tests__/` → 0 résultat). Voir DB-1. |
| **A4** — cran, signal qui l'a fixé, valeur observée, seuil franchi et seuil manqué | **partielle** | Cran, valeur et deux seuils : `axis-proof-row.tsx:29-56`, adossés à `axis-proof.helper.ts:96-116` et testés en `__tests__/unit/core/scoring/axis-proof.test.ts:62,74,88`. **Le signal manque** dès que `held` est vide (`axis-proof-row.tsx:23,39`) — voir DB-3. |
| **A5** — l'axe inféré porte une marque distincte de l'axe mesuré | **tenue** | `src/features/scoring-summary/components/elements/measurement-mark.tsx:20-42` : trois mots distincts (`mesuré` / `inféré` / `non mesuré`) et trois formes distinctes (barre pleine `h-8`, barre hachurée `h-5`, contour tireté). Aucun état n'emprunte la forme d'un autre. Tests `axis-proof-row.test.tsx:87,93,100`. Le marquage des données est conforme au tableau de D1, vérifié par agrégation de `config/course.json` (voir « Ce que j'ai vérifié »). |
| **A6** — l'axe non mesuré le dit et n'affiche aucun chiffre bas | **tenue** | `axis-proof-row.tsx:30-32` remplace le cran par « aucun critère ne mesure cet axe », et `:45` supprime toute la ligne chiffrée. `weighted-mapping.strategy.ts:66` laisse `band: undefined` quand `possible === 0`. Tests `axis-proof-row.test.tsx:108` (« renders no figure at all »), `summary-view.test.tsx:133`. |
| **A7** — aucun pourcentage d'axe à l'écran | **tenue, avec réserve** | `dimension-row.tsx` est supprimé et n'est plus référencé nulle part (`grep -rn "DimensionRow\|dimension-row" src __tests__` → 0). `grep -rn "percent\|toFixed" src/` ne renvoie plus rien dans `scoring-summary`. Test `summary-view.test.tsx:148` : `container.textContent` ne matche pas `/%/`. Réserve : des décimales nues subsistent (`franchi 0.25`), voir SUG-1. |
| **A8** — deux blocs distincts, et l'écran écrit que la signature ne déplace aucun niveau | **tenue** | `sections/summary-view.tsx:19-30` : deux `div` frères, chacun avec son propre `rounded-2xl border`. `composites/signature-block.tsx:24-27` porte la phrase. Tests `summary-view.test.tsx:72` (les deux titres n'ont pas le même conteneur) et `:88`. |
| **A9** — sans fichier de signature, le niveau seul, sans mention d'une lecture absente | **tenue** | `summary-view.tsx:24` : le bloc n'est rendu que si `signature !== undefined`. Test `summary-view.test.tsx:106` : `container.textContent` ne matche pas `/signature/i`. Test `:115` confirme que le niveau annoncé est identique avec et sans signature. |
| **A10** — chaque axe bloquant porte une action et la preuve qui la validerait | **partielle** | `progression-step.tsx:23-33` rend l'action et la preuve verbatim ; `grid.test.ts:142` garde la grille réelle (toute bande `from > 0` porte les deux). **Mais** sur une condition à borne `max`, la bande cible résolue est la bande `from: 0`, qui n'a par construction ni action ni preuve : l'écran retombe sur « La grille ne porte pas d'action pour ce cran ». D4 l'autorise ; l'épique (« elle sait nommer l'action qui la ferait monter ») ne s'en satisfait pas. Voir DB-2. |
| **A11** — le texte des actions vient de `config/grid.json`, sans toucher au code | **tenue** | `progression-plan.helper.ts:89-90` : `action: target?.action`, `proof: target?.proof`, aucun littéral joueur dans le fichier. Test `__tests__/unit/core/scoring/progression-plan.test.ts:201` (« changes the rendered action when only the grid object changes, the code untouched ») et `:184` (aucun texte inventé sur une bande sans action). |
| **A12** — aucun réseau, aucun modèle, aucune horloge dans la chaîne | **tenue** | `grep -rn "Date\|Math.random\|fetch\|now()" src/core/scoring/` → aucun résultat. `game-session.facade.ts:257-268` : `getVerdict()` n'appelle jamais `this.clock`. Tests de déterminisme dans les trois helpers : `level-resolver.test.ts:118`, `axis-proof.test.ts:171`, `progression-plan.test.ts:282`. |

**Décompte** : 8 tenues, 3 partielles, 1 non tenue.

---

## Constats

### `deal-breaker`

#### DB-1 — L'axe qui plafonne ne nomme jamais la borne qu'il aurait fallu atteindre

**Fichiers** : `src/features/scoring-summary/helpers/condition-gap-text.helper.ts:9-12` et `:24-28`, consommé par `src/features/scoring-summary/components/composites/capping-axis.tsx:18-20`.

Le commentaire du helper l'écrit noir sur blanc :

```
 * La résolution du libellé exact de la borne visée (le futur « axis proof »)
 * n'est pas construite ici : elle appartient à la phase suivante.
```

La phase suivante — la 2, puis la 4 — a livré exactement l'objet manquant : `PlanStep.target = { label, from }`, résolu dans `progression-plan.helper.ts:53-70`. Il n'a jamais été rebranché sur le bloc du plafond. Le joueur lit donc :

> Harness monté autour du modèle — actuellement « prompts », la condition demande un cran plus haut

au lieu de « … la condition demande « context engineering » ». Phase 1 §4 exigeait pourtant : « `capping-axis.tsx` reçoit `capping` et nomme l'axe, **sa borne exigée et la valeur observée** ».

**Pourquoi ça compte** : A3 est l'acceptance de la story n°1 de l'épique, sur l'écran où le produit tient ou tombe, et elle porte le critère de jury n°2. « Un cran plus haut » ne dit ni où l'on est ni où il faut aller ; le joueur doit descendre dans une autre section pour recoller l'information. Le commentaire reste par ailleurs faux dans le code livré — item « pas de contradiction docs-vs-code » du checklist.

#### DB-2 — Le profil « creux du référentiel » lit une phrase impossible et un plan qui lui demande de régresser

**Fichiers** : `condition-gap-text.helper.ts:24-25`, `progression-plan.helper.ts:63-67`, données `config/grid.json` (niveau `white` : `{ "dimension": "taille", "max": 0 }`, `{ "dimension": "harness", "max": 0 }`).

Scénario reproductible, celui-là même que D2 anticipe (« le profil tombe dans un creux du référentiel ») : un joueur qui réussit `g5-1`/`g5-2` (`taille ≈ 0.5`) et rate entièrement `g7-2` (`parallele = 0`, mesuré) échoue à White (`taille > 0`) et à Red (`parallele < 0.33`) → non classé. `blocking` = les conditions `max: 0` de White.

Ce qu'il lit alors, trois fois :

- bloc niveau (`level-block.tsx:56`) : « Taille de la plus grosse feature livrée avec l'IA — actuellement « M — complexité moyenne », **la condition demande un cran plus bas** » ;
- bloc plafond (`capping-axis.tsx:20`) : **la même phrase, mot pour mot** — `resolveLevel` pose `unranked === blocking` et `capping === gaps[0]` (`level-resolver.helper.ts:133-138`), donc `LevelBlock` liste déjà l'élément que `CappingAxis` re-rend ;
- section « Ce qui vous ferait monter » : `resolveTargetBand` sur une borne `max: 0` renvoie la bande `from: 0`, soit « **aucune feature livrée avec l'IA** », sans `action` ni `proof` → « Taille … → aucune feature livrée avec l'IA » + « La grille ne porte pas d'action pour ce cran. »

Cas voisin, plus absurde encore : à `taille = 0.2`, `bandFor` rend la bande `from: 0`, donc la phrase devient « actuellement « aucune feature livrée avec l'IA », la condition demande un cran plus bas » — on demande au joueur de descendre sous le plancher de l'échelle.

**Pourquoi ça compte** : la *Success Evidence* de l'épique est « elle sait nommer l'action qui la ferait monter, et comment elle saura qu'elle l'a faite ». Ce profil-là reçoit l'inverse : une injonction à défaire son travail, une section de progression vide de sens, et la même phrase répétée deux fois à dix lignes d'écart (item « pas de duplication d'information » du checklist). C'est un état que la spec a explicitement prévu, pas un cas limite exotique.

Note connexe sur le même code : `describeConditionGap:24-25` choisit la direction sur `condition.min !== undefined`. Une condition portant les deux bornes, que `levelConditionSchema` autorise (`grid.schema.ts:52-64`), annoncerait « un cran plus haut » sur une violation de `max`. La grille actuelle n'en porte aucune, donc c'est latent — mais le contrat, lui, l'autorise.

#### DB-3 — Un axe mesuré entièrement raté n'affiche aucun signal, et `missed` est calculé pour rien

**Fichiers** : `src/features/scoring-summary/components/composites/axis-proof-row.tsx:23` (`const decisiveSignal = proof.held[0]`) et `:39-43`.

Quand un axe est mesuré mais qu'aucune contribution n'est tenue, `held` est vide : la ligne « fixé par « … » » disparaît entièrement. Le joueur voit le cran plancher (« rien », « aucun ») et « 0 sur 6 contributions », sans qu'aucune question ne lui soit nommée. `AxisProof.missed` — trié par poids décroissant, `criterionId` en départage (`axis-proof.helper.ts:83-86,127`) — contient exactement l'information qui manque, et n'est utilisé que pour `.length` (`axis-proof-row.tsx:24`).

**Pourquoi ça compte** : A4 demande « le signal qui l'a fixé » pour **chaque** axe. Un zéro est un cran fixé par quelque chose. C'est précisément le lecteur qui va contester — celui à qui l'épique promet « discuter le verdict sur des faits plutôt que le subir » — qui reçoit le moins de faits. Et c'est du calcul domaine livré puis jeté, item « pas de code mort » du checklist.

---

### `suggestion`

#### SUG-1 — Des décimales nues à côté d'une fraction d'une autre échelle

`axis-proof-row.tsx:46-55` rend, sur une seule ligne : `3 sur 8 contributions · franchi 0.25 · manqué 0.5 → context engineering`.

Aucun `%`, donc A7 tient. Mais `3/8` et `0.25` sont deux échelles que rien ne relie visuellement, et `0.25` n'a ni unité ni référent. `design.md:30` pose que le sens ne repose jamais sur la seule couleur et s'accompagne du libellé du cran ; ici le libellé du cran franchi n'est pas rendu alors que `AxisProof.crossed` pourrait être remplacé par le label de la bande atteinte, déjà connu. Ce serait cohérent avec le traitement du seuil manqué, qui, lui, porte son label.

#### SUG-2 — `PlanStep.observed` et `PlanStep.required` sont calculés et jamais rendus

`progression-plan.helper.ts:91-92` produit les deux champs ; aucun composant ne les lit (`grep -rn "\.observed\|\.required" src/` → 0 résultat, un seul usage en test). Le wireframe de `phase-4.md` les demandait explicitement : « (4) La valeur observée face à la borne exigée, dans les mots de la grille — *Lu à 2 chantiers, le cran demande 3 chantiers et plus.* », et le journey mermaid de la phase porte la même branche.

Deux issues cohérentes : soit rendre la ligne (elle réglerait aussi une partie de DB-1), soit retirer les deux champs. `requiredBound()` (`:38-46`), qui n'existe que pour alimenter `required`, disparaîtrait avec la seconde.

#### SUG-3 — Champs de signal transportés puis abandonnés

`AxisSignal` porte `gameId`, `weight` et `evidence` (`axis-proof.helper.ts:23-30`) ; seul `question` est rendu. Aucun de ces trois n'apparaît dans `src/features` ni `src/components`. Même remarque pour `LevelVerdict.satisfiedConditions` — qui, lui, préexistait au diff et reste non lu. Généralité spéculative, item « pas d'abstraction inutilisée ».

#### SUG-4 — Trois surfaces livrées sans test

`capping-axis.tsx`, `signature-block.tsx` et `condition-gap-text.helper.ts` n'ont aucun fichier de test dédié, et aucune assertion indirecte : `grep -rn "plafonne\|CappingAxis\|describeConditionGap" __tests__/` ne renvoie que des occurrences de `level-resolver` côté domaine. C'est la seule zone du diff où le filet est absent — et c'est celle qui porte l'acceptance non tenue (DB-1). `testing.md` demande une couverture par surface rendue.

#### SUG-5 — Le libellé « aucun niveau » est dupliqué en littéral

`signature-block.tsx:6` (`const NO_LEVEL_LABEL = 'Aucun niveau ne peut être annoncé'`) reproduit mot pour mot le texte de `level-block.tsx:50`. Deux sources pour une même phrase produit ; item DRY du checklist.

Question de fond sous-jacente : `config/signature.json` peut légitimement rendre un verdict non classé (`vibe-coder` exige `verification ≤ 0.4`, `aidd-en-route` exige `verification ≥ 0.4` **et** `pilotage-contexte ≥ 0.35` — un profil à `0.5 / 0.2` ne tient ni l'un ni l'autre). Le bloc signature affiche alors « Aucun niveau ne peut être annoncé » **sans aucune raison**, à côté du bloc officiel qui, lui, en donne une. Une lecture dont le rôle est de distinguer deux profils classés pareil ne devrait pas pouvoir se taire ainsi.

#### SUG-6 — Deux styles d'import cohabitent dans le même dossier

`level-resolver.helper.ts:1-2` importe en `@/core/...`, `axis-proof.helper.ts:1-3` et `progression-plan.helper.ts:1-6` en relatif `../../...`. Trois fichiers voisins, deux conventions. Biome ne tranche pas ; le lecteur, si.

#### SUG-7 — `ReachedLevel` masque son invariant

`level-block.tsx:29-31` : `{level.level?.label}` alors que le branchement appelant (`:23-26`) garantit `level.level !== undefined`. L'optional chaining transforme un invariant en silence potentiel — une régression de branchement rendrait un titre `h2` vide au lieu de casser. Un type de props plus étroit (`{ level: Level; hint; nextLevel }`) le supprimerait.

---

### `correct`

- **Le repli menteur est mort, et bien mort.** `level-resolver.helper.ts:120-142` : plus de `?? byOrder[0]`, `level: Level | undefined` assumé jusque dans le type. C'est le point le plus important du diff et il est net.
- **Le statut de mesure est porté par la donnée, pas par le code.** `evidence` sur le mapping (`course.schema.ts:9-20`), résolu en `weighted-mapping.strategy.ts:20-33` sans jamais consulter `satisfied` — la distinction « comment la valeur a été obtenue » vs « ce qu'elle vaut » est tenue. L'agrégation réelle de `config/course.json` correspond au tableau de D1, ligne pour ligne.
- **Extensions de schéma réellement additives.** `evidence` a un `.default('measured')`, `action`/`proof` sont `.optional()`. Une grille tierce charge toujours ; les tests de rejet de `grid.test.ts:84-138` restent verts.
- **Tri des conditions bloquantes déterministe.** `level-resolver.helper.ts:96-113` : comparateur total (`unmeasured` d'abord, puis écart décroissant, puis ordre de la grille), départage explicite à écart flottant égal par `rank`. Aucune dépendance à la stabilité du `sort`. Testé en `level-resolver.test.ts:163,174,187`. Même rigueur sur `sortByWeightThenId` (`axis-proof.helper.ts:83-86`), départagé par `criterionId`.
- **`src/core/` reste du domaine pur.** `grep -rn "from 'react'\|@/features\|@/components\|@/store\|@/games\|@/infrastructure\|@/providers" src/core/` → aucun résultat.
- **Aucun barrel export.** `find src -name "index.ts" -o -name "index.tsx"` → aucun résultat.
- **Smart/Dumb tenu.** `summary-view.tsx` (section) est le seul à appeler `facade.getVerdict()` ; les cinq composites et l'élément livrés ne reçoivent que des props et ne portent aucun appel de façade, de store ou de hook métier.
- **Le prefix d'échelle est garanti par le schéma.** `resolveThresholds` (`axis-proof.helper.ts:105-108`) fait l'hypothèse que les bandes franchies forment un préfixe de `scale` ; `dimensionScaleSchema` (`grid.schema.ts:31-46`) l'impose (départ à 0, strictement croissante). L'hypothèse est adossée au contrat, pas à la donnée.
- **Le garde-fou sur la grille réelle est le bon réflexe.** `grid.test.ts:142-159` casse la construction si une bande `from > 0` perd son action ou sa preuve. C'est ce qui protège le jour J d'une édition JSON hâtive.
- **Les dix-sept actions et preuves tiennent la contrainte de rédaction de D4.** Chacune nomme un geste à l'infinitif et un artefact repérable — « Poser une boucle de relance qui rejoue l'IA tant qu'une commande du projet échoue » / « Un script versionné dans le dépôt, et une exécution où il relance au moins deux fois avant le vert ». Aucune intention déguisée du type « améliorer son harness ». Les deux plus faibles sont `intervention@0.5` (« Des PR où seule une partie des fichiers modifiés porte une relecture manuelle après coup » — difficilement traçable dans un dépôt) et `harness@0.5` (« … et la tenir à jour », habitude plutôt que geste ponctuel) ; les deux restent adossées à un fichier ou une PR qu'on peut aller regarder. Elles passent.
- **La dette du référentiel est consignée là où elle se lit.** `aidd_docs/memory/architecture.md:50` note que `taille`, `harness` et `initiative` montent sur des bancs de jugement, et que la dette se solde en construisant les trois jeux manquants, pas en changeant la règle. La tension de D1 n'est pas enterrée.

---

## Ce que j'ai vérifié moi-même

| Vérification | Commande | Résultat |
| --- | --- | --- |
| Périmètre du diff | `git diff main...HEAD --stat` | 54 fichiers, +3081 / −296, un seul commit `2496b26` |
| Typage | `npm run typecheck` | propre, aucune sortie **confirmé** |
| Tests | `npm run test` | `Test Files 90 passed (90)` · `Tests 821 passed (821)` **confirmé** |
| Lint / format | `npx biome check src __tests__ config` | `Checked 242 files in 74ms. No fixes applied.` **confirmé** |
| Pureté du domaine | `grep -rn "from 'react'\|@/features\|@/components\|@/store\|@/games\|@/infrastructure\|@/providers" src/core/` | aucun résultat |
| Déterminisme | `grep -rn "Date\|Math.random\|fetch\|now()" src/core/scoring/` | aucun résultat |
| Absence de barrel | `find src -name "index.ts" -o -name "index.tsx"` | aucun résultat |
| Absence de pourcentage | `grep -rn "percent\|toFixed\|Math.round" src/` | plus rien dans `scoring-summary` ; restes légitimes dans `practice-map` (messages de schéma) et `onboarding` (arrondi de durée) |
| Suppression effective de `dimension-row` | `ls .../composites/` + `grep -rn "DimensionRow\|dimension-row" src __tests__` | fichier absent, zéro référence |
| Conformité du marquage `evidence` au tableau D1 | agrégation node sur `config/course.json` | `taille` inféré (0 mes. / 6 inf.), `harness` inféré (0/14), `initiative` inféré (0/2), `resilience` inféré (0/6), `intervention` mesuré (3/4, via `g7-1`), `parallele` mesuré (4/0, via `g7-2`), `verification` mesuré (10/4), `pilotage-contexte` mesuré (6/2) — **conforme ligne pour ligne** |
| Bande rendue sur une borne `max: 0` violée | résolution manuelle de `bandFor` sur `config/grid.json` à `taille = 0.2` | rend `aucune feature livrée avec l'IA` → confirme l'incohérence DB-2 |
| Couverture des surfaces livrées | `ls __tests__/unit/features/scoring-summary/` + `grep -rn "plafonne\|CappingAxis\|describeConditionGap" __tests__/` | 4 fichiers de test ; `capping-axis`, `signature-block` et `condition-gap-text` non couverts |
| Champs calculés non rendus | `grep -rn "\.observed\|\.required\|satisfiedConditions" src/` | zéro usage en couche de rendu |

## Score

**72 / 100.**

Le calcul, à défaut de pondération fournie par la spec : 8 acceptances tenues, 3 partielles, 1 non tenue → 9,5 / 12 ≈ 79. Retrait pour la sévérité de DB-2 (état anticipé par la spec, rendu incohérent sur l'écran décisif, avec duplication de la phrase) et pour l'absence totale de test sur la surface qui porte l'acceptance non tenue.

Aucune violation dure — pas d'atteinte à la pureté du domaine, pas de rupture Smart/Dumb, pas de non-déterminisme, pas d'appel modèle — donc pas de mise à zéro.

Le seuil de passage appartient à l'appelant.

---
---

# Second passage — 2026-08-31, commit `48defa9`

> `fix(verdict): aim the plan upward and name every threshold in the grid's words`
> Diff jugé : `git diff HEAD~1 HEAD` — 19 fichiers, +805 / −128.
> Les fichiers `src/games/practice-map/**` modifiés dans le worktree sont hors de ces
> deux commits et n'ont pas été jugés.

## Verdict global révisé

**`approved` — 88 / 100.**

Les trois deal-breakers sont clos, chacun avec un test qui échouerait si on revenait en
arrière. Les douze acceptances tiennent. Le correctif de fond — `resolveClimbTarget` —
est la bonne réponse conceptuelle et pas un contournement d'affichage : il déplace la
cible du plan au lieu de maquiller la phrase.

Ce qui reste est du latent et de l'hygiène, pas du produit cassé sur le chemin
atteignable. Un point mérite quand même d'être lu avant de shipper : **le test de
non-régression de DB-2 est une tautologie** et ne protège rien (SUG-8).

---

## (a) Les trois deal-breakers sont-ils clos ?

### DB-1 — l'axe qui plafonne sans sa borne → **clos**

| Preuve | Où |
| --- | --- |
| `CappingAxis` consomme un `PlanStep`, plus un `ConditionGap` | `capping-axis.tsx:4,21` — `describePlanStep(capping)` |
| Le texte nomme le cran actuel **et** le cran visé, en libellés de grille | `condition-gap-text.helper.ts:22` — `« ${currentBand} », la condition demande « ${step.target.label} »` |
| `SummaryView` alimente `CappingAxis` avec `plan[0]`, donc le même axe que la première étape du plan | `summary-view.tsx:28` |
| Le commentaire périmé (« elle appartient à la phase suivante ») a disparu | `condition-gap-text.helper.ts:3-10`, réécrit |
| Test dédié, qui verrouille l'absence de l'ancienne formulation | `capping-axis.test.tsx:20-30` — assert `getByText('… actuellement « prompts », la condition demande « context engineering »')`, plus `queryByText(/cran plus (haut\|bas)/)` et `queryByText(/0\.\d/)` à `null` |
| Test unitaire du helper, six cas | `condition-gap-text.test.ts:18-62`, dont `never renders a raw number` |

L'exigence de `phase-1.md` §4 — « nomme l'axe, sa borne exigée **et la valeur observée** » —
est désormais tenue par les deux moitiés de la phrase.

### DB-2 — le creux du référentiel → **clos sur le chemin atteignable**

`resolveClimbTarget` (`level-resolver.helper.ts:152-163`) retient le niveau le plus bas,
en ordre croissant, dont **aucune condition `max` n'est violée**. L'invariant est le bon :
le niveau retenu ne contient plus, dans ses conditions non tenues, que des violations
`min` ou des axes non mesurés — donc `resolveTargetBand` ne peut plus emprunter
`bandAtOrBelow` et viser une bande inférieure.

Mon scénario exact du premier passage est repris tel quel comme test :

```
level-resolver.test.ts — 'aims Red by climbing when the profile falls into the gap
between White and Red, never White by descending'
  resolveLevel(grid, axes(0.5, 0.5, 1, 0))
  → nextLevel.id === 'red'
  → capping.condition.dimension === 'parallele'
  → blocking === ['parallele']
  → unranked === ['harness', 'taille']
```

Les trois symptômes que j'avais listés ont disparu sur ce chemin : plus de plan visant
`from: 0`, plus de « La grille ne porte pas d'action pour ce cran », et `unranked`
(conditions de White) n'a plus le même contenu que `blocking` (conditions de Red) —
donc plus de phrase dupliquée entre `LevelBlock` et `CappingAxis`.

Le latent que j'avais signalé sur les conditions à deux bornes est traité à la racine :
`ConditionGap.violated` est posé par `evaluateCondition` (`level-resolver.helper.ts:81-96`),
et `requiredBound` comme `resolveTargetBand` branchent dessus
(`progression-plan.helper.ts:65-75`, `:91-111`). Testé en `progression-plan.test.ts` —
`'picks the direction from the bound that actually gave way, not merely from having a min'`,
sur une condition `{ min: 0.1, max: 0.4 }` à score `0.6`.

**Résidus** : voir SUG-8 et SUG-9. Ils ne sont pas atteignables avec `config/course.json`
et `config/grid.json` tels que livrés.

### DB-3 — l'axe raté sans signal → **clos**

`axis-proof-row.tsx:27,47-52` : quand `held` est vide, la ligne nomme `missed[0]` —
le signal manqué le plus lourd, `criterionId` en départage. La formulation choisie est
juste : « aucun signal tenu — le plus proche resté sans réponse : « … » » présente le
signal comme un **manque**, pas comme la cause du cran, ce qui aurait été faux.
Test `axis-proof-row.test.tsx` — `'names the heaviest unanswered signal as a lack, not a
cause, when nothing was held'`, avec `queryByText(/^fixé par/)` à `null`.

---

## (b) A2, A3, A4, A10 passent-elles de partielles à tenues ?

**Oui, les quatre.** Tableau d'acceptance révisé — les huit autres sont inchangées.

| # | Passage 1 | Passage 2 | Preuve du changement |
| --- | --- | --- | --- |
| **A2** | partielle | **tenue** | `LevelBlock` consomme `unrankedReason: readonly PlanStep[]` (`level-block.tsx:8,25,63-65`), construit par le même `planProgression` que `plan` (`game-session.facade.ts:284-287`). La raison nomme l'axe, son cran actuel et le cran que le premier niveau exige, en libellés de grille. La formulation « un cran plus bas » a disparu du code. Test `level-block.test.tsx` — `'names the current rung and the targeted rung, both in the words of the grid'`. |
| **A3** | **non tenue** | **tenue** | Voir DB-1. La borne est nommée par son libellé de bande, jamais par un nombre. |
| **A4** | partielle | **tenue** | Voir DB-3 : un axe qui porte au moins une contribution nomme toujours un signal, tenu ou manqué. Un axe sans contribution est `unmeasured` et n'en nomme aucun — ce qui est correct, il n'y en a pas. |
| **A10** | partielle | **tenue** | La cible du plan ne peut plus être une bande `from: 0` sur le chemin atteignable : `resolveClimbTarget` écarte tout niveau à borne `max` violée, donc chaque étape vise une bande `from > 0`, que `grid.test.ts:142` garantit porteuse d'une `action` et d'une `proof`. |

**Douze acceptances sur douze.**

---

## (c) Régressions et nouveaux trous

### `suggestion` — SUG-8 · Le test de non-régression de DB-2 ne peut pas échouer

**Fichier** : `__tests__/unit/core/scoring/level-resolver.test.ts`, dernière assertion du
cas `'aims Red by climbing…'` :

```ts
expect(verdict.blocking).not.toBe(verdict.unranked)
```

commentée « plus de phrase dupliquée ». `toBe` compare les **références**. Or
`sortByBlockingOrder` se termine par `return [...gaps].sort(...)`
(`level-resolver.helper.ts:136`) : il rend **toujours** un tableau neuf. `blocking` et
`unranked` sont donc deux objets distincts sur **tous** les chemins, y compris ceux où
leur contenu est identique. L'assertion est vraie par construction et ne protège rien.

Ce qui protège réellement, dans le même test, c'est la comparaison des contenus
(`blocking === ['parallele']` vs `unranked === ['harness','taille']`) — celle-là est
bonne. C'est l'assertion suivante qui donne une fausse impression de garantie
structurelle. **Pourquoi ça compte** : c'est le seul filet explicitement posé sur la
propriété « plus de phrase dupliquée », et c'est celui qui ne peut jamais tomber.

### `suggestion` — SUG-9 · Deux chemins où `unranked` et `blocking` coïncident encore

Réponse directe à la question posée. Oui, deux cas subsistent, tous deux hors d'atteinte
avec la configuration livrée :

1. **Le repli `climbable ?? byOrder[0]`** (`level-resolver.helper.ts:162`). Si **tous** les
   niveaux portent une borne `max` violée, la cible retombe sur le niveau le plus bas —
   celui-là même dont on venait d'établir que le viser demande de régresser. On récupère
   alors exactement la pathologie de DB-2 : `blocking` a le contenu de `unranked`,
   `CappingAxis` répète une ligne de `LevelBlock`, et `resolveTargetBand` reprend
   `bandAtOrBelow`. **Aucun test ne couvre ce repli** (`grep -rn "climbable\|byOrder\[0\]" __tests__/` → 0).
2. **Le niveau le plus bas échoue sans violer de `max`.** `resolveClimbTarget` parcourt en
   ordre croissant : si `lowest` ne viole aucun `max`, il est retenu comme cible, et
   `blocking` est alors calculé sur le même niveau que `unranked` — contenus identiques.
   Sur la grille réelle, White ne porte que des bornes `max` ; il ne peut échouer sans en
   violer une **que si un axe est `unmeasured`** (une condition sur un axe non mesuré ne
   tient pas et pose `violated: undefined`, `level-resolver.helper.ts:78-80`). La cible
   redevient White, la bande visée redevient `from: 0` (« rien »), sans action.

**Atteignabilité** : nulle en l'état. L'écran de résumé n'est monté que sur
`progress.finished` (`use-course.hook.ts:28`, `use-restore-run.hook.ts:44`), donc tous les
jeux sont soumis, et les cinq axes de `config/grid.json` ont tous des mappings dans
`config/course.json` — aucun ne peut être `unmeasured`. Le trou est purement structurel.

**Pourquoi ça compte quand même** : `grid.schema.ts` se présente comme « le format
d'accueil de n'importe quelle grille », et `BRIEF.md` §3.1 fait de l'axe non mesuré une
promesse produit de premier rang (critère de jury n°3, « assume quand il n'est pas sûr »).
La correction tient par la donnée, pas par le code.

### `suggestion` — SUG-10 · La branche « niveau atteint » n'a pas reçu le même garde-fou

`resolveClimbTarget` ne protège que la branche non classée. Dans la branche où un niveau
tient, `nextLevel = byOrder[position + 1]` (`level-resolver.helper.ts:199`) est pris sans
filtre. Sur une grille où un niveau intermédiaire porte une borne `max`, un profil
**classé** peut donc recevoir un plan régressif — la pathologie exacte de DB-2, remontée
d'un cran. La grille réelle est immune (seul White, `order: 1`, porte des `max`, et il
n'est jamais le `nextLevel` de personne). Asymétrie à assumer explicitement ou à combler.

### `suggestion` — SUG-11 · « franchi » répète mot pour mot le titre de la ligne

`axis-proof-row.tsx:33-37` affiche `proof.band` en gros. `:57` affiche
`· franchi « {proof.band} »`. **La même chaîne, deux fois dans le même `<li>`** :

```
M — complexité moyenne                                   [mesuré]
Taille de la plus grosse feature livrée avec l'IA
fixé par « … »
5 sur 6 contributions · franchi « M — complexité moyenne » · manqué « L — multi-étapes »
```

Le remplacement de la décimale par le libellé règle A7 mais transforme le « seuil franchi »
en tautologie : le seuil franchi *est* la bande atteinte, déjà le plus gros objet de la
ligne. Item « pas de duplication d'information » du checklist. Le seuil **manqué**, lui,
apporte bien une information neuve et reste justifié.

### `suggestion` — SUG-12 · Le tas de champs domaine non rendus a grossi

`grep -rn "\.crossed\|missedBand\.from\|\.observed\b\|\.required\b\|\.capping\|satisfiedConditions" src/`
ne renvoie plus qu'un commentaire. Sont désormais calculés et jamais lus par une couche
de rendu :

| Champ | Statut |
| --- | --- |
| `AxisProof.crossed` | **devenu mort dans ce commit** — R4 l'a remplacé par `proof.band` à l'écran |
| `AxisProof.missedBand.from` | **devenu mort dans ce commit** — seul `.label` est rendu |
| `LevelVerdict.capping` | **devenu mort dans ce commit** — `SummaryView` lit `plan[0]` (`summary-view.tsx:28`) |
| `PlanStep.observed`, `.required` | inchangés depuis le passage 1 |
| `LevelVerdict.satisfiedConditions` | inchangé, antérieur au diff |

Le commentaire de `progression-step.tsx:6-7` (« `PlanStep.observed` et `.required` restent
au domaine, non rendus ici ») documente l'intention plutôt qu'il ne la corrige — c'est
défendable pour un type domaine, mais ça ne s'étend pas aux trois champs qui viennent de
mourir. Cas particulier de `capping` : le domaine porte maintenant **deux** expressions du
même concept (`LevelVerdict.capping` et `plan[0]`), dont une seule est branchée, et deux
commentaires qui la définissent chacun à sa façon (`level-resolver.helper.ts:53` « la tête
de `blocking` » vs `capping-axis.tsx:10` « la tête de `plan` »).

### `suggestion` — SUG-5 (rappel) · La signature peut toujours se taire

Non traité, et désormais figé par un test : `signature-block.test.tsx:67-77` verrouille le
comportement « titre `Aucun niveau ne peut être annoncé`, aucune raison ». Une lecture dont
le rôle est de distinguer deux profils classés pareil reste muette sur un état atteignable
(`verification = 0.5`, `pilotage-contexte = 0.2` ne tient ni `vibe-coder` ni `aidd-en-route`).

### `suggestion` — SUG-6, SUG-7 (rappel) · Non traités

Styles d'import mélangés dans `src/core/scoring/helpers/` (`@/core/...` en
`level-resolver.helper.ts:1-2`, relatif dans les deux autres) ; `level.level?.label` en
`level-block.tsx:37` alors que le branchement appelant garantit la valeur.

### Nit

Titre de test agrammatical : `condition-gap-text.test.ts:54` — « falls back to **an explicit
words** ».

---

## `correct` — ce que le second commit fait bien

- **`resolveClimbTarget` corrige la cause, pas le symptôme.** Déplacer la cible du plan
  plutôt que réécrire la phrase est la bonne réponse : elle vaut pour toute grille, et
  l'invariant qu'elle pose (« la cible ne viole aucune borne `max` ») est ce qui rend
  `resolveTargetBand` incapable de viser vers le bas. Le commentaire de tête
  (`level-resolver.helper.ts:19-33`) énonce l'invariant, ce qui le rend vérifiable.
- **`ConditionGap.violated` supprime une classe entière d'ambiguïtés.** Le latent que
  j'avais signalé sur les conditions à deux bornes n'est pas rustiné localement : la borne
  qui a cédé devient une donnée du domaine, et les deux consommateurs y branchent.
- **`PlanStep` devient le vocabulaire unique de l'écran.** `LevelBlock`, `CappingAxis` et
  `ProgressionStep` lisent tous le même type, produit par le même `planProgression`. Il n'y
  a plus deux façons de décrire un axe qui bloque, et `ConditionGap` ne remonte plus
  jusqu'à l'UI — le domaine reste derrière une seule projection.
- **`observedBand` est résolu par `bandFor`**, le helper qui résout déjà la bande du score
  ailleurs (`progression-plan.helper.ts:7,122`) : pas de seconde implémentation de la
  résolution de bande, pas de recalcul depuis un libellé.
- **Plus une seule décimale à l'écran.** Vérifié par deux tests indépendants
  (`axis-proof-row.test.tsx` `'renders no raw decimal anywhere on the row'` sur
  `container.textContent`, et `condition-gap-text.test.ts` `'never renders a raw number'`)
  — pas seulement par relecture.
- **Les trois surfaces non testées le sont.** `capping-axis.test.tsx` (3 cas),
  `signature-block.test.tsx` (4 cas), `condition-gap-text.test.ts` (6 cas). SUG-4 est soldé.
- **`NO_LEVEL_LABEL` a une seule source**, exportée par `level-block.tsx:12` et importée par
  `signature-block.tsx:3`. SUG-5 (première moitié) soldé.
- **La ligne du wireframe de `phase-4.md` est livrée.** « Lu à « X », le cran demande « Y ». »
  (`progression-step.tsx:34-38`) — l'écart plan/code que j'avais relevé est comblé, et en
  libellés plutôt qu'en nombres.
- **Les tests portent leur intention.** Les commentaires de
  `level-resolver.test.ts` expliquent *pourquoi* la cible grimpe, pas seulement quoi
  asserter. Un lecteur qui reprend le code comprend l'invariant sans remonter à la spec.

---

## Ce que j'ai vérifié moi-même, second passage

| Vérification | Commande | Résultat |
| --- | --- | --- |
| Périmètre | `git diff HEAD~1 HEAD --stat` | 19 fichiers, +805 / −128, commit `48defa9` |
| Typage | `npm run typecheck` | propre, aucune sortie |
| Suite complète | `npm run test` | `Test Files 93 passed (93)` · `Tests 847 passed (847)` — **847, pas 843** : le worktree contient des tests `practice-map` non commités, hors périmètre |
| Périmètre verdict seul | `npx vitest run __tests__/unit/core/scoring __tests__/unit/features/scoring-summary __tests__/integration/config-loading __tests__/unit/core/session` | `Test Files 16 passed` · `Tests 143 passed` |
| Lint / format | `npx biome check src/core src/features/scoring-summary __tests__/unit/core/scoring __tests__/unit/features/scoring-summary config` | `Checked 42 files in 20ms. No fixes applied.` |
| Champs domaine non rendus | `grep -rn "\.crossed\|missedBand\.from\|\.observed\b\|\.required\b\|\.capping\|satisfiedConditions" src/` | un seul commentaire, zéro usage de rendu → SUG-12 |
| Couverture du repli `climbable` | `grep -rn "climbable\|resolveClimbTarget\|byOrder\[0\]" __tests__/` | aucun test → SUG-9 |
| Atteignabilité d'un axe non mesuré | `grep -rn "showSummary" src/` + `App.tsx:64` | montée sur `progress.finished` uniquement → SUG-9 non atteignable en l'état |
| Tautologie du test anti-duplication | lecture de `sortByBlockingOrder` (`level-resolver.helper.ts:136`) | `[...gaps].sort()` rend toujours un tableau neuf → `not.toBe` toujours vrai |
| Pureté du domaine, barrels, pourcentages | rejouées depuis le passage 1 | inchangées, toujours propres |

## Score révisé

**88 / 100.**

Douze acceptances sur douze (contre 9,5/12 au premier passage). Retrait pour SUG-8 — un
test de non-régression inopérant sur la propriété précisément corrigée — et pour le duo
SUG-9 / SUG-10, deux chemins où la correction tient par la configuration plutôt que par le
code. Retrait mineur pour SUG-11 et SUG-12, qui sont de l'hygiène introduite par le
correctif lui-même.

Aucune violation dure. Le seuil de passage appartient à l'appelant.
