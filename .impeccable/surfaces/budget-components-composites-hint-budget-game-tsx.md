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

**Deux colonnes pairs, à toute largeur.** Le cadrage et le marché d'indices vivent côte à côte, dans une grille à deux colonnes qui **ne se replie jamais** en une seule colonne, y compris à 390px de large — contrairement au reste du produit, où `sm:grid-cols-N` bascule à une seule colonne sous 640px. C'est la réponse retenue à la contrainte centrale de cette passe : sur un empilement à une colonne, l'un des deux gestes est structurellement en premier, ce que `c2` mesure directement. La grille à deux colonnes est un motif déjà présent dans le vocabulaire du produit (`round-sheet.tsx` de `lie-detector` la pose en `sm:grid-cols-2`) ; ce jeu ne fait qu'en garder l'usage à toute largeur plutôt que d'y renoncer sous un certain seuil — aucun motif neuf n'est introduit. La contrepartie assumée : chaque colonne reste étroite sur mobile (environ 170px), donc chaque élément de carte (`FramingLine`, `HintCard`) empile son propre contenu verticalement plutôt que de le poser sur une seule ligne, à toute largeur — un choix qui tient à la fois au petit et au grand gabarit, pour ne pas dépendre d'un seuil de colonne qui n'existe pas dans le vocabulaire Tailwind.

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
- **L'état est une quantité, jamais une couleur seule.** La lecture retenue porte une case cochée pleine (`bg-plane-foreground`) contre un carré vide ; la cause tranchée porte un anneau (`ring-inset`, hérité du motif de `lie-detector`) ; le fait « cause réelle » porte un disque plein contre un cercle fin, jamais la triade `--nominal`/`--caution`/`--missed` qui note la performance du joueur ailleurs dans le produit.
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

Vérifié : la parité des deux gestes tient exactement aux deux gabarits (même sommet et même pied des deux panneaux, sur `s1` et sur `s3`, deux corpus différents) ; acheter cinq indices ne fait pas grandir le document ; le relevé se plafonne et se replie ; aucune pénalité ne figure avant la tranche ; la désaturation (filtre `grayscale(1)`) laisse la case cochée, la cause tranchée et le fait « cause réelle » identifiables sans couleur. Non atteint, et assumé : la densité du contenu (rapport + deux colonnes + trois causes) dépasse la hauteur des deux viewports dès l'ouverture d'une situation, aux deux gabarits — un défilement reste nécessaire pour atteindre les causes, comme chez `lie-detector` et `defect-hunt` avant lui. Ce n'est pas un défaut propre à ce jeu ; il est transverse et suivi séparément.
