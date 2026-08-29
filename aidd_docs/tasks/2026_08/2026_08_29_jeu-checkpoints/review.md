# Review: Le jeu `checkpoints`, premier jeu à état

- **Verdict**: approved — les cinq constats sont clos le 29/08, voir « Clôture » en fin de fiche
- **Diff**: `f099d4c...cc97021`
- **Axes run**: code, functional, relevancy
- **Date**: 2026_08_29
- **Findings**: 0 critical, 3 warning, 2 minor

## Phases

### Phase 1 — Les contrats et la simulation pure

- [x] Une configuration sans étape est refusée, le message nomme le champ — `src/games/checkpoints/schema/config.schema.ts:50`, `__tests__/unit/games/checkpoints/config.schema.test.ts:46`
- [x] Un coût négatif ou un facteur inférieur à un est refusé — `src/games/checkpoints/schema/config.schema.ts:26`, `src/games/checkpoints/schema/config.schema.ts:35`
- [x] Le budget vient de la configuration : le changer change la partie sans toucher au code — `src/games/checkpoints/helpers/run-simulation.helper.ts:44`, `__tests__/unit/games/checkpoints/run-simulation.test.ts:128`
- [x] Une trace à qui il manque une étape est refusée — `src/games/checkpoints/schema/answer.schema.ts:53`, `__tests__/unit/games/checkpoints/answer.schema.test.ts:57`
- [x] La trace porte, à la fin, le budget restant et les défauts encore présents — `src/games/checkpoints/schema/answer.schema.ts:22`
- [x] Un défaut laissé passer au cadrage coûte, au merge, son coût multiplié par son facteur — `src/games/checkpoints/helpers/run-simulation.helper.ts:77`, `__tests__/unit/games/checkpoints/run-simulation.test.ts:69` (le parcours le fait éclater à la revue, pas au merge : le mécanisme est celui du critère, l'étape vient du barème)
- [x] Le même défaut corrigé à sa source coûte son prix une fois, sans multiplication — `src/games/checkpoints/helpers/run-simulation.helper.ts:89`, `__tests__/unit/games/checkpoints/run-simulation.test.ts:88`
- [x] Deux exécutions de la même suite de choix rendent des traces identiques — `__tests__/unit/games/checkpoints/run-simulation.test.ts:122` (aucune occurrence de `Date`, `Math.random` ou `crypto` dans `src/games/checkpoints/`)
- [x] Un budget dépassé n'interrompt pas la partie — `src/games/checkpoints/helpers/run-simulation.helper.ts:115`, `__tests__/unit/games/checkpoints/run-simulation.test.ts:111`
- [x] Rejouer une trace complète rend le même état final que l'avoir jouée pas à pas — `src/games/checkpoints/helpers/run-simulation.helper.ts:139`, `__tests__/unit/games/checkpoints/run-simulation.test.ts:136`

### Phase 2 — L'évaluateur et ses trois règles

- [x] Une trace hors contrat est refusée, aucun critère n'est rendu manqué par défaut — `src/games/checkpoints/checkpoints.evaluator.ts:125`, `__tests__/unit/games/checkpoints/evaluator.test.ts:188`
- [x] Un type de règle inconnu lève une erreur qui nomme la règle et le jeu — `src/games/checkpoints/checkpoints.evaluator.ts:33`, `__tests__/unit/games/checkpoints/evaluator.test.ts:197`
- [x] L'évaluateur ne recalcule pas l'avancée : il passe par le helper de simulation — `src/games/checkpoints/checkpoints.evaluator.ts:131`, `__tests__/unit/games/checkpoints/evaluator.test.ts:171`
- [x] Une trace dont la reprise la plus lourde tombe au merge fait manquer le critère — `src/games/checkpoints/checkpoints.evaluator.ts:88`, `__tests__/unit/games/checkpoints/evaluator.test.ts:114`
- [x] Deux étapes au même coût font retenir la plus précoce — `src/games/checkpoints/checkpoints.evaluator.ts:72`, `__tests__/unit/games/checkpoints/evaluator.test.ts:118`
- [x] Une correction posée après la revue fait manquer le critère — `src/games/checkpoints/checkpoints.evaluator.ts:101`, `__tests__/unit/games/checkpoints/evaluator.test.ts:131`
- [x] Un défaut qui éclate seul après la revue ne fait pas manquer le critère — `src/games/checkpoints/checkpoints.evaluator.ts:103`, `__tests__/unit/games/checkpoints/evaluator.test.ts:135`
- [x] Une trace intégralement reprise fait manquer le critère — `src/games/checkpoints/checkpoints.evaluator.ts:114`, `__tests__/unit/games/checkpoints/evaluator.test.ts:142`
- [x] Déplacer le seuil dans le JSON change le résultat sans qu'une ligne de code bouge — `config/course.json:1138`, `__tests__/integration/course-run/checkpoints-run.test.ts:150`
- [x] Un joueur qui corrige tout obtient un score d'intervention inférieur à celui qui cadre tôt et laisse courir — `__tests__/unit/games/checkpoints/evaluator.test.ts:151`, `__tests__/integration/course-run/checkpoints-run.test.ts:110`

### Phase 3 — Le jeu à l'écran et son câblage

- [x] La trace produite suit l'ordre de la configuration, pas celui des clics — `src/games/checkpoints/actions/build-checkpoints-answer.action.ts:20`, `__tests__/unit/games/checkpoints/build-answer.test.ts:35`
- [x] Les coûts de la trace viennent de la simulation, ils ne sont pas recalculés dans l'action — `src/games/checkpoints/actions/build-checkpoints-answer.action.ts:27`, `__tests__/unit/games/checkpoints/build-answer.test.ts:43`
- [x] La configuration n'est parsée qu'une fois, pas à chaque rendu — `src/games/checkpoints/hooks/use-checkpoints.hook.ts:20`, `__tests__/unit/games/checkpoints/use-checkpoints.test.ts:63`
- [x] `onSubmit` est appelé une seule fois, au sixième choix — `src/games/checkpoints/hooks/use-checkpoints.hook.ts:42`, `__tests__/unit/games/checkpoints/use-checkpoints.test.ts:87`
- [x] Aucun retour en arrière n'est possible sur une étape tranchée — `src/games/checkpoints/hooks/use-checkpoints.hook.ts:49`, `__tests__/unit/games/checkpoints/use-checkpoints.test.ts:116`
- [x] L'état d'une étape se lit sans la couleur — `src/games/checkpoints/components/elements/stage-track.tsx:16`, `src/games/checkpoints/components/elements/stage-track.tsx:23`
- [x] Le coût d'un choix est visible avant de trancher ; la conséquence de le refuser ne l'est jamais — `src/games/checkpoints/components/elements/choice-card.tsx:30`
- [x] Un défaut ne se repère pas au cadre de la sortie de l'IA — `src/games/checkpoints/components/composites/checkpoints-game.tsx:111` (cadre invariant, aucune branche sur `stage.defect`)
- [x] Aucun des trois choix ne se lit comme l'action recommandée — `src/games/checkpoints/components/elements/choice-card.tsx:27`, `src/games/checkpoints/components/composites/checkpoints-game.tsx:59`
- [x] Le budget sous zéro porte le signe, le poids et `--missed`, jamais la couleur seule — `src/games/checkpoints/components/composites/checkpoints-game.tsx:94`
- [x] Ajouter le jeu n'a modifié que les deux fichiers de câblage — `src/games/register-games.ts:23`, `src/games/register-components.ts:16` (le commit `02a67f7` touche aussi `run-simulation.helper.ts`, fichier de la feature, jamais un fichier hors périmètre)
- [x] Un type de jeu non résolu laisse le reste du parcours debout — `src/features/group-navigation/components/sections/course-view.tsx:61` (garde préexistante, inchangée par le diff)

### Phase 4 — Le groupe 7 dans le parcours

- [x] `course.json` augmenté se charge sans erreur — `__tests__/integration/course-run/checkpoints-run.test.ts:106`
- [x] Un mapping visant une dimension que ni la grille ni la signature ne déclarent est refusé au chargement — `__tests__/integration/course-run/checkpoints-run.test.ts:164`
- [x] Changer un coût ou un seuil dans le JSON change le résultat sans qu'une ligne de code bouge — `__tests__/integration/course-run/checkpoints-run.test.ts:150`
- [x] Une partie qui cadre tôt obtient un score d'`intervention` supérieur à une partie qui reprend tout — `__tests__/integration/course-run/checkpoints-run.test.ts:110`
- [x] La partie passe par la façade de production, sans branche réservée aux tests — `__tests__/integration/course-run/checkpoints-run.test.ts:7` (vrai `course.json`, vrai `buildGameRegistry`, vraie `GameSessionFacade` ; seules l'horloge et la persistance sont doublées)
- [x] La trace d'audit porte la soumission du jeu — `__tests__/integration/course-run/checkpoints-run.test.ts:126`
- [x] Le jeu se joue de bout en bout dans le navigateur et rend la main au parcours — `qa/parcours-de-bout-en-bout.webm`, `qa/README.md` (les six étapes tranchées, budget 10 → 6, puis `Situation 17 sur 20`)
- [x] Les sept groupes ont sept teintes distinctes, sur écran large et en largeur mobile — `qa/rampe-sept-teintes.webm`, `qa/README.md` (sept angles de teinte relevés sur le rendu, identiques en 1440×900 et 390×844, sans débordement)
- [x] Un rechargement au milieu du groupe reprend au même jeu — `__tests__/integration/course-run/checkpoints-run.test.ts:171` (couvert au niveau session, pas au niveau navigateur)

## Findings

| Sev | Kind | Phase | Location | Issue | Fix |
| --- | ---- | ----- | -------- | ----- | --- |
| 🟡 | functional | 4 | `aidd_docs/tasks/2026_08/2026_08_29_jeu-checkpoints/phase-4.md` | Le critère « le jeu se joue de bout en bout dans le navigateur et rend la main au parcours » n'a aucune preuve. Le chaînage est plausible à la lecture (`course-view.tsx:41` passe `submit`, le composant rend `null` dès la sixième décision), mais rien n'atteste qu'il a été joué | Lancer `/aidd-dev:11-browser-qa` sur le groupe 7 et déposer la vidéo à côté du plan |
| 🟡 | functional | 4 | `aidd_docs/tasks/2026_08/2026_08_29_jeu-checkpoints/phase-4.md` | Le critère « sept teintes distinctes, sur écran large et en largeur mobile » n'a aucune preuve après l'ajout du groupe 7 | Vérifier la rampe aux deux largeurs dans la même passe de QA navigateur |
| 🟡 | rot | 2 | `aidd_docs/tasks/2026_08/2026_08_29_jeu-checkpoints/phase-2.md:51` | Le Test Scope annonce qu'un joueur qui ne touche à rien satisfait « les deux premiers critères, le troisième aussi », soit 3 sur 3. Le barème de `phase-4.md` annonce 2 sur 3 pour la même partie, et c'est ce que le code fait : sans aucune reprise, `heaviestRecoveryIndex` rend `undefined` et le premier critère manque (`checkpoints.evaluator.ts:78`, `evaluator.test.ts:158`). Deux phases du même plan décrivent deux verdicts opposés pour la même partie | Corriger le Test Scope de `phase-2.md` sur le barème de `phase-4.md`, qui fait foi et que le code respecte |
| 🟢 | conform | - | `tsconfig.app.json:21` | Ni `strict` ni `noUncheckedIndexedAccess`. Le diff écrit des types `Stage \| undefined` (`run-simulation.helper.ts:53`) et un accès indexé non gardé (`checkpoints.evaluator.ts:72`, `decisions[heaviest].cost`) dont le compilateur ne vérifie rien : les gardes tiennent par discipline, pas par le typage. Préexistant, mais le code du diff s'appuie dessus | Activer `strict` dans `tsconfig.app.json` et corriger les sites révélés, dans un lot séparé |
| 🟢 | code | 3 | `src/games/checkpoints/components/composites/checkpoints-game.tsx:55` | Un `fieldset`/`legend` enveloppe trois `button`. `fieldset` groupe des contrôles de saisie ; pour un groupe d'actions, `role="group"` porté par un conteneur avec `aria-label` dit la même chose sans détourner l'élément. La fiche de surface a acté les boutons contre le groupe radio, elle n'a pas acté le `fieldset` | Remplacer par `<div role="group" aria-label="Votre réponse pour l'étape …">` et retirer la `legend` en `sr-only` |

## Verification

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Verified      | 100% (41/41) après clôture — 95% (39/41) à la revue |
| Files checked | `src/games/checkpoints/schema/config.schema.ts`, `src/games/checkpoints/schema/answer.schema.ts`, `src/games/checkpoints/helpers/run-simulation.helper.ts`, `src/games/checkpoints/checkpoints.evaluator.ts`, `src/games/checkpoints/actions/build-checkpoints-answer.action.ts`, `src/games/checkpoints/hooks/use-checkpoints.hook.ts`, `src/games/checkpoints/components/elements/stage-track.tsx`, `src/games/checkpoints/components/elements/choice-card.tsx`, `src/games/checkpoints/components/composites/checkpoints-game.tsx`, `src/games/register-games.ts`, `src/games/register-components.ts`, `config/course.json`, `__tests__/unit/games/checkpoints/*.test.ts`, `__tests__/integration/course-run/checkpoints-run.test.ts` |
| Unchecked     | Aucun. Les deux critères laissés ouverts sont couverts par `qa/` |
| Unplanned     | `cc97021` réécrit l'accessibilité de `.impeccable/surfaces/kpoints-components-composites-checkpoints-game-tsx.md` : la fiche demandait un groupe de boutons radio, elle acte les boutons de l'implémentation. Arbitrage explicite, postérieur au merge, rattaché à aucun critère du plan |

## Clôture

Traitée le 29/08 sur la branche `fix/cloture-jeu-checkpoints`, postérieure au merge de la PR #4.

| Constat | Sort | Preuve |
| --- | --- | --- |
| 🟡 `functional` — le jeu se joue de bout en bout dans le navigateur | corrigé | `qa/parcours-de-bout-en-bout.webm`, `qa/README.md` |
| 🟡 `functional` — sept teintes distinctes aux deux largeurs | corrigé | `qa/rampe-sept-teintes.webm`, `qa/README.md` |
| 🟡 `rot` — deux verdicts opposés pour la même partie | corrigé | `phase-2.md:52`, réaligné sur le barème de `phase-4.md` que le code respecte |
| 🟢 `conform` — ni `strict` ni `noUncheckedIndexedAccess` | reporté | `aidd_docs/backlog/tasks/armer-le-typage-strict-que-le-code-suppose.md`, comme la revue le demandait |
| 🟢 `code` — le `fieldset` autour des trois boutons | **rejeté** | voir ci-dessous |

### Le constat rejeté

La revue demandait de remplacer `<fieldset><legend>` par `<div role="group" aria-label>`. Le remplacement a été écrit, puis annulé : il va contre la sémantique, pas dans son sens.

- La cartographie ARIA en HTML fait de `fieldset` l'élément qui porte nativement le rôle `group`. Écrire `role="group"` sur un `div` reproduit à la main ce que `fieldset` donne, et Biome le refuse au titre de `useSemanticElements` : `The elements with this role can be changed to the following elements: <fieldset>`.
- La prémisse du constat — « `fieldset` groupe des contrôles de saisie » — ne disqualifie pas l'usage : `<button>` **est** un élément associé aux formulaires, et la spécification autorise explicitement `fieldset` à grouper d'autres contenus que des champs.

Le `fieldset` reste. La `legend` en `sr-only` nomme l'étape, ce qu'un `aria-label` sur un `div` ferait moins bien pour la même intention.
