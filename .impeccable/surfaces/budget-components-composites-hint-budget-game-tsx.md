---
version: 1
slug: "budget-components-composites-hint-budget-game-tsx"
primary_target: "src/games/hint-budget/components/composites/hint-budget-game.tsx"
related_targets: []
---

# Le jeu `hint-budget` — cadrer avant de demander, payer chaque indice

Septième jeu à état du parcours, et le premier du deuxième groupe (« Pilotage du contexte »). Il prend la place du banc d'essai placeholder `g2-1`.

Les cinq règles communes à tous les jeux — coût annoncé et conséquence tue, partie dans le composant et trace comme réponse, état porté par une quantité, relevé qui ne chasse pas la décision, avancée discrète — vivent dans [DESIGN.md](../../DESIGN.md), section « La surface d'un jeu ». Elles ne se rediscutent pas ici.

## Périmètre et mode

Une surface, mode **Operate**. Elle occupe la colonne de droite de `CourseView` ; la coquille, l'en-tête de parcours et la rampe restent en place et ne sont pas redessinées.

## Public et métier

Le développeur évalué, seul, sur trois incidents successifs. Chaque situation porte un symptôme, un rapport de faits gratuits, cinq lectures de cadrage (dont certaines établies par le rapport, d'autres de simples suppositions), un marché de cinq indices à prix croissant, et cinq causes candidates. Le joueur peut, dans l'ordre qu'il choisit, transmettre le cadre qu'il retient du rapport (un dépôt, verrouillé) et acheter des indices (un geste unitaire, irréversible, chacun à son prix affiché), avant de trancher une cause.

Ce qui est mesuré n'est pas la justesse de la tranche seule, mais deux choses distinctes : **le joueur a-t-il posé un cadrage exact avant tout achat** (fondé — il retient exactement les lectures établies, ni plus ni moins — et posé en premier), et **a-t-il résolu l'incident en achetant peu d'indices** (moins de la moitié). Rien de tout cela ne s'énonce à l'écran.

## Action et preuve

Le joueur lit le rapport, décide s'il en extrait un cadre avant d'interroger l'assistant ou s'il interroge d'abord, achète ce qu'il juge nécessaire, puis tranche. Le succès de l'écran, c'est que ces deux gestes restent des choix réels du joueur — jamais suggérés par la mise en page — et que rien ne laisse deviner que l'un vaut mieux que l'autre, ou que l'achat a un plafond.

## Le concept

**Correction du 30/08, après revue.** La version initiale de cette fiche décrivait une grille `grid-cols-2` sans repli, jamais à une seule colonne même à 390px, en la présentant comme la réponse à la contrainte de parité. La revue a montré que cette parité était une tautologie de `align-items: stretch` entre deux frères d'une même rangée — vraie quelle que soit la largeur des colonnes — et que la contrepartie « chaque colonne reste étroite » n'était pas un choix mineur : à 390px, une lecture de cadrage se repliait sur sept lignes d'une quatorzaine de caractères. Ce qui suit remplace la description initiale.

**Deux colonnes pairs sur desktop, empilées pour rester lisibles sur mobile.** Le cadrage et le marché d'indices vivent dans `grid-cols-1 sm:grid-cols-2` — le même point de rupture que `CutPanel` applique déjà à ses causes (l'ancienne grille sans repli le contredisait, sur le même écran). Sous 640px, chaque panneau prend la largeur pleine : chaque lecture de cadrage et chaque indice se lisent sur deux à trois lignes normales, plus aucun repli caractère par caractère.

**L'empilement impose un ordre par construction ; la réponse est de ne pas le figer.** Sur un seul écran empilé, l'un des deux panneaux est nécessairement rendu avant l'autre — aucun motif sans introduire une pièce d'interface propre à ce seul jeu (onglets, bascule) ne lève cette contrainte, et le mandat du produit interdit ce genre de motif à un seul jeu. La réponse retenue : l'ordre DOM des deux panneaux **alterne selon la parité de la situation** (`cadrageFirst = (situationNumber - 1) % 2 === 0`), pour qu'aucun des deux gestes ne soit *systématiquement* en tête sur l'ensemble d'une partie. Mesuré sur le corpus réel de trois situations : cadrage en tête sur `s1` et `s3`, marché en tête sur `s2` ; au clavier, le marché est six arrêts de tabulation derrière le cadrage sur `s1`, le cadrage cinq arrêts derrière le marché sur `s2`. Ce n'est pas une parité par écran — elle reste structurellement hors de portée d'un empilement à une colonne sans motif propre à ce jeu — seulement l'absence de biais systématique sur l'ensemble de la partie, assumée par écrit plutôt que déclarée résolue. Sur desktop, la grille à deux colonnes tient la parité par écran exactement, sommet et pied identiques, mesuré aux trois états de la tournée.

**Le marché ne peut que rétrécir.** Les indices non achetés restent dans le marché, prix affiché ; un indice acheté le quitte pour rejoindre un second bloc, « Déjà acheté », sous le marché. Le marché seul ne s'allonge donc jamais — c'est le relevé des achats qui grandit, et lui seul se plafonne à deux entrées visibles, le reste replié derrière `<details>Voir N indices de plus</details>`. Mesuré : sur le corpus réel (cinq indices, coûts `5·10·15·20·25`), acheter les cinq indices d'une situation ne change **pas** la hauteur totale du document (delta mesuré à 0 sur mobile, à -37px sur desktop) — la carte plafonnée-et-repliée compense exactement ce que le marché perd.

**La grille des causes n'utilise jamais le fond du conteneur comme filet.** `round-sheet.tsx` de `lie-detector` pose ses hairlines en `gap-px bg-plane-rule`, un motif qui suppose que la grille se remplit exactement — quatre affirmations sur deux colonnes, sans reste. Les causes de ce jeu sont cinq sur trois colonnes : la dernière rangée est incomplète, et le motif du fond partagé y aurait laissé un pan de gris nu à la place de la carte manquante. `CauseOption` porte donc son propre filet (`border border-plane-rule`), et `CutPanel` pose un espacement réel (`gap-3`) plutôt que le fond partagé — un ajustement local à ce jeu, pas un changement du motif chez `lie-detector`, dont le compte tombe toujours juste.

| Bande | Ce qu'elle porte | Pourquoi elle est là |
| --- | --- | --- |
| Consigne | Le cadre annoncé — dépôt unique, prix affichés, ordre libre | Se replie dès la deuxième situation, sur le modèle de `lie-detector` |
| Compteur / coût engagé | Situation courante sur trois, coût engagé cumulé | Deux quantités, jamais un compte de réussites |
| Rapport | Symptôme puis faits gratuits | La matière du cadrage, toujours visible |
| Cadrage / Marché | Les deux gestes, pairs, deux colonnes | Le cœur de la mesure |
| Causes | Les cinq candidates, trois colonnes | L'unique action primaire de l'écran |
| Relevé | Coût des indices, pénalité, surtaxe, total — à la révélation seulement | Le prix de la tranche, jamais avant |

## Ce qui ne se négocie pas

- **Une lecture établie et une supposition se rendent à l'identique.** `FramingLine` ne reçoit jamais `established` — seulement `id` et `text` — et ne peut donc pas le laisser fuiter par le ton, la longueur ou la position. Verrouillé par un test qui compare l'arbre rendu de deux configurations où seule l'identité de la lecture établie change : les deux rendus doivent être des chaînes strictement égales.
- **La révélation ne qualifie jamais le cadrage.** `SituationRevelation` ne porte que la cause, sa vérification, et le relevé du coût — jamais un jugement sur la façon dont le joueur a cadré. Verrouillé par un test qui inspecte le pied de la révélation et refuse tout mot de la famille « cadr », « fondé », « établi », « supposition ».
- **Le prix se lit avant le clic, sans survol ni dépliage.** Chaque `HintCard` affiche `Acheter · <coût>` en clair ; le texte de l'indice n'apparaît qu'après l'achat, jamais avant.
- **L'achat est unitaire.** Aucune action du hook n'achète plus d'un indice ; `buyHint(id)` ignore un identifiant déjà acheté et ne prend qu'un seul argument.
- **Aucune pénalité ne figure avant la tranche.** `wrongCutPenalty` et `blindCutSurcharge` n'entrent dans `spent` qu'à la révélation de la situation courante ; avant, `spent` ne porte que le coût des indices achetés.
- **L'état est une quantité, jamais une couleur seule.** La lecture retenue porte une case cochée pleine (`bg-plane-foreground`) contre un carré vide ; la cause candidate ou tranchée s'annonce par `aria-pressed`, sans marque visuelle propre avant la révélation (`selected` ne peut valoir `true` qu'à la révélation — `CutPanel` le dérive de `revelation?.cutCauseId`, `undefined` tant que la situation n'est pas tranchée) ; le fait « cause réelle » porte un disque plein contre un cercle fin, jamais la triade `--nominal`/`--caution`/`--missed` qui note la performance du joueur ailleurs dans le produit. **Correction du 30/08, après revue : cette fiche décrivait un anneau `ring-inset` qui n'a jamais existé dans le code** — le mécanisme réel, ci-dessus, est celui que `cause-option.tsx` porte depuis la phase 3.
- **L'avancée reste discrète.** Aucune transition d'écran entre `playing` et `revealed` ; React remonte le contenu par cran.

## Ce que l'écran ne dit jamais

Le cadre s'annonce dans la consigne, jamais les critères.

| S'énonce | Se tait |
| --- | --- |
| Que le cadre se transmet une seule fois, et se verrouille | Que l'ordre des deux gestes est lu |
| Le prix de chaque indice, avant l'achat | Qu'acheter beaucoup coûte un critère |
| Que l'ordre des deux gestes est libre | Qu'il en existe un qui vaut mieux |
| La situation courante sur le total | Le compte des situations déjà résolues, et les seuils |
| Le coût engagé, à mesure qu'il monte | Qu'une tranche fausse est pénalisée, et qu'une tranche à l'aveugle l'est davantage |

## Vérifié

Tournée de navigateur réel — Chromium via Playwright CLI (`npx playwright`, harnais hors du dépôt), sur `npm run dev`, aux deux gabarits `1440×900` et `390×844`, session posée directement sur `g2-1` via `laivel-eval.session`. Chaque capture et chaque mesure part de `window.scrollTo(0, 0)`, `window.scrollY` vérifié à `0` avant toute lecture — l'erreur de mesure qui a contaminé la tournée de `lie-detector` ne s'est pas reproduite ici, la méthode ayant été corrigée après cette revue. Détail complet et mesures dans `aidd_docs/tasks/2026_08/2026_08_30_jeu-hint-budget/qa/README.md`.

**Correction du 30/08, après revue.** La première tournée capturait ses six écrans mobiles en viewport à `scrollY = 0`, alors que la grille cadrage/marché commence sous le pli aux deux gabarits — elle n'en montrait aucun pixel, contrairement à ce que son propre README affirmait. La tournée reprise capture en page pleine partout où une mesure de contenu est en jeu.

Vérifié, aux deux gabarits, sur `s1` et sur `s3` : sur desktop, la parité des deux gestes tient exactement (même sommet et même pied des deux panneaux) ; sur mobile, elle ne tient plus par construction (empilement à une colonne) mais l'ordre alterne selon la situation pour éviter un biais systématique, mesuré au clavier comme visuellement (`qa/README.md`, « Point 1 »). Acheter cinq indices ne fait pas grandir le document, aux deux gabarits ; le relevé se plafonne et se replie ; aucune pénalité ne figure avant la tranche ; la désaturation (filtre `grayscale(1)`) laisse la case cochée, l'indice acheté et le fait « cause réelle » identifiables sans couleur.

Non atteint, et assumé par écrit plutôt que déclaré résolu : la densité du contenu (rapport + deux colonnes + trois causes) dépasse la hauteur des deux viewports **dès l'ouverture** d'une situation, aux deux gabarits (610px de dépassement desktop, 1436px mobile) — un défilement reste nécessaire pour atteindre le panneau des causes, l'action que `c1` observe. Ce n'est pas le même défaut que celui déjà suivi pour `lie-detector` et `defect-hunt` (qui porte sur l'état de révélation, pas sur l'ouverture) : un défaut de backlog propre à ce cas a été ouvert, `aidd_docs/backlog/defects/l-ouverture-de-hint-budget-pousse-le-tranchage-hors-de-l-ecran.md`.
