# Review: Le jeu `confidence-bet`, la mise de confiance à l'aveugle

- **Verdict**: changes-requested
- **Diff**: `main...HEAD` (`dfaa40b`, `1ba0b2b`)
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_30
- **Findings**: 1 critical, 6 warning, 3 minor

## Phases

### Phase 1 — Les contrats et la simulation pure

- [x] Un corpus sans extrait défectueux, sans extrait sain, ou sans extrait indécidable n'ouvre pas de session et nomme le champ — `src/games/confidence-bet/schema/config.schema.ts:83`
- [x] Une échelle sans miroir autour de la mise neutre est refusée au chargement — `config.schema.ts:71`
- [x] Une échelle qui ne contient pas la mise neutre est refusée au chargement — `config.schema.ts:63`
- [x] Deux extraits de même identifiant sont refusés au chargement — `config.schema.ts:50`
- [x] Une trace qui ne couvre pas tous les extraits est refusée, et l'erreur nomme l'extrait manquant — `answer.schema.ts:74`
- [x] Une mise absente de l'échelle déclarée est refusée, et l'erreur nomme l'extrait fautif — `answer.schema.ts:85`
- [x] La mise la plus haute sur un extrait sain fait le gain le plus grand, la même mise sur un défectueux fait la perte de même ampleur — `run-simulation.helper.ts:69`
- [x] Sur un extrait indécidable, la mise neutre ne coûte rien, et les deux mises extrêmes coûtent le même montant — `run-simulation.helper.ts:75`
- [x] La calibration vaut 1 quand chaque extrait tranchable a reçu la mise extrême du bon côté — `run-simulation.helper.ts:158`
- [x] La calibration vaut 0 quand toutes les mises sont posées sur la mise neutre — `__tests__/unit/games/confidence-bet/run-simulation.test.ts:128`
- [x] La calibration ne compte aucun extrait indécidable — `run-simulation.helper.ts:162`
- [x] Deux rejeux des mêmes mises rendent le même état final — `run-simulation.test.ts:94`

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
- [x] Le parcours résout le type `confidence-bet` vers son évaluateur et vers son composant — `register-games.ts:41`, `register-components.ts:20`, rendu prouvé par `qa/desktop-tour-3.png`

### Phase 4 — Le jeu dans le parcours

- [x] Le parcours réel se charge sans erreur et le groupe « Jugement critique » ouvre sur `confidence-bet` — `confidence-bet-run.test.ts:281`
- [x] Aucun critère du jeu ne vise une autre dimension que `verification` — `confidence-bet-run.test.ts:292`
- [x] La consigne ne nomme ni seuil, ni bande, ni moyenne par nature — `confidence-bet-run.test.ts:303`
- [x] Les huit profils rendent exactement les scores du tableau — `confidence-bet-run.test.ts:224`, arithmétique refaite ligne à ligne, les huit scores et les huit capitaux sont justes
- [x] Le profil qui mise haut partout obtient un score strictement inférieur à 0.4 — `confidence-bet-run.test.ts:249`
- [x] Le profil qui lit le code mais mise haut sur l'indécidable obtient un score strictement inférieur au profil calibré — `confidence-bet-run.test.ts:235`
- [x] Le profil tiède atterrit sur le seuil de calibration exact et le franchit — `confidence-bet-run.test.ts:270`, vérifié à la main : 80/160 = 0.5

### Phase 5 — La passe impeccable de la surface

- [x] La surface du jeu est décrite dans `.impeccable/surfaces/` — `.impeccable/surfaces/ence-bet-components-composites-confidence-bet-game-tsx.md`
- [x] Le code de l'extrait est le contenu le plus lisible de l'écran — `snippet-card.tsx:33`, `qa/desktop-tour-3.png`
- [x] Le verdict et le signe du mouvement se lisent sans distinguer les couleurs — `reveal-panel.tsx:4`, `reveal-panel.tsx:22`
- [x] L'échelle se lit comme un axe du doute à la certitude — `stake-rule.tsx:37`
- [ ] À 390 de large, le code ne déborde pas et l'échelle reste atteignable — non tenu : `qa/README.md:41` relève `scrollWidth 515 / clientWidth 390` au tour 3 et `qa/README.md:45` note que « la ligne "CERTITUDE" de la règle sort du cadre visible ». Le débordement est mesuré comme venant de la rampe, hors périmètre, mais le rendu du jeu à 390 réellement disponible n'a jamais été observé (`qa/README.md:49`)
- [x] Le contour de focus est visible sur chaque valeur de l'échelle et sur les deux boutons — `stake-rule.tsx:69`, boutons sur la primitive partagée `components/ui/button`
- [x] L'écran ne contient ni seuil, ni bande, ni mention d'un critère de notation — aucune constante de seuil dans `src/games/confidence-bet/`, `qa/README.md:25`
- [x] La tournée aux deux gabarits est déposée dans `qa/` — six captures, 1440 et 390

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🔴 | fit | 4 | `config/course.json:19-66` | Le corpus est déclaré groupé par nature dans l'ordre de jeu (`s1`,`s2` sound, puis `f1`,`f2` flawed, puis `u1`,`u2` undecidable) et le hook ouvre les extraits dans l'ordre déclaré (`use-confidence-bet.hook.ts:71`). Chaque révélation nomme la nature en clair (`reveal-panel.tsx:4`). Un joueur qui n'évalue honnêtement que les trois premiers extraits déduit la maille 2/2/2 et obtient les trois derniers gratuitement : mises 90·90·10 lues, puis 10·50·50 devinées, soit 7/7 = 1.000. La moitié du corpus est offerte, et l'epic exige qu'un joueur qui joue le système n'obtienne pas un cran supérieur | Entrelacer les natures dans l'ordre déclaré (p.ex. sound, undecidable, flawed, sound, flawed, undecidable) et ajouter au tableau du test d'intégration un profil « déduit la maille sans lire » dont le score reste sous 0.4 |
| 🟡 | fit | 4 | `config/course.json:44-50` | `f2` est classé `flawed` parce que `undici` n'exporte pas `fetchWithRetry`. Le fait est exact, mais l'information qui tranche vit dans l'API du paquet, hors de l'extrait, ce qui est exactement la définition que `phase-4.md:60` donne d'`undecidable`. Le jeu n'offre aucun moyen de consulter le paquet en partie : le joueur honnête qui répond « je ne peux pas l'établir » pose 50 et perd 40 points de capital. La note tient encore (mean flawed 30 < 50, calibration 0.625 ≥ 0.5), mais la taxonomie que le jeu enseigne se contredit sur son propre corpus | Rendre le défaut lisible dans l'extrait, ou reclasser `f2` en `undecidable` et écrire un second `flawed` visible à la lecture |
| 🟡 | fit | 4 | `config/course.json:20-27` | `parseAmount` est déclaré `sound` alors que `Number('')` et `Number('   ')` valent `0` : la chaîne vide passe comme montant valide, et `Number('0x1f')` vaut 31. Pour une fonction de validation de montant c'est un défaut défendable, et sa révélation ne répond pas à l'objection. Un lecteur exigeant qui pose 30 sur `s1` fait tomber `mean sound` à 60 et manque `g1-1-c2`, soit 2 points sur 7 : ce corpus punit le meilleur lecteur, ce que la story interdit | Fermer le trou dans l'extrait (`if (raw.trim() === '') throw`), ou déplacer `s1` vers `undecidable` |
| 🟡 | fit | 4 | `config/course.json:20`, `stake-rule.tsx:43` | Les identifiants encodent la nature (`s`/`f`/`u`) et `StakeRule` les rend dans le DOM avant tout engagement : `name` traverse le contexte du RadioGroup (`node_modules/@base-ui/react/radio-group/RadioGroup.js:178`) et se pose sur l'input caché de chaque radio (`.../radio/root/RadioRoot.js:160`, `:224`). Un clic droit sur la règle affiche `name="stake-f1"`. L'exposition de fond est systémique et préexistante (`composition-root.ts:1` embarque tout `course.json` dans le bundle, `test-bench` y expose déjà ses `expected`), mais des identifiants opaques la mettraient hors de portée d'un simple inspecteur | Renommer les extraits en jetons neutres (`x1`…`x6`) dans `config/course.json` et les fixtures |
| 🟡 | code | 1 | `src/games/confidence-bet/schema/answer.schema.ts:68-91` | `parseConfidenceBetTrace` vérifie la couverture par `find` mais ne borne ni le nombre de mises ni les doublons. Une trace forgée `[s1,s1,s2,f1,f2,u1,u2]` passe la relecture, puis `replayBets` lève `GameAlreadyOverError` (`run-simulation.helper.ts:102`), une erreur au nom trompeur, remontée non attrapée par `GameSessionFacade.submitAnswer` (`game-session.facade.ts:223`). Le gabarit annoncé fait l'inverse : `parseThreeTracksTrace` relit positionnellement et documente explicitement la trace forgée (`three-tracks/schema/answer.schema.ts:98`) | Refuser `trace.bets.length !== config.snippets.length` par une erreur nommée dans `parseConfidenceBetTrace` |
| 🟡 | code | 4 | `__tests__/integration/course-run/confidence-bet-run.test.ts:172-233` | Le tableau de `phase-4.md:80` est déclaré « le contrat », mais le test n'assert que `Score` et `Capital`. Les colonnes `c1 c2 c3 c4` ne sont vérifiées que sur deux cases isolées (`:243` pour c4 du profil 3, `:276` pour c3 du profil 4). Avec des poids 2·2·2·1, un score de 5/7 est atteignable par trois combinaisons de critères distinctes et 2/7 par trois autres : la moitié du contrat n'est pas verrouillée | Porter les quatre `satisfied` attendus dans chaque entrée de `TABLE_FROM_PHASE_4` et les asserter dans le `it.each` |
| 🟡 | functional | 5 | `aidd_docs/.../qa/README.md:41` | Critère « À 390 de large, le code ne déborde pas et l'échelle reste atteignable » non tenu : `scrollWidth 515 / clientWidth 390` au tour 3, et la ligne « CERTITUDE » sort du cadre. La cause est mesurée hors périmètre et déposée en défaut, mais le rendu du jeu à 390 réellement disponible reste non observé (`README.md:49`) | Capturer la colonne du jeu isolée à 390 pour lever le doute maintenant, ou recapturer après correction de la rampe |
| 🟢 | rot | 3 | `reveal-panel.tsx:22`, `bet-ledger.tsx:4` | `formatDelta` est dupliquée à l'identique dans les deux fichiers, alors que son jumeau `movementToneClassName` est, lui, exporté et partagé (`bet-ledger.tsx:2`) | Exporter `formatDelta` à côté de `movementToneClassName` et l'importer |
| 🟢 | code | 1 | `run-simulation.helper.ts:145` | `meanStakeOn` rend `0` sur une nature absente. Sur `mean-stake-on-flawed-below {threshold: 50}`, `0 < 50` rend le critère satisfait par vacuité, précisément le mode d'échec que `config.schema.ts:83` existe pour fermer et que `phase-1.md:76` appelle « le refus le plus important ». Le garde de configuration rend la branche inatteignable aujourd'hui, mais le repli choisi est le plus dangereux des deux | Lever une erreur nommée plutôt que rendre `0` |
| 🟢 | code | 1 | `run-simulation.helper.ts:49` | `natureOf` lève un `Error` nu là où le fichier et son voisin nomment chacune de leurs erreurs (`GameAlreadyOverError`, `UnknownSnippetError` dans `answer.schema.ts:36`). `phase-1.md:86` demande « une erreur nommée par cas » | Réutiliser `UnknownSnippetError` |

## Verification

| Metric        | Value |
| ------------- | ----- |
| Verified      | 98% (44/45) |
| Files checked | `config/course.json`, `src/games/confidence-bet/**` (13 fichiers), `src/games/register-games.ts`, `src/games/register-components.ts`, `__tests__/unit/games/confidence-bet/**` (6 fichiers), `__tests__/integration/course-run/confidence-bet-run.test.ts`, `__tests__/integration/course-run/three-tracks-run.test.ts`, `__tests__/integration/course-run/checkpoints-run.test.ts`, `__tests__/integration/config-loading/course.test.ts`, `__tests__/unit/composition-root.test.ts`, `aidd_docs/.../qa/**`, `.impeccable/surfaces/ence-bet-...md` |
| Unchecked     | À 390 de large, le code ne déborde pas et l'échelle reste atteignable — fix |
| Unplanned     | Fixtures `confidence-bet` ajoutées à `three-tracks-run.test.ts:80` et `checkpoints-run.test.ts:83` ; filtre élargi de `composition-root.test.ts:23` laissant tomber critères, jeux et groupes vidés ; assertion `propositions` → `snippets` dans `config-loading/course.test.ts:96`. Les quatre découlent mécaniquement du remplacement du type de `g1-1` et sont des ajustements de fixture, pas des contournements ; `git log` couvre le défaut de rampe (`1ba0b2b`) |

Preuves de validation rejouées : `npm run typecheck` sans sortie, `npx biome check` « Checked 139 files, no fixes applied », `npm run test` 49 fichiers et 417 tests verts.
