---
version: 1
slug: "tracks-components-composites-three-tracks-game-tsx"
primary_target: "src/games/three-tracks/components/composites/three-tracks-game.tsx"
related_targets: []
---

# Le jeu `three-tracks` — le registre de bord

Deuxième jeu à état du parcours, et le second des deux qui débloquent le verdict.

**Chaque jeu a sa propre surface, et cette fiche ne vaut que pour celle-ci.** `checkpoints` est une frise de six étapes avec une décision unique à l'écran ; celui-ci est une table qui s'écrit colonne après colonne. Rien de la fiche de `checkpoints` ne se reprend ici, et les trois jeux suivants du groupe 7 ne reprendront rien de celle-ci.

Les cinq règles communes à tous les jeux — coût annoncé et conséquence tue, partie dans le composant et trace comme réponse, état porté par une quantité, relevé qui ne chasse pas la décision, avancée discrète — vivent dans [DESIGN.md](../../DESIGN.md), section « La surface d'un jeu ». Elles ne se rediscutent pas ici.

## Périmètre et mode

Une surface, mode **Operate**. Elle occupe la colonne de droite de `CourseView` ; la coquille, l'en-tête de parcours et la rampe restent en place et ne sont pas redessinés.

## Public et métier

Le développeur évalué, seul, déjà engagé depuis plusieurs jeux. Il doit répartir une attention qui ne suffit jamais pour quatre chantiers, sept tours de suite, et il découvre les règles en les subissant.

Ce qu'il doit saisir en trois secondes à chaque tour : combien d'attention il lui reste à placer, où en est chaque chantier, et lesquels il n'a pas touchés depuis trop longtemps.

## Action et preuve

Il inscrit son allocation dans la colonne du tour, il clôt, sept fois. Le succès de l'écran, c'est qu'il ait arbitré **entre des chantiers**, jamais optimisé un barème.

Vrai ici et nulle part ailleurs : le travail restant de chaque chantier est chiffré et visible, mais rien ne dit jamais combien de tours d'abandon déclenchent la dérive, ni combien la perte.

## Thèse structurelle

**Le relevé est le plateau.** Il n'y a pas de journal à côté du jeu : l'historique et la décision sont la même table, et le joueur écrit dans la colonne du jour d'une main courante dont les colonnes précédentes sont déjà remplies.

C'est ce qui rend la dérive lisible sans qu'aucun avertissement ne soit écrit : **une suite de points alignés sur une ligne est une négligence qui s'annonce**, et le joueur la voit s'allonger de sa propre main.

Le moment mémorable : la colonne se ferme, et quatre points s'alignent d'un coup sur une ligne restée vide. Le joueur voit sa négligence s'écrire, en chiffres, sur la table où il décide.

## Régions, de haut en bas

### 1. Ligne de position

`TOUR 3 SUR 7 · 2 UNITÉS À PLACER`. `text-xs`, majuscules, interlettrage `0.14em`, chiffres en `tabular-nums`. Une seule ligne. Région `status`, annoncée poliment : c'est un relevé, pas une alerte.

Elle informe, elle ne conditionne plus rien : la clôture du tour reste toujours disponible, quelle que soit l'attention qui reste à placer. Aucun message d'erreur ailleurs.

### 2. Le registre

Un vrai tableau. Lignes : les chantiers, dans l'ordre du parcours, **qui ne bouge jamais**. Colonnes : la tête de ligne, une colonne par tour, une colonne d'avancement.

Sémantique obligatoire : `caption` en `sr-only`, `th scope="col"` pour chaque tour, `th scope="row"` pour chaque chantier. Une grille en `div` est refusée — un lecteur d'écran doit pouvoir lire « La migration, tour 3, deux unités ».

**Les cellules des tours écoulés portent le chiffre posé, ou un point médian pour zéro.** Le point est ce qui rend la négligence lisible : un blanc ne se compte pas du regard, un point si.

L'état d'un chantier passe par le filet de sa ligne et une mention en petites capitales dans sa tête. Jamais par une couleur seule, jamais par une opacité réduite.

| État | Filet de la ligne | Tête de ligne | Cellules à venir |
| --- | --- | --- | --- |
| Ouvert | plein, filet de base | poids normal | vides |
| Dérive | pointillé, filet de base | poids normal, mention `DÉRIVE` | vides |
| Mergé | plein, filet épais | `font-semibold`, mention `MERGÉ` | barrées d'un filet horizontal |
| Perdu | creusé, sans filet | poids normal, mention `PERDU` en `--missed` | barrées d'un filet horizontal |

La ligne d'un chantier perdu reste à pleine opacité. Le vermillon ne porte que le mot, jamais la ligne.

### 3. La colonne d'avancement

Une jauge **à crans**, un cran par unité de travail, les crans acquis pleins et les restants évidés. Pas de barre continue : ce monde avance par crans, il ne fond pas. Le chiffre `3 / 4` la suit, en `tabular-nums`.

### 4. La colonne ouverte

La colonne du tour courant est la seule qui s'écrit. Chaque cellule y porte le sélecteur d'attention de son chantier : un groupe radio de `maxPerTrack + 1` pastilles, de zéro au plafond.

**Le zéro est une pastille, pas une absence** : le joueur doit voir qu'il a le droit de ne rien poser sur un chantier, sinon il croira devoir servir tout le monde.

Chaque pastille porte un nom accessible complet : « deux unités sur La migration, tour 3 ». Une valeur que l'attention restante ne permet plus est **désactivée**, et sa désactivation est une marque structurelle — pastille évidée, sans anneau — jamais un grisé.

Les lignes d'un chantier mergé ou perdu n'ont pas de sélecteur du tout. Ni actif, ni désactivé, ni caché : la cellule est barrée comme les suivantes.

### 5. La clôture du tour

Une seule action primaire sur l'écran, en pied de registre. **Toujours disponible**, dès le premier tour et quelle que soit l'attention déjà posée, y compris zéro : ni désactivée, ni grisée, ni assortie d'une explication.

L'attention non placée à la clôture est perdue. Rien à l'écran ne l'annonce : le coût d'un geste est annoncé, sa conséquence ne l'est jamais. Avec un plafond par chantier inférieur à l'attention du tour, ce prix force un parallélisme minimal entre chantiers — c'est exactement ce que l'écran mesure ; l'exiger explicitement forcerait la main du joueur plutôt que de la lui laisser.

Elle ne dit jamais ce qui va se passer. Après elle, aucun retour en arrière n'est offert : ni actif, ni grisé, ni caché.

## Adaptation

Sous `md`, le registre replie ses colonnes : seuls les trois derniers tours écoulés et la colonne ouverte restent, précédés d'une cellule `n TOURS PLUS ANCIENS`. La colonne d'avancement passe sous le libellé du chantier, dans la tête de ligne.

Les colonnes ne se compriment jamais sous la largeur d'un chiffre : c'est le nombre de colonnes qui tombe, jamais leur lisibilité.

## Accessibilité

- Le tableau est tabulaire et annoncé comme tel. La position d'un chiffre dans le registre est une information, pas une décoration.
- Le sélecteur d'attention d'une cellule est un `radiogroup` : une seule valeur par chantier et par tour, la validation vient du bouton de clôture. Construire sur la primitive Base UI, pas à côté.
- La ligne de position est la seule région annoncée à chaque changement. Le registre ne réannonce rien : sept tours × quatre chantiers feraient un bavardage.
- Aucun état ne repose sur la couleur seule, le chantier perdu compris — il porte aussi le filet creusé, le barré et le mot.

## Ce qu'un implémenteur ne doit pas inventer

- Annoncer combien de tours d'abandon déclenchent la dérive, ou la perte.
- Mettre un chantier en avant : ils sont pairs, en taille, en filet et en surface.
- Trier ou réordonner les lignes. L'ordre est celui du parcours et il ne bouge pas.
- Ajouter une barre de progression du jeu : les colonnes de tours la remplacent.
- Animer le remplissage d'une jauge, l'apparition d'un état, ou la fermeture d'une colonne.
- Offrir un retour en arrière sur un tour clos.
- Un chronomètre, un compte à rebours, un rappel.
- Expliquer pourquoi un chantier est perdu, ou ce que la partie va noter.
- La couleur du groupe dans le registre : le relevé reste sur le plan neutre, comme partout.

## Hors périmètre

L'écran de verdict, et la restitution de la médiane de chantiers vivants — qui appartiennent à la restitution, pas au jeu.

## Décisions non tranchées

- Le barème — sept tours, trois unités, plafond de deux, dérive à deux tours, perte à quatre — est provisoire et se règle en jouant, dans `course.json`. La composition ne dépend d'aucun de ces chiffres, sauf le nombre de colonnes, qui suit `turns`.
- Au-delà d'une dizaine de tours, le repli mobile devient le cas nominal sur toutes les largeurs. Rien ne le traite aujourd'hui : le parcours n'en déclare pas autant.
