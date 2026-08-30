# Tournée navigateur — `hint-budget`

30/08/2026, refaite intégralement après le commit `69633bd` (« floor hint-budget's field at two causes, never one ») : trois intitulés d'indices de `g2-1` réécrits (`s1-h4`, `s2-h2`, `s3-h3`), une quatrième ligne ajoutée au rapport de `s1`, et le seuil de la règle `frugal-solves-at-least` passé de `2` à `3`. Les trois premiers changent la hauteur du document ; le dernier est une règle d'évaluation, sans effet visuel. La tournée précédente (`qa/README.md` au commit `fcba488`) mesurait un corpus qui n'existe plus : ce fichier la remplace en entier, sans recopier aucun de ses chiffres. Chromium via Playwright (`@playwright/test`, déjà une dépendance du projet), harnais jetable écrit pour cette tournée, supprimé après capture. Aux deux gabarits `1440×900` et `390×844`.

**Port du serveur de développement.** `5173` était occupé par le serveur d'un autre chantier en cours sur cette machine (`.claude/worktrees/placer-les-pratiques-sur-deux-axes`) — confirmé avant de s'y connecter (`netstat`, ligne `LISTENING` sur `5173` déjà présente avant tout lancement de cette tournée). S'y connecter aurait mesuré le mauvais jeu, comme lors d'une tournée précédente. Toute la tournée a donc tourné sur un second serveur dédié, `npm exec vite -- --port 5199 --strictPort`, lancé depuis ce répertoire de travail et arrêté après capture.

**Méthode de mesure.** Session posée directement sur `g2-1` en écrivant `{"playerName":"QA Reviewer","groupIndex":1,"gameIndex":0,"submissions":[]}` dans `laivel-eval.session` (`localStorage`), rechargement, clic « Reprendre ». Avant toute capture, la cible a été vérifiée à l'écran : groupe « Pilotage du contexte » en surbrillance dans la rampe, titre « Combien d'indices vous faut-il ? », panneaux « L'assistant » et « Le cadrage » tous deux présents — la preuve visuelle que la session est bien tombée sur `g2-1`, pas sur un voisin.

Chaque capture et chaque lecture de position part de `window.scrollTo(0, 0)`, `window.scrollY` **vérifié explicitement à 0** juste avant — le script lève une erreur s'il ne l'est pas. Toute lecture de position (sommet de panneau, `scrollHeight`) précède le balayage `Tab` qui mesure les arrêts de tabulation, jamais l'inverse : un balayage clavier fait défiler la page pour ramener le focus dans le viewport, et une lecture de position prise après lui serait fausse sans qu'aucune erreur ne le signale — c'est l'erreur qui avait contaminé une tournée précédente avant d'être corrigée. Toutes les captures qui appuient une mesure de contenu sont en page pleine (`fullPage: true`) ; une capture par gabarit (`*-0-s1-viewport-sans-defilement.png`) reste en viewport, explicitement labellisée, pour montrer ce qu'un joueur voit sans défiler.

## Le parcours joué

Trois situations, dans l'ordre :

- **`s1`, en entier** : mesure de l'ordre des panneaux et des arrêts de tabulation à l'ouverture, cadre déposé (deux lectures retenues, « Transmettre ce cadre » cliqué) et un indice acheté, les cinq indices achetés, puis une tranche **délibérément fausse** (la première cause du panneau, jamais garantie réelle) pour observer le relevé complet.
- **`s2`, à vide** : aucun cadrage, aucun achat, tranche immédiate — pour observer l'ordre inversé des panneaux, la position du panneau des causes côté `s2` (non reprise par la tournée précédente) et la surtaxe d'aveugle au relevé, cette fois avec sa capture.
- **`s3`, partiellement** : ouverture mesurée, un cadre déposé (une lecture retenue, « Transmettre ce cadre » cliqué) et un indice acheté, capturée sous `grayscale(1)`.

## Ce qui est capturé

18 fichiers, 9 par gabarit, dimensions PNG lues à l'octet et recoupées avec les `scrollHeight` DOM (aucun écart) :

| Fichier | État | Dimensions (desktop / mobile) |
| --- | --- | --- |
| `{gabarit}-0-s1-viewport-sans-defilement.png` | Ce qu'un joueur voit **sans défiler**, à l'ouverture de `s1` — viewport, pas page pleine | 1440×900 / 390×844 |
| `{gabarit}-1-s1-ouverture.png` | `s1` ouverte, rien cliqué — page pleine | 1440×1600 / 390×2372 |
| `{gabarit}-2-s1-cadre-depose-un-achat.png` | Cadre déposé (deux lectures retenues, transmis), un indice acheté — page pleine | 1440×1677 / 390×2430 |
| `{gabarit}-3-s1-cinq-achats.png` | Les cinq indices achetés : le relevé plafonné-et-replié — page pleine | 1440×1522 / 390×2234 |
| `{gabarit}-4-s1-revelation.png` | Révélation de `s1`, après une tranche volontairement fausse — page pleine | 1440×1920 / 390×2629 |
| `{gabarit}-5-s2-ouverture.png` | `s2` ouverte : le cadrage en tête cette fois — page pleine | 1440×1358 / 390×2039 |
| `{gabarit}-5b-s2-revelation.png` | Révélation de `s2`, tranche à l'aveugle — page pleine, **nouveau cette tournée** | 1440×1755 / 390×2453 |
| `{gabarit}-6-s3-ouverture.png` | `s3` ouverte : le marché en tête à nouveau — page pleine | 1440×1400 / 390×2071 |
| `{gabarit}-7-s3-desature.png` | `s3`, une lecture retenue et un indice acheté, sous `grayscale(1)` — page pleine | 1440×1477 / 390×2149 |

`desktop-0`/`mobile-0` sont bien en viewport (1440×900, 390×844), pas en page pleine — le panneau des causes n'y apparaît pas (`s1_causes_top` mesuré à 1253,5px desktop, 1820,25px mobile, tous deux au-delà de la hauteur du viewport). `mobile-0` est, à l'octet près, identique à la capture équivalente de la tournée précédente : la quatrième ligne de rapport ajoutée par `69633bd` tombe hors du viewport mobile (844px) dès l'ouverture, après les trois lignes déjà là — rien de nouveau n'y est visible, ce n'est pas une capture non renouvelée par erreur.

## Point 1 — position et lisibilité du cadrage et du marché, aux deux gabarits

**Desktop (`sm:` et au-delà) : parité par écran exacte, inchangée.** `hint-budget-game.tsx` pose `grid-cols-1 sm:grid-cols-2` : les deux panneaux sont deux frères d'une même rangée CSS Grid, sommet et pied identiques par construction (`align-items: stretch`). Mesuré (`getBoundingClientRect().top`) :

| Situation | Sommet cadrage | Sommet marché | Écart |
| --- | --- | --- | --- |
| `s1` | 696,5 | 696,5 | 0 |
| `s2` | 494 | 494 | 0 |
| `s3` | 516,75 | 516,75 | 0 |

**Mobile (390px) : empilement à une colonne, pas de parité par écran.** Mesuré :

| Situation | Sommet cadrage | Sommet marché | Écart vertical |
| --- | --- | --- | --- |
| `s1` | 1429,5 | 944,5 | 485 |
| `s2` | 631,5 | 1022,25 | 390,75 |
| `s3` | 1071 | 586 | 485 |

**Ce qui infirme l'ancienne tournée : `s1` a bougé, `s2` et `s3` n'ont pas bougé — et c'est exactement ce que le commit mesuré prédit.** `69633bd` touche le rapport de `s1` (une ligne de plus) et l'intitulé de `s1-h4` ; il ne touche ni le rapport de `s2`/`s3` ni leurs positions au-dessus de la grille. Mesuré : le sommet de `s1` passe de 647px à **696,5px** desktop (+49,5px, la ligne de rapport en plus), de 1337,25/872,25px à **1429,5/944,5px** mobile (+92,25 pour le cadrage, +72,25 pour le marché — un écart entre les deux qui vient de l'intitulé de `s1-h4`, plus long, qui allonge aussi le panneau du marché sur une colonne étroite). `s2` (494 / 631,5 / 1022,25) et `s3` (516,75 / 1071 / 586) restent identiques à la décimale près à la tournée précédente : ni leur rapport ni le contenu au-dessus de leur grille n'a changé. Une position qui bouge exactement là où la tâche a touché, et qui ne bouge pas là où elle n'a pas touché, n'est pas une régression de mesure : c'est la preuve que le périmètre de la tâche est le bon.

**Lisibilité, aux deux gabarits.** Vérifiée sur `desktop-1-s1-ouverture.png` et `mobile-1-s1-ouverture.png` : le nouvel intitulé de `s1-h4` (« Demander la clé de signature effectivement chargée en production ») tient sur trois lignes desktop, deux lignes mobile, aucun repli caractère par caractère. Confirmé aussi sur `desktop-5-s2-ouverture.png`/`mobile-5-s2-ouverture.png` pour le nouvel intitulé de `s2-h2` (« Rechercher une remise appliquée sur les lignes concernées ») et sur `desktop-6-s3-ouverture.png` pour celui de `s3-h3` (« Comparer les versions mineures de Node résolues de part et d'autre ») — trois lignes desktop, lisibles, pas de repli.

## Point 2 — l'ordre réel des deux panneaux dans chacune des trois situations

`cadrageFirst = (situationNumber - 1) % 2 !== 0` — mesuré en DOM (`querySelectorAll('section')`, position de l'en-tête « Le cadrage » contre « L'assistant »), identique aux deux gabarits :

| Situation | Panneau en tête (DOM) | Vérifié sur |
| --- | --- | --- |
| `s1` | **Le marché** | `desktop-1`, `mobile-1` |
| `s2` | **Le cadrage** | `desktop-5`, `mobile-5` |
| `s3` | **Le marché** | `desktop-6`, `mobile-6` |

Confirmé visuellement : « L'ASSISTANT » en tête sur `desktop-1`/`mobile-1`, « LE CADRAGE » en tête sur `desktop-5`/`mobile-5`, « L'ASSISTANT » de nouveau en tête sur `desktop-6`/`mobile-6`. Inchangé depuis la tournée précédente — attendu, la réécriture des indices ne touche ni composant ni classe de mise en page.

## Point 3 — l'action de trancher : position à l'ouverture et après cinq achats

Mesuré sur `s1`, `scrollY = 0` vérifié avant chaque lecture, page pleine :

| Gabarit | `scrollHeight` | `clientHeight` | Dépassement | Sommet du panneau des causes | Sous le pli de |
| --- | --- | --- | --- | --- | --- |
| Desktop, ouverture | 1600 | 900 | 700px | 1253,5px | 353,5px |
| Desktop, après 5 achats | 1522 | 900 | 622px | 1176,25px | 276,25px |
| Mobile, ouverture | 2372 | 844 | 1528px | 1820,25px | 976,25px |
| Mobile, après 5 achats | 2234 | 844 | 1390px | 1682,25px | 838,25px |

**Trancher reste hors d'écran sans défilement, aux deux gabarits, dès l'ouverture** — inchangé depuis les dernières tournées, toujours couvert par `aidd_docs/backlog/defects/l-ouverture-de-hint-budget-pousse-le-tranchage-hors-de-l-ecran.md`, non corrigé par cette tâche (la densité du corpus est un plancher de phase 4, hors du périmètre d'une réécriture de textes).

**Acheter n'aggrave jamais ce défilement, aux deux gabarits** : desktop −78px (1600 → 1522), mobile −138px (2372 → 2234).

**Ce que ce nouveau relevé infirme.** Les deux tournées précédentes donnaient tour à tour −37px/−119px puis −57px/−118px pour desktop/mobile ; les deux sont périmées. Le nouveau relevé, **−78px desktop, −138px mobile**, s'explique par où `69633bd` a agi : à l'ouverture, la quatrième ligne de rapport (nouvelle) et le nouvel intitulé de `s1-h4` (plus long que l'ancien) allongent le document d'ouverture — 1600px desktop contre 1530px avant ce commit, 2372px mobile contre 2280px. Après les cinq achats, seul le texte de preuve de `s1-h4` (`text`, aussi réécrit, plus court que l'ancien : « La clé chargée au démarrage correspond à celle du coffre de secrets… » contre l'ancien texte du cache CDN) entre dans le relevé plafonné à deux entrées visibles — 1522px desktop contre 1473px avant, 2234px mobile contre 2162px. Le document d'ouverture a grandi davantage que le document après achats : l'écart entre les deux (le delta) grandit donc lui aussi, dans le sens négatif. Ce n'est pas une instabilité du composant, c'est le corpus mesuré qui a changé aux deux bouts.

## Point 4 — le nombre d'arrêts de tabulation pour atteindre chaque panneau

Mesuré par une marche `Tab` continue depuis un focus remis sur `document.body` (rien cliqué avant, dans cette situation), en comptant le pas auquel le focus entre pour la première fois dans la section portant l'en-tête « Le cadrage » puis « L'assistant ». Identique aux deux gabarits — l'ordre de tabulation suit le DOM, pas la largeur de viewport.

| Situation | 1er arrêt dans marché | 1er arrêt dans cadrage | Panneau atteint en premier |
| --- | --- | --- | --- |
| `s1` | 1 | 6 | Marché (5 arrêts d'avance) |
| `s2` | 8 | 2 | Cadrage (6 arrêts d'avance) |
| `s3` | 2 | 7 | Marché (5 arrêts d'avance) |

Chiffres identiques à la tournée précédente, remesurés plutôt que recopiés — attendu, la réécriture des indices ne change ni le nombre d'éléments focalisables ni leur ordre. Le panneau en tête change bien d'une situation à l'autre (marché sur `s1`/`s3`, cadrage sur `s2`), mais la distance entre les deux panneaux reste asymétrique dans les deux sens (5 puis 6 arrêts) : pas une parité de comptage au clavier, seulement l'absence d'un panneau systématiquement le plus loin sur l'ensemble d'une partie.

## Point 5 — la révélation, avec son relevé chiffré

**`s1` — cinq indices achetés, tranche fausse** (`desktop-4-s1-revelation.png`, `mobile-4-s1-revelation.png`) :

> INDICES 75 · TRANCHE FAUSSE +40 · TOTAL 115

Vérifié : 5+10+15+20+25 = 75 (les cinq indices, coûts inchangés par ce commit), +40 la pénalité de tranche fausse, pas de surtaxe d'aveugle puisque des indices ont été achetés, 75+40 = 115 — identique à la tournée précédente, attendu puisque `69633bd` ne touche ni les coûts ni la pénalité. Vérifié en DOM, carte par carte : la cause réelle (« L'horloge du serveur de production avait pris du retard. ») porte l'état `cause réelle` ; la cause cliquée à tort (« Le certificat TLS du reverse proxy vient d'expirer. ») porte `écartée — tranchée`, et cette marque n'apparaît que sur une seule carte à la fois (`s1CutMarkingCount = 1`, vérifié en DOM aux deux gabarits), distincte des trois autres cartes qui portent `écartée` seule.

**`s2` — aucun cadrage, aucun achat, tranche à l'aveugle, capturée cette fois** (`desktop-5b-s2-revelation.png`, `mobile-5b-s2-revelation.png`) :

> INDICES 0 · TRANCHE FAUSSE +40 · AVEUGLE +30 · TOTAL 70

Vérifié : 0 indice acheté, +40 la pénalité de tranche fausse, +30 la surtaxe d'aveugle (`blindCutSurcharge`), cumulées puisqu'aucun indice n'a été acheté avant de trancher, 0+40+30 = 70. **Ce qui ferme un point resté ouvert après la tournée précédente** : la revue indépendante avait relevé que ce total (« TOTAL 70 ») était marqué vérifié sans capture à l'appui. Il l'est maintenant, aux deux gabarits.

## Point 6 — l'affichage identique des deux natures de lecture

Vérifié en DOM, séparément de la tournée principale (lecture de contrôle sur les six boutons du panneau « Le cadrage » de `s1`, ouverture fraîche, `scrollY = 0`) : les cinq boutons `FramingLine` partagent une seule et même `className`, aucun attribut `data-*` distinctif ; seul le sixième bouton (« Transmettre ce cadre », le composant `Button` de soumission) en porte un (`data-slot`), et sa classe diffère — cohérent avec le fait qu'il ne s'agit pas d'une ligne de cadrage. `framing-line.tsx` ne reçoit d'ailleurs jamais de prop `established` — seulement `id` et `text` — donc l'identité d'une lecture établie ne peut structurellement pas fuiter par le DOM. Confirme ce que `hint-budget-game.test.tsx` verrouille déjà (« renders an established reading and a supposition with exactly the same structure »).

## Point 7 — l'état sans la couleur

`desktop-7-s3-desature.png`, `mobile-7-s3-desature.png` (`grayscale(1)`, page pleine, sur `s3` : un cadre déposé et un indice acheté) : la lecture de cadrage retenue reste identifiable par sa case pleine (carré noir), l'indice acheté par son cadenas et son texte déjà révélé, le bouton « Transmettre ce cadre » par son état assombri (« Cadre transmis »). **Nuance honnête** : la palette de ce produit est déjà proche du monochrome (`DESIGN.md`) ; le filtre `grayscale(1)` a donc un effet visuellement discret sur cet écran précis — la vérification porte moins sur « la couleur disparaît » que sur « aucune des marques d'état ne s'appuyait uniquement sur une teinte qui aurait disparu », ce que les deux captures confirment.

## Ce qui n'a pas été mesuré, dit franchement

- **Le fondement du cadrage (`c3`) n'a pas de preuve visuelle dédiée** : cette tournée dépose des cadres avec une, deux ou aucune lecture retenue selon la situation, mais ne rejoue pas systématiquement les trois profils (fondé exact, partiel, vide) pour chaque situation. Couvert par les tests (`evaluator.test.ts`, `hint-budget-run.test.ts`), pas par une capture dédiée ici — inchangé depuis les tournées précédentes.
- **Le décompte des situations résolues et le score final** ne sont jamais affichés pendant la partie ; cette tournée ne les a donc pas cherchés à l'écran, conformément à « un jeu ne dit jamais ce qu'il note ».
- **Les causes elles-mêmes n'ont pas été réécrites par `69633bd`** (seuls les intitulés et textes de trois indices, et le rapport de `s1`, l'ont été) : les textes de causes affichés en révélation sont identiques à ceux des tournées précédentes — vérifié par comparaison directe du texte extrait en DOM sur `s1` et `s2`, pas seulement supposé.
- **Le nouveau seuil de la règle `frugal-solves-at-least` (`threshold: 3`, était `2`) n'a aucune preuve visuelle** : c'est une règle d'évaluation pure, jamais affichée à l'écran par construction (« un jeu ne dit jamais ce qu'il note ») — rien à capturer, seulement à confirmer par lecture de `config/course.json` et par les tests d'intégration (`hint-budget-run.test.ts`), hors du périmètre d'une tournée navigateur.

**Deux points relevés comme non couverts par la revue précédente, et fermés par cette tournée** : le relevé de `s2` (« TOTAL 70 ») a maintenant sa capture (`desktop-5b`/`mobile-5b-s2-revelation.png`) ; la position du panneau des causes sur `s2` est maintenant mesurée (1012,25px desktop, 1487,25px mobile — table complète ci-dessous).

| Situation | Sommet du panneau des causes (desktop) | Sommet du panneau des causes (mobile) |
| --- | --- | --- |
| `s1`, ouverture | 1253,5 | 1820,25 |
| `s1`, après 5 achats | 1176,25 | 1682,25 |
| `s2`, ouverture | 1012,25 | 1487,25 |

## Verdict

**Ce que cette tournée établit, mesuré et vérifié au pixel ou en DOM, sur le corpus réécrit par `69633bd`** : la parité desktop reste exacte (écart de sommet nul sur les trois situations) ; l'alternance mobile fait toujours alterner le panneau en tête (marché deux fois, cadrage une fois) sans jamais atteindre une parité de comptage au clavier (5 puis 6 arrêts) ; l'ouverture pousse toujours le panneau des causes sous le pli, aux deux gabarits, et les cinq achats réduisent toujours ce dépassement plutôt que de l'aggraver ; le relevé de révélation est exact au centime près, sur `s1` (tranche fausse) comme sur `s2` (tranche à l'aveugle, désormais avec sa capture) ; la marque « écartée — tranchée » reste visible, unique et distincte des trois autres cartes écartées ; les trois nouveaux intitulés d'indices restent lisibles sans repli aux deux gabarits.

**Ce qu'elle infirme d'une affirmation précédente.** La position du sommet des deux panneaux sur `s1` n'est plus stable d'une tournée à l'autre comme l'affirmait le fichier remplacé : elle passe de 647px à **696,5px** desktop, de 1337,25/872,25px à **1429,5/944,5px** mobile — parce que `69633bd`, contrairement au commit mesuré par la tournée précédente, touche le contenu au-dessus de la grille de `s1` (une ligne de rapport en plus). `s2` et `s3` restent inchangés, cohérent avec un commit qui ne touche pas leur rapport. Le delta de hauteur documentaire après cinq achats sur `s1` n'est plus −57px/−118px (desktop/mobile) mais **−78px/−138px** — les deux tournées précédentes mesuraient un corpus d'indices qui n'existe plus ; celle-ci les remplace en entier.

**Ce qu'elle ne prétend toujours pas** : une parité par écran au gabarit mobile (structurellement hors de portée d'un empilement à une colonne sans motif d'interface propre à ce seul jeu, que le mandat du produit interdit) ; que « trancher reste atteignable sans défilement » soit tenu (mesuré non tenu, dès l'ouverture, aux deux gabarits — défaut de backlog existant, non corrigé ici, hors du périmètre d'une réécriture de textes) ; une preuve visuelle du fondement du cadrage (`c3`) ou du nouveau seuil de frugalité, tous deux hors de portée d'une capture d'écran par construction.

Revalidé au moment de cette tournée : `npm run typecheck` (muet), `npx biome check src __tests__ config` (« Checked 201 files… No fixes applied »), `npm run test` (73 fichiers, 665 tests, tous passés — un test de plus que la tournée précédente, ajouté par `69633bd` dans `hint-budget-run.test.ts`).
