# Tournée navigateur — `hint-budget`

30/08/2026, Chromium via Playwright CLI, sur `npm run dev`, à 1440×900 et 390×844. Le harnais est hors du dépôt, comme pour les tournées précédentes : `playwright` a été invoqué par `npx` avec `NODE_PATH` pointé sur le `node_modules` du projet, jamais ajouté au manifeste.

**Repère de mesure.** Chaque capture et chaque mesure de cette page part de `window.scrollTo(0, 0)`, explicitement exécuté juste avant, et `window.scrollY` est vérifié à `0` avant toute lecture de position — la leçon retenue de la tournée `lie-detector`, où une première passe avait rapporté des chiffres contaminés par un défilement résiduel laissé par un clic précédent (l'application est une SPA, elle ne recharge jamais entre deux situations). Cette tournée n'a mesuré qu'après ce contrôle, à chaque capture.

## Le parcours joué

La session est posée directement sur `g2-1` en écrivant `{"playerName":"QA Reviewer","groupIndex":1,"gameIndex":0,"submissions":[]}` dans `laivel-eval.session` puis en cliquant « Reprendre » : jouer le premier groupe avant chaque capture n'apprend rien sur cette surface. Conséquence connue de ce raccourci, comme pour `lie-detector` : la tête de page affiche « Situation 1 sur 20 » au lieu de 3, artefact de `progress.submitted + 1` compté à zéro dans une session forgée — pas un défaut de `hint-budget`.

Deux situations jouées, désignées par la tâche pour couvrir deux corpus distincts : `s1` (le premier, joué en entier — cadrage, achats, tranche, révélation) et `s3` (le dernier, atteint en jouant `s1` puis `s2` minimalement, pour vérifier que la parité et la densité tiennent sur un second corpus, pas seulement celui mesuré en premier).

## Ce qui est capturé

| Fichier | État |
| --- | --- |
| `desktop-1-s1-ouverture.png` · `mobile-1-s1-ouverture.png` | `s1` ouverte, rien cliqué : rapport, cadrage, marché tous visibles au premier rendu |
| `desktop-2-s1-cadre-depose-un-achat.png` · `mobile-2-…` | Le cadre déposé (une lecture retenue), un indice acheté |
| `desktop-3-s1-cinq-achats.png` · `mobile-3-…` | Les cinq indices achetés : le relevé plafonné-et-replié |
| `desktop-4-s1-revelation.png` · `mobile-4-…` | La révélation de `s1`, après une tranche volontairement fausse |
| `desktop-5-s3-ouverture.png` · `mobile-5-…` | `s3` ouverte, second corpus, même vérification de parité |
| `desktop-6-s3-desature.png` · `mobile-6-…` | `s3`, une lecture retenue et un indice acheté, sous un filtre `grayscale(1)` |

Une septième capture, hors de cette liste numérotée, a été prise en aparté pour documenter la révélation en page pleine : voir « Point 3 » ci-dessous.

## Point 1 — la parité des deux gestes, au gabarit mobile

**Tenue, aux deux gabarits, sur les deux corpus mesurés.**

Le passage de `sm:grid-cols-2` (motif de `lie-detector`, qui bascule à une colonne sous 640px) à `grid-cols-2` sans repli — la grille du cadrage et du marché reste à deux colonnes même à 390px de large — a été choisi plutôt qu'un motif neuf (onglets, accordéon) : le mandat de la phase interdit d'introduire un motif propre à un seul jeu, et la grille à deux colonnes existe déjà dans le vocabulaire du produit. La contrepartie : chaque colonne mesure environ 170px sur mobile, ce qui obligeait `HintCard` à empiler son prix sous son intitulé plutôt que de les poser côte à côte — sans ce second ajustement, le bouton « Acheter » flottait au milieu d'un intitulé replié sur quatre lignes, y compris sur desktop où la même colonne étroite existe (le contenu centré à `max-w-4xl`, partagé en deux, ne laisse pas la largeur qu'un jeu à une seule colonne aurait).

Mesures, `scrollY = 0` vérifié :

| Gabarit | Situation | Cadrage (haut / bas) | Marché (haut / bas) | Même position |
| --- | --- | --- | --- | --- |
| Desktop 1440×900 | `s1` | 676 / 1169 | 676 / 1169 | oui |
| Desktop 1440×900 | `s3` | 517 / 1011 | 517 / 1011 | oui |
| Mobile 390×844 | `s1` | 902 / 1627 | 902 / 1627 | oui |
| Mobile 390×844 | `s3` | 586 / 1388 | 586 / 1388 | oui |

Les deux panneaux commencent et finissent exactement à la même position, aux deux gabarits, sur les deux corpus : aucun des deux gestes n'est atteint avant l'autre par construction de la mise en page — le clavier et le lecteur d'écran restent seuls à décider d'un ordre de parcours (vérifié par `hint-budget-game.test.tsx`, l'ordre DOM suit l'ordre du corpus dans les deux inventaires).

## Point 2 — la densité des trois inventaires (plus le rapport)

Resserrée sans devenir un mur, mais pas ramenée sous un seul écran — assumé, voir « Point 3 ».

Deux correctifs structurels, tous deux visibles sur les captures :

1. **Le marché ne peut que rétrécir.** Un indice acheté quitte la liste des indices à vendre pour rejoindre un second bloc, « Déjà acheté », qui seul grandit — et ce bloc se plafonne à deux entrées visibles, le reste replié derrière `<details>Voir N indices de plus</details>` (visible sur `desktop-3-s1-cinq-achats.png` : « VOIR 3 INDICES DE PLUS »). Mesuré : acheter les cinq indices d'une situation ne fait **pas** grandir le document — desktop passe de 1597px à 1560px (-37, le bloc replié prend moins de place que cinq cartes développées), mobile reste à 2190px exactement (delta 0).
2. **La grille des causes ne montre plus de trou.** `lie-detector` pose ses hairlines en fond de conteneur partagé (`gap-px bg-plane-rule`), qui suppose une grille qui se remplit exactement (quatre affirmations sur deux colonnes). Les cinq causes de ce jeu sur trois colonnes laissaient, avant correctif, un pan de fond gris nu à la place de la sixième carte absente — chaque `CauseOption` porte désormais son propre filet, un espacement réel remplace le fond partagé.

## Point 3 — l'action de trancher reste-t-elle atteignable sans défilement ?

**Non, aux deux gabarits, dès l'ouverture d'une situation — assumé, transverse au produit, non corrigé dans cette passe.**

Ce jeu porte quatre blocs (rapport, cadrage, marché, causes) dont le corpus impose la matière : deux à quatre faits de rapport, cinq lectures de cadrage, cinq indices, cinq causes — un plancher de contenu que la phase 4 a fixé et que cette passe ne peut pas réduire sans rouvrir le corpus. Mesuré à l'ouverture de `s1`, `scrollY = 0` :

- Desktop : `scrollHeight` 1597 contre un `clientHeight` de 900 — 697px de dépassement avant même un clic.
- Mobile : `scrollHeight` 2190 contre un `clientHeight` de 844 — 1346px de dépassement.

Le même constat existe déjà, non corrigé, dans `lie-detector-game.tsx` (révélation de `r1`, 383px de dépassement desktop, 597px mobile) et `defect-hunt-game.tsx`, tous deux relevés par leur propre tournée. Ce n'est donc pas un défaut propre à `hint-budget` : c'est le même défaut transverse, suivi séparément (`aidd_docs/backlog/defects/la-revelation-pousse-l-action-hors-de-l-ecran.md`), non traité ici.

Ce que cette passe corrige, en revanche, et qui est propre à ce jeu : **acheter n'aggrave pas ce défilement.** Voir « Point 2 » — le delta de hauteur documentaire entre l'ouverture et cinq achats est nul ou négatif, aux deux gabarits. Un joueur qui achète beaucoup ne pousse donc jamais l'action de trancher plus loin qu'elle ne l'était déjà à l'ouverture de la situation.

Capture de la révélation en page pleine (desktop), prise en aparté pour documenter le relevé complet : la cause réelle porte un disque plein et l'étiquette « CAUSE RÉELLE », les quatre autres un cercle fin et « ÉCARTÉE », chacune avec sa vérification ; le pied de la révélation lit « INDICES 0 · TRANCHE FAUSSE +40 · AVEUGLE +30 · TOTAL 70 » — aucune mention du cadrage.

## Point 4 — le prix avant le clic

Confirmé, aux deux gabarits. Chaque `HintCard` non achetée affiche `ACHETER · <coût>` en clair, sans survol ni dépliage (`desktop-1-s1-ouverture.png`, colonne « L'ASSISTANT »). Une fois acheté, le prix reste lisible à côté d'un cadenas (`desktop-2-…`), et le texte de l'indice n'apparaît qu'à cet instant, jamais avant.

## Point 5 — la conséquence se tait

Confirmé. Ni `wrongCutPenalty` (40) ni `blindCutSurcharge` (30) ne figurent nulle part avant la tranche — vérifié visuellement sur `desktop-1` à `desktop-3` et verrouillé par un test (`hint-budget-game.test.tsx`, « announces no consequence before cutting »). Les deux montants n'apparaissent qu'au relevé de la révélation (`desktop-4-s1-revelation.png`), et seulement ceux qui s'appliquent : la pénalité de tranche fausse ici, jamais la surtaxe d'aveugle sur une situation où un indice a été acheté.

## Point 6 — les deux natures de lecture de cadrage

Confirmé, structurellement et visuellement. `FramingLine` ne reçoit que `id` et `text` — jamais `established` — donc les cinq lectures de `s1` et `s3` se rendent identiquement, cases à cocher rigoureusement identiques dans leur structure, seul le texte variant (`desktop-1-s1-ouverture.png`, colonne « LE CADRAGE »). Verrouillé par un test qui compare l'arbre rendu de deux configurations où seule l'identité de la lecture établie change — les deux rendus HTML sont des chaînes strictement égales une fois les deux identifiants de lecture normalisés.

## Point 7 — l'état sans la couleur

Confirmé, capturé sous `grayscale(1)` (`desktop-6-s3-desature.png`, `mobile-6-s3-desature.png`) après avoir retenu une lecture et acheté un indice : la case de cadrage retenue reste identifiable par son remplissage plein (pas une teinte), l'indice acheté par son cadenas et son texte déjà révélé, et — hors du périmètre de ce jeu mais visible sur la même capture — la rampe des groupes reste lisible par le poids du filet et non la seule couleur.

## Verdict

**Deux problèmes structurels traités, tous deux propres à ce jeu :**

1. La parité du cadrage et du marché d'indices, résolue en gardant la grille à deux colonnes du vocabulaire existant à toute largeur plutôt qu'en la laissant se replier — mesurée exactement à la même position aux deux gabarits, sur deux corpus.
2. La densité du marché, résolue en séparant les indices à vendre (qui ne peuvent que rétrécir) du relevé de ceux déjà achetés (qui seul grandit, et se plafonne à deux entrées visibles) — mesurée à un delta de hauteur nul ou négatif après cinq achats.

Un correctif secondaire, découvert pendant la mesure : la grille des causes laissait un pan de fond nu sur sa dernière rangée incomplète (cinq cartes sur trois colonnes) — chaque carte porte désormais son propre filet plutôt qu'un fond de conteneur partagé.

**Un point non corrigé, par assomption explicite, cohérente avec le reste du produit** : l'action de trancher n'est pas atteignable sans défilement dès l'ouverture d'une situation, aux deux gabarits — le même défaut, non corrigé non plus, existe déjà chez `lie-detector` et `defect-hunt`, et reste suivi comme un défaut transverse séparé. Ce que cette passe garantit, en revanche, c'est qu'acheter des indices n'aggrave jamais ce défilement.

Revalidé après les correctifs : `npm run lint` (Biome, aucun problème sur les fichiers du jeu), `npm run typecheck` (muet), `npm run test` (73 fichiers, 645 tests, aucune régression).
