---
verdict: changes-requested
scope: "commit 01953e2 — jeu wrong-assistant uniquement (la réparation keep-or-toss du même commit est hors périmètre)"
score: 35
reviewed: 2026-08-31
---

# Revue : le jeu `wrong-assistant`

## Verdict

`changes-requested`. Le jeu se joue, ne rappelle aucun modèle, refuse au chargement ce que le plan lui demande de refuser, et ses 63 tests passent. Mais **il ne mesure pas ce qu'il annonce** : un joueur qui ne lit rien — ni un message de l'assistant, ni le texte d'une réponse — et qui clique systématiquement le **dernier** bouton de chaque tour tient **les deux critères à 100 %**, donc le poids `resilience` complet (2 + 1). Le pire lecteur honnête, celui qui repère les trois erreurs et les conteste sans jamais vérifier, tient 2 sur 3. Le tricheur bat strictement l'expert.

C'est la classe d'échec la plus grave des quatre revues précédentes (`keep-or-toss`, douze items sur douze tranchés au verbe de tête), reproduite ici sous deux formes structurelles au lieu d'une forme lexicale. Le test qui devait la fermer existe, mais il est vacant.

## Ce qui a été mesuré, et comment

Script jetable hors dépôt, `/e/tmp/wa-review/` : les règles `flaws-caught-before-accepting` et `corrective-replies-at-least` y sont **réimplémentées depuis leur énoncé** (plan, § Phase 2), sans importer une ligne du jeu ; le corpus lu est le slot `g3-1` de `config/course.json`. L'arbre est fini et acyclique, les **15 chemins** racine→feuille sont énumérés en entier.

Témoin de fidélité : mon énumération indépendante retrouve exactement les chiffres annoncés par le commit — 15 chemins, `P(c1 ∧ c2)` en clic uniforme `= 14,8148 % = 4/27`. Les écarts rapportés ci-dessous ne viennent donc pas d'une divergence de lecture des règles.

---

## Constats, du plus grave au moins grave

### 1. CRITIQUE — La position dans la liste **est** la `stance` : « toujours le dernier bouton » tient les deux critères

`config/course.json`, slot `g3-1`, nœuds `n1`, `n3`, `n5` (les trois seuls à offrir un choix).

Sur **chacun** des trois nœuds à choix, l'ordre déclaré est identique :

```
position 1 : ["accept","accept","accept"]        <<< STANCE CONSTANTE
position 2 : ["challenge","challenge","challenge"] <<< STANCE CONSTANTE
position 3 : ["verify","reformulate","reformulate"] <<< toujours CORRECTIVE
```

La réponse **la plus longue** est corrective aux trois nœuds ; la **plus courte** est `accept` aux trois. Un verbe à l'impératif (`Montrez`, `Fixez`, `Ajoutez`) marque la corrective aux trois.

**Ce qui casse.** Un joueur ouvre l'écran, ne lit aucun message, clique le bouton du bas à chaque tour, valide, part :

| Profil | Lecture | `c1` | `c2` | Poids obtenu |
| --- | --- | --- | --- | --- |
| toujours la **dernière** de la liste | aucune | **OK** | **OK** | **3 / 3** |
| la **plus longue** en caractères | aucune | **OK** | **OK** | **3 / 3** |
| lecteur honnête qui conteste sans vérifier | complète | OK | RATÉ | 2 / 3 |
| toujours accepter | aucune | RATÉ | RATÉ | 0 / 3 |
| toujours la première de la liste | aucune | RATÉ | RATÉ | 0 / 3 |
| toujours la 2e si elle existe | aucune | OK | RATÉ | 2 / 3 |

Le meilleur profil aveugle **ne reste pas sous** le pire profil de lecture correcte : il le dépasse, sur les deux critères à la fois. `BUILD-ORDER.md:145` — « Un jeu livré sans garde-fou est un jeu qui se joue au lieu de mesurer. »

Le garde-fou ne dépend pas du seuil : mesuré à `threshold` 1, 2 et 3, le profil « toujours la dernière » tient `c1` **et** `c2` dans les trois cas.

`ReplyChoice` (`src/games/wrong-assistant/components/elements/reply-choice.tsx:6-8`) documente pourtant : « jamais un ordre stable qui la classerait. `WrongAssistantGame` les pose dans l'ordre où le corpus les déclare ». C'est exact, et c'est précisément le problème : **le corpus déclare un ordre stable**. Le composant tient sa promesse, le corpus l'annule.

### 2. CRITIQUE — Le nombre de réponses offertes partitionne parfaitement défectueux / sain

`config/course.json`, slot `g3-1`, les sept nœuds.

```
separateur "nombre de reponses offertes" : *** PARTITIONNE PARFAITEMENT ***
  defectueux = [3]   sains = [1]
```

Les trois nœuds `flawed: true` (`n1`, `n3`, `n5`) offrent 3 réponses. Les quatre nœuds `flawed: false` (`n2`, `n4`, `c1`, `c2`) en offrent 1, forcée.

**Ce qui casse.** « Rien ne distingue un tour défectueux d'un tour sain » (plan, Phase 3 ; fiche de surface ligne 31 ; message de commit) est vrai **du rendu** et faux **de la situation** : le joueur sait qu'un tour ment exactement quand on lui donne le choix. Il n'a jamais à lire un seul message de l'assistant pour savoir lequel juger — et comme le constat 1 lui dit lequel des trois boutons choisir, il n'a jamais non plus à lire une réponse. Les deux tells composés suffisent à jouer la partie entière les yeux fermés.

Aucun lexème ne partitionne les messages (vérifié : aucun mot présent dans les trois défectueux et absent des quatre sains, ni l'inverse), aucune longueur, aucune ponctuation, aucun chiffre. La prose est propre. C'est la **forme de l'arbre** qui trahit.

### 3. MAJEUR — La `question` de `c1` promet « repérée », la règle calcule « pas acceptée »

`config/course.json` : `"question": "Chaque erreur rencontrée a-t-elle été repérée avant d'être acceptée ?"`
`src/games/wrong-assistant/helpers/read-exchange.helper.ts:74` : `caught: node.flawed && reply.stance !== 'accept'`

La règle ne lit aucune détection : elle lit une **non-acceptation**, quelle qu'en soit la raison.

**Ce qui casse.** Le texte de `n1-challenge` est « Un vendredi soir, ça me semble aller vite. » — une inquiétude de calendrier qui ne mentionne ni les tests, ni le diff, ni quoi que ce soit de faux dans l'affirmation. Un joueur qui n'a rien repéré et se méfie par tempérament (ou qui clique le 2e bouton sans lire, profil mesuré ci-dessus : `c1` OK) s'entend dire dans le relevé de verdict : « Chaque erreur rencontrée a-t-elle été repérée avant d'être acceptée ? — satisfait ». Il n'a repéré aucune erreur.

Même classe qu'`ambiguity-scan` (part brute promise, part nette calculée) et que `keep-or-toss` (« dépasse » pour un `>=`), inscrite en `BUILD-ORDER.md:147` : « La `question` affichée d'un critère doit décrire *exactement* ce que sa règle calcule. » La question honnête serait « Aucune erreur rencontrée n'a-t-elle été acceptée ? ».

`c2` en revanche est exact : « choisie au moins deux fois » contre `correctiveRepliesCount >= threshold`, `threshold: 2`. Comparaison et compte concordent, pas de dénominateur en jeu.

### 4. MAJEUR — Le test censé fermer la classe 3 est vacant, et ne couvre ni longueur ni position

`__tests__/unit/games/wrong-assistant/brute-force.test.ts:236-254`, `it('never lets a first word give the stance away within a single node')`.

Ce que le test vérifie : qu'au sein d'un même nœud, deux réponses de camps différents ne commencent pas par le même mot. Or chaque nœud du corpus porte au plus une réponse par `stance`, et les treize premiers mots du corpus sont tous distincts : la boucle ne peut structurellement jamais lever. Le test passe sans rien contraindre.

Il vérifie de surcroît **l'inverse du risque** : des premiers mots *différents* par camp sont un tell, pas une protection.

`BUILD-ORDER.md:147` nomme exactement ce qu'il fallait écrire : « un **test qui calcule sur le corpus réel** qu'aucun lexème, aucun verbe de tête, **aucune longueur, aucune position** ne partitionne le lot selon la réponse attendue ». Longueur et position sont absentes du test, et ce sont les deux qui cassent (constat 1). Le plan (Phase 5) demandait la même chose et n'a pas été tenu.

### 5. MAJEUR — `challenge` et `verify`/`reformulate` produisent exactement la même suite : `c2` note une distinction que la situation rend invisible

`config/course.json` : `n1-challenge` et `n1-verify` pointent tous deux `nextId: "n2"` ; `n3-challenge` et `n3-reformulate` pointent tous deux `"n4"` ; `n5-challenge` et `n5-reformulate` ferment tous deux le scénario.

**Ce qui casse.** Scénario : le joueur conteste aux trois tours défectueux. L'assistant concède à chaque fois — « Vous avez raison, seuls les tests unitaires sont passés », puis « D'accord, je fige chaque dépendance à une version précise » — exactement comme s'il avait vérifié ou reformulé. La partie lui enseigne donc que contester **suffit**, puis le relevé de verdict lui retire le tiers du poids `resilience` pour ne pas avoir vérifié.

Le plan fait de cette distinction sa raison d'être (« Sans un troisième camp qui refuse sans agir, les deux critères se confondraient »), et la Decision « Quatre `stance` » la justifie. Le corpus l'annule : aucune conséquence, aucun changement de réponse de l'assistant, aucun signal dans le fil ne distingue les deux camps. Le critère `c2` note un geste que rien dans la situation ne motive.

### 6. MAJEUR — `n2` affirme comme sain l'énoncé exact que `n3` porte comme défectueux

`config/course.json`, `n2` (`"flawed": false`) : « … les dépendances du module sont toutes épinglées à une version précise et à jour. »
`n3` (`"flawed": true`) : « Toutes les dépendances du module sont épinglées à une version précise et à jour, aucune n'a de faille connue. »
`n3.flaw` : « Le paquet de parsing utilisé est fixé sur `latest`, **pas sur une version précise** … »

La proposition « toutes épinglées à une version précise » est déclarée fausse par le `flaw` de `n3`, et posée verbatim comme vraie à `n2`.

**Ce qui casse.** Scénario : un joueur lit vraiment. Il repère à `n2` que l'assistant vient de glisser une affirmation invérifiable sur les dépendances. Son unique bouton est « Notez ça, et voyons la suite. » (`stance: accept`). La lecture enregistre `n2` comme sain et son acceptation comme gratuite. Un tour plus tard, la même affirmation revient et devient notée. Le drapeau `flawed` n'est donc pas une propriété du contenu mais de la **position dans l'arbre** — ce qui recoupe le constat 2 par un autre chemin, et rend le corpus incohérent avec lui-même.

### 7. MAJEUR — Le nœud de conséquence `c1` est réutilisé pour `n5`, et raconte alors une faute que le joueur n'a pas commise

`config/course.json` : `n1-accept` → `c1` et `n5-accept` → `c1`.

**Ce qui casse.** Chemin réel, énuméré : `n1-verify` → `n2-1` → `n3-challenge` → `n4-1` → `n5-accept` → `c1`.

Le joueur a exigé le rapport complet au premier tour, contesté au troisième, puis accepté au cinquième la fausse affirmation sur le champ vide (`n5.flaw` : « la fonction lève une exception non interceptée dès qu'elle reçoit une chaîne vide »). Le fil lui affiche alors :

> « La fusion est passée sans relecture. Le pipeline de nuit signale un test d'intégration en échec sur cette branche, déjà en production. »

Il n'a pas fusionné sans relecture — il a explicitement demandé le rapport, et l'assistant a concédé à `n2` que seuls les tests unitaires étaient passés. Le test d'intégration en échec est le `flaw` de `n1`, qu'il a justement **repéré**. Rien dans ce constat ne parle du champ vide qu'il vient d'accepter.

La quatrième acceptance de la story (« Une branche acceptée à tort produit une conséquence visible plus loin dans le scénario ») est mécaniquement garantie — les 7 chemins acceptants atteignent bien un nœud à `consequence`, vérifié — mais la conséquence rendue **ne correspond pas à la faute** sur ce chemin. Le signal existe, il désigne autre chose.

Accessoirement, « plus loin dans le scénario » est optimiste : `c1` et `c2` sont toujours le tour **immédiatement suivant**, et toujours terminal. Accepter à `n1` clôt la partie en 2 pas sur 5. La fiche de surface (ligne 25) promet une conséquence « qui tombe plus loin dans le scénario, jamais au tour même » — elle tombe au tour d'après, et met fin à la partie.

### 8. MAJEUR — Le seuil `threshold: 2` et la prose « au moins deux fois » ne se comparent nulle part

`config/course.json`, `g3-1-c2` : la règle porte `"threshold": 2`, la question porte « … choisie **au moins deux fois** ? ». Aucun test ne lie les deux (`grep` sur les 7 fichiers de test : le nombre `2` n'est jamais rapproché du texte de la question).

**Ce qui casse.** Un caractère dans `config/course.json` fait passer `threshold` à `3`. Le relevé de verdict continue d'afficher « la branche reformuler ou vérifier a-t-elle été choisie au moins deux fois ? — manqué » à un joueur qui l'a choisie deux fois. Mesuré :

| `threshold` | chemins tenant les deux | clic aveugle pondéré | profil « toujours la dernière » |
| --- | --- | --- | --- |
| 1 | 7 / 15 | **25,93 %** (> plafond 25 % du plan) | c1 OK, c2 OK |
| 2 (actuel) | 4 / 15 | 14,81 % | c1 OK, c2 OK |
| 3 | 1 / 15 | 3,70 % | c1 OK, c2 OK |
| 4 | 0 / 15 | 0,00 % | c1 OK, c2 RATÉ |

Le plafond de 25 % que le plan fixe se franchit donc aussi à un caractère près, sans qu'aucun test ne le voie autrement que par la valeur épinglée `4/27`. C'est la leçon de `flow-order`, `BUILD-ORDER.md:147` : « Un seuil figé dans le code et un seuil déclaré dans le parcours doivent se voir quelque part. »

### 9. MINEUR — Ambiguïté du critère du plan, tranchée dans le sens qui passe

Plan, Phase 5 : « la part de chemins au hasard qui tiennent les deux critères reste **sous 25 %** ».

Deux lectures possibles, et elles ne donnent pas le même verdict :

- part **pondérée** par la probabilité d'un clic uniforme par nœud : **14,81 %** → sous le plafond ;
- part **brute** des chemins : **4 / 15 = 26,67 %** → au-dessus du plafond.

L'implémenteur a retenu la première et l'argumente longuement (`brute-force.test.ts:19-27`) ; l'argument est juste sur le fond — un chemin n'est pas équiprobable à un autre. Mais le critère du plan reste ambigu au mot, et la lecture retenue est la seule des deux qui passe. À trancher explicitement dans le plan plutôt qu'à l'implémentation.

### 10. MINEUR — Le champ `consequence` n'atteint jamais l'écran : écart de plan non déclaré, et donnée morte

Plan, Phase 3 : « Quand un nœud porte une `consequence`, elle s'affiche **dans le fil, à sa place**, comme un constat de l'assistant ».

`grep -rn "consequence" src/` : le champ n'est lu que par `config.schema.ts:77,288` (les gardes) et par `read-exchange.helper.ts:76,89`. Le hook ne l'expose pas ; `PlayedTurn` (`use-wrong-assistant.hook.ts:13-17`) ne porte que `assistantMessage` et `chosenReplyText`. La chaîne n'est rendue nulle part.

Ce que le joueur voit à `c1`/`c2` est le `message` du nœud, qui redit la même chose en d'autres mots — duplication d'information entre `message` et `consequence` dans le corpus, et le second n'est qu'un marqueur booléen déguisé en prose.

Conséquence directe : `Reading.consequencesHit` (`read-exchange.helper.ts:43,89`) n'est lu par **aucune règle** de l'évaluateur. Il n'existe que pour les tests. Code mort en production.

### 11. MINEUR — La garde « aucune conséquence hors acceptation d'un tour défectueux » ne couvre pas la racine

`src/games/wrong-assistant/schema/config.schema.ts:284-294`.

La garde s'arme sur les **arêtes** : pour chaque réponse, si sa cible porte une `consequence` sans être l'acceptation d'un nœud défectueux, refus. Vérifié par sonde : elle tient aussi bien sur une arête directe que sur une chaîne forcée traversant plusieurs nœuds sains (les deux cas sont refusés, avec le bon message). C'est plus solide que le seul cas nommé au test — bon point.

Le trou : **aucune arête ne vise la racine**. Sonde `E` (`/e/tmp/wa-review/probe2.mts`) — un `rootId` portant lui-même une `consequence` est **accepté** par le schéma. Tout joueur, y compris le lecteur parfait qui n'accepte jamais rien, verrait alors le dommage au premier tour. Le plan pose l'invariant « aucun nœud sain ne mène à une `consequence` » ; il se contourne par la racine.

Impact réel aujourd'hui : nul (le corpus ne le fait pas, et la `consequence` n'est de toute façon pas rendue — constat 10). Latent.

### 12. MINEUR — La fiche de surface affirme deux choses que la mesure dément

`.impeccable/surfaces/tant-components-composites-wrong-assistant-game-tsx.md`

- **Ligne 33** : « **Rien ne classe les réponses par `stance`.** … pas d'ordre stable (les réponses restent dans l'ordre où le corpus les déclare) … Le corpus réel est vérifié en force brute (`brute-force.test.ts`) ». La parenthèse est exacte et l'affirmation est fausse : l'ordre du corpus **est** l'ordre des `stance`, aux trois nœuds (constat 1), et la vérification invoquée est vacante (constat 4). La fiche adosse sa garantie à un test qui ne la porte pas.
- **Ligne 60** : « Les **quatre** réponses possibles à chaque tour ». Le corpus en offre **trois** au maximum, et une seule sur quatre nœuds sur sept.

Le reste de la fiche dit vrai, y compris les mesures navigateur : les hauteurs `max-h-[13vh] sm:max-h-[28vh]` (fil) et `max-h-[10vh] sm:max-h-[14vh]` (révélation) correspondent au code rendu (`exchange-thread.tsx:64`, `wrong-assistant-game.tsx:82`), et le tableau « avant/après resserrage » est cohérent avec ces valeurs.

### 13. MINEUR — `aria-live` et déplacement de focus se disputent la même annonce

`src/games/wrong-assistant/components/composites/exchange-thread.tsx:62-64` (`aria-live="polite"` sur la zone du fil) et `:85` (`autoFocus={index === 0}` sur la première réponse).

Les deux se déclenchent au même rendu. Un déplacement de focus interrompt généralement une annonce `polite` en cours : le nouveau tour de l'assistant — la matière même à juger — risque de n'être jamais lu, le lecteur d'écran annonçant à la place le libellé du bouton qui vient de prendre le focus. L'utilisateur doit alors remonter le fil à la main à chaque tour.

Non mesuré avec un lecteur d'écran réel ; signalé comme risque, pas comme fait. La fiche de surface (ligne 66) présente les deux mécanismes comme complémentaires sans avoir mesuré leur interaction.

---

## Ce qui tient, et qui a été vérifié

**Contrainte d'épique — aucun appel à un modèle pendant une partie.** `grep -rn "fetch\|axios\|XMLHttpRequest" src/games/wrong-assistant/` : aucune occurrence. Aucune construction de réponse d'assistant à la volée : `use-wrong-assistant.hook.ts` ne fait que suivre les `nextId` du corpus. L'arbre entier vit dans `config/course.json`. **Acceptance 1 de la story : tenue.**

**Pureté du domaine.** Ni `Date`, ni `Date.now`, ni `Math.random`, ni `window`, ni `localStorage` dans le périmètre. Aucun import React hors `components/` et `hooks/` : `config.schema.ts`, `answer.schema.ts`, `read-exchange.helper.ts`, `wrong-assistant.evaluator.ts` et `build-wrong-assistant-answer.action.ts` sont purs.

**Smart/Dumb.** Respecté. `useWrongAssistant` porte tout l'état ; `ExchangeThread`, `AssistantTurn` et `ReplyChoice` ne reçoivent que du texte et un callback. `AssistantTurn` ne reçoit jamais `flawed`, `flaw`, `consequence` ni `stance` — vérifié par lecture des props et par le test DOM `wrong-assistant-game.test.tsx:101-106`. Aucune fuite par le rendu.

**Lecture unique et partagée.** `readExchange` est appelé une seule fois par `evaluate` (`wrong-assistant.evaluator.ts:72`) et les deux règles lisent la même lecture. Aucun seuil dans le helper : le `threshold` ne vit que dans le parcours, lu par la règle. Conforme au plan.

**Trace sans champ dérivé.** `wrongAssistantAnswerSchema` ne porte que `{ nodeId, replyId }[]`. Tout ce qui est jugé se recalcule depuis l'arbre. `parseWrongAssistantTrace` refuse bien les quatre cas annoncés (nœud inconnu, réponse étrangère au nœud, premier pas hors `rootId`, chaînage rompu), et l'écran repasse par le même contrat avant de soumettre (`build-wrong-assistant-answer.action.ts`).

**`flawedNodesMet > 0` dans `c1`.** Vérifié des deux côtés. Sur le corpus réel, **0 chemin sur 15** ne croise aucun nœud défectueux (la racine `n1` est défectueuse, donc tout chemin en rencontre au moins un). Et la règle **fermerait** bien le cas si un corpus futur en créait un : sonde `D` — un arbre offrant une branche qui évite tous les nœuds défectueux est **accepté** par le schéma (comme le plan l'annonce), et la règle rend alors `false` puisque `flawedNodesMet === 0`. Décision du plan tenue et justifiée.

**Garantie de conséquence.** Les 7 chemins qui acceptent un tour défectueux atteignent tous un nœud à `consequence` ; les 8 autres n'en atteignent aucun. Le schéma le garantit vraiment, pas seulement sur le cas nommé au test : sonde `A` — une `consequence` atteinte depuis un nœud sain par une **chaîne forcée de deux nœuds** est refusée, avec le message exact `« la réponse "relay-1" du nœud "relay" mène au nœud de conséquence "cons2" sans être l'acceptation d'un nœud défectueux »`. Seule la racine échappe à la garde (constat 11).

**Irréversibilité.** Aucun chemin de retour. `reply()` (`use-wrong-assistant.hook.ts:70-86`) n'écrit que vers l'avant ; `currentNode` vaut `undefined` dès la phase `'revealed'`, ce qui neutralise tout appel tardif. Les boutons de réponse sont remontés par `key={reply.id}` à chaque tour, donc les anciens sont démontés — aucun DOM résiduel ne reste cliquable. Aucun historique navigateur, aucun état React ne permet de rejouer un tour. `advance()` est protégé contre le double appel par `submittedRef`, vérifié au test (`wrong-assistant-game.test.tsx:142-169`). L'arbre étant acyclique, aucun nœud n'est traversé deux fois et `nodeId` reste une clé stable.

**Aucune valeur de seuil sur une surface jouée.** La consigne du corpus annonce le cadre (« un choix posé ne se reprend pas ») et rien de ce qui est noté. La `question` d'un critère n'est rendue que dans le relevé de verdict (`summary-view.tsx:96`), jamais pendant la partie. `DESIGN.md` — « Un jeu ne dit jamais ce qu'il note » — tenu.

**Aucune conséquence formulée en verdict.** Les messages de `c1` et `c2` sont des constats de situation (« Le pipeline de nuit signale… », « Le paquet resté sur `latest` a été mis à jour cette nuit côté registre… »), jamais un jugement adressé au joueur. Le mot « erreur » n'apparaît dans aucun des deux. La révélation ne montre que les `flaw` des tours défectueux **rencontrés**, jamais lesquels ont été laissés passer, jamais un score — vérifié par le test `/correctement|manqué|réussi|raté|score|repéré/i` et par lecture du composant `Revelation`.

**Clavier et pointeur.** Parité par construction : chaque réponse est un `<button type="button">` natif, sans `role` ni `aria-label` surchargés, sans geste bespoke. Tab / Entrée / Espace déclenchent le même `onClick` que le pointeur, et aucun bouton n'est `disabled`. Le nom accessible de chaque réponse **est** son texte visible, sans concaténation. Le bouton « Continuer » est un `Button` standard du projet.

**Surface propre au jeu (`DESIGN.md:66-67`).** Comparée bloc par bloc à `practice-map`, `ambiguity-scan`, `flow-order` et `keep-or-toss` : la composition — zone de fil bornée et défilante qui s'allonge, pied de réponses **fixe hors de la zone**, aucun repli, aucune manche, aucune pile, aucun chronomètre — n'existe dans aucun des quatre. Ce qui est partagé se limite à la coquille commune (`flex flex-col gap-3 sm:gap-6`, consigne `max-w-[54ch] text-lg`) et au panneau de révélation (`border border-plane-rule bg-plane` + micro-en-tête capitale + « Continuer »), identiques chez `practice-map` et `ambiguity-scan` : ce sont des jetons du système de design, pas une composition héritée. Aucun `border-l-*` comme marque d'état. Aucune animation d'étape. Une seule action primaire par écran. **Pas de constat sur cet axe.**

**Phases du plan.** Les cinq sont livrées. Phase 4 vérifiée dans le détail : `g3-1` passe de `test-bench` à `wrong-assistant`, le mapping `harness`/`inferred` du placeholder a bien disparu, les deux critères portent `resilience` en poids 2 et 1, et `evidence` par défaut vaut `measured` (`course.schema.ts:20`). Blocs présents dans `register-games.ts` et `register-components.ts`.

**Outillage.** 63 tests passent sur les 7 fichiers du périmètre (`npx vitest run __tests__/unit/games/wrong-assistant` : `Test Files 7 passed (7) · Tests 63 passed (63)`). `biome check` sur le périmètre : `Checked 17 files. No fixes applied.`

**Défauts déjà en backlog, non re-signalés** : `la-revelation-precede-le-verrou-donc-un-rechargement-la-rejoue.md` et `la-revelation-pousse-l-action-hors-de-l-ecran.md`. Aucune aggravation propre à ce jeu constatée ; sur le second, la fiche de surface montre au contraire un resserrage mesuré qui ramène la décision sous la ligne de flottaison aux six états.

---

## Hors périmètre, signalé au passage

`npx tsc -b --noEmit` échoue actuellement dans ce worktree (14 lignes d'erreur), dont trois sur `__tests__/unit/games/wrong-assistant/evaluator.test.ts:73,80,143` (`Property 'evidence' is missing`). **Ce n'est pas un défaut de `01953e2`** : le champ `evidence` n'existait pas à ce commit (`git show 01953e2:src/core/contracts/course.schema.ts | grep evidence` → vide), il est introduit par le chantier « restitution du verdict » présent en staged dans ce worktree. Ce chantier a mis à jour les tests d'évaluateur des huit autres jeux mais **a oublié `wrong-assistant` et `keep-or-toss`**. À corriger côté verdict, pas ici.

---

## Score

**35 / 100.**

Le validateur (plan + story) ne définit ni pondération ni seuil ; le score est la proportion d'acceptances tenues, ajustée de la sévérité.

| Acceptance de la story | État |
| --- | --- |
| Arbre écrit à l'avance, aucun modèle appelé | **tenue** |
| Le critère « erreur détectée avant acceptation » ressort satisfait ou manqué | **partielle** — il ressort, mais il se tient à l'aveugle (constat 1) et sa question promet autre chose que ce qu'il calcule (constat 3) |
| Le critère « branche reformuler ou vérifier choisie » ressort satisfait ou manqué | **partielle** — il ressort, mais il se tient à l'aveugle (constat 1) et note une distinction que le scénario efface (constat 5) |
| Une acceptation à tort produit une conséquence visible plus loin | **partielle** — garantie mécaniquement, mais le constat rendu peut désigner une autre faute que celle commise (constat 7) |

Une acceptance sur quatre pleinement tenue, trois partielles, soit ≈ 55 % sur la seule proportion. Abattu à 35 par la sévérité : deux constats critiques qui, ensemble, permettent de tenir **les deux** critères sans lire une ligne, et qui violent frontalement une règle écrite du projet (`BUILD-ORDER.md:145,147`). Un jeu de mesure dont le meilleur profil aveugle bat le pire lecteur honnête ne mesure pas — c'est la définition que `BUILD-ORDER.md` s'est donnée après `lie-detector`.

Aucun de ces constats n'est difficile à fermer : mélanger l'ordre des réponses par nœud et donner un choix réel aux nœuds sains désarment les deux critiques ; le test de séparabilité manquant (longueur, position, nombre de réponses) les empêche de revenir.
