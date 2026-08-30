# Review: Le jeu `confidence-bet`, la mise de confiance à l'aveugle

- **Verdict**: changes-requested
- **Diff**: `main...HEAD` (`dfaa40b`, `1ba0b2b`, `754ff1a`)
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_30
- **Findings**: 0 critical, 1 warning, 1 minor

## Phases

### Phase 1 — Les contrats et la simulation pure

- [x] Un corpus sans extrait défectueux, sans extrait sain, ou sans extrait indécidable n'ouvre pas de session et nomme le champ — `schema/config.schema.ts:83`
- [x] Une échelle sans miroir autour de la mise neutre est refusée au chargement — `config.schema.ts:71`
- [x] Une échelle qui ne contient pas la mise neutre est refusée au chargement — `config.schema.ts:63`
- [x] Deux extraits de même identifiant sont refusés au chargement — `config.schema.ts:50`
- [x] Une trace qui ne couvre pas tous les extraits est refusée, et l'erreur nomme l'extrait manquant — `answer.schema.ts:95`
- [x] Une mise absente de l'échelle déclarée est refusée, et l'erreur nomme l'extrait fautif — `answer.schema.ts:106`
- [x] La mise la plus haute sur un extrait sain fait le gain le plus grand, la même mise sur un défectueux fait la perte de même ampleur — `run-simulation.helper.ts:87`
- [x] Sur un extrait indécidable, la mise neutre ne coûte rien, et les deux mises extrêmes coûtent le même montant — `run-simulation.helper.ts:93`
- [x] La calibration vaut 1 quand chaque extrait tranchable a reçu la mise extrême du bon côté — `run-simulation.helper.ts:176`
- [x] La calibration vaut 0 quand toutes les mises sont posées sur la mise neutre — `run-simulation.test.ts:133`
- [x] La calibration ne compte aucun extrait indécidable — `run-simulation.helper.ts:180`
- [x] Deux rejeux des mêmes mises rendent le même état final — `run-simulation.test.ts:99`

### Phase 2 — L'évaluateur et ses quatre règles

- [x] Une mise moyenne posée exactement sur le seuil des extraits défectueux fait manquer le critère — `confidence-bet.evaluator.ts:47`
- [x] Une mise moyenne posée exactement sur le seuil des extraits sains fait manquer le critère — `confidence-bet.evaluator.ts:53`
- [x] Une calibration posée exactement sur son seuil satisfait le critère — `confidence-bet.evaluator.ts:59`
- [x] Une seule mise hors bande sur un extrait indécidable fait manquer le garde-fou — `confidence-bet.evaluator.ts:73`
- [x] Une trace au capital forgé rend exactement les mêmes verdicts — `confidence-bet.evaluator.ts:90`
- [x] Un type de règle inconnu lève une erreur qui nomme la règle et le jeu — `confidence-bet.evaluator.ts:36`
- [x] Le joueur qui mise haut partout ne satisfait qu'un critère sur quatre — `evaluator.test.ts:221`
- [x] Le joueur qui reste sur la mise neutre partout ne satisfait qu'un critère sur quatre — `evaluator.test.ts:225`
- [x] Le joueur juste sur les tranchables et extrême sur les indécidables manque le seul garde-fou — `evaluator.test.ts:229`

### Phase 3 — Le jeu à l'écran et son câblage

- [x] Jouer les extraits dans le désordre produit exactement la même trace — `build-confidence-bet-answer.action.ts:33`
- [x] La trace construite porte une mise par extrait déclaré — `build-answer.test.ts:50`
- [x] Aucune fonction rendue par le hook ne permet de retirer ou de réécrire une mise engagée — `use-confidence-bet.hook.ts:125`
- [x] La révélation d'un extrait est absente tant que sa mise n'est pas engagée — `use-confidence-bet.hook.ts:77`
- [x] Passer le dernier extrait deux fois ne soumet la trace qu'une fois — `use-confidence-bet.hook.ts:120`
- [x] Avant l'engagement, l'écran ne porte ni nature, ni verdict, ni mouvement de capital — `confidence-bet-game.test.tsx:73`
- [x] Après l'engagement, l'échelle n'est plus à l'écran — `confidence-bet-game.tsx:67`
- [x] L'engagement est indisponible tant qu'aucune valeur n'est choisie — `confidence-bet-game.tsx:82`
- [x] Le parcours résout le type `confidence-bet` vers son évaluateur et vers son composant — `register-games.ts:41`, `register-components.ts:20`, rendu prouvé par `qa/colonne-390-tour-1.png`

### Phase 4 — Le jeu dans le parcours

- [x] Le parcours réel se charge sans erreur et le groupe « Jugement critique » ouvre sur `confidence-bet` — `confidence-bet-run.test.ts:338`
- [x] Aucun critère du jeu ne vise une autre dimension que `verification` — `confidence-bet-run.test.ts:349`
- [x] La consigne ne nomme ni seuil, ni bande, ni moyenne par nature — `confidence-bet-run.test.ts:360`
- [x] Aucun extrait déclaré `sound` ne porte un défaut qu'un lecteur exigeant rejetterait à bon droit — `config/course.json` `x3` (`groupBy` sur `Map`) et `x5` (`chunk`) relus ligne à ligne : clés de prototype neutralisées par la `Map`, seau créé une fois, entrée jamais mutée pour `x3` ; garde `size < 1` avant la boucle et `slice` auto-bornant pour `x5`. Aucune interprétation de chaîne, aucune coercition
- [x] Aucun extrait déclaré `flawed` ne se tranche sur une information absente de ses lignes — `x1` (`clamp` aux bornes croisées) et `x4` (`forEach` à callback `async`) : le défaut de `x4` tient dans `forEach` et `async`, tous deux montrés, quel que soit ce que fait `persist`
- [x] Deux extraits de même nature ne se suivent jamais dans l'ordre déclaré, et aucun identifiant n'encode sa nature — `config/course.json:19-68`, ordre `flawed · undecidable · sound · flawed · sound · undecidable`, identifiants `x1`…`x6`
- [x] Les neuf profils rendent exactement les scores du tableau, et leurs quatre verdicts de critère — `confidence-bet-run.test.ts:259`, les neuf lignes redérivées à la main, scores, capitaux et verdicts compris
- [x] Le profil qui déduit la maille au lieu de lire reste strictement sous celui qui a lu tout le code — `confidence-bet-run.test.ts:281`, 4/7 contre 6/7
- [x] Le profil qui mise haut partout obtient un score strictement inférieur à 0.4 — `confidence-bet-run.test.ts:306`
- [x] Le profil qui lit le code mais mise haut sur l'indécidable obtient un score strictement inférieur au profil calibré — `confidence-bet-run.test.ts:292`
- [x] Le profil tiède atterrit sur le seuil de calibration exact et le franchit — `confidence-bet-run.test.ts:327`, vérifié à la main : 80/160 = 0.5

### Phase 5 — La passe impeccable de la surface

- [x] La surface du jeu est décrite dans `.impeccable/surfaces/` — `.impeccable/surfaces/ence-bet-components-composites-confidence-bet-game-tsx.md`
- [x] Le code de l'extrait est le contenu le plus lisible de l'écran — `snippet-card.tsx:33`, `qa/colonne-390-tour-1.png`
- [x] Le verdict et le signe du mouvement se lisent sans distinguer les couleurs — `reveal-panel.tsx:4`, `reveal-panel.tsx:27`
- [x] L'échelle se lit comme un axe du doute à la certitude — `stake-rule.tsx:37`
- [x] À 390 de large, le code ne déborde pas et l'échelle reste atteignable — `qa/README.md:47`, colonne isolée à 390 mesurée `scrollWidth` 390 / `clientWidth` 390 aux tours 1 et 2 ; les cinq graduations et les deux boutons sont dans le cadre sur `qa/colonne-390-tour-1.png`
- [x] Le contour de focus est visible sur chaque valeur de l'échelle et sur les deux boutons — `stake-rule.tsx:69`, boutons sur la primitive partagée `components/ui/button`
- [x] L'écran ne contient ni seuil, ni bande, ni mention d'un critère de notation — aucune constante de seuil dans `src/games/confidence-bet/`, `qa/README.md:27`
- [x] La tournée aux deux gabarits est déposée dans `qa/` — huit captures, 1440, 390 page entière, 390 colonne isolée

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🟡 | code | 4 | `__tests__/integration/course-run/confidence-bet-run.test.ts` | `phase-4.md:111` érige en critère d'acceptation « Deux extraits de même nature ne se suivent jamais dans l'ordre déclaré, et aucun identifiant n'encode sa nature ». C'est la seule ligne de cette table qui n'a aucun contrôle mécanique : la propriété tient dans les données, mais rien ne la garde. Le profil 9 la protège par accident, ses mises étant figées sur l'ordre actuel ; un réordonnancement le ferait échouer sur un écart de score, sans jamais nommer l'invariant violé. C'est exactement l'invariant dont la rupture faisait le défaut critique de la revue précédente | Ajouter au fichier une assertion sur `realG1_1Config().snippets` : aucune paire adjacente de même `nature`, et aucun `id` ne contenant `sound`, `flawed`, `undecidable` ni leurs initiales |
| 🟢 | fit | 5 | `snippet-card.tsx:33`, `qa/README.md:52` | À 390, le bloc de code tronque horizontalement à environ 51 caractères et son ascenseur peut rester invisible tant qu'on n'a pas commencé à faire défiler, ce que la tournée déclare comme « limite connue, non corrigée ». Le corpus actuel y échappe : les six extraits ont été relus ligne à ligne contre la largeur visible de `colonne-390-tour-1.png`, aucun jeton décisif n'est perdu (la garde `if (size < 1) throw new RangeError(` de `x5` et le `items.forEach(async` de `x4` restent entiers). Mais rien n'enregistre la contrainte, et un extrait futur dont la ligne décisive dépasse 51 caractères se ferait juger amputé sur mobile | Consigner la limite de ~51 caractères par ligne dans la règle de rédaction du corpus de `phase-4.md`, ou rendre l'ascenseur du bloc visible au repos |

## Verification

| Metric        | Value |
| ------------- | ----- |
| Verified      | 100% (49/49) |
| Files checked | `config/course.json`, `src/games/confidence-bet/**` (13 fichiers), `src/games/register-games.ts`, `src/games/register-components.ts`, `__tests__/unit/games/confidence-bet/**` (6 fichiers), `__tests__/integration/course-run/**` (3 fichiers), `__tests__/integration/config-loading/course.test.ts`, `__tests__/unit/composition-root.test.ts`, `aidd_docs/.../qa/**` (README et 8 captures), `.impeccable/surfaces/ence-bet-...md`, `phase-4.md` |
| Unchecked     | none |
| Unplanned     | Fixtures `confidence-bet` ajoutées à `three-tracks-run.test.ts:80` et `checkpoints-run.test.ts:83` ; filtre élargi de `composition-root.test.ts:23` ; assertion `propositions` → `snippets` dans `config-loading/course.test.ts:96`. Les quatre découlent mécaniquement du remplacement du type de `g1-1`. Les six captures de la deuxième passe ont été remplacées, l'ancien corpus les ayant périmées |

Preuves de validation rejouées sur `754ff1a` : `npm run typecheck` sans sortie, `npx biome check` « Checked 139 files, no fixes applied », `npm run test` 49 fichiers et 422 tests verts.

## Constats de la revue précédente, tous refermés

| Constat | Vérification |
| --- | --- |
| 🔴 Corpus rangé par nature | Ordre `F·U·S·F·S·U`. Sous l'hypothèse de deux extraits par nature, le seul créneau déductible est le sixième, et il est `undecidable` : sa mise optimale une fois déduite (la neutre, `delta` 0) est exactement celle qu'on pose dans l'ignorance. La déduction ne rapporte rien |
| 🟡 `f2`, dépendance hallucinée | Supprimé. `x4` (`forEach` à callback `async`) se tranche entièrement dans ses trois lignes |
| 🟡 `s1`, `parseAmount` | Supprimé. `x3` (`groupBy` sur `Map`) résiste à la relecture : pas de coercition, pas d'interprétation de chaîne, pas de clé de prototype |
| 🟡 Identifiants encodant la nature | `x1`…`x6`. Le canal `name="stake-…"` du groupe radio ne porte plus rien |
| 🟡 Trace non bornée | `TraceLengthMismatchError`, posée après les deux refus de couverture pour ne pas leur voler leur nom sur une trace trop courte. Couverte `answer.schema.test.ts:87` |
| 🟡 Tableau des profils sous-asserté | Quatre `satisfied` par ligne, assertés dans le `it.each`. Neuvième profil ajouté et comparé au profil 3 |
| 🟡 390 non observé | Colonne isolée mesurée 390/390 aux deux moments où l'échelle puis la révélation sont à l'écran |
| 🟢 `formatDelta` dupliquée | Exportée depuis `reveal-panel.tsx:27`, importée par le relevé |
| 🟢 `meanStakeOn` rendant `0` | `NoStakeForNatureError`, couverte sur un état monté à la main |
| 🟢 `natureOf` en `Error` nu | `UnknownSnippetError` partagée, couverte |
