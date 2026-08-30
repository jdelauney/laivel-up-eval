# Tournée navigateur — `hint-budget`

30/08/2026, refaite intégralement après la tâche 1 (réécriture des `causes[].text`) et les corrections de revue déjà fusionnées sur la branche (alternance inversée, textes d'indices réécrits, `c1`/`c2` corrigés). Chromium via Playwright CLI (`node` + le paquet `playwright` du projet), sur `npm run dev` (port 5173), aux deux gabarits `1440×900` et `390×844`. Le harnais qui a piloté cette tournée est resté hors du dépôt (script jetable, supprimé après capture), comme pour les tournées précédentes.

**Pourquoi une reprise complète plutôt qu'un correctif.** Deux revues indépendantes ont déjà sanctionné une tournée de ce jeu pour des preuves qui n'ouvraient pas la région qu'elles prétendaient mesurer. La tournée précédente (celle que ce fichier remplace) documentait un sens d'alternance qui n'est plus celui du code (`cadrageFirst` a été inversé une deuxième fois depuis), des textes d'indices et de causes qui ne sont plus ceux du corpus, et aucune capture de `s2`. Rejouer entièrement plutôt que corriger une ligne à la fois évite de répéter cette faute.

**Méthode de mesure.** Chaque capture et chaque mesure part de `window.scrollTo(0, 0)`, `window.scrollY` **vérifié explicitement à 0** juste avant — le script lève une erreur s'il ne l'est pas. Toutes les captures qui appuient une mesure de contenu sont en page pleine (`fullPage: true`) ; deux captures par gabarit (`*-0-s1-viewport-sans-defilement.png`) restent en viewport, explicitement labellisées, pour montrer ce qu'un joueur voit sans défiler.

## Le parcours joué

Session posée directement sur `g2-1` en écrivant `{"playerName":"QA Reviewer","groupIndex":1,"gameIndex":0,"submissions":[]}` dans `laivel-eval.session`, puis en cliquant « Reprendre ». Comme pour les tournées précédentes, la tête de page affiche « Situation 1 sur 20 » et « 0/20 SITUATIONS » plutôt qu'une position cohérente : artefact de `progress.submitted + 1` compté à zéro dans une session forgée sans historique de soumissions — pas un défaut de `hint-budget`, et sans rapport avec son propre libellé interne, qui affiche « Incident 1 sur 3 », « Incident 2 sur 3 », « Incident 3 sur 3 ».

Trois situations jouées, dans l'ordre :

- **`s1`, en entier** : mesure de l'ordre des panneaux et des arrêts de tabulation à l'ouverture, cadre déposé (deux lectures retenues) et un indice acheté, les cinq indices achetés, puis une tranche **délibérément fausse** (la première cause du panneau, jamais garantie réelle) pour observer le relevé complet (indices + pénalité).
- **`s2`, à vide** : aucun cadrage, aucun achat, tranche immédiate — pour observer l'ordre inversé des panneaux et la **surtaxe d'aveugle** au relevé (pénalité de tranche fausse *et* surtaxe d'aveugle cumulées, aucun indice acheté).
- **`s3`, partiellement** : ouverture mesurée, un cadre déposé (une lecture retenue) et un indice acheté, capturée sous `grayscale(1)`.

## Ce qui est capturé

16 fichiers, 8 par gabarit, tous relus image par image après capture :

| Fichier | État |
| --- | --- |
| `{gabarit}-0-s1-viewport-sans-defilement.png` | Ce qu'un joueur voit **sans défiler**, à l'ouverture de `s1` — viewport, pas page pleine |
| `{gabarit}-1-s1-ouverture.png` | `s1` ouverte, rien cliqué — page pleine |
| `{gabarit}-2-s1-cadre-depose-un-achat.png` | Cadre déposé (deux lectures retenues), un indice acheté — page pleine |
| `{gabarit}-3-s1-cinq-achats.png` | Les cinq indices achetés : le relevé plafonné-et-replié — page pleine |
| `{gabarit}-4-s1-revelation.png` | Révélation de `s1`, après une tranche volontairement fausse — page pleine |
| `{gabarit}-5-s2-ouverture.png` | `s2` ouverte : le cadrage en tête cette fois (alternance inversée) — page pleine |
| `{gabarit}-6-s3-ouverture.png` | `s3` ouverte : le marché en tête à nouveau — page pleine |
| `{gabarit}-7-s3-desature.png` | `s3`, une lecture retenue et un indice acheté, sous `grayscale(1)` — page pleine |

Dimensions PNG lues à l'octet, corroborant les hauteurs de document mesurées en DOM (§ Point 3) : `desktop-1` 1440×1510, `desktop-3` 1440×1473, `mobile-1` 390×2280, `mobile-3` 390×2161. `desktop-0`/`mobile-0` sont bien en viewport (1440×900, 390×844), pas en page pleine.

## Point 1 — position et lisibilité du cadrage et du marché, aux deux gabarits

**Desktop (`sm:` et au-delà) : parité par écran exacte.** `hint-budget-game.tsx` pose `grid-cols-1 sm:grid-cols-2` : les deux panneaux sont deux frères d'une même rangée CSS Grid, dont le sommet et le pied sont identiques par construction (`align-items: stretch`). Mesuré, sommet des deux panneaux (`getBoundingClientRect().top` :

| Situation | Sommet cadrage | Sommet marché | Écart |
| --- | --- | --- | --- |
| `s1` | 647 | 647 | 0 |
| `s2` | 494 | 494 | 0 |
| `s3` | 516,75 | 516,75 | 0 |

**Mobile (390px) : empilement à une colonne, pas de parité par écran.** Un panneau est nécessairement au-dessus de l'autre. Mesuré :

| Situation | Sommet cadrage | Sommet marché | Écart vertical |
| --- | --- | --- | --- |
| `s1` | 1337,25 | 872,25 | 465 |
| `s2` | 631,5 | 1022,25 | 390,75 |
| `s3` | 1071 | 586 | 485 |

**Lisibilité, aux deux gabarits** : vérifiée sur `mobile-1-s1-ouverture.png` — chaque lecture de cadrage et chaque indice tiennent sur une à deux lignes normales, aucun repli caractère par caractère. Les cinq nouvelles longueurs de causes (tâche 1) restent lisibles sur `mobile-6-s3-ouverture.png` et `desktop-4-s1-revelation.png` : trois lignes au plus par carte, pas de débordement.

## Point 2 — l'ordre réel des deux panneaux dans chacune des trois situations

`cadrageFirst = (situationNumber - 1) % 2 !== 0` — mesuré en DOM (`querySelectorAll('section')`, position de l'en-tête « Le cadrage » contre « L'assistant »), aux deux gabarits identiquement (l'ordre DOM ne dépend pas de la largeur) :

| Situation | Panneau en tête (DOM) | Vérifié sur |
| --- | --- | --- |
| `s1` | **Le marché** | `desktop-1`, `mobile-1` |
| `s2` | **Le cadrage** | `desktop-5`, `mobile-5` |
| `s3` | **Le marché** | `desktop-6`, `mobile-6` |

Aucun des deux gestes n'est en tête sur les trois situations : le marché deux fois, le cadrage une fois — exactement l'inverse de la répartition qui faisait tenir `c2` à un joueur passif avant le tour 2 de revue (cadrage en tête deux fois sur trois). Confirmé visuellement : `desktop-1` et `mobile-1` (« L'ASSISTANT » à gauche/en haut, « LE CADRAGE » à droite/en bas), `desktop-5` (« LE CADRAGE » à gauche), `desktop-6`/`mobile-6` (« L'ASSISTANT » de nouveau en tête).

## Point 3 — l'action de trancher : position à l'ouverture et après cinq achats

Mesuré sur `s1`, `scrollY = 0` vérifié, page pleine :

| Gabarit | `scrollHeight` | `clientHeight` | Dépassement | Sommet du panneau des causes | Sous le pli de |
| --- | --- | --- | --- | --- | --- |
| Desktop, ouverture | 1510 | 900 | 610px | 1164px | 264px |
| Desktop, après 5 achats | 1473 | 900 | 573px | 1126,75px | 226,75px |
| Mobile, ouverture | 2280 | 844 | 1436px | 1728px | 884px |
| Mobile, après 5 achats | 2161 | 844 | 1317px | 1609,5px | 765,5px |

**Trancher reste hors d'écran sans défilement, aux deux gabarits, dès l'ouverture** — inchangé depuis la dernière tournée, toujours couvert par `aidd_docs/backlog/defects/l-ouverture-de-hint-budget-pousse-le-tranchage-hors-de-l-ecran.md`, non corrigé par ce lot (la densité du corpus est un plancher de phase 4).

**Acheter n'aggrave jamais ce défilement, aux deux gabarits** : desktop −37px (1510 → 1473), mobile −119px (2280 → 2161). Le delta mobile diffère de celui de la tournée précédente (−138px) : attendu, et non une régression — la tâche 1 a changé la longueur des cinq `causes[].text` de `s1` (pour fermer le canal de rang de longueur, cf. le commit dédié), ce qui déplace de quelques caractères le nombre de lignes que certaines cartes du panneau des causes occupent avant la révélation. Les deux tournées mesurent honnêtement deux corpus différents.

## Point 4 — le nombre d'arrêts de tabulation pour atteindre chaque panneau

Mesuré par une marche `Tab` continue depuis le focus initial de la page (rien cliqué avant), en comptant le pas auquel le focus entre pour la première fois dans la section portant l'en-tête « Le cadrage » puis « L'assistant ». Identique aux deux gabarits — l'ordre de tabulation suit le DOM, pas la largeur de viewport.

| Situation | 1er arrêt dans marché | 1er arrêt dans cadrage | Panneau atteint en premier |
| --- | --- | --- | --- |
| `s1` | 1 | 6 | Marché (5 arrêts d'avance) |
| `s2` | 8 | 2 | Cadrage (6 arrêts d'avance) |
| `s3` | 2 | 7 | Marché (5 arrêts d'avance) |

L'écart de +1 sur `s2`/`s3` par rapport à `s1` (le premier panneau à 2 plutôt qu'à 1) vient d'un arrêt de tabulation supplémentaire commun aux deux : à partir de la deuxième situation, la consigne se replie derrière un bouton natif « Revoir la consigne » (`<details><summary>`, visible sur `desktop-5`, `desktop-7`), qui est lui-même un arrêt de tabulation avant les deux panneaux. Le panneau en tête change bien d'une situation à l'autre (marché sur `s1`/`s3`, cadrage sur `s2`), mais la **distance** entre les deux panneaux reste asymétrique dans les deux sens (5 puis 6 arrêts) : ce n'est pas une parité de comptage au clavier, seulement l'absence d'un panneau systématiquement le plus loin sur l'ensemble d'une partie.

## Point 5 — la révélation, avec son relevé chiffré

**`s1` — cinq indices achetés, tranche fausse** (`desktop-4-s1-revelation.png`, `mobile-4-s1-revelation.png`) :

> INDICES 75 · TRANCHE FAUSSE +40 · TOTAL 115

Vérifié : 5+10+15+20+25 = 75 (les cinq indices), +40 la pénalité de tranche fausse, pas de surtaxe d'aveugle puisque des indices ont été achetés. Vérifié au pixel : la cause réelle (« L'horloge du serveur de production avait pris du retard. ») porte le disque plein et « CAUSE RÉELLE » ; la cause cliquée à tort (« Le certificat TLS du reverse proxy vient d'expirer. ») porte désormais un cercle plus épais et **« ÉCARTÉE — TRANCHÉE »**, distincte des deux autres causes simplement « ÉCARTÉE » — la marque ajoutée par le correctif W6 de cette même série de commits, visible en tournée réelle pour la première fois.

**`s2` — aucun cadrage, aucun achat, tranche à l'aveugle** :

> INDICES 0 · TRANCHE FAUSSE +40 · AVEUGLE +30 · TOTAL 70

Vérifié : 0 indice acheté, +40 la pénalité de tranche fausse, +30 la surtaxe d'aveugle (`blindCutSurcharge`), cumulées puisqu'aucun indice n'a été acheté avant de trancher. `30 < 40` et surtout `30 <= max(cost) = 25` n'est **pas** le cas ici — `blindCutSurcharge` (30) reste strictement supérieur au coût du plus cher des cinq indices de `s2` (25), la garantie que le schéma refuse de charger sans elle.

## Point 6 — l'affichage identique des deux natures de lecture

Vérifié en DOM sur les cinq boutons du panneau « Le cadrage » de `s1` : même `className`, aucun attribut `data-*` distinctif entre une lecture établie et une supposition (échantillon relevé par le script, cinq boutons, une seule classe partagée). Confirme structurellement ce que `hint-budget-game.test.tsx` verrouille déjà (« renders an established reading and a supposition with exactly the same structure »).

## Point 7 — l'état sans la couleur

`desktop-7-s3-desature.png`, `mobile-7-s3-desature.png` (`grayscale(1)`, page pleine) : la lecture de cadrage retenue reste identifiable par sa case pleine (carré noir), l'indice acheté par son cadenas et son texte déjà révélé — vérifié visuellement sous désaturation complète.

## Point 8 — ce que la tâche 1 a changé, vérifié à l'écran

Les nouveaux textes de `s1-c-clock`, `s1-c-tls`, `s1-c-header`, `s1-c-secret`, `s1-c-cdn`, `s3-c-parallel`, `s3-c-env`, `s3-c-node`, `s3-c-timezone` (rang de longueur descendant de la cause réelle : 2 · 3 · 4, cf. le commit dédié) sont lisibles sans repli sur `desktop-4-s1-revelation.png` et `mobile-6-s3-ouverture.png` : trois lignes au plus par carte de cause, aux deux gabarits. La question de `g2-1-c1` (« Les incidents ont-ils été résolus… ») n'est pas affichée pendant la partie — conforme à « un jeu ne dit jamais ce qu'il note » — donc rien à en vérifier à l'écran ; seule sa formulation dans `config/course.json` change.

## Ce qui n'a pas été mesuré, dit franchement

- **Le fondement du cadrage (`c3`) n'a pas de preuve visuelle dédiée** : cette tournée dépose des cadres avec une, deux ou aucune lecture retenue selon la situation, mais ne rejoue pas systématiquement les trois profils (fondé exact, partiel, vide) pour chaque situation. Couvert par les tests (`evaluator.test.ts`, `hint-budget-run.test.ts`), pas par une capture dédiée ici.
- **`s2`, mesure de la position du panneau des causes et du dépassement** : non reprise (seule `s1` a servi de base à cette mesure, comme pour la tournée précédente). Rien n'indique qu'elle différerait significativement, la densité du corpus étant la même aux trois situations, mais ce n'est pas mesuré.
- **Le décompte des situations résolues et le score final** ne sont jamais affichés pendant la partie ; cette tournée ne les a donc pas cherchés à l'écran, conformément à « un jeu ne dit jamais ce qu'il note ».

## Verdict

**Ce que cette tournée établit, mesuré et vérifié au pixel ou en DOM** : la parité desktop est exacte (écart de sommet nul sur les trois situations) ; l'alternance mobile fait bien alterner le panneau en tête (marché deux fois, cadrage une fois) sans jamais atteindre une parité de comptage au clavier (5 puis 6 arrêts) ; l'ouverture pousse toujours le panneau des causes sous le pli, aux deux gabarits, et les cinq achats réduisent toujours ce dépassement plutôt que de l'aggraver ; le relevé de révélation est exact au centime près, sur une tranche fausse comme sur une tranche à l'aveugle ; la marque « ÉCARTÉE — TRANCHÉE » du correctif W6 est visible et distincte des trois autres cartes écartées à l'écran, pas seulement dans le code.

**Ce qu'elle infirme d'une affirmation précédente** : le delta de hauteur documentaire mobile après cinq achats n'est plus −138px mais **−119px**, parce que le corpus de causes a changé sous ce lot (tâche 1). Ni l'ancienne ni la nouvelle mesure n'était fausse en son temps ; c'est le document mesuré qui a changé.

**Ce qu'elle ne prétend toujours pas** : une parité par écran au gabarit mobile (structurellement hors de portée d'un empilement à une colonne sans motif d'interface propre à ce seul jeu, que le mandat du produit interdit) ; que « trancher reste atteignable sans défilement » soit tenu (mesuré non tenu, dès l'ouverture, aux deux gabarits — défaut de backlog existant, non corrigé ici).

Revalidé après les correctifs de ce lot : `npm run typecheck` (muet), `npx biome check src __tests__ config` (aucun problème), `npm run test` (73 fichiers, 661 tests, aucune régression).
