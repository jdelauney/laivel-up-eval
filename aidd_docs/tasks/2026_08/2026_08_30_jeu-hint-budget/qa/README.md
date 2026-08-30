# Tournée navigateur — `hint-budget`

30/08/2026, refaite intégralement après la réécriture des quinze textes d'indices de `g2-1` (chaque indice élimine désormais exactement une cause, `s1-h*`/`s2-h*`/`s3-h*` portent tous un champ `eliminates`, cf. commits `0d3ae27`, `6e9ade6`, `e8e591b`, `4cabf0c`). Chromium via Playwright (`@playwright/test`, déjà une dépendance du projet), harnais jetable écrit pour cette tournée, supprimé après capture — comme les tournées précédentes. Aux deux gabarits `1440×900` et `390×844`.

**Port du serveur de développement.** `npm run dev` par défaut sur `5173` était déjà occupé, sur cette machine, par le serveur d'un autre chantier en cours (`.claude/worktrees/placer-les-pratiques-sur-deux-axes`, un worktree distinct de cette branche, confirmé par sa ligne de commande). S'y connecter aurait mesuré le mauvais jeu : une première tentative a atterri sur `g2-2` (« Où placez-vous ces pratiques ? », type `test-bench`) avec `session.groupIndex=1, gameIndex=0` pourtant correct dans `localStorage` — la preuve que le serveur qui répondait sur `5173` ne servait pas cette branche. Toute la tournée a donc tourné sur un second serveur dédié, `npm exec vite -- --port 5199 --strictPort`, lancé depuis ce répertoire de travail et vérifié avant capture (`Le cadrage` présent dans le DOM, `L'assistant` aussi). Écart entre l'instruction (`5173`) et l'exécution réelle, assumé plutôt que tu : un port occupé par un processus tiers n'est pas ce jeu, peu importe qu'il réponde `200`.

**Méthode de mesure.** Session posée directement sur `g2-1` en écrivant `{"playerName":"QA Reviewer","groupIndex":1,"gameIndex":0,"submissions":[]}` dans `laivel-eval.session` (`localStorage`), rechargement, clic « Reprendre ». Chaque capture et chaque lecture de position part de `window.scrollTo(0, 0)`, `window.scrollY` **vérifié explicitement à 0** juste avant — le script lève une erreur s'il ne l'est pas. Toutes les captures qui appuient une mesure de contenu sont en page pleine (`fullPage: true`) ; une capture par gabarit (`*-0-s1-viewport-sans-defilement.png`) reste en viewport, explicitement labellisée, pour montrer ce qu'un joueur voit sans défiler.

**Une erreur de mesure attrapée avant capture, pas après.** Le premier passage du script lisait la position du panneau des causes à `s1` (`getBoundingClientRect().top`) *après* le balayage `Tab` qui mesure les arrêts de tabulation — or ce balayage fait défiler la page (le navigateur ramène l'élément focalisé dans le viewport), et le script ne revérifiait pas `scrollY = 0` avant cette lecture précise. Résultat, une valeur clairement fausse (`691px`, alors que la capture en viewport montre le panneau des causes hors écran à l'ouverture) : exactement la classe d'erreur que ce tour devait éviter. Corrigé en réordonnant le script — toute lecture de position précède désormais le balayage clavier — et la tournée entière a été rejouée avec l'ordre corrigé plutôt que corrigée à la ligne.

## Le parcours joué

Trois situations, dans l'ordre :

- **`s1`, en entier** : mesure de l'ordre des panneaux et des arrêts de tabulation à l'ouverture, cadre déposé (deux lectures retenues) et un indice acheté, les cinq indices achetés, puis une tranche **délibérément fausse** (la première cause du panneau, jamais garantie réelle) pour observer le relevé complet.
- **`s2`, à vide** : aucun cadrage, aucun achat, tranche immédiate — pour observer l'ordre inversé des panneaux et la surtaxe d'aveugle au relevé.
- **`s3`, partiellement** : ouverture mesurée, un cadre déposé (une lecture retenue) et un indice acheté, capturée sous `grayscale(1)`.

## Ce qui est capturé

16 fichiers, 8 par gabarit, dimensions PNG lues à l'octet et recoupées avec les `scrollHeight` DOM (aucun écart) :

| Fichier | État | Dimensions (desktop / mobile) |
| --- | --- | --- |
| `{gabarit}-0-s1-viewport-sans-defilement.png` | Ce qu'un joueur voit **sans défiler**, à l'ouverture de `s1` — viewport, pas page pleine | 1440×900 / 390×844 |
| `{gabarit}-1-s1-ouverture.png` | `s1` ouverte, rien cliqué — page pleine | 1440×1530 / 390×2280 |
| `{gabarit}-2-s1-cadre-depose-un-achat.png` | Cadre déposé (deux lectures retenues), un indice acheté — page pleine | 1440×1608 / 390×2338 |
| `{gabarit}-3-s1-cinq-achats.png` | Les cinq indices achetés : le relevé plafonné-et-replié — page pleine | 1440×1473 / 390×2162 |
| `{gabarit}-4-s1-revelation.png` | Révélation de `s1`, après une tranche volontairement fausse — page pleine | 1440×1870 / 390×2557 |
| `{gabarit}-5-s2-ouverture.png` | `s2` ouverte : le cadrage en tête cette fois — page pleine | 1440×1358 / 390×2039 |
| `{gabarit}-6-s3-ouverture.png` | `s3` ouverte : le marché en tête à nouveau — page pleine | 1440×1381 / 390×2071 |
| `{gabarit}-7-s3-desature.png` | `s3`, une lecture retenue et un indice acheté, sous `grayscale(1)` — page pleine | 1440×1457 / 390×2149 |

`desktop-0`/`mobile-0` sont bien en viewport (1440×900, 390×844), pas en page pleine — visibles sur la capture elle-même : le panneau des causes n'y apparaît pas (`s1_causes_top` mesuré à 1184px desktop, 1728px mobile, tous deux au-delà de la hauteur du viewport).

## Point 1 — position et lisibilité du cadrage et du marché, aux deux gabarits

**Desktop (`sm:` et au-delà) : parité par écran exacte.** `hint-budget-game.tsx` pose `grid-cols-1 sm:grid-cols-2` : les deux panneaux sont deux frères d'une même rangée CSS Grid, sommet et pied identiques par construction (`align-items: stretch`). Mesuré (`getBoundingClientRect().top`) :

| Situation | Sommet cadrage | Sommet marché | Écart |
| --- | --- | --- | --- |
| `s1` | 647 | 647 | 0 |
| `s2` | 494 | 494 | 0 |
| `s3` | 516,75 | 516,75 | 0 |

**Mobile (390px) : empilement à une colonne, pas de parité par écran.** Mesuré :

| Situation | Sommet cadrage | Sommet marché | Écart vertical |
| --- | --- | --- | --- |
| `s1` | 1337,25 | 872,25 | 465 |
| `s2` | 631,5 | 1022,25 | 390,75 |
| `s3` | 1071 | 586 | 485 |

**Ce qui ne bouge pas d'une tournée à l'autre, et pourquoi.** Ces huit valeurs sont identiques, à la décimale, à celles de la tournée précédente (avant la réécriture des indices). Ce n'est pas une preuve recopiée : c'est une conséquence attendue de ce que la tâche a changé. La position du sommet des deux panneaux ne dépend que du contenu **au-dessus** de la grille (l'énoncé, le rapport d'incident) — jamais réécrit par cette tâche — et l'ordre DOM des deux panneaux n'a pas bougé non plus. Une position de sommet identique n'implique donc aucune régression de mesure ; elle confirme au contraire que la tâche a touché le bon périmètre (les indices) et rien d'autre.

**Lisibilité, aux deux gabarits.** Vérifiée sur `mobile-1-s1-ouverture.png` et `desktop-0-s1-viewport-sans-defilement.png` : les nouveaux intitulés d'indices (« Vérifier la date d'expiration du certificat TLS du reverse proxy », « Comparer la clé secrète de signature entre les deux environnements », etc.) tiennent sur une à deux lignes normales, aucun repli caractère par caractère. Confirmé aussi sur `desktop-6-s3-ouverture.png` et `mobile-3-s1-cinq-achats.png` pour les indices déjà achetés (texte de preuve affiché).

## Point 2 — l'ordre réel des deux panneaux dans chacune des trois situations

`cadrageFirst = (situationNumber - 1) % 2 !== 0` — mesuré en DOM (`querySelectorAll('section')`, position de l'en-tête « Le cadrage » contre « L'assistant »), identique aux deux gabarits :

| Situation | Panneau en tête (DOM) | Vérifié sur |
| --- | --- | --- |
| `s1` | **Le marché** | `desktop-1`, `mobile-1` |
| `s2` | **Le cadrage** | `desktop-5`, `mobile-5` |
| `s3` | **Le marché** | `desktop-6`, `mobile-6` |

Confirmé visuellement : `desktop-1`/`mobile-1` (« L'ASSISTANT » en tête), `desktop-5` (« LE CADRAGE » en tête), `desktop-6`/`mobile-6` (« L'ASSISTANT » de nouveau en tête). Structure inchangée depuis la tournée précédente — attendu, la réécriture des indices n'a touché ni composant ni classe de mise en page.

## Point 3 — l'action de trancher : position à l'ouverture et après cinq achats

Mesuré sur `s1`, `scrollY = 0` vérifié avant chaque lecture, page pleine :

| Gabarit | `scrollHeight` | `clientHeight` | Dépassement | Sommet du panneau des causes | Sous le pli de |
| --- | --- | --- | --- | --- | --- |
| Desktop, ouverture | 1530 | 900 | 630px | 1184px | 284px |
| Desktop, après 5 achats | 1473 | 900 | 573px | 1126,75px | 226,75px |
| Mobile, ouverture | 2280 | 844 | 1436px | 1728px | 884px |
| Mobile, après 5 achats | 2162 | 844 | 1318px | 1610px | 766px |

**Trancher reste hors d'écran sans défilement, aux deux gabarits, dès l'ouverture** — inchangé depuis la dernière tournée, toujours couvert par `aidd_docs/backlog/defects/l-ouverture-de-hint-budget-pousse-le-tranchage-hors-de-l-ecran.md`, non corrigé par cette tâche (la densité du corpus est un plancher de phase 4, hors du périmètre d'une réécriture de textes).

**Acheter n'aggrave jamais ce défilement, aux deux gabarits** : desktop −57px (1530 → 1473), mobile −118px (2280 → 2162).

**Ce que ce nouveau relevé infirme de l'ancien.** L'ancien delta mobile, −119px, est périmé : le nouveau est **−118px** — un écart d'1px, dans le bruit d'un arrondi de ligne. L'ancien delta desktop, −37px, l'est davantage : le nouveau est **−57px**. La différence s'explique par où la tâche a agi. À l'ouverture, seuls les intitulés (`label`) des indices sont visibles, et ils ont été substantiellement réécrits (`git diff` sur `config/course.json` : aucun des quinze intitulés de `g2-1` n'est resté identique) — la hauteur de document à l'ouverture desktop est donc passée de 1510px à **1530px** (+20px), pas restée stable. Après les cinq achats en revanche, la hauteur retombe exactement à la même valeur qu'avant la réécriture (1473px desktop, contre 1473px déjà mesuré la tournée précédente ; 2162px mobile contre 2161px) : le texte de preuve affiché après achat (`text`, aussi réécrit) occupe, par coïncidence de longueur, le même nombre de lignes que l'ancien corpus dans les deux entrées visibles du relevé plafonné. Un desktop qui parcourt cinq lettres différentes pour atterrir au même total de lignes n'est pas une anomalie de mesure ; c'est un fait sur ce corpus précis, qu'un futur corpus ne reproduira pas nécessairement.

## Point 4 — le nombre d'arrêts de tabulation pour atteindre chaque panneau

Mesuré par une marche `Tab` continue depuis un focus remis sur `document.body` (rien cliqué avant, dans cette situation), en comptant le pas auquel le focus entre pour la première fois dans la section portant l'en-tête « Le cadrage » puis « L'assistant ». Identique aux deux gabarits — l'ordre de tabulation suit le DOM, pas la largeur de viewport.

| Situation | 1er arrêt dans marché | 1er arrêt dans cadrage | Panneau atteint en premier |
| --- | --- | --- | --- |
| `s1` | 1 | 6 | Marché (5 arrêts d'avance) |
| `s2` | 8 | 2 | Cadrage (6 arrêts d'avance) |
| `s3` | 2 | 7 | Marché (5 arrêts d'avance) |

Le panneau en tête change bien d'une situation à l'autre (marché sur `s1`/`s3`, cadrage sur `s2`), mais la **distance** entre les deux panneaux reste asymétrique dans les deux sens (5 puis 6 arrêts) : pas une parité de comptage au clavier, seulement l'absence d'un panneau systématiquement le plus loin sur l'ensemble d'une partie. Chiffres identiques à la tournée précédente — attendu, la réécriture des indices ne change ni le nombre d'éléments focalisables ni leur ordre.

## Point 5 — la révélation, avec son relevé chiffré

**`s1` — cinq indices achetés, tranche fausse** (`desktop-4-s1-revelation.png`, `mobile-4-s1-revelation.png`) :

> INDICES 75 · TRANCHE FAUSSE +40 · TOTAL 115

Vérifié : 5+10+15+20+25 = 75 (les cinq indices), +40 la pénalité de tranche fausse, pas de surtaxe d'aveugle puisque des indices ont été achetés, 75+40 = 115. Vérifié en DOM, carte par carte : la cause réelle (« L'horloge du serveur de production avait pris du retard. ») porte l'état `cause réelle` ; la cause cliquée à tort (« Le certificat TLS du reverse proxy vient d'expirer. ») porte `écartée — tranchée`, distincte des trois autres cartes qui portent `écartée` seule — le libellé est en minuscules dans le DOM, rendu en capitales par la classe `uppercase`, ce que l'ancien README rendait déjà de façon un peu ambiguë en écrivant la version capitalisée.

**`s2` — aucun cadrage, aucun achat, tranche à l'aveugle** :

> INDICES 0 · TRANCHE FAUSSE +40 · AVEUGLE +30 · TOTAL 70

Vérifié : 0 indice acheté, +40 la pénalité de tranche fausse, +30 la surtaxe d'aveugle (`blindCutSurcharge`), cumulées puisqu'aucun indice n'a été acheté avant de trancher, 0+40+30 = 70. `blindCutSurcharge` (30) reste strictement supérieur au coût du plus cher des cinq indices de `s2` (25) — la garantie que le schéma refuse de charger sans elle, toujours tenue par ce corpus.

## Point 6 — l'affichage identique des deux natures de lecture

Vérifié en DOM, séparément de la tournée principale (lecture de contrôle sur les cinq boutons du panneau « Le cadrage » de `s1`, ouverture fraîche, `scrollY = 0`) : une seule `className` sur les cinq boutons, aucun attribut `data-*` distinctif. `framing-line.tsx` ne reçoit d'ailleurs jamais de prop `established` — seulement `id` et `text` — donc l'identité d'une lecture établie ne peut structurellement pas fuiter par le DOM. Confirme ce que `hint-budget-game.test.tsx` verrouille déjà (« renders an established reading and a supposition with exactly the same structure »).

## Point 7 — l'état sans la couleur

`desktop-7-s3-desature.png`, `mobile-7-s3-desature.png` (`grayscale(1)`, page pleine) : la lecture de cadrage retenue reste identifiable par sa case pleine (carré noir), l'indice acheté par son cadenas et son texte déjà révélé. **Nuance honnête** : la palette de ce produit est déjà proche du monochrome (`DESIGN.md`) ; le filtre `grayscale(1)` a donc un effet visuellement discret sur cet écran précis — la vérification porte moins sur « la couleur disparaît » que sur « aucune des trois marques d'état ne s'appuyait uniquement sur une teinte qui aurait disparu », ce que les deux captures confirment.

## Ce qui n'a pas été mesuré, dit franchement

- **Le fondement du cadrage (`c3`) n'a pas de preuve visuelle dédiée** : cette tournée dépose des cadres avec une, deux ou aucune lecture retenue selon la situation, mais ne rejoue pas systématiquement les trois profils (fondé exact, partiel, vide) pour chaque situation. Couvert par les tests (`evaluator.test.ts`, `hint-budget-run.test.ts`), pas par une capture dédiée ici.
- **`s2`, mesure de la position du panneau des causes et du dépassement** : non reprise (seule `s1` a servi de base à cette mesure, comme pour les tournées précédentes). Rien n'indique qu'elle différerait significativement, la densité du corpus étant la même aux trois situations, mais ce n'est pas mesuré.
- **Le décompte des situations résolues et le score final** ne sont jamais affichés pendant la partie ; cette tournée ne les a donc pas cherchés à l'écran, conformément à « un jeu ne dit jamais ce qu'il note ».
- **Les causes elles-mêmes n'ont pas été réécrites par cette tâche** (seuls les indices l'ont été) : les textes de causes affichés en révélation, sur `s1`, sont identiques à ceux de la tournée précédente — cohérent, pas une omission de cette passe.

## Verdict

**Ce que cette tournée établit, mesuré et vérifié au pixel ou en DOM, sur le corpus d'indices réécrit** : la parité desktop reste exacte (écart de sommet nul sur les trois situations) ; l'alternance mobile fait toujours alterner le panneau en tête (marché deux fois, cadrage une fois) sans jamais atteindre une parité de comptage au clavier (5 puis 6 arrêts) ; l'ouverture pousse toujours le panneau des causes sous le pli, aux deux gabarits, et les cinq achats réduisent toujours ce dépassement plutôt que de l'aggraver ; le relevé de révélation est exact au centime près, sur une tranche fausse comme sur une tranche à l'aveugle ; la marque « écartée — tranchée » reste visible et distincte des trois autres cartes écartées ; les nouveaux intitulés d'indices restent lisibles sans repli aux deux gabarits.

**Ce qu'elle infirme d'une affirmation précédente** : le delta de hauteur documentaire mobile après cinq achats n'est plus −119px mais **−118px** — un écart négligeable. Le delta desktop, lui, change substantiellement : plus −37px mais **−57px**, parce que la hauteur d'ouverture elle-même a grandi de 20px (nouveaux intitulés plus longs) sans que la hauteur après achats ne bouge. Les seize captures et toutes les mesures de position de la tournée précédente montraient un corpus d'indices qui n'existe plus ; ce fichier les remplace en entier.

**Ce qu'elle ne prétend toujours pas** : une parité par écran au gabarit mobile (structurellement hors de portée d'un empilement à une colonne sans motif d'interface propre à ce seul jeu, que le mandat du produit interdit) ; que « trancher reste atteignable sans défilement » soit tenu (mesuré non tenu, dès l'ouverture, aux deux gabarits — défaut de backlog existant, non corrigé ici, hors du périmètre d'une réécriture de textes).

Revalidé au moment de cette tournée : `npm run typecheck` (muet), `npx biome check src __tests__ config` (« Checked 201 files… No fixes applied »), `npm run test` (73 fichiers, 664 tests, tous passés).
