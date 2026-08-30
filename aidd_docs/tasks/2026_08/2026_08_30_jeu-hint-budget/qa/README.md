# Tournée navigateur — `hint-budget`

31/08/2026, refaite intégralement après le commit `ec18346` (« extend hint-budget's floor to everything the screen names ») : six lectures de cadrage réécrites (`s1-f3`, `s1-f4`, `s2-f3`, `s2-f5`, `s3-f1`, `s3-f4`), `framing.refersTo` ajouté aux quinze lectures. Les six textes réécrits changent la hauteur du panneau de cadrage aux deux gabarits ; `refersTo` n'a aucun effet visuel (jamais exposé au hook, cf. `use-hint-budget.hook.ts`). La tournée précédente (`qa/README.md` au commit `69633bd`) mesurait un corpus de lectures qui n'existe plus : ce fichier la remplace en entier, sans recopier aucun de ses chiffres. Chromium via Playwright (`playwright`, déjà une dépendance du projet), harnais jetable écrit pour cette tournée, supprimé après capture. Aux deux gabarits `1440×900` et `390×844`.

**Port du serveur de développement.** `5173` n'était pas occupé au lancement de cette tournée (vérifié par `netstat` avant tout démarrage), mais la consigne du chantier précédent reste tenue par précaution — une connexion sur ce port a déjà mesuré `g2-2` au lieu de `g2-1` lors d'une tournée antérieure, le serveur d'un autre chantier ayant pu s'y attacher entre deux vérifications. Toute la tournée a donc tourné sur un second serveur dédié, `npm exec vite -- --port 5205 --strictPort`, lancé depuis ce répertoire de travail et arrêté après capture.

**Méthode de mesure.** Session posée directement sur `g2-1` en écrivant `{"playerName":"QA Reviewer","groupIndex":1,"gameIndex":0,"submissions":[]}` dans `laivel-eval.session` (`localStorage`), rechargement, clic « Reprendre ». Avant toute capture, la cible a été vérifiée à l'écran : le titre « Combien d'indices vous faut-il ? » et les deux en-têtes de section « Le cadrage » et « L'assistant » sont tous présents — la preuve que la session est bien tombée sur `g2-1`, pas sur un voisin.

Chaque capture et chaque lecture de position part de `window.scrollTo(0, 0)`, `window.scrollY` **vérifié explicitement à 0** juste avant — le harnais lève une erreur s'il ne l'est pas. Toute lecture de position (sommet de panneau, `scrollHeight`) précède le balayage `Tab` qui mesure les arrêts de tabulation, jamais l'inverse — un balayage clavier fait défiler la page pour ramener le focus dans le viewport, et une lecture de position prise après lui serait fausse sans qu'aucune erreur ne le signale. Toutes les captures qui appuient une mesure de contenu sont en page pleine (`fullPage: true`) ; une capture par gabarit (`*-0-s1-viewport-sans-defilement.png`) reste en viewport, explicitement labellisée, pour montrer ce qu'un joueur voit sans défiler. Chaque capture en page pleine a sa hauteur PNG recoupée à l'octet contre le `document.documentElement.scrollHeight` lu juste avant l'écriture du fichier — aucun écart sur les 18 fichiers.

## Le parcours joué

Trois situations, dans l'ordre :

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
| `{gabarit}-4-s1-revelation.png` | Révélation de `s1`, après une tranche volontairement fausse — page pleine | 1440×1920 / 390×2610 |
| `{gabarit}-5-s2-ouverture.png` | `s2` ouverte : le cadrage en tête cette fois — page pleine | 1440×1339 / 390×2020 |
| `{gabarit}-5b-s2-revelation.png` | Révélation de `s2`, tranche à l'aveugle — page pleine | 1440×1736 / 390×2434 |
| `{gabarit}-6-s3-ouverture.png` | `s3` ouverte : le marché en tête à nouveau — page pleine | 1440×1400 / 390×2052 |
| `{gabarit}-7-s3-desature.png` | `s3`, une lecture retenue et un indice acheté, sous `grayscale(1)` — page pleine | 1440×1477 / 390×2129 |

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

**Ce que cette tournée infirme et confirme, situation par situation — pas uniformément.** Les sommets de panneau restent identiques à l'octet près à la tournée précédente sur les **cinq** couples mesurés sur six : desktop `s1`/`s2`/`s3` (696,5 / 494 / 516,75, écart nul comme toujours par construction), mobile `s1` (1429,5 / 944,5) et mobile `s3` (1071 / 586). Seul mobile `s2` bouge : le marché recule de 1022,25px à **1003px** (−19,25px), le cadrage reste à 631,5px. La raison tient à l'ordre DOM et à la colonne dominante, pas à un déplacement uniforme :

- Sur `s1` et `s3`, le marché rend en premier (`cadrageFirst` faux) et son contenu — les cinq indices, jamais touchés par `ec18346` — est inchangé : le marché ne bouge donc pas, et le cadrage qui le suit ne peut pas bouger son propre sommet en changeant son propre contenu.
- Sur `s2`, le cadrage rend en premier (`cadrageFirst` vrai) : ses deux lectures raccourcies (`s2-f3`, `s2-f5`) réduisent sa hauteur propre, ce qui recule d'autant le sommet de ce qui le suit — le marché, mobile uniquement, où l'empilement à une colonne fait dépendre la position d'un panneau de la hauteur de celui qui le précède.
- Sur desktop, les deux panneaux sont deux frères d'une même rangée CSS Grid (`align-items: stretch`) : leurs sommets sont toujours égaux par construction, quelle que soit la colonne la plus haute — ce que la parité à écart nul confirme sur les trois situations, inchangée.

Ce que la hauteur de **document** infirme, en revanche, ne suit pas la position des panneaux. En mobile, l'empilement additionne les hauteurs : les trois situations perdent chacune ~19px sur leur `scrollHeight` d'ouverture (`s1` 2372 → 2353, `s2` 2039 → 2020, `s3` 2071 → 2052), que le cadrage y rende en premier ou en second — le panneau qui suit se déplace, sans que son propre sommet ne bouge, cf. Point 3. En desktop, la rangée grid est bornée par sa colonne la plus haute : `s2` perd 19px (`1358` → `1339`) parce que le cadrage — pas le marché — y était la colonne dominante avant la réécriture ; `s1` et `s3` n'en perdent aucun, parce que le marché — inchangé — y reste dominant des deux côtés de la comparaison.

**Lisibilité, aux deux gabarits.** Vérifiée sur `desktop-1-s1-ouverture.png` et `mobile-1-s1-ouverture.png` : les six lectures réécrites (« Le proxy applique une limite de débit… », « Les appels sortants passent par un tunnel réseau… », « Le format d'affichage des montants a changé… », « Le modèle de facture a été refait par l'assistant… », « Le pipeline CI a été migré vers un nouveau fournisseur… », « Les journaux de la CI sont tronqués… ») tiennent chacune sur deux à trois lignes aux deux gabarits, aucun repli caractère par caractère.

## Point 2 — l'ordre réel des deux panneaux dans chacune des trois situations

`cadrageFirst = (situationNumber - 1) % 2 !== 0` — mesuré en DOM (`querySelectorAll('section')`, position de l'en-tête « Le cadrage » contre « L'assistant »), identique aux deux gabarits :

| Situation | Panneau en tête (DOM) | Vérifié sur |
| --- | --- | --- |
| `s1` | **Le marché** | `desktop-1`, `mobile-1` |
| `s2` | **Le cadrage** | `desktop-5`, `mobile-5` |
| `s3` | **Le marché** | `desktop-6`, `mobile-6` |

Inchangé depuis les tournées précédentes — attendu, la réécriture des lectures de cadrage ne touche ni composant ni classe de mise en page.

## Point 3 — l'action de trancher : position à l'ouverture et après cinq achats

Mesuré sur `s1`, `scrollY = 0` vérifié avant chaque lecture, page pleine :

| Gabarit | `scrollHeight` | `clientHeight` | Dépassement | Sommet du panneau des causes | Sous le pli de |
| --- | --- | --- | --- | --- | --- |
| Desktop, ouverture | 1600 | 900 | 700px | 1253,5px | 353,5px |
| Desktop, après 5 achats | 1522 | 900 | 622px | 1176,25px | 276,25px |
| Mobile, ouverture | 2353 | 844 | 1509px | 1801px | 957px |
| Mobile, après 5 achats | 2215 | 844 | 1371px | 1663px | 819px |

**Trancher reste hors d'écran sans défilement, aux deux gabarits, dès l'ouverture** — inchangé depuis les dernières tournées, toujours couvert par `aidd_docs/backlog/defects/l-ouverture-de-hint-budget-pousse-le-tranchage-hors-de-l-ecran.md`, non corrigé par cette tâche (la densité du corpus est un plancher de phase 4, hors du périmètre d'une réécriture de lectures de cadrage).

**Acheter n'aggrave jamais ce défilement, aux deux gabarits** : desktop −78px (1600 → 1522), mobile −138px (2353 → 2215).

**Ce que ce nouveau relevé confirme et infirme, et pourquoi `s1` bouge ici alors que ses panneaux ne bougent pas (Point 1).** Desktop est identique à l'octet près à la tournée précédente sur `s1` (700px / 353,5px à l'ouverture, 622px / 276,25px après achats, delta −78px) : sur cette situation, le marché — inchangé par `ec18346` — reste la colonne la plus haute de la rangée grid, donc la hauteur de la rangée, et tout ce qui la suit (le panneau des causes), ne dépendent pas de la longueur du cadrage. Mobile bouge d'un même quart de pixel sur les quatre mesures de `s1` — ouverture 976,25px → **957px** de dépassement sous le pli du panneau des causes (−19,25px), après achats 838,25px → **819px** (−19,25px) — bien que les sommets des panneaux cadrage et marché de `s1`, eux, n'aient pas bougé (Point 1). La raison : en empilement mobile, le marché rend en premier sur `s1`, donc son sommet et sa hauteur ne dépendent pas du cadrage ; mais le cadrage, qui le suit, a lui-même raccourci (deux lectures réécrites), et ce raccourcissement recule d'autant tout ce qui vient **après** le cadrage — le panneau des causes — sans jamais toucher le sommet du cadrage lui-même, fixé par le marché qui le précède. Le delta mobile reste inchangé, **−138px**, à l'identique de la tournée précédente : la réécriture des lectures de cadrage déplace le document d'un même décalage constant, avant comme après les cinq achats de `s1` (les achats ne touchent jamais le panneau de cadrage), donc la différence entre les deux états ne bouge pas.

## Point 4 — le nombre d'arrêts de tabulation pour atteindre chaque panneau

Mesuré par une marche `Tab` continue depuis un focus remis sur `document.body` (rien cliqué avant, dans cette situation), en comptant le pas auquel le focus entre pour la première fois dans la section portant l'en-tête « Le cadrage » puis « L'assistant ». Identique aux deux gabarits — l'ordre de tabulation suit le DOM, pas la largeur de viewport.

| Situation | 1er arrêt dans marché | 1er arrêt dans cadrage | Panneau atteint en premier |
| --- | --- | --- | --- |
| `s1` | 1 | 6 | Marché (5 arrêts d'avance) |
| `s2` | 8 | 2 | Cadrage (6 arrêts d'avance) |
| `s3` | 2 | 7 | Marché (5 arrêts d'avance) |

Chiffres identiques à la tournée précédente, remesurés plutôt que recopiés — attendu, la réécriture des lectures de cadrage ne change ni le nombre d'éléments focalisables ni leur ordre, seulement leur texte. Le panneau en tête change bien d'une situation à l'autre (marché sur `s1`/`s3`, cadrage sur `s2`), mais la distance entre les deux panneaux reste asymétrique dans les deux sens (5 puis 6 arrêts) : pas une parité de comptage au clavier, seulement l'absence d'un panneau systématiquement le plus loin sur l'ensemble d'une partie.

## Point 5 — la révélation, avec son relevé chiffré

**`s1` — cinq indices achetés, tranche fausse** (`desktop-4-s1-revelation.png`, `mobile-4-s1-revelation.png`) :

> INDICES 75 · TRANCHE FAUSSE +40 · TOTAL 115

Vérifié : 5+10+15+20+25 = 75 (les cinq indices, coûts inchangés par ce commit), +40 la pénalité de tranche fausse, pas de surtaxe d'aveugle puisque des indices ont été achetés, 75+40 = 115 — identique à la tournée précédente, attendu puisque `ec18346` ne touche ni les coûts ni la pénalité. Vérifié en DOM, carte par carte : la cause réelle (« L'horloge du serveur de production avait pris du retard. ») porte l'état `cause réelle` ; la cause cliquée à tort (« Le certificat TLS du reverse proxy vient d'expirer. ») porte `écartée — tranchée`, et cette marque n'apparaît que sur une seule carte à la fois, distincte des trois autres cartes qui portent `écartée` seule.

**`s2` — aucun cadrage, aucun achat, tranche à l'aveugle** (`desktop-5b-s2-revelation.png`, `mobile-5b-s2-revelation.png`) :

> INDICES 0 · TRANCHE FAUSSE +40 · AVEUGLE +30 · TOTAL 70

Vérifié : 0 indice acheté, +40 la pénalité de tranche fausse, +30 la surtaxe d'aveugle (`blindCutSurcharge`), cumulées puisqu'aucun indice n'a été acheté avant de trancher, 0+40+30 = 70 — identique à la tournée précédente, attendu pour la même raison.

## Point 6 — l'affichage identique des deux natures de lecture

`framing-line.tsx` ne reçoit jamais de prop `established` ni `refersTo` — seulement `id`/`text` du côté du hook, `text`/`retained`/`locked`/`onToggle` côté composant — donc l'identité ou la cible d'une lecture ne peuvent structurellement pas fuiter par le DOM. Vérifié sur `desktop-1-s1-ouverture.png` et `mobile-1-s1-ouverture.png` : les cinq lectures du panneau « Le cadrage » de `s1` (deux établies désormais dotées d'un `refersTo`, trois suppositions réécrites) partagent la même structure visuelle — case, texte, aucune marque distinctive. Confirme ce que `hint-budget-game.test.tsx` verrouille déjà (« renders an established reading and a supposition with exactly the same structure »).

## Point 7 — l'état sans la couleur

`desktop-7-s3-desature.png`, `mobile-7-s3-desature.png` (`grayscale(1)`, page pleine, sur `s3` : un cadre déposé et un indice acheté) : la lecture de cadrage retenue reste identifiable par sa case pleine (carré noir), l'indice acheté par son cadenas et son texte déjà révélé, le bouton « Transmettre ce cadre » par son état assombri (« Cadre transmis »). Inchangé depuis les tournées précédentes : la réécriture des lectures de cadrage ne touche aucune marque d'état.

## Ce qui n'a pas été mesuré, dit franchement

- **Le fondement du cadrage (`c3`) et la nouvelle union de désignations (`framing.refersTo`) n'ont aucune preuve visuelle dédiée** : cette tournée dépose des cadres avec une ou deux lectures retenues selon la situation, mais ne rejoue pas systématiquement les trois profils (fondé exact, partiel, vide) pour chaque situation, et `refersTo` n'est de toute façon jamais exposé à l'écran par construction. Couvert par les tests (`config.schema.test.ts`, `evaluator.test.ts`, `hint-budget-run.test.ts`), pas par une capture dédiée ici.
- **Le décompte des situations résolues et le score final** ne sont jamais affichés pendant la partie ; cette tournée ne les a donc pas cherchés à l'écran, conformément à « un jeu ne dit jamais ce qu'il note ».
- **Le panneau des causes de `s3` n'a pas de position mesurée** dans cette tournée, comme dans les précédentes : `s3` n'est jouée que partiellement (un cadre, un achat, capture désaturée), sans revenir sur la position du panneau des causes.
- **Le plancher de deux causes élargi à l'union** (rapport, indices, cadrage) n'a aucune preuve visuelle : c'est un refus au chargement et un calcul de contrat, jamais affiché à l'écran par construction — rien à capturer, seulement à confirmer par lecture de `config/course.json` et par les tests (`config.schema.test.ts`, `hint-budget-run.test.ts`), hors du périmètre d'une tournée navigateur.

## Verdict

**Ce que cette tournée établit, mesuré et vérifié au pixel ou en DOM, sur le corpus réécrit par `ec18346`** : la parité desktop tient toujours exactement, écart de sommet nul sur les trois situations, sommets identiques à l'octet près à la tournée précédente sur les trois ; les sommets des panneaux mobiles ne bougent que là où le panneau raccourci rend **avant** celui qu'on mesure (`s2`, marché reculé de 19,25px) et restent inchangés partout où c'est l'inverse (`s1`, `s3`) — cf. Point 1 pour le mécanisme complet, pas un déplacement uniforme ; la hauteur totale du document, elle, bouge sur les trois situations en mobile (~−19px chacune, l'empilement additionne toujours) mais seulement sur `s2` en desktop (−19px, seule situation où le cadrage dominait la rangée grid avant sa réécriture) ; l'écart entre les deux panneaux (`s1`/`s3` marché en tête, `s2` cadrage en tête) et les arrêts de tabulation (5 puis 6) ne changent pas ; l'ouverture pousse toujours le panneau des causes sous le pli, aux deux gabarits, et les cinq achats réduisent toujours ce dépassement plutôt que de l'aggraver, avec un delta mobile inchangé (−138px) et un delta desktop inchangé (−78px) sur `s1` ; le relevé de révélation est exact au centime près, identique à la tournée précédente sur `s1` (tranche fausse) comme sur `s2` (tranche à l'aveugle) ; la marque « écartée — tranchée » reste visible, unique et distincte des trois autres cartes écartées ; les six lectures de cadrage réécrites restent lisibles sans repli aux deux gabarits.

**Ce qu'elle infirme d'une affirmation qu'une lecture rapide pourrait supposer.** `ec18346` ne change ni les coûts, ni les pénalités, ni le nombre d'éléments focalisables, ni la structure DOM : seul le texte de six lectures de cadrage bouge, plus un champ (`refersTo`) jamais rendu à l'écran. La conséquence mesurée n'est pas pour autant uniforme : elle dépend de l'ordre DOM et de la colonne dominante de chaque situation, pas d'un simple « mobile bouge, desktop ne bouge pas » — c'est un déplacement étroit et explicable par la structure de la grille, pas une réouverture large des mesures précédentes.

**Ce qu'elle ne prétend toujours pas** : une parité par écran au gabarit mobile (structurellement hors de portée d'un empilement à une colonne sans motif d'interface propre à ce seul jeu, que le mandat du produit interdit) ; que « trancher reste atteignable sans défilement » soit tenu (mesuré non tenu, dès l'ouverture, aux deux gabarits — défaut de backlog existant, non corrigé ici, hors du périmètre d'une réécriture de lectures de cadrage) ; une preuve visuelle du fondement du cadrage (`c3`), du plancher élargi au tour 5, ou de `refersTo`, tous trois hors de portée d'une capture d'écran par construction.

Revalidé au moment de cette tournée : `npm run typecheck` (muet), `npx biome check src __tests__ config` (« Checked 201 files… No fixes applied »), `npm run test` (73 fichiers, 667 tests, tous passés).
