# Un parcours en sept mondes, un niveau qui assume ce qu'il ignore

L'outil situe un développeur sur le référentiel AIDD et lui dit ce que le cran suivant demanderait. Il ne lui demande jamais de se décrire : chaque jeu le met en situation, il dépense une ressource rare, la simulation répond, et des critères OUI/NON mécaniques lisent le résultat. Le niveau se calcule en code sur des seuils lus dans du JSON, sans qu'aucun modèle n'intervienne — contrainte du jury rappelée à l'oral, et ce qui rend le verdict reproductible.

Six groupes portent le manifeste AI-Driven Development et alimentent la signature, la lecture de rigueur qui ne décide aucun niveau. Un septième porte les cinq axes du référentiel officiel. Il n'est pas un supplément : dans `config/grid.json`, tous les niveaux à partir de Red exigent `intervention` et `parallele`, que rien d'autre ne mesure. Le dépôt GitHub reste la seconde source, facultative, lue par arithmétique pure sur des dates et des compteurs.

## Ce qui est clair

- Sept groupes, deux jeux chacun en v1, le troisième en option. Quatorze jeux visés.
- Le joueur agit, il ne se déclare jamais. Ce qu'on mesure est ce qu'il a **réussi à livrer**, pas ce qu'il a tenté.
- `checkpoints` et `three-tracks` sont les deux jeux v1 du groupe 7 : sans eux, aucun verdict n'est annonçable.
- Le parcours seul donne un plancher et annonce son plafond en clair. Le dépôt lève le plafond.
- Aucun modèle dans la chaîne de décision. Le dialogue à personas du groupe 3 est un arbre écrit à l'avance.
- Onboarding : pseudo et dépôt Git. Rien d'autre.
- Sept mondes visuels. La septième teinte est un magenta entre le violet et le vermillon, plus près du violet.
- Sauvegarde en JSON téléchargeable et rechargeable, derrière le port de persistance existant. La base de la v2 prendra la même porte.
- Ordre de construction : onboarding, les jeux un par un, le déroulé, l'évaluation du dépôt, la présentation des scores, la sauvegarde.

## Les cinq jeux du septième groupe

Règle commune : le joueur dépense une ressource rare — attention, temps, passes — et la simulation lui renvoie un résultat.

### `scope-break` → axe `taille`

*Regroupement de tranches.* Une feature arrive éclatée en une douzaine de tranches atomiques avec leurs dépendances. Le joueur les regroupe en lots ; un lot est ce qu'il confierait à l'IA en une passe. La simulation exécute chaque lot : trop gros il revient cassé et coûte des passes de réparation, minuscule il en gaspille, mal ordonné il échoue sur sa dépendance.

- Le lot médian livré sans réparation atteint-il le cran L ?
- Aucun lot ne viole l'ordre des dépendances ?
- La feature entière est-elle livrée dans le budget de passes ?

**Garde-fou :** seuls les lots qui passent comptent. Un lot géant pour paraître XL revient cassé, et le cran retenu redescend à ce qui a tenu.

### `repo-kit` → axe `harness`

*Défense de tour.* Avant une série de tâches IA, le joueur équipe le dépôt avec un budget de préparation fixe : fichier de contexte, conventions, glossaire, règle de comportement, agent spécialisé, hook bloquant, boucle de relance sur commande en échec. Puis les vagues de défauts passent. Un contexte évite des malentendus, une règle en arrête d'autres, un hook bloque et rend la main, seule la boucle relance l'IA jusqu'au vert.

- Un artefact de contexte posé avant la première vague ?
- Un garde-fou qui agit sur le comportement, pas seulement sur le savoir ?
- Une relance automatique branchée sur une commande du projet ?
- Le kit a-t-il arrêté assez de défauts pour tenir la dernière vague ?

**Garde-fou :** le hook et la boucle sont deux objets distincts, aux effets visiblement différents. C'est le piège Copper/Silver rendu jouable : qui achète le hook voit qu'il doit revenir à la main.

### `checkpoints` → axe `intervention`

*Rotation à points de reprise.* Une tâche traverse six étapes — cadrage, plan, génération, revue, tests, merge. À chacune le joueur voit la sortie de l'IA et choisit : laisser passer, corriger, re-cadrer. Chaque reprise coûte du temps compté. Un défaut semé au cadrage et laissé passer réapparaît plus loin et coûte cinq fois plus cher au merge ; le joueur le découvre en jouant.

- La reprise la plus lourde a-t-elle eu lieu avant la génération ?
- Zéro reprise après l'étape de revue ?
- L'IA a-t-elle effectivement produit l'essentiel du livrable ?

**Garde-fou :** le troisième critère répond au piège symétrique — qui ne délègue rien n'a rien à reprendre. Tout corriger soi-même donne un score bas, pas haut.

### `three-tracks` → axe `parallele`

*Allocation d'attention.* Quatre chantiers démarrent. À chaque tour le joueur répartit son attention. Un chantier laissé seul trop longtemps dérive puis meurt ; un chantier sur-surveillé consomme l'attention qui manque ailleurs.

- Combien de chantiers menés jusqu'au merge ? Zéro, un, ou trois — les crans de la grille.
- Aucun chantier ouvert puis abandonné ?
- La médiane de chantiers vivants sur l'ensemble des tours, jamais le maximum.

**Garde-fou :** la médiane par tour est exactement ce que dit le référentiel, « habituellement, un pic isolé ne compte pas ». Ouvrir quatre chantiers puis en perdre trois ne fait pas un profil parallèle.

### `task-board` → axe `initiative`

*Trois modes de délégation.* Un tableau de tâches, chacune plus ou moins bien cadrée. Pour chaque, le joueur choisit : je la fais, je la délègue en surveillant, ou je la confie à un agent en autonomie — il ouvre la PR lui-même. Une tâche bien cadrée en autonomie aboutit ; une tâche floue part en vrille de façon visible ; une tâche faite à la main passe mais coûte un tour.

- Au moins une tâche aboutie en autonomie complète, PR comprise ?
- Les tâches confiées en autonomie étaient-elles celles que leur cadrage permettait ?
- Plusieurs tâches abouties dans le même tour sans intervention humaine ?

**Garde-fou :** le deuxième critère mesure le discernement, pas le volume. Tout confier en autonomie fait exploser le tableau et ne monte pas l'axe.

## Encore ouvert

- Les cinq jeux du groupe 7 sont les plus lourds du catalogue : tous portent un état qui évolue et une simulation qui réagit, là où les jeux des autres groupes sont sans mémoire. C'est là que le week-end peut déraper.
- Les seuils de chaque critère ne sont pas posés, et rien ne les vérifie à froid. Ils se calent au jugé et au test manuel.
- La valeur *Outcome over Output* reste hors des groupes, traitée dans le résumé IA, lui-même optionnel et repoussé.

## Prochain pas

Construire `checkpoints` d'abord — c'est le premier jeu à état, il servira de gabarit aux quatre autres du groupe 7, et il débloque à lui seul un des deux axes qui bloquent le verdict.
