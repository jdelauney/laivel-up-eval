---
verdict: changes-requested
scope: "jeu `keep-or-toss` au commit eeea851 (la réparation de `flow-order` du même commit est hors périmètre)"
reviewed: 2026-08-31
score: 55/100
---

# Revue — le jeu `keep-or-toss`

## Verdict

`changes-requested`. La mécanique tient, les tests sont verts, le domaine est propre. Ce qui ne tient pas est ce que le jeu prétend mesurer : **ses deux critères se satisfont sans aucune connaissance de sécurité**, l'un par un geste unique répété, l'autre par une heuristique de formulation qui donne 12/12 sur le corpus réel. Un joueur sans la moindre pratique encaisse les 3 points de poids sur `verification`, et ce +1 franchit le palier `0.4` de `signature.json` pour quiconque siège à 9/24.

Ce qui a été exécuté pour cette revue : lecture du commit, des quatre acceptances de la story, des cinq phases du plan, de l'épique, de `DESIGN.md` §60-75 et §93-94, de `BUILD-ORDER.md` §143-147 ; `npx vitest run __tests__/unit/games/keep-or-toss __tests__/integration/config-loading` → **12 fichiers, 104 tests verts** ; `npx biome check src/games/keep-or-toss __tests__/unit/games/keep-or-toss` → **19 fichiers, 0 erreur** ; `npm run typecheck` → **0 erreur** ; et deux passages en force brute écrits hors dépôt (`/e/tmp/keep-or-toss-brute-force.mjs`, `/e/tmp/keep-or-toss-question-vs-rule.mjs`), qui **réimplémentent les deux règles depuis leur énoncé** — aucune ligne importée du jeu — et tournent sur le slot `g4-2` réel de `config/course.json`.

---

## Ce que la force brute a mesuré

Corpus `g4-2` : 12 items, 6 « garder », 6 « jeter », `durationSeconds: 20`, seuil `c1 = 0.75` (9 justes sur 12). Verdicts attendus dans l'ordre de présentation : `GGJGJJGJGJGJ`.

### Les 4096 traces complètes

| Lecture | Tiennent `c1` | Tiennent `c2` | Tiennent les deux |
| --- | --- | --- | --- |
| 4096 traces complètes, rendues dans le budget | **299** (7,30 %) | **4096** (100 %) | **299** (7,30 %) |

Distribution par nombre de justes : `j=0:1, 1:12, 2:66, 3:220, 4:495, 5:792, 6:924, 7:792, 8:495, 9:220, 10:66, 11:12, 12:1`. `c1` tient à `j >= 9` et nulle part en dessous. Contrôle Monte-Carlo sur 200 000 tirages 50/50 : 6,90 % (attendu 7,30 %).

**Toute trace complète rendue dans le budget tient `c2`, sans exception.** `c2` ne discrimine rien parmi les traces complètes ; il ne sépare que « a fini » de « n'a pas fini ».

### Profil par profil

| Profil | Triés | Justes | `c1` | `c2` |
| --- | --- | --- | --- | --- |
| garde tout (12 × ArrowLeft) | 12 | 6 | non | **oui** |
| jette tout (12 × ArrowRight) | 12 | 6 | non | **oui** |
| alterne G/J dès la 1re carte | 12 | 8 | non | **oui** |
| alterne J/G dès la 1re carte | 12 | 4 | non | **oui** |
| moitié G puis moitié J | 12 | 6 | non | **oui** |
| **polarité de la formulation, zéro connaissance sécurité** | **12** | **12** | **oui** | **oui** |
| trie 8 justes puis abandonne | 8 | 8 | non | non |
| trie 9 justes puis abandonne | 9 | 9 | oui | non |
| lecture correcte, 3 erreurs, lot bouclé | 12 | 9 | oui | oui |
| lecture correcte, 4 erreurs, lot bouclé | 12 | 8 | non | oui |
| lecture correcte parfaite, rendue à 21 s | 12 | 12 | oui | non |

Sur l'axe `c1`, la réponse à la question posée est **oui** : le meilleur profil aveugle déterministe (alterne G/J, 8/12) reste strictement sous le pire profil de lecture correcte qui passe encore (3 erreurs, 9/12). Sur l'axe `c2`, la réponse est **non**, et c'est le constat 1.

---

## Constats

### 1. `c2` récompense le geste aveugle et reste hors de portée du joueur qui lit — critique

`config/course.json` slot `g4-2`, critère `g4-2-c2` · `src/games/keep-or-toss/helpers/read-sorting.helper.ts:49-50`

**Ce qui casse.** Un joueur qui ne lit rien tient `c2` en environ deux secondes : douze `ArrowLeft`, `sortedCount === total`, `elapsedSeconds ≈ 2 <= 20`. Un joueur qui lit ne le tient pas. Mesure du corpus réel :

```
libellés : 769 caractères, 117 mots pour 12 cartes
budget : 20 s => 1.67 s par carte, 38.5 caractères/s, 351 mots/minute exigés
```

351 mots/minute **soutenus, plus un verdict garder/jeter par carte**, contre une vitesse de lecture silencieuse de prose non fictionnelle autour de 240 mots/minute. Même à 400 mots/minute d'écrémage, les 117 mots consomment 17,6 s des 20 s et laissent 2,4 s pour douze jugements. Le profil « lit correctement » finit donc typiquement à 8 ou 9 cartes sur 12 : `c2` manqué, et à 8 cartes `c1` manqué aussi (8/12 = 0,667 < 0,75).

Scénario concret : deux joueurs sur le même écran. A martèle `ArrowLeft` pendant deux secondes → `c1` non, **`c2` oui**, 1/24 de `verification`. B lit chaque pratique, en classe huit correctement, le chronomètre le gèle → `c1` non, `c2` non, **0/24**. **Le tricheur sort strictement au-dessus de l'expert consciencieux.** C'est la classe d'échec que `BUILD-ORDER.md:147` désigne — « deux critères passaient les tests en récompensant l'inverse de ce qu'ils annonçaient » — et que l'épique interdit en Success Evidence : « Un joueur qui tente de tricher un jeu […] n'obtient pas un cran supérieur ».

**Ce que ça vaut, chiffré.** `verification` porte 24 points de poids possible sur tout le parcours (`g1-1-c1:2 g1-1-c2:2 g1-1-c3:2 g1-1-c4:1 g1-2-c1:2 g1-2-c2:2 g1-2-c3:2 g1-2-c4:1 g1-3-c1:2 g1-3-c2:2 g4-1-c1:2 g4-1-c2:1 g4-2-c1:2 g4-2-c2:1`). Donc :

| Ce qui est obtenu | Poids | Part de `verification` |
| --- | --- | --- |
| `c2` seul (tout garder) | 1/24 | **4,17 pt** |
| `c1` seul | 2/24 | 8,33 pt |
| `c1` + `c2` | 3/24 | 12,50 pt |

Et ce +1/24 n'est pas cosmétique. Franchissements de palier qu'il ouvre à lui seul, mesurés contre `config/signature.json` :

```
 9/24 = 0.3750 -> 10/24 = 0.4167 franchit le palier 0.4 « vérifie après coup »
16/24 = 0.6667 -> 17/24 = 0.7083 franchit le palier 0.7 « vérifie avant d'accepter »
23/24 = 0.9583 -> 24/24 = 1.0000 franchit le palier 1
```

Le palier `0.4` est la condition d'entrée du niveau `aidd-en-route` (`signature.json`, `levels[1].conditions`). **Un joueur assis à 9/24 passe de `vibe-coder` à `AIDD en route` en martelant une flèche pendant deux secondes.** 9/24 est atteignable (par exemple `2+2+2+2+1` sur les critères de `g1-1`/`g1-2`).

**Verdict sur la question posée : non, ce n'est pas acceptable en l'état.** `c2` doit exiger davantage que la complétude — au minimum la complétude **conditionnée à un plancher de justesse** (par exemple : lot entier trié *et* `correctShare` au-dessus d'un plancher bas), ce qui rend le geste unique répété inopérant sans pénaliser le lecteur rapide. Alternative, si l'on tient à garder `c2` pur : rendre le budget compatible avec une lecture réelle (le corpus demande aujourd'hui 351 mots/minute), ce qui ne referme pas la fuite du geste répété mais lui retire son avantage sur l'expert. Le poids 1 ne suffit pas à rendre la fuite inoffensive, la démonstration de bascule de palier ci-dessus le montre.

### 2. `c1` se satisfait 12/12 par la polarité des formulations, sans une once de connaissance sécurité — critique

`config/course.json`, les douze `label` du slot `g4-2`

**Ce qui casse.** Le corpus est séparable sans lire le fond, uniquement sur la forme du libellé. Règle appliquée à l'aveugle, sans domaine : « le libellé prescrit-il l'ajout d'un contrôle (`Chiffrer`, `Valider`, `Faire tourner`, `Limiter`, `Journaliser`, `Appliquer`) ou décrit-il un relâchement (`Stocker … dans le dépôt`, `Désactiver`, `Partager`, `Construire … par concaténation`, `Laisser … ouvert`, `Accorder … par défaut`) ? » Sortie du passage en force brute :

```
verdicts déduits : GGJGJJGJGJGJ
attendus         : GGJGJJGJGJGJ
justes : 12 / 12 => c1 true | c2 (lot bouclé) true
items que l’heuristique rate : aucun
```

**Douze sur douze. La partition « verbe vertueux vs. formule de relâchement » est exactement la partition garder/jeter.** Le premier mot de chaque libellé suffit :

```
p1  G Chiffrer     p2  G Valider     p3  J Stocker      p4  G Faire
p5  J Désactiver   p6  J Partager    p7  G Limiter      p8  J Construire
p9  G Journaliser  p10 J Laisser     p11 G Appliquer    p12 J Accorder
```

Scénario concret : un joueur qui n'a jamais entendu parler d'injection SQL ni de rotation de clés applique « ça sonne prudent → garder / ça sonne négligent → jeter », obtient 12/12, tient `c1` **et** `c2`, et encaisse 12,50 pt de `verification` sans avoir démontré quoi que ce soit. L'épique exige l'inverse : « Deux joueurs de pratiques opposées qui font le même parcours en ressortent avec des scores d'axes différents ». Ici ils en ressortent au même endroit.

Ce constat aggrave le 1 : le budget de 20 s **force** la lecture par polarité (personne ne lit 117 mots en 20 s), et la polarité donne la réponse complète. Le jeu ne mesure pas « ce que je sais sans le temps de le chercher », il mesure la capacité à reconnaître un ton.

Le plan avait posé la contrainte — « écrites pour que le tri se joue sur la connaissance et non sur la formulation — pas de « jamais » ni de « toujours » qui trahiraient la réponse » (`plan.md`, phase 4). Le contrôle littéral est tenu (`mots interdits par le plan (jamais/toujours) : aucun`), la contrainte réelle ne l'est pas : le tell n'était pas dans les adverbes, il est dans le verbe de tête. Un correctif porte sur le corpus, pas sur le code : au moins la moitié des libellés doivent être des pratiques dont la polarité de surface **contredit** le verdict attendu (une pratique qui sonne prudente mais expose, une pratique qui sonne relâchée mais tient).

### 3. Le libellé de la carte n'est jamais annoncé : un joueur au clavier ne sait pas ce qu'il trie — majeur

`src/games/keep-or-toss/components/composites/sorting-deck.tsx:53-91` · `src/games/keep-or-toss/components/elements/practice-card.tsx:10-16`

**Ce qui casse.** Le seul `aria-live` de la surface porte l'annonce de palier du chronomètre (`countdown-bar.tsx:52-54`). La carte courante est un `<p>` inerte dans un `<div>` non focusable, et le focus reste sur le bouton « Garder », dont le nom accessible est « Garder », rien de plus. Scénario : un joueur au lecteur d'écran presse `ArrowLeft` ; la carte suivante se substitue silencieusement ; rien n'est vocalisé. Pour connaître la carte suivante il doit sortir du bouton, parcourir la page au curseur virtuel, revenir — impossible dans un budget de 1,67 s par carte. Le seul comportement jouable qui lui reste est de marteler une flèche, c'est-à-dire exactement le profil de triche du constat 1.

`DESIGN.md:93-94` place cette responsabilité dans le jeu : « Les jeux chronométrés et les glissers-déposers sont l'exception : leur interaction est propre, donc l'atteignabilité au clavier et l'annonce du minuteur sont à traiter dans le jeu lui-même. » L'annonce du minuteur est traitée ; l'annonce de ce sur quoi porte le geste ne l'est pas. La fiche `.impeccable/surfaces/r-toss-components-composites-keep-or-toss-game-tsx.md:70-72` liste trois points d'accessibilité et n'en dit rien.

### 4. Un clic sur la carte tue silencieusement le chemin clavier — majeur

`src/games/keep-or-toss/components/composites/sorting-deck.tsx:42-51, 70-90`

**Ce qui casse.** L'écoute des flèches vit sur les deux boutons (`onKeyDown={onArrowSort}`), jamais sur un conteneur. `PracticeCard` est un `<div>` non focusable. Scénario : le joueur clique sur la carte — geste naturel, on clique sur ce qu'on regarde — ce qui déplace le focus vers `<body>` ; il presse alors `ArrowLeft` : rien ne se passe, la page défile, et il perd des secondes d'un budget de 20 s sans aucun signal. Il n'existe aucun moyen de récupérer le focus autrement qu'à la souris ou au `Tab`.

La fiche affirme le contraire, ligne 53 : « aucun état atteignable à la souris seule, aucun à la flèche seule […] cette surface s'interdit par construction ». La parité est prouvée dans `__tests__/unit/games/keep-or-toss/keep-or-toss-game.test.tsx:87-119`, mais les tests envoient le `keyDown` **directement sur le bouton** (`fireEvent.keyDown(screen.getByRole('button', …))`), ce qui présuppose le focus au lieu de le vérifier. Le test ne peut structurellement pas voir la panne.

### 5. La bande de révélation est celle de `practice-map`, recopiée classe pour classe — majeur

`src/games/keep-or-toss/components/composites/keep-or-toss-game.tsx:52-70` contre `src/games/practice-map/components/elements/marker-line.tsx:12-17`

**Ce qui casse.** `DESIGN.md:66-67` : « Vingt jeux, vingt surfaces. Aucun n'hérite de la composition d'un autre ». Les deux lignes de révélation sont le même objet :

- `practice-map` : `<div className="border-plane-rule border-b px-3 py-2 last:border-b-0">` + `<p>` libellé + `<p className="mt-1 …">` repère.
- `keep-or-toss` : `<div className="border-plane-rule border-b px-3 py-2 last:border-b-0">` + `<p>` libellé (avec une étiquette en plus) + `<p className="mt-1 max-w-[68ch] …">` raison.

Enveloppe identique au caractère près, même composition à deux paragraphes, dans la même section `border border-plane-rule bg-plane` coiffée du même `<header>`. Le message du commit revendique pourtant avoir corrigé exactement cette faute sur l'autre jeu : « la révélation se relit comme une frise plutôt que d'emprunter le bloc encadré du jeu précédent » — `flow-order` a reçu `revealed-timeline.tsx` pour cela, dans ce même commit. `keep-or-toss` fait ce qui vient d'être réparé ailleurs. Scénario de casse : un joueur qui enchaîne `g2-2` puis `g4-2` voit deux fois la même bande et ne distingue pas le relevé d'un jeu de celui de l'autre — c'est précisément ce que la règle des vingt surfaces protège.

Accessoirement : la ligne de révélation de `keep-or-toss` est inlinée dans le composite du jeu, là où `practice-map` (`MarkerLine`), `flow-order` (`RevealedTimeline`) et `ambiguity-scan` extraient. `KeepOrTossGame` fait 101 lignes pour une seule fonction, contre les 30 de `.claude/skills/user-clean-code-typescript` (« Max 30 lines per function »).

### 6. La consigne n'annonce ni le chronomètre ni le gel, alors que la fiche et le code affirment qu'elle le fait — majeur

`config/course.json`, `g4-2.config.statement` · `.impeccable/surfaces/…keep-or-toss-game-tsx.md:42` · `src/games/keep-or-toss/components/composites/keep-or-toss-game.tsx:16-17`

**Ce qui casse.** La consigne réelle, en entier :

> « Ces pratiques ont été relevées sur un dépôt réel. Gardez celles qui tiennent, jetez celles qui exposent. »

Ni le temps, ni le gel, ni le fait qu'une carte non triée compte comme manquée. La fiche, elle, tabule : « Consigne | Qu'il faut garder ou jeter, **que le temps gèle le lot** ». Et le composite le redit en JSDoc : « La consigne annonce le cadre — qu'il faut garder ou jeter, **que le temps gèle le lot** ». Les deux décrivent une consigne qui n'existe pas.

Scénario : un joueur voit un chronomètre descendre et suppose, comme dans `defect-hunt` dont le cadran mesure sans jamais interrompre, qu'il s'agit d'une mesure et non d'un couperet. Il prend son temps sur les six premières cartes ; à 0 s l'écran se fige sur « Le tri est figé », six cartes jamais vues comptées manquées. `DESIGN.md` autorise et même exige d'annoncer le cadre — « Le contrat énonce le cadre — durée, format, le fait que rien n'est déclaratif — jamais les critères » — et interdit seulement d'annoncer les critères. Dire « le temps gèle le lot, ce qui n'est pas trié compte manqué » est du cadre, pas un critère : rien ne s'y oppose, et la fiche prétend déjà que c'est fait.

### 7. La question de `c1` ne décrit pas le dénominateur que la règle calcule — majeur

`config/course.json`, `g4-2-c1.question` · `src/games/keep-or-toss/helpers/read-sorting.helper.ts:48`

**Ce qui casse.** Question restituée au joueur : « Le taux de bon classement dépasse-t-il le seuil ? ». Règle calculée : `correctCount / total du lot`, où le total inclut les cartes **jamais vues**. Le français « taux de bon classement » se lit naturellement comme la part de justes **parmi les cartes classées** — une carte non triée n'a pas été classée. Mesure sur l'espace réel des traces (les non triées sont toujours un suffixe, donc `sum(2^k, k=0..12) = 8191` traces) :

```
espace réel des traces                        : 8191
la règle (dénominateur = lot entier) dit oui  : 378
la question (part parmi les classées) dit oui : 534
traces où les deux lectures divergent         : 156 (1.9 %)
```

Scénario : le joueur trie huit cartes, les huit justes, le chronomètre le gèle. L'écran de verdict lui répond « Le taux de bon classement dépasse-t-il le seuil ? — **non** ». Son taux de bon classement, tel que la phrase le désigne, vaut 100 %. Il ne peut pas comprendre le verdict — et « on comprend pourquoi » est le critère produit que l'épique met en avant. C'est la classe d'échec relevée sur `ambiguity-scan` (question promettant une part brute, règle lisant une part nette), en plus étroit : 156 traces au lieu de 306, mais la confusion porte sur **toute** trace incomplète, pas seulement celles qui divergent. La story a raison au mot sur la règle (« les éléments non triés comptent comme manqués ») ; c'est la `question` qui ne la porte pas. Une formulation qui dit le dénominateur — « La part de pratiques bien classées **sur le lot entier** atteint-elle le seuil ? » — referme le point sans toucher au code.

### 8. Le gel accorde jusqu'à 250 ms de sursis après la limite — mineur

`src/games/keep-or-toss/hooks/use-countdown.hook.ts:16, 47-71, 78` · `src/games/keep-or-toss/hooks/use-keep-or-toss.hook.ts:100-103, 125-134`

**Ce qui casse.** `sort()` ne se garde que sur `phase !== 'sorting'`. `phase` ne passe à `'frozen'` que via l'effet déclenché par `expired`, et `expired` dérive de l'état `elapsedSeconds`, remis à jour uniquement par un `setInterval` à `TICK_MS = 250`. Entre l'instant `startedAt + durationSeconds` et le tick suivant, `phase` vaut encore `'sorting'` : **un tri déposé dans cette fenêtre est accepté et entre dans la trace.** Scénario : à t = 20,0 s le joueur a huit verdicts justes ; il presse deux fois de plus dans les 250 ms qui suivent, juste avant le tick ; la trace part avec 10/12 justes et `c1` bascule de manqué à satisfait.

Ampleur honnête : le sursis est borné à 250 ms en avant-plan, et `c2` reste protégé — `read-sorting.helper.ts:50` compare `elapsedSeconds <= durationSeconds` et la durée capturée au gel est bien la durée réelle (`readElapsedSeconds()`), donc un lot bouclé en sursis échoue `c2`. Seul `c1` est exposé. Mais le plan affirme un absolu — « Un tri arrivé après la seconde limite n'entre pas dans la trace » — et la fiche aussi, ligne 34 : « au-delà, plus aucun geste n'est accepté ». Le test censé le prouver, `__tests__/unit/games/keep-or-toss/use-keep-or-toss.test.ts:146-167`, avance de 2500 ms sur un budget de 2000 ms : le gel a déjà eu lieu, la fenêtre litigieuse n'est jamais visitée. Sous throttling d'onglet en arrière-plan (tick ramené à ≥ 1 s), la fenêtre s'élargit d'autant au retour au premier plan.

### 9. Le plafond d'équilibre du schéma et le seuil déclaré dans le parcours ne se voient nulle part — mineur

`src/games/keep-or-toss/schema/config.schema.ts:85-86` · `src/games/keep-or-toss/keep-or-toss.evaluator.ts:22`

**Ce qui casse.** Le schéma refuse un verdict qui **dépasse** deux tiers du lot : `count * 3 > total * 2`. Comparaison stricte, donc **exactement deux tiers passent** — le test le fige, `config.schema.test.ts:94-115`, « accepts a verdict share exactly at two thirds of the lot, the inclusive boundary » avec 8 « garder » sur 12. Sur un tel lot, « tout garder » atteint 8/12 = 0,667 de `correctShare`. Or le seuil de `c1` est déclaré librement dans le parcours et n'est borné par rien : `shareRuleSchema = z.object({ threshold: z.number() })` — pas même à `[0, 1]`. Rien, nulle part, ne compare le plancher que le plafond d'équilibre garantit (0,667) au seuil que le parcours déclare.

Scénario : un auteur trouve `g4-2` trop dur et abaisse `threshold` de `0.75` à `0.65` dans `config/course.json`, sur un corpus de 8/4 que le schéma accepte. « Tout garder » satisfait alors `c1` **et** `c2` : le geste unique répété rafle 3/24 de `verification`. Aucun test ne rougit — la force brute du jeu recalcule tout depuis `config/course.json`, elle suit donc le seuil au lieu de le contraindre. C'est la classe d'échec de `flow-order` (« le schéma figeait 1, le parcours déclarait 1, rien ne les liait »), avec la même conséquence à un caractère près.

À porter au crédit du travail : le **plafond « deux secondes par item » est, lui, correctement lié** — `config.schema.ts:103` calcule `total * MAX_SECONDS_PER_ITEM` depuis le corpus réellement déclaré, donc il ne peut pas diverger, et `brute-force.test.ts:45` passe la configuration du parcours par `keepOrTossConfigSchema.parse`, ce qui épingle l'équilibre 6/6 et les 20 s réels contre le schéma.

### 10. « Dépasse-t-il le seuil » alors que la règle est `>=` — mineur

`config/course.json`, `g4-2-c1.question` · `src/games/keep-or-toss/keep-or-toss.evaluator.ts:42`

**Ce qui casse.** La question dit « dépasse », la règle applique `correctShare >= threshold`. Sur l'espace réel des 8191 traces, **286 traces** tombent exactement au seuil `9/12 = 0,75` : le joueur y lit « oui » à une question qui promet un dépassement, alors qu'il est pile dessus. Ce n'est pas un bord théorique — le plan désigne ce point comme le cas nominal : « Seuil `c1` : `0.75` — neuf items justes sur douze ». Corriger la phrase (« atteint-il le seuil ») ou la règle, pas les deux.

### 11. Le plan n'a pas suivi le code, et `BUILD-ORDER` ignore la livraison — mineur

`aidd_docs/tasks/2026_08/2026_08_31_jeu-keep-or-toss/plan.md` (front-matter, phase 5) · `BUILD-ORDER.md:130` · `aidd_docs/backlog/stories/trier-sous-le-chronometre.md` (front-matter)

**Ce qui casse.** La phase 5 du plan pose une acceptance chiffrée : « la part de traces complètes au hasard qui tiennent `c1` reste sous 5 % ». La valeur réelle est **7,30 %** (299/4096), et elle ne dépend que du total (12) et du seuil (0,75) que le plan fixe lui-même — donc l'acceptance était fausse dès l'écriture. Le code l'assume honnêtement, dans un commentaire de `brute-force.test.ts:21-32` (« Écart assumé avec le texte du plan »), mais **le plan n'a jamais été amendé** : il reste `status: draft`, avec l'acceptance non tenue en toutes lettres. La story reste `status: proposed`, et la ligne 13 de `BUILD-ORDER.md` reste vide là où les stories 1 à 5 portent « **livrée** (jeu `…`) ».

Scénario : un agent qui reprend la file lit `BUILD-ORDER.md`, voit la story 13 non livrée, et rouvre un chantier déjà câblé dans `config/course.json`, `register-games.ts` et `register-components.ts`. (Le trou est systémique — les stories 6, 7, 15 et 17 sont livrées et non marquées elles aussi — mais il se referme ici pour la story de ce périmètre.)

### 12. Deux petites choses de code — mineur

- `src/games/keep-or-toss/components/composites/countdown-bar.tsx:1` importe `formatDuration` depuis `../../../defect-hunt/helpers/format-duration.helper`. Premier import transversal entre deux dossiers de jeux du dépôt (vérifié : `grep -rn "format-duration" src/` ne rend que `defect-hunt` et celui-ci). Scénario : un jour où `defect-hunt` change le format de son cadran, `keep-or-toss` change avec lui sans que personne ne l'ait décidé. Un helper partagé par deux jeux appartient à un emplacement partagé, pas au dossier du premier arrivé.
- `src/games/keep-or-toss/hooks/use-countdown.hook.ts:55-60` : `MILESTONES_SECONDS.find(...)` rend le **premier** palier de `[30, 10, 5]` encore non annoncé et déjà franchi. Si un tick saute plus de cinq secondes — throttling d'onglet en arrière-plan, dégel après veille — l'annonce lue est « 10 secondes restantes » alors qu'il en reste 4. Un utilisateur de lecteur d'écran entend une durée fausse, dans le seul canal que la surface lui offre sur le temps.

---

## Ce qui tient, et que j'ai vérifié

- **Les quatre acceptances de la story sont câblées.** Aucune validation avant la fin : `use-keep-or-toss.hook.ts:150-158` garde `revelations` vide hors de `'revealed'`, `CurrentItem` ne porte que `id` et `label` (ligne 20), `PracticeCard` n'affiche qu'un libellé. Aucun `aria-*`, `title`, ordre de cartes ni longueur de libellé ne trahit le verdict attendu : longueur moyenne 62,3 caractères pour « garder » contre 65,8 pour « jeter », médianes 56 contre 68, recouvrement complet — la longueur ne prédit rien. Les deux critères ressortent bien satisfait ou manqué. Les non triés comptent manqués : `correctShare = correctCount / total` (`read-sorting.helper.ts:48`), et `brute-force.test.ts:109-117` épingle 8/12 = 0,67 < 0,75.
- **Aucun seuil de critère ne fuite vers le joueur.** La consigne ne cite ni `0.75` ni la règle de complétude ; l'écran ne montre que le temps restant et « N sur 12 triée(s) ». `DESIGN.md` « Un jeu ne dit jamais ce qu'il note » est respecté (le reproche du constat 6 est l'inverse : le cadre en dit trop peu, pas les critères trop).
- **Le domaine reste pur.** `grep` : aucun import React et aucun `Date` sous `schema/`, `helpers/`, `actions/`, `keep-or-toss.evaluator.ts`. `Date.now()` vit dans `use-countdown.hook.ts:31, 44` seulement, et la durée entre dans la trace comme donnée mesurée — décision de `defect-hunt` reprise telle quelle, cohérente avec `aidd_docs/memory/architecture.md:30`.
- **La durée retenue est celle du geste, pas du dernier battement.** `freeze()` appelle `readElapsedSeconds()` (`use-keep-or-toss.hook.ts:94`), qui recalcule depuis la ref (`use-countdown.hook.ts:43-44`), jamais l'état affiché.
- **Smart/Dumb tenu.** Seul `KeepOrTossGame` connaît le hook et `GameComponentProps` ; `SortingDeck`, `CountdownBar` et `PracticeCard` ne reçoivent que des valeurs et un `onSort`. Aucun accès à la configuration depuis un composant muet.
- **Les cinq phases du plan sont livrées**, fichier par fichier, aux noms annoncés. Les trois refus du schéma existent et sont testés un par un (`config.schema.test.ts`). La trace accepte un tri inachevé et refuse `itemId` inconnu et doublon (`answer.schema.test.ts`). Les mappings `intervention`/`verification` du placeholder ont bien disparu du slot.
- **L'état est une quantité**, pas une couleur : `countdown-bar.tsx:27, 46-51` dérive la largeur du trait de `remainingSeconds` par proportion, et le passage sous 5 s change **à la fois** le poids typographique et la teinte, jamais la teinte seule. Aucun `border-l-4`.
- **Aucun code mort, aucun `console`, aucun bloc commenté, aucun TODO** sous `src/games/keep-or-toss/`. Une seule assertion de type (`build-keep-or-toss-answer.action.ts:25`, `as boolean`), immédiatement précédée du `filter(has)` qui la justifie.
- **Outillage vert** : 104 tests, `biome check` 0 erreur sur le périmètre, `tsc -b --noEmit` 0 erreur. Les 4 erreurs de `npm run lint` sur l'ensemble du dépôt viennent de `src/games/wrong-assistant/`, non commité, hors périmètre.
- Les deux défauts déjà sortis en backlog (révélation avant verrou, révélation qui pousse l'action hors écran) ne sont pas aggravés ici : la révélation de `keep-or-toss` est une liste de douze lignes courtes suivie d'un unique « Continuer », sans relevé qui s'allonge.

---

## Score

**55/100.**

Le validateur n'énonce ni pondération ni seuil ; je note la proportion de critères tenus, ajustée par la gravité.

Sur les quatre acceptances de la story : deux pleinement tenues (aucune validation avant la fin ; non triés comptés manqués), deux tenues mécaniquement mais vidées de leur sens — le critère de bon classement se satisfait sans connaissance (constat 2) et le critère de bouclage récompense le geste aveugle contre le lecteur (constat 1). Sur les cinq phases du plan : cinq livrées, une acceptance chiffrée non tenue et non amendée (constat 11). Sur la liste de contrôle : duplication d'information avérée (constat 5), incohérence documentaire avérée (constat 6), pas de sur-ingénierie, pas de code mort.

La décote tient à ceci : sur un jeu dont la raison d'être est de mesurer, deux constats critiques établissent qu'il ne mesure pas ce qu'il annonce, et l'un des deux ouvre une bascule de palier de niveau démontrée chiffres en main. La note reste au-dessus de la moitié parce que la structure, le typage, les frontières hexagonales, la couverture de tests et la propreté du code sont réellement bons, et parce que le passage en force brute exigé par `BUILD-ORDER.md:147` a bien été écrit — il a simplement été braqué sur `c1` seul, sans jamais mettre `c2` en regard d'un profil de lecture réelle.

Le seuil de passage appartient à l'appelant.
