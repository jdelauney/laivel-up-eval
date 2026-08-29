---
version: 1
slug: "tracks-components-composites-three-tracks-game-tsx"
primary_target: "src/games/three-tracks/components/composites/three-tracks-game.tsx"
related_targets: []
---

# Le jeu `three-tracks` — le registre de bord

Deuxième jeu à état du parcours, et le second des deux qui débloquent le verdict.

**Chaque jeu a sa propre surface, et cette fiche ne vaut que pour celle-ci.** `checkpoints` est une frise de six étapes avec une décision unique à l'écran ; celui-ci est une table à quatre colonnes fixes qui se réécrit chantier par chantier, tour après tour. Rien de la fiche de `checkpoints` ne se reprend ici, et les trois jeux suivants du groupe 7 ne reprendront rien de celle-ci.

Les cinq règles communes à tous les jeux — coût annoncé et conséquence tue, partie dans le composant et trace comme réponse, état porté par une quantité, relevé qui ne chasse pas la décision, avancée discrète — vivent dans [DESIGN.md](../../DESIGN.md), section « La surface d'un jeu ». Elles ne se rediscutent pas ici.

## Périmètre et mode

Une surface, mode **Operate**. Elle occupe la colonne de droite de `CourseView` ; la coquille, l'en-tête de parcours et la rampe restent en place et ne sont pas redessinés.

## Public et métier

Le développeur évalué, seul, déjà engagé depuis plusieurs jeux. Il doit répartir une attention qui ne suffit jamais pour quatre chantiers, sept tours de suite. La consigne lui donne le cadre — tours, unités, plafond, geste attendu à chaque tour, sort d'un chantier délaissé — mais il découvre en la jouant ce que « trop longtemps » ou « assez souvent » veulent dire.

Ce qu'il doit saisir en trois secondes à chaque tour : combien d'attention il lui reste à placer, où en est chaque chantier, et lequel il a laissé dériver.

## Action et preuve

Il choisit, chantier par chantier, combien d'unités il lui accorde ce tour, puis il clôt, sept fois. Le succès de l'écran, c'est qu'il ait arbitré **entre des chantiers**, jamais optimisé un barème.

Vrai ici et nulle part ailleurs : le travail restant de chaque chantier est chiffré et visible, mais rien ne dit jamais combien de tours d'abandon déclenchent la dérive, ni combien la perte.

## Thèse structurelle

**Quatre colonnes, définitivement : Chantier, Description, le choix du tour courant, Avancement.** Aucune ne se replie : sous `md`, ce n'est pas une colonne qui tombe, c'est le tableau entier qui cède la place à une liste de blocs portant les quatre mêmes champs. Un chantier ne perd jamais un champ en rétrécissant, il change de forme. C'est le remède retenu après deux défauts produits par la structure précédente — une colonne par tour, repliée sous `md` : la première fois, le repli faisait disparaître le brief sous `md` faute d'y avoir sa propre place ; la seconde fois, la multiplication des colonnes de tour affamait le nom et le brief d'un chantier sur desktop pendant que des colonnes à venir restaient vides. Une structure fixe plutôt qu'un mécanisme de repli à reprendre à chaque défaut qu'il produit.

Le prix assumé : **l'historique tour par tour n'existe plus.** La suite de points qui montrait une négligence s'allonger disparaît avec les colonnes de tour. L'acceptance de la story — la dérive visible avant la mort — ne dépendait déjà que du filet de ligne et de la mention `DÉRIVE`, jamais de cet historique : un chantier délaissé se lit toujours comme tel, à l'instant, sans qu'aucune trace de tours passés soit nécessaire.

## Régions, de haut en bas

### 0. La consigne

Un paragraphe, au-dessus du registre, dans le même traitement typographique que celui du banc d'essai (`test-bench`) : `text-lg`, `max-w-[52ch]`, interlignage détendu, sur `--plane-foreground`. Porté par un champ `statement` de la configuration du jeu, nommé comme celui de `test-bench` — deux jeux ne nomment pas différemment la même chose. Requis au chargement : une configuration muette n'ouvre pas de session.

Elle énonce le cadre, jamais les critères — `DESIGN.md`, « Un jeu ne dit jamais ce qu'il note » : le nombre de tours, l'attention disponible à chaque tour, le plafond par chantier, **le geste attendu sur chaque chantier** (choisir le nombre d'unités qu'on lui accorde ce tour, de zéro au plafond), et le sort d'un chantier délaissé (il dérive, puis il est perdu). Elle ne dit jamais après combien de tours, ni ce qui compte dans le verdict — ni les merges, ni la médiane, ni l'abandon.

La phrase sur le geste a été ajoutée après une remontée terrain : les chiffres `0`, `1`, `2` des pastilles, seuls, ne disaient rien de ce qu'ils représentaient. La consigne relie maintenant explicitement « unités d'attention » au geste qui les pose.

### 1. Ligne de position

`TOUR 3 SUR 7 · 2 UNITÉS À PLACER`. `text-xs`, majuscules, interlettrage `0.14em`, chiffres en `tabular-nums`. Une seule ligne. Région `status`, annoncée poliment : c'est un relevé, pas une alerte.

Elle informe, elle ne conditionne plus rien : la clôture du tour reste toujours disponible, quelle que soit l'attention qui reste à placer. Aucun message d'erreur ailleurs.

### 2. Le registre

Un vrai tableau, quatre colonnes fixes. Lignes : les chantiers, dans l'ordre du parcours, **qui ne bouge jamais**. Colonnes, dans l'ordre : Chantier, Description, le choix du tour courant, Avancement.

Sémantique obligatoire : `caption` en `sr-only`, `th scope="col"` pour chaque colonne, `th scope="row"` pour chaque chantier, autant de cellules par ligne que d'en-têtes de colonne. Une grille en `div` est refusée — un lecteur d'écran doit pouvoir lire « La migration, tour 3, deux unités ».

**La colonne « Chantier » porte le nom accessible de la ligne, jamais le brief.** Un `aria-label` posé sur le `th scope="row"` a déjà remplacé ce nom une fois par la phrase entière du brief : un lecteur d'écran la réannonçait alors à chacune des cellules de la ligne, une fois par colonne. Le nom accessible d'une tête de ligne reste construit depuis son seul contenu visible — le libellé et la mention d'état — jamais posé à la main.

**La colonne « Description » porte le brief de chaque chantier, dans sa propre cellule, à toutes les largeurs.** C'est le brief qui permet d'arbitrer entre les chantiers ; le faire dépendre de la largeur d'écran serait le même défaut d'accessibilité sous un autre angle — invisible à qui joue sur un petit gabarit plutôt qu'à un lecteur d'écran. Son en-tête s'abrège visuellement en `Descr.` sous `md`, faute de place à côté d'une colonne « Chantier » et de deux colonnes bornées ; `aria-label="Description"` porte le mot entier pour un lecteur d'écran, à toutes les largeurs.

**La colonne du tour courant nomme ce qu'on y pose, pas seulement le tour.** Son en-tête porte deux lignes : la fraction `1/7`, `2/7`… au-dessus, et le mot « Attention » en dessous, en plus petit. Un chiffre nu dans trois pastilles se lisait aussi bien comme une note, une priorité ou un rang qu'une unité d'attention ; le nom accessible du groupe radio le disait déjà à un lecteur d'écran, un joueur voyant n'avait rien d'équivalent avant ce libellé visible. Poids plus fort (`font-semibold`), couleur pleine (`--plane-foreground`), filet inférieur épais : le même vocabulaire que celui d'une ligne mergée, appliqué à une colonne. C'est la seule colonne qui s'écrit.

L'état d'un chantier passe par le filet de sa ligne et une mention en petites capitales dans sa tête. Jamais par une couleur seule, jamais par une opacité réduite.

| État | Filet de la ligne | Tête de ligne |
| --- | --- | --- |
| Ouvert | plein, filet de base | poids normal |
| Dérive | pointillé, filet de base | poids normal, mention `DÉRIVE` |
| Mergé | plein, filet épais | `font-semibold`, mention `MERGÉ` |
| Perdu | creusé, filet conservé | poids normal, mention `PERDU` en `--missed` |

La ligne d'un chantier perdu reste à pleine opacité. Le vermillon ne porte que le mot, jamais la ligne.

### 3. La colonne d'avancement

Une jauge **à crans**, un cran par unité de travail, les crans acquis pleins et les restants évidés. Pas de barre continue : ce monde avance par crans, il ne fond pas. Le chiffre `3 / 4` la suit, en `tabular-nums`. Une largeur propre lui est réservée, mesurée sur le chantier qui porte le plus de travail — c'est le contenu le moins compressible du registre après les pastilles.

### 4. La colonne ouverte

La colonne du tour courant est la seule qui s'écrit. Chaque cellule y porte le sélecteur d'attention de son chantier : un groupe radio de `maxPerTrack + 1` pastilles, de zéro au plafond.

**Le zéro est une pastille, pas une absence** : le joueur doit voir qu'il a le droit de ne rien poser sur un chantier, sinon il croira devoir servir tout le monde.

**Chaque pastille porte aussi son chiffre à l'écran**, zéro compris, en `aria-hidden` : un joueur voyant lit ce qu'il pose sans dépendre du nom accessible, qui reste la source de vérité pour un lecteur d'écran et ne change pas — « deux unités sur La migration, tour 3 ». La marque de sélection change de mécanique pour lui laisser sa place : un point centré se confondrait avec un chiffre qui occupe le même centre, la pastille sélectionnée se remplit donc en totalité — un remplissage, la quantité physique que `DESIGN.md` autorise — et le chiffre s'inverse sur `--plane` pour rester lisible. Une valeur que l'attention restante ne permet plus est **désactivée**, et sa désactivation est une marque structurelle — filet pâle, chiffre dans le même jeton `--plane-rule` — jamais un grisé.

Les lignes d'un chantier mergé ou perdu n'ont pas de sélecteur du tout. Ni actif, ni désactivé, ni caché : la cellule est barrée, comme le reste de sa ligne le dirait s'il restait des colonnes de tour à venir.

### 5. La clôture du tour

Une seule action primaire sur l'écran, en pied de registre. **Toujours disponible**, dès le premier tour et quelle que soit l'attention déjà posée, y compris zéro : ni désactivée, ni grisée, ni assortie d'une explication.

L'attention non placée à la clôture est perdue. Rien à l'écran ne l'annonce : le coût d'un geste est annoncé, sa conséquence ne l'est jamais. Avec un plafond par chantier inférieur à l'attention du tour, ce prix force un parallélisme minimal entre chantiers — c'est exactement ce que l'écran mesure ; l'exiger explicitement forcerait la main du joueur plutôt que de la lui laisser.

Elle ne dit jamais ce qui va se passer. Après elle, aucun retour en arrière n'est offert : ni actif, ni grisé, ni caché.

## Adaptation

**Deux structures, jamais rendues ensemble.** À `md` et au-dessus, le tableau à quatre colonnes fixes décrit ci-dessus, inchangé. Sous `md`, une liste de blocs empilés — un `<li>` par chantier — remplace le tableau : quatre colonnes fixes à 390 px ne laissaient plus que ~60 px à chacune, assez pour ne jamais déborder mais pas pour rester lisible (un libellé de chantier tombait sur quatre lignes, son brief sur six). Le choix entre les deux structures se fait en JS, sur la largeur de fenêtre réelle (`useIsNarrowViewport`), jamais en CSS sur deux arbres rendus en parallèle dont l'un serait masqué : un lecteur d'écran ne reçoit donc que la structure de son gabarit, jamais les deux.

Une table ne s'empile pas sans cesser d'en être une : forcer `display: block` sur ses `tr`/`td` pour la restyler casse la sémantique de ligne et de cellule que les lecteurs d'écran lui reconnaissent. La liste de blocs est donc une structure distincte, pas le même tableau restylé.

**L'ordre vertical d'un bloc mobile** : le libellé et sa mention d'état, puis le brief, puis l'avancement, puis le choix du tour — en dernier, parce qu'une pile place naturellement l'action la plus engageante à la fin plutôt qu'au milieu, contrairement à l'ordre des colonnes du tableau (Chantier, Description, choix, Avancement).

**Chaque bloc porte ses propres libellés** — `Description`, `Avancement`, la fraction du tour et le mot `Attention` — puisqu'il n'y a plus d'en-tête de colonne partagé pour les porter à sa place ; c'est le même texte que celui du tableau, relogé à côté de son propre contenu plutôt qu'au-dessus de la colonne.

**Le nom accessible d'un bloc** est calculé exactement comme celui d'une tête de ligne du tableau : le libellé et la mention d'état, jamais le brief. Les deux structures partagent le même composant pour ce contenu, afin de calculer mot pour mot le même nom, quel que soit le gabarit — c'est la garantie qu'un lecteur d'écran reçoit la même information à 390 et à 1440, seulement portée par une structure différente.

Au tableau, les colonnes ne se compriment jamais sous la largeur de leur contenu le moins compressible — trois pastilles, une jauge à crans : c'est le texte de « Chantier » et « Description » qui absorbe l'étroitesse d'un petit gabarit, jamais ce contenu-là. Au bloc mobile, cette contrainte n'a plus d'objet : chaque bloc prend toute la largeur disponible, et son texte se replie sur autant de lignes que nécessaire sans jamais forcer de débordement latéral.

## Accessibilité

- Le tableau est tabulaire et annoncé comme tel. La position d'un chiffre dans le registre est une information, pas une décoration.
- Le sélecteur d'attention d'une cellule est un `radiogroup` : une seule valeur par chantier et par tour, la validation vient du bouton de clôture. Construire sur la primitive Base UI, pas à côté.
- La ligne de position est la seule région annoncée à chaque changement. Le registre ne réannonce rien : quatre chantiers par tour feraient un bavardage inutile — c'est pourquoi une cellule barrée reste muette à part son filet décoratif en `aria-hidden`, sans répéter un texte réservé aux lecteurs d'écran ; la mention `PERDU` ou `MERGÉ` de la tête de ligne le dit déjà, une fois.
- Le nom accessible d'une tête de ligne n'est jamais posé à la main : il vient de son seul contenu, le libellé et la mention d'état. Le brief n'y entre pas — il a sa propre cellule, sous son propre en-tête de colonne, visible à toutes les largeurs — parce qu'un `aria-label` remplace tout le nom calculé et rendrait le brief injoignable en navigation de tableau.
- L'abréviation visuelle de l'en-tête « Description » sous `md` ne change jamais son nom accessible : `aria-label="Description"` porte le mot entier, le texte visible abrégé est `aria-hidden`.
- Aucun état ne repose sur la couleur seule, le chantier perdu compris — il porte aussi le filet creusé, le barré et le mot.

## Ce qu'un implémenteur ne doit pas inventer

- Annoncer combien de tours d'abandon déclenchent la dérive, ou la perte — dans la consigne comme ailleurs à l'écran.
- Mettre un chantier en avant : ils sont pairs, en taille, en filet et en surface.
- Trier ou réordonner les lignes. L'ordre est celui du parcours et il ne bouge pas.
- Réintroduire une colonne par tour, ou tout autre historique tour par tour : la structure à quatre colonnes est définitive, pas une étape vers un futur repli.
- Animer le remplissage d'une jauge, l'apparition d'un état, ou le changement de tour.
- Offrir un retour en arrière sur un tour clos.
- Un chronomètre, un compte à rebours, un rappel.
- Expliquer pourquoi un chantier est perdu, ou ce que la partie va noter — y compris dans la consigne : elle énonce le cadre et le geste, jamais que les merges, la médiane ou l'abandon comptent.
- La couleur du groupe dans le registre : le relevé reste sur le plan neutre, comme partout.
- Un texte répété par cellule pour dire qu'un chantier est hors jeu : la mention de la tête de ligne suffit, une fois pour toute la ligne.

## Hors périmètre

L'écran de verdict, et la restitution de la médiane de chantiers vivants — qui appartiennent à la restitution, pas au jeu.

## Décisions non tranchées

- Le barème — sept tours, trois unités, plafond de deux, dérive à deux tours, perte à quatre — est provisoire et se règle en jouant, dans `course.json`. La composition ne dépend d'aucun de ces chiffres : le nombre de colonnes est fixe, il ne suit plus `turns`.
- Au-delà d'un chantier dont le travail dépasse largement six ou sept crans, la largeur de la colonne d'avancement n'a pas été vérifiée : elle est mesurée sur les chantiers déclarés dans `course.json` aujourd'hui, pas sur un cas arbitrairement long.
