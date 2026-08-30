# Tournée navigateur — `hint-budget`

30/08/2026, reprise après revue. Chromium via Playwright CLI, sur `npm run dev` (port 5183), aux deux gabarits `1440×900` et `390×844`. Le harnais est hors du dépôt, comme pour les tournées précédentes.

**Correction du 30/08, après revue.** La tournée précédente prenait ses captures mobiles en viewport (`fullPage: false`) à `scrollY = 0`, alors que la grille cadrage/marché commence sous le pli aux deux gabarits (voir « Point 3 ») : ces captures n'en montraient aucun pixel, et le README l'affirmait pourtant visible au premier rendu. **Toutes les captures qui appuient une mesure de contenu sont désormais prises en page pleine (`fullPage: true`)** ; une seule capture reste en viewport, à l'ouverture, pour montrer honnêtement ce qu'un joueur voit sans défiler — qui est précisément le sujet du « Point 3 ». Chaque capture et chaque mesure part de `window.scrollTo(0, 0)`, `window.scrollY` vérifié à `0` avant toute lecture.

## Le parcours joué

Session posée directement sur `g2-1` en écrivant `{"playerName":"QA Reviewer","groupIndex":1,"gameIndex":0,"submissions":[]}` dans `laivel-eval.session` puis en cliquant « Reprendre ». Comme pour `lie-detector`, la tête de page affiche « Situation 1 sur 20 » au lieu de 3 : artefact de `progress.submitted + 1` compté à zéro dans une session forgée, pas un défaut de `hint-budget` — et sans lien avec le libellé interne du jeu, qui affiche désormais « Incident » (voir « Point 8 »).

Trois situations jouées, dans l'ordre : `s1` en entier (cadrage, un achat, cinq achats, tranche fausse, révélation), `s2` minimalement (une tranche, sans cadrage ni achat, pour atteindre `s3` et vérifier l'alternance de parité — voir « Point 1 »), `s3` ouverte puis jouée jusqu'à un achat et une lecture retenue, capturée sous `grayscale(1)`.

## Ce qui est capturé

| Fichier | État |
| --- | --- |
| `desktop-0-s1-viewport-sans-defilement.png` · `mobile-0-…` | Ce qu'un joueur voit **sans défiler**, à l'ouverture de `s1` — capture en viewport, pas en page pleine |
| `desktop-1-s1-ouverture.png` · `mobile-1-…` | `s1` ouverte, rien cliqué — page pleine |
| `desktop-2-s1-cadre-depose-un-achat.png` · `mobile-2-…` | Le cadre déposé (une lecture retenue), un indice acheté — page pleine |
| `desktop-3-s1-cinq-achats.png` · `mobile-3-…` | Les cinq indices achetés : le relevé plafonné-et-replié — page pleine |
| `desktop-4-s1-revelation.png` · `mobile-4-…` | La révélation de `s1`, après une tranche volontairement fausse — page pleine |
| `desktop-5-s3-ouverture.png` · `mobile-5-…` | `s3` ouverte, second corpus, cadrage en tête à nouveau (alternance) — page pleine |
| `desktop-6-s3-desature.png` · `mobile-6-…` | `s3`, une lecture retenue et un indice acheté, sous `grayscale(1)` — page pleine |

Douze fichiers numérotés, tous vérifiés contenir ce que ce tableau leur attribue — relu image par image après capture, pas supposé.

## Point 1 — la parité des deux gestes, au gabarit mobile

**Corrigé pour de vrai, sur les trois canaux demandés — avec une limite assumée, écrite ci-dessous plutôt que déclarée acquise.**

Le motif précédent (`grid-cols-2` sans repli, y compris à 390px) tenait la parité **visuelle** par une tautologie : deux panneaux frères d'une même rangée CSS Grid partagent nécessairement sommet et pied (`align-items: stretch`), quelle que soit la largeur de leurs colonnes. Il ne tenait ni la **lisibilité** (chaque colonne à ~170px forçait une lecture de cadrage sur sept lignes d'environ quatorze caractères, mesuré sur `mobile-6-s3-desature.png` de la tournée précédente) ni le **clavier** (le marché restait structurellement six arrêts de tabulation derrière le cadrage, dans toutes les situations, sans exception).

**Ce qui change :**

1. **Lisibilité.** `hint-budget-game.tsx` passe de `grid-cols-2` à `grid-cols-1 sm:grid-cols-2` — le même point de rupture que `CutPanel` applique déjà à ses causes (`cut-panel.tsx:34`), qui contredisait l'ancien motif. Sous 640px, chaque panneau prend la largeur pleine ; visible sur `mobile-1-s1-ouverture.png` : chaque lecture de cadrage et chaque indice se lisent sur deux à trois lignes normales, plus aucune ne se replie caractère par caractère.
2. **Absence de biais systématique, faute de parité par écran.** Un empilement à une colonne impose un ordre par construction — c'est la contrainte que la phase 3 nommait déjà comme non résoluble par la seule mise en page. La réponse retenue : l'ordre DOM des deux panneaux **alterne selon la parité de la situation** (`cadrageFirst = (situationNumber - 1) % 2 === 0`), si bien qu'aucun des deux gestes n'est *toujours* en tête sur l'ensemble d'une partie. Mesuré sur le corpus réel de trois situations : `s1` cadrage en tête, `s2` marché en tête, `s3` cadrage en tête à nouveau — deux situations sur trois en faveur du cadrage, une inversion, jamais un ordre fixe.
3. **Clavier**, mesuré par comptage réel des arrêts de tabulation (`Tab` piloté) :

   | Situation | Panneau en tête | Arrêts jusqu'à l'autre panneau |
   | --- | --- | --- |
   | `s1` | Le cadrage | 6 (cinq lectures + « Transmettre ce cadre ») |
   | `s2` | L'assistant | 5 (cinq boutons « Acheter ») |

   Le marché n'est plus *toujours* six arrêts derrière le cadrage : selon la situation, c'est l'inverse. La distance elle-même reste asymétrique (6 contre 5, parce que le cadrage porte cinq cases **et** un bouton de dépôt, le marché seulement cinq boutons) — ce n'est pas une parité de comptage exacte, seulement l'absence de biais systématique.

**Ce que ça ne résout pas, et qui reste vrai** : sur un même écran, l'un des deux panneaux est nécessairement rendu avant l'autre dans le DOM — la parité *par situation* qu'un empilement à une colonne interdit structurellement. Aucun motif d'interface propre à ce seul jeu (onglets, accordéon, bascule) n'a été introduit pour la simuler : le mandat de la phase l'interdit, et l'alternance était la réponse la moins coûteuse qui reste dans le vocabulaire déjà posé par `CutPanel`. Consigné aussi dans `phase-5.md` et dans la fiche `.impeccable`.

Sur desktop (`sm:` et au-delà), la grille à deux colonnes s'applique toujours et la parité par écran, elle, tient exactement — mesuré ci-dessous, Point 3.

## Point 2 — la densité des trois inventaires (plus le rapport)

Inchangé depuis la tournée précédente sur le fond, revérifié après le passage à `grid-cols-1 sm:grid-cols-2` :

1. **Le marché ne peut que rétrécir**, le relevé des achats se plafonne à deux entrées visibles et se replie derrière `<details>` — visible sur `desktop-3-s1-cinq-achats.png` (« VOIR 3 INDICES DE PLUS »). Vérifié en DOM que les deux entrées visibles portent bien deux indices distincts (`h1`, `h2`), pas une lecture erronée d'une capture compressée.
2. **La grille des causes ne montre plus de trou** : chaque `CauseOption` porte son propre filet plutôt qu'un fond de conteneur partagé, inchangé depuis la passe précédente.

## Point 3 — l'action de trancher reste-t-elle atteignable sans défilement ?

**Non, aux deux gabarits, dès l'ouverture d'une situation — assumé, et désormais couvert par un défaut de backlog propre à ce cas.**

Mesuré à l'ouverture de `s1`, page pleine, `scrollY = 0` vérifié :

| Gabarit | `scrollHeight` | `clientHeight` | Dépassement à l'ouverture | Sommet du panneau des causes |
| --- | --- | --- | --- | --- |
| Desktop 1440×900 | 1510 | 900 | 610px | 1177px (277px sous le pli) |
| Mobile 390×844 | 2280 | 844 | 1436px | 1741px (897px sous le pli) |

Le dépassement desktop a reculé par rapport à la tournée précédente (697px), la consigne ayant perdu une phrase (voir « Point 8 »). Le dépassement mobile a **augmenté** (1346px → 1436px) : conséquence directe et assumée du passage à une colonne unique sur les deux panneaux du Point 1, qui ajoute de la hauteur au document pour gagner en lisibilité — l'arbitrage inverse de celui du Point 1.

Après cinq achats, mesuré page pleine :

| Gabarit | `scrollHeight` à l'ouverture | `scrollHeight` après cinq achats | Delta |
| --- | --- | --- | --- |
| Desktop | 1510 | 1473 | -37px |
| Mobile | 2280 | 2142 | -138px |

**Acheter n'aggrave donc jamais ce défilement** — le relevé plafonné-et-replié du Point 2 compense plus que ce que le marché perd, aux deux gabarits.

**Ce qui est nouveau dans cette tournée** : le geste hors écran à l'ouverture n'est pas l'action de passage de la révélation (`aidd_docs/backlog/defects/la-revelation-pousse-l-action-hors-de-l-ecran.md`, qui couvre `lie-detector` et `defect-hunt`, un autre état et un autre geste) — c'est le panneau des causes lui-même, l'action de **trancher**, dès l'ouverture, avant tout cadrage ou tout achat. Le ticket existant ne couvre pas ce cas ; un défaut propre a été ouvert : `aidd_docs/backlog/defects/l-ouverture-de-hint-budget-pousse-le-tranchage-hors-de-l-ecran.md`. Non corrigé dans cette passe — la densité du corpus (rapport + deux colonnes + trois causes) est un plancher fixé en phase 4, que cette passe ne peut pas réduire sans rouvrir le corpus, comme la fiche `phase-5.md` le consignait déjà pour le défaut voisin.

`desktop-4-s1-revelation.png` et `mobile-4-s1-revelation.png` montrent, vérifié pixel par pixel, la phase `revealed` : la cause réelle porte un disque plein et l'étiquette « CAUSE RÉELLE », les quatre autres un cercle fin et « ÉCARTÉE », chacune avec sa vérification ; le pied de la révélation lit « INDICES 75 · TRANCHE FAUSSE +40 · TOTAL 115 » sur ce lot (`s1`, tranchée sur `s1-c-tls`, fausse, après cinq achats — pas de surtaxe d'aveugle puisque des indices ont été achetés). Le bouton « Incident suivant » est présent sous le relevé, mesuré à desktop 1774px et mobile 2457px — sous le pli aux deux gabarits, la même famille de défaut que le ticket voisin couvre déjà pour cet état-là.

## Point 4 — le prix avant le clic

Confirmé, aux deux gabarits, sur `desktop-1-s1-ouverture.png` et `mobile-1-s1-ouverture.png` : chaque `HintCard` non achetée affiche `ACHETER · <coût>` en clair, sans survol ni dépliage. Une fois acheté, le prix reste lisible à côté d'un cadenas, vérifié en DOM sur les cinq indices de `s1` (`desktop-3-s1-cinq-achats.png`) : deux visibles, trois repliés, chacun avec son propre prix et son propre texte, aucune duplication ni omission.

## Point 5 — la conséquence se tait

Confirmé. Ni `wrongCutPenalty` (40) ni `blindCutSurcharge` (30) ne figurent nulle part avant la tranche — vérifié sur `desktop-1` à `desktop-3` et verrouillé par un test (`hint-budget-game.test.tsx`, « announces no consequence before cutting »). Les deux montants n'apparaissent qu'au relevé de la révélation, et seulement ceux qui s'appliquent.

## Point 6 — les deux natures de lecture de cadrage

Confirmé, structurellement et visuellement. `FramingLine` ne reçoit que `id` et `text` — jamais `established`. Verrouillé par un test qui compare l'arbre rendu de deux configurations où seule l'identité de la lecture établie change.

## Point 7 — l'état sans la couleur

Confirmé, capturé sous `grayscale(1)` (`desktop-6-s3-desature.png`, `mobile-6-s3-desature.png`), page pleine cette fois — la tournée précédente le capturait en viewport à `scrollY = 0`, qui sur mobile n'en montrait aucun pixel. La case de cadrage retenue reste identifiable par son remplissage plein, l'indice acheté par son cadenas et son texte déjà révélé.

## Point 8 — l'affordance morte après la tranche, et le libellé « Situation »

Deux correctifs de cette passe, tous deux vérifiés en DOM plutôt que par capture seule :

1. **Affordances mortes.** `HintMarket` ne recevait pas `interactive` : après la révélation, chaque indice non acheté gardait un bouton « ACHETER » d'apparence active dont le clic ne faisait plus rien. `FramingLine` avait le même défaut quand aucun cadre n'avait été déposé. Les deux boutons portent désormais l'attribut `disabled` une fois la situation révélée — vérifié par un test (`hint-budget-game.test.tsx`, « disables every unbought hint button and every framing reading once the situation is revealed »).
2. **Collision de libellé.** La coquille du parcours affiche son propre « Situation 1 sur 20 » (le compte des vingt jeux), et le jeu affichait un second « Situation 1 sur 3 » à ~250px d'écart avec un dénominateur contradictoire. Renommé en « Incident 1 sur 3 » et « Incident suivant », visible sur toutes les captures de cette tournée — les six autres jeux du parcours nomment chacun leur propre unité (« Manche », « Tour », « Étape », « Extrait »).

## Verdict

**Un problème structurel résolu sur les trois canaux demandés, avec sa limite assumée par écrit** : la lisibilité mobile (Point 1) est corrigée en substance — plus de lecture repliée caractère par caractère — et le biais systématique de parité (visuel comme clavier) est éliminé par alternance plutôt que par une parité par écran que l'empilement à une colonne rend structurellement impossible sans motif d'interface propre à ce jeu.

**Un arbitrage assumé et chiffré** : la lisibilité mobile coûte 90px de dépassement documentaire supplémentaire à l'ouverture (1346px → 1436px), sur un défaut déjà non corrigé et désormais mieux nommé — un second défaut de backlog couvre spécifiquement le panneau des causes hors écran à l'ouverture, distinct de celui déjà suivi pour la révélation.

**Deux correctifs mineurs mais vérifiés en test** : les affordances mortes après révélation, et la collision de libellé avec la coquille du parcours.

Revalidé après les correctifs : `npm run lint` (Biome, aucun problème), `npm run typecheck` (muet), `npm run test` (73 fichiers, 650 tests, aucune régression).
