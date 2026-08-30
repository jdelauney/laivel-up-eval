# Tournée navigateur — `hint-budget`

31/08/2026, refaite intégralement après le commit `61f9576` (« isolate hint-budget's floor and framing-reference refusals ») : trois `verification` de cause réécrites (`s1-c-cdn`, `s2-c-double`, `s3-c-cache`, celles que le plancher de deux causes laisse debout), pour citer la ligne de rapport qui porte l'inférence plutôt qu'un indice supprimé au tour 3. Aucun champ de configuration hors `causes[].verification` ne bouge — ni `framings`, ni `hints`, ni les prix, ni les pénalités. Une `verification` n'est montrée qu'à la révélation d'une situation : seule la hauteur de l'état revealed peut donc bouger, jamais l'ouverture, le cadrage ou le marché. La tournée précédente (`qa/README.md` au commit `ec18346`) mesurait un corpus dont les trois `verification` citaient un fait absent de l'écran : ce fichier la remplace en entier, sans recopier aucun de ses chiffres. Chromium via Playwright (`playwright`, déjà une dépendance du projet), harnais jetable écrit pour cette tournée, supprimé après capture. Aux deux gabarits `1440×900` et `390×844`.

**Port du serveur de développement.** `5173` était déjà occupé (deux serveurs, `5173` et `5174`, tous deux d'un autre chantier sur cette machine — vérifié par `netstat` avant tout lancement). La tournée a tourné sur un troisième port dédié, `npm exec vite -- --port 5210 --strictPort`, lancé depuis ce répertoire de travail et arrêté après capture. Vérifié sur `g2-1` avant toute capture : voir « Méthode de mesure ».

**Méthode de mesure.** Session posée directement sur `g2-1` en écrivant `{"playerName":"QA Reviewer","groupIndex":1,"gameIndex":0,"submissions":[]}` dans `laivel-eval.session` (`localStorage`), rechargement, clic « Reprendre ». Avant toute capture, la cible a été vérifiée par le contenu texte brut du document (`document.body.textContent`, pas `innerText` — les en-têtes de section sont mises en capitales par CSS `uppercase`, et `innerText` reflète cette transformation à la casse, ce qui aurait fait échouer une vérification sensible à la casse) : le titre « Combien d'indices vous faut-il ? » et les deux en-têtes de section « Le cadrage » et « L'assistant » sont tous présents — la preuve que la session est bien tombée sur `g2-1`, pas sur un voisin.

Chaque capture et chaque lecture de position part de `window.scrollTo(0, 0)`, `window.scrollY` **vérifié explicitement à 0** juste avant — le harnais lève une erreur s'il ne l'est pas. Toute lecture de position (sommet de panneau, `scrollHeight`) précède le balayage `Tab` qui mesure les arrêts de tabulation, jamais l'inverse — un balayage clavier fait défiler la page pour ramener le focus dans le viewport, et une lecture de position prise après lui serait fausse sans qu'aucune erreur ne le signale. Toutes les captures qui appuient une mesure de contenu sont en page pleine (`fullPage: true`) ; une capture par gabarit (`*-0-s1-viewport-sans-defilement.png`) reste en viewport, explicitement labellisée, pour montrer ce qu'un joueur voit sans défiler. Chaque capture en page pleine a sa hauteur PNG (lue à l'octet dans l'en-tête `IHDR` du fichier) recoupée contre le `document.documentElement.scrollHeight` lu juste avant l'écriture du fichier — aucun écart sur les 18 fichiers.

## Le parcours joué

Trois situations, dans l'ordre — identique à la tournée précédente, aucune mesure recopiée :

- **`s1`, en entier** : mesure de l'ordre des panneaux et des arrêts de tabulation à l'ouverture, cadre déposé (deux lectures établies retenues, « Transmettre ce cadre » cliqué) et un indice acheté, les cinq indices achetés, puis une tranche **délibérément fausse** (la première cause du panneau, jamais garantie réelle) pour observer le relevé complet.
- **`s2`, à vide** : aucun cadrage, aucun achat, tranche immédiate sur la première cause du panneau — pour observer l'ordre inversé des panneaux, la position du panneau des causes côté `s2`, et la surtaxe d'aveugle au relevé, avec sa capture.
- **`s3`, partiellement** : ouverture mesurée, un cadre déposé (une lecture établie retenue, « Transmettre ce cadre » cliqué) et un indice acheté, capturée sous `grayscale(1)`.

## Ce qui est capturé

18 fichiers, 9 par gabarit, dimensions PNG lues à l'octet et recoupées avec les `scrollHeight` DOM (aucun écart) :

| Fichier | État | Dimensions (desktop / mobile) |
| --- | --- | --- |
| `{gabarit}-0-s1-viewport-sans-defilement.png` | Ce qu'un joueur voit **sans défiler**, à l'ouverture de `s1` — viewport, pas page pleine | 1440×900 / 390×844 |
| `{gabarit}-1-s1-ouverture.png` | `s1` ouverte, rien cliqué — page pleine | 1440×1600 / 390×2353 |
| `{gabarit}-2-s1-cadre-depose-un-achat.png` | Cadre déposé (deux lectures établies retenues, transmis), un indice acheté — page pleine | 1440×1677 / 390×2411 |
| `{gabarit}-3-s1-cinq-achats.png` | Les cinq indices achetés : le relevé plafonné-et-replié — page pleine | 1440×1522 / 390×2215 |
| `{gabarit}-4-s1-revelation.png` | Révélation de `s1`, après une tranche volontairement fausse — page pleine | 1440×**1998** / 390×**2649** |
| `{gabarit}-5-s2-ouverture.png` | `s2` ouverte : le cadrage en tête cette fois — page pleine | 1440×1339 / 390×2020 |
| `{gabarit}-5b-s2-revelation.png` | Révélation de `s2`, tranche à l'aveugle — page pleine | 1440×**1834** / 390×**2493** |
| `{gabarit}-6-s3-ouverture.png` | `s3` ouverte : le marché en tête à nouveau — page pleine | 1440×1400 / 390×2052 |
| `{gabarit}-7-s3-desature.png` | `s3`, une lecture retenue et un indice acheté, sous `grayscale(1)` — page pleine | 1440×1477 / 390×2129 |

Seules les deux lignes en gras bougent par rapport à la tournée précédente — les deux états de **révélation** que ce commit peut toucher, `s1` et `s2` (`s3` n'est jamais révélée dans cette tournée, cf. « Ce qui n'a pas été mesuré » plus bas). Les sept autres lignes portent des dimensions identiques, pixel pour pixel, confirmées par remesure et non par hypothèse — les fichiers PNG eux-mêmes diffèrent de quelques octets d'un rendu Chromium à l'autre (anticrénelage, compression), sans conséquence sur ce que ces dimensions mesurent.

`desktop-0`/`mobile-0` sont bien en viewport (1440×900, 390×844), pas en page pleine — le panneau des causes n'y apparaît pas (`s1_causes_top` mesuré à 1253,5px desktop, 1801px mobile, tous deux au-delà de la hauteur du viewport).

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
| `s2` | 631,5 | 1003 | 371,5 |
| `s3` | 1071 | 586 | 485 |

**Ce que cette tournée confirme, à la décimale près, sur les six couples mesurés.** `61f9576` ne touche que trois `causes[].verification` — jamais un `framings[].text` ni un `hints[].label` — donc rien de ce qui compose le cadrage ou le marché avant révélation ne peut bouger. Remesuré plutôt que supposé : les six valeurs ci-dessus sont identiques, à la décimale près, à celles de la tournée précédente (desktop `s1`/`s2`/`s3` à écart nul comme toujours par construction ; mobile `s1` 1429,5/944,5, `s2` 631,5/1003, `s3` 1071/586). Aucune ne bouge, dans aucun sens.

**Lisibilité, aux deux gabarits.** Vérifiée sur `desktop-1-s1-ouverture.png` et `mobile-1-s1-ouverture.png` : les cinq lectures de `s1` tiennent chacune sur deux à trois lignes aux deux gabarits, aucun repli caractère par caractère — inchangé, `s1-f*.text` n'a pas bougé depuis la tournée précédente.

## Point 2 — l'ordre réel des deux panneaux dans chacune des trois situations

`cadrageFirst = (situationNumber - 1) % 2 !== 0` — mesuré en DOM (`querySelectorAll('section')`, position de l'en-tête « Le cadrage » contre « L'assistant »), identique aux deux gabarits :

| Situation | Panneau en tête (DOM) | Vérifié sur |
| --- | --- | --- |
| `s1` | **Le marché** | `desktop-1`, `mobile-1` |
| `s2` | **Le cadrage** | `desktop-5`, `mobile-5` |
| `s3` | **Le marché** | `desktop-6`, `mobile-6` |

Inchangé depuis les tournées précédentes — attendu, `61f9576` ne touche ni composant ni classe de mise en page, ni le corpus de cadrage ou de marché.

## Point 3 — l'action de trancher : position à l'ouverture et après cinq achats

Mesuré sur `s1`, `scrollY = 0` vérifié avant chaque lecture, page pleine :

| Gabarit | `scrollHeight` | `clientHeight` | Dépassement | Sommet du panneau des causes | Sous le pli de |
| --- | --- | --- | --- | --- | --- |
| Desktop, ouverture | 1600 | 900 | 700px | 1253,5px | 353,5px |
| Desktop, après 5 achats | 1522 | 900 | 622px | 1176,25px | 276,25px |
| Mobile, ouverture | 2353 | 844 | 1509px | 1801px | 957px |
| Mobile, après 5 achats | 2215 | 844 | 1371px | 1663px | 819px |

**Trancher reste hors d'écran sans défilement, aux deux gabarits, dès l'ouverture** — inchangé depuis les dernières tournées, toujours couvert par `aidd_docs/backlog/defects/l-ouverture-de-hint-budget-pousse-le-tranchage-hors-de-l-ecran.md`, non corrigé par cette tâche (un correctif de trois `verification`, montrées à la révélation seulement, ne peut rien changer à un dépassement mesuré à l'ouverture).

**Acheter n'aggrave jamais ce défilement, aux deux gabarits** : desktop −78px (1600 → 1522), mobile −138px (2353 → 2215).

**Ce que ce relevé confirme, à l'identique de la tournée précédente sur les cinq valeurs.** Les cinq mesures ci-dessus (dépassement d'ouverture, dépassement après achats, sommets de panneau des causes, aux deux gabarits) sont toutes identiques à l'octet ou au dixième de pixel près à la tournée précédente — attendu, `61f9576` ne touche que des `verification` de cause, jamais rendues avant la révélation d'une situation, et le panneau des causes avant révélation ne porte que `text`, jamais `verification`.

## Point 4 — le nombre d'arrêts de tabulation pour atteindre chaque panneau

Mesuré par une marche `Tab` continue depuis un focus remis sur `document.body` (rien cliqué avant, dans cette situation), en comptant le pas auquel le focus entre pour la première fois dans la section portant l'en-tête « Le cadrage » puis « L'assistant ». Identique aux deux gabarits — l'ordre de tabulation suit le DOM, pas la largeur de viewport.

| Situation | 1er arrêt dans marché | 1er arrêt dans cadrage | Panneau atteint en premier |
| --- | --- | --- | --- |
| `s1` | 1 | 6 | Marché (5 arrêts d'avance) |
| `s2` | 8 | 2 | Cadrage (6 arrêts d'avance) |
| `s3` | 2 | 7 | Marché (5 arrêts d'avance) |

Chiffres identiques à la tournée précédente, remesurés plutôt que recopiés — attendu, `61f9576` ne change ni le nombre d'éléments focalisables ni leur ordre : le champ qu'il touche (`causes[].verification`) n'est jamais focalisable, et n'existe même pas dans le DOM avant la révélation d'une situation.

## Point 5 — la révélation, avec son relevé chiffré

**`s1` — cinq indices achetés, tranche fausse** (`desktop-4-s1-revelation.png`, `mobile-4-s1-revelation.png`) :

> INDICES 75 · TRANCHE FAUSSE +40 · TOTAL 115

Vérifié : 5+10+15+20+25 = 75 (les cinq indices, coûts inchangés par ce commit), +40 la pénalité de tranche fausse, pas de surtaxe d'aveugle puisque des indices ont été achetés, 75+40 = 115 — identique à la tournée précédente en valeur, attendu puisque `61f9576` ne touche ni les coûts ni la pénalité. Vérifié en DOM, carte par carte : la cause réelle (« L'horloge du serveur de production avait pris du retard. ») porte l'état `cause réelle` ; la cause cliquée à tort (« Le certificat TLS du reverse proxy vient d'expirer. ») porte `écartée — tranchée`, et cette marque n'apparaît que sur une seule carte à la fois, distincte des trois autres cartes qui portent `écartée` seule.

**Ce qui a changé, et pourquoi c'était attendu.** La hauteur de cette capture passe de 1440×1920 à **1440×1998** (desktop, +78px) et de 390×2610 à **390×2649** (mobile, +39px). La cause `s1-c-cdn » (« Le cache CDN sert une version périmée de la réponse »), écartée mais non tranchée, porte désormais une `verification` plus longue : « Le rapport le dit sans le conclure : chaque appel reçoit un refus calculé à la volée, jamais deux fois la même réponse servie à l'identique. Un cache resservirait la même. Ce n'est pas la cause. » — contre « La réponse est marquée non-cacheable et n'entre jamais dans le cache CDN : ce n'est pas la cause. » avant `61f9576`. Le fait cité existe désormais dans le rapport affiché à l'écran (`s1.report`), au lieu de citer `s1-h5`, un indice supprimé au tour 3 qu'aucun geste du jeu ne pouvait plus produire.

**`s2` — aucun cadrage, aucun achat, tranche à l'aveugle** (`desktop-5b-s2-revelation.png`, `mobile-5b-s2-revelation.png`) :

> INDICES 0 · TRANCHE FAUSSE +40 · AVEUGLE +30 · TOTAL 70

Vérifié : 0 indice acheté, +40 la pénalité de tranche fausse, +30 la surtaxe d'aveugle (`blindCutSurcharge`), cumulées puisqu'aucun indice n'a été acheté avant de trancher, 0+40+30 = 70 — identique à la tournée précédente en valeur.

**Ce qui a changé, et pourquoi c'était attendu.** La hauteur passe de 1440×1736 à **1440×1834** (desktop, +98px) et de 390×2434 à **390×2493** (mobile, +59px). La cause `s2-c-double` (« Le total de la facture est recalculé deux fois de façon indépendante »), écartée à ce relevé, porte désormais : « Le rapport le dit sans le conclure : l'écart n'apparaît que sur les lignes dont la quantité comporte une décimale. Un total calculé deux fois serait faux partout, jamais sur ces lignes-là seulement. Ce n'est pas la cause. » — contre « Le total n'est calculé qu'une seule fois, côté serveur : ce n'est pas la cause. » avant `61f9576`, qui citait `s2-h2`, un indice lui aussi supprimé au tour 3.

**`s3` n'est pas révélée dans cette tournée** (jouée seulement partiellement, cf. « Le parcours joué »), donc la troisième `verification` réécrite par `61f9576` (`s3-c-cache`, « Le rapport le dit sans le conclure : l'échec ne porte jamais sur les mêmes tests d'une exécution à l'autre. Un cache corrompu ferait échouer les mêmes tests à chaque fois. Ce n'est pas la cause. », contre l'ancienne citant `s3-h3`) n'a aucune capture qui la montre — cohérent avec le périmètre de cette tournée depuis son origine, cf. « Ce qui n'a pas été mesuré » plus bas.

## Point 6 — l'affichage identique des deux natures de lecture

`framing-line.tsx` ne reçoit jamais de prop `established` ni `refersTo` — seulement `id`/`text` du côté du hook, `text`/`retained`/`locked`/`onToggle` côté composant — donc l'identité ou la cible d'une lecture ne peuvent structurellement pas fuiter par le DOM. Vérifié sur `desktop-1-s1-ouverture.png` et `mobile-1-s1-ouverture.png` : les cinq lectures du panneau « Le cadrage » de `s1` — deux établies (`s1-f1`, `s1-f2`), dotées d'un `refersTo` depuis le tour 5 mais dont le **texte** n'a pas bougé, et trois suppositions (`s1-f3`, `s1-f4`, `s1-f5`), dont **deux** ont été réécrites au tour 5 (`s1-f3`, `s1-f4`) et **une** garde son texte d'origine (`s1-f5`) — partagent toutes la même structure visuelle : case, texte, aucune marque distinctive. Confirme ce que `hint-budget-game.test.tsx` verrouille déjà (« renders an established reading and a supposition with exactly the same structure »).

## Point 7 — l'état sans la couleur

`desktop-7-s3-desature.png`, `mobile-7-s3-desature.png` (`grayscale(1)`, page pleine, sur `s3` : un cadre déposé et un indice acheté) : la lecture de cadrage retenue reste identifiable par sa case pleine (carré noir), l'indice acheté par son cadenas et son texte déjà révélé, le bouton « Transmettre ce cadre » par son état assombri (« Cadre transmis »). Inchangé depuis les tournées précédentes, mêmes dimensions exactes (1440×1477 desktop, 390×2129 mobile) : `s3` n'est pas révélée dans cet état, donc la `verification` réécrite de `s3-c-cache` n'y entre pas.

## Ce qui n'a pas été mesuré, dit franchement

- **La troisième `verification` réécrite (`s3-c-cache`) n'a aucune preuve visuelle dans cette tournée** : `s3` n'est jouée que partiellement (un cadre, un achat, capture désaturée), sans revenir sur sa révélation — cohérence avec le périmètre des tournées précédentes, qui ne révèlent jamais `s3` non plus. Le nouveau texte est cité et comparé à l'ancien au Point 5, par lecture directe de `config/course.json`, pas par capture.
- **Les trois refus nouvellement testés (le plancher de deux causes, les deux refus `refersTo`) et le sens de `ruledOutByReport`** n'ont, et n'ont jamais eu, de preuve visuelle : ce sont des refus au chargement de la configuration et un champ de contrat, jamais affichés à l'écran par construction. Couverts par `config.schema.test.ts` (`describe('the two-cause floor', …)`), pas par une capture.
- **Le fondement du cadrage (`c3`) et `framing.refersTo`** n'ont toujours aucune preuve visuelle dédiée, comme aux tournées précédentes : `refersTo` n'est jamais exposé à l'écran par construction (`framing-line.tsx` ne reçoit que `text`). Couvert par les tests, pas par une capture ici.
- **Le décompte des situations résolues et le score final** ne sont jamais affichés pendant la partie ; cette tournée ne les a donc pas cherchés à l'écran, conformément à « un jeu ne dit jamais ce qu'il note ».
- **Le panneau des causes de `s3` n'a pas de position mesurée** dans cette tournée, comme dans les précédentes : `s3` n'est jouée que partiellement, sans revenir sur la position de son panneau des causes.

## Verdict

**Ce que cette tournée établit, mesuré et vérifié au pixel ou en DOM, sur le corpus réécrit par `61f9576`** : sur les neuf états capturés par gabarit, sept portent des dimensions identiques, pixel pour pixel, à la tournée précédente — parité desktop exacte sur les trois situations, sommets de panneau mobiles inchangés, ordre DOM et arrêts de tabulation inchangés (5 puis 6), dépassement de l'action de trancher à l'ouverture et après cinq achats inchangé (700px/957px à l'ouverture, 622px/819px après achats, deltas −78px/−138px) ; seuls les deux états de **révélation** joués dans cette tournée (`s1`, `s2`) portent une hauteur différente (+78/+39px desktop/mobile sur `s1`, +98/+59px sur `s2`), et ce déplacement est entièrement expliqué par l'allongement d'une seule `verification` par situation, jamais par un changement de mise en page. Les coûts, pénalités et surtaxe restent identiques (`s1` : 75+40=115 ; `s2` : 0+40+30=70). Le point 6 de la tournée précédente affirmait « trois suppositions réécrites » sur le panneau de `s1` : recompté ici, ce sont deux (`s1-f3`, `s1-f4`), la troisième (`s1-f5`) garde son texte d'origine — la seule inexactitude relevée par la revue sur l'ensemble de la tournée précédente, corrigée ici.

**Ce qu'elle infirme d'une affirmation qu'une lecture rapide pourrait supposer.** `61f9576` ne change ni la structure DOM, ni les classes de mise en page, ni le corpus de cadrage ou de marché : seul le texte de trois `verification` de cause bouge, chacune montrée à la révélation d'une seule situation. La conséquence mesurée n'est donc pas un réagencement de l'écran mais un allongement ponctuel de deux panneaux de révélation sur trois possibles (`s1`, `s2` ; `s3` non revue dans cette tournée) — un déplacement étroit, entièrement contenu dans l'état `revealed`, jamais dans `playing`.

**Ce qu'elle ne prétend toujours pas** : une parité par écran au gabarit mobile (structurellement hors de portée d'un empilement à une colonne sans motif d'interface propre à ce seul jeu, que le mandat du produit interdit) ; que « trancher reste atteignable sans défilement » soit tenu (mesuré non tenu, dès l'ouverture, aux deux gabarits — défaut de backlog existant, non corrigé ici, hors du périmètre d'une réécriture de trois `verification`) ; une preuve visuelle du fondement du cadrage (`c3`), de `refersTo`, ou de la révélation de `s3`, tous trois hors de portée d'une capture d'écran par construction ou hors du périmètre joué par cette tournée.

Revalidé au moment de cette tournée : `npm run typecheck` (muet), `npx biome check src __tests__ config` (« Checked … files… No fixes applied »), `npm run test` (670 tests, tous passés).
