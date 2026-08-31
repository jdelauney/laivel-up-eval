---
version: 1
slug: "r-toss-components-composites-keep-or-toss-game-tsx"
primary_target: "src/games/keep-or-toss/components/composites/keep-or-toss-game.tsx"
related_targets: []
---

# Le jeu `keep-or-toss` — douze cartes triées sous le chronomètre

Treizième jeu du parcours, et le second du groupe « Sécurité et responsabilité ». Il prend la place du banc d'essai placeholder `g4-2`.

**Chaque jeu a sa propre surface, et cette fiche ne vaut que pour celle-ci.** `defect-hunt` est une épreuve d'imprimeur qu'on relit ligne à ligne ; `flow-order` une frise verticale qu'on réordonne ; `ambiguity-scan` un texte continu dont on bascule des segments. Celui-ci n'est ni l'un ni l'autre : une **pile**, une carte à la fois, deux destinations, et un temps qui court sur le lot entier plutôt que sur un geste isolé. Rien n'y est réordonné, rien n'y est relu deux fois — une carte partie ne revient pas.

Les cinq règles communes à tous les jeux — coût annoncé et conséquence tue, partie dans le composant et trace comme réponse, état porté par une quantité, relevé qui ne chasse pas la décision, avancée discrète — vivent dans [DESIGN.md](../../DESIGN.md), section « La surface d'un jeu ». Elles ne se rediscutent pas ici.

## Périmètre et mode

Une surface, mode **Operate**. Elle occupe la colonne de droite de `CourseView` ; la coquille, l'en-tête de parcours et la rampe restent en place et ne sont pas redessinées.

## Public et métier

Le développeur évalué, seul, à la seconde situation du groupe sécurité. Douze pratiques défilent une à une ; il garde celles qui tiennent, jette celles qui exposent, sous un temps qui ne lui laisse pas le loisir de chercher. Ce que le jeu mesure n'est pas la mémoire d'une liste, mais ce que le joueur sait déjà — sans le temps de vérifier, sans retour pour se corriger en cours de route.

## Action et preuve

Il trie douze fois, ou moins si le temps l'arrête avant. Le succès de l'écran, c'est que le joueur ait tranché **sur sa connaissance**, jamais sur un signal que l'écran lui aurait laissé filtrer — ni couleur, ni compte de justes, ni la moindre coche avant la fin.

Vrai ici et nulle part ailleurs dans ce groupe : c'est le chronomètre, et lui seul, qui tient lieu de retour. Le joueur ne sait à aucun instant s'il vient de bien trier — seulement combien de temps il lui reste et combien de cartes il a déjà traitées.

## Le concept, et ce qu'il refuse explicitement

**Ce n'est ni une feuille qu'on relit, ni une frise qu'on réordonne, ni un texte qu'on annote.** Une pile centrale, une carte visible à la fois, deux destinations fixes de part et d'autre — Garder à gauche, Jeter à droite. La carte triée disparaît, la suivante prend sa place. Aucun retour en arrière n'est offert : une carte triée est triée, tout comme le journal de `checkpoints` n'offre aucune reprise.

**Le temps porte sur le lot, jamais sur la carte.** Contrairement au cadran de `defect-hunt`, qui mesure une revue à son propre rythme sans jamais l'interrompre, ce jeu a un budget total et le gèle à zéro : au-delà, plus aucun geste n'est accepté, et le lot est jugé sur ce qu'il porte à cet instant, trié ou non. C'est cette coupure nette — pas un simple dépassement visible comme chez `defect-hunt` — qui rend le chronomètre contraignant plutôt que décoratif.

**Aucune jauge qui se vide comme une preuve de progression.** Le trait de `CountdownBar` se retire à mesure que le temps s'écoule, mais il ne prétend rien terminer : c'est une quantité qui diminue, jamais une promesse d'achèvement. Le chiffre en `tabular-nums` porte la même lecture, et bascule au poids fort puis au `--missed` sous cinq secondes — jamais une couleur seule.

## Bandes de l'écran

| Bande | Ce qu'elle porte | Pourquoi elle est là |
| --- | --- | --- |
| Consigne | Qu'il faut garder ou jeter, que le temps gèle le lot | Jamais les critères : ni le seuil de bon classement, ni celui de complétion |
| Temps restant | Le budget qui se retire, en trait et en chiffre | Remplace tout retour immédiat — c'est la seule pression que le joueur ressent |
| Compte trié | `N sur 12 triée(s)` | Le seul repère de progression ; jamais un compte de justes |
| La carte | Le libellé de la pratique courante, seul | Rien qui trahisse le verdict attendu |
| Garder / Jeter | Deux boutons de poids égal, aux mêmes libellés que les flèches clavier | Les deux destinations, sans qu'aucune ne domine visuellement l'autre |
| Le gel | Un état neutre : « le tri est figé », le compte final, un seul bouton | La fin du geste, avant que le joueur ne demande à voir le compte réel |
| La révélation | Chaque pratique, le verdict attendu, le pourquoi | Jamais le verdict du joueur, jamais le score |

## Ce qui ne se négocie pas

- **Trois temps, jamais deux ni un.** `sorting` → `frozen` → `revealed`. Le gel est atteint par deux chemins seulement — le temps écoulé ou le lot entier trié — et c'est le seul chemin qui existe : passé ce point, `sort()` ne fait plus rien, et aucun autre geste ne rouvre le tri. La bascule de `frozen` vers `revealed` reste un geste du joueur (« Voir la révélation »), jamais automatique, sur le modèle de toutes les autres transitions volontaires du parcours (« Continuer », « Rendre ma revue »).
- **Pointeur et clavier atteignent exactement les mêmes états.** `ArrowLeft` vaut Garder, `ArrowRight` vaut Jeter, et les deux appellent la même fonction que les boutons visibles — jamais deux chemins qui pourraient diverger. C'est la faute relevée sur `flow-order` que cette surface s'interdit par construction : aucun état atteignable à la souris seule, aucun à la flèche seule.
- **Un état est une quantité.** Le trait du temps se retire en proportion réelle du budget ; son poids et sa teinte ne changent qu'à l'approche de la fin, jamais en dessous de cinq secondes sans que le chiffre ne le dise aussi en toutes lettres.
- **Aucune validation, aucun retour, aucun compteur de justes avant la fin.** Ni coche, ni couleur d'état sur une carte déjà triée — il n'y en a d'ailleurs plus trace à l'écran, la carte suivante ayant pris sa place. Le compte visible ne porte jamais que le nombre de cartes traitées, jamais combien sont justes.
- **La révélation donne le pourquoi, jamais le verdict du joueur.** Choix identique à `practice-map` et `hint-budget` : un jeu déjà soumis peut être rejoué, et ce qu'il reste au joueur est la matière, pas sa propre note.
- **Aucune animation au tri.** La carte suivante apparaît, elle ne glisse pas et ne s'anime pas vers sa destination — ce monde avance par crans.

## Ce que l'écran ne dit jamais

| S'énonce | Se tait |
| --- | --- |
| Qu'il faut garder ou jeter, et que le temps gèle le lot | Le seuil de bon classement, et celui de complétion |
| Le temps restant et le compte de cartes triées | Combien sont justes parmi elles |
| Que le tri est figé, une fois le temps écoulé ou le lot fini | Le score, avant la révélation |
| À la révélation, le verdict attendu et le pourquoi de chaque pratique | Ce que le joueur avait répondu |

## Accessibilité

- Les deux boutons Garder / Jeter portent l'écoute clavier des flèches directement — aucun conteneur muet rendu interactif à côté, chaque contrôle interactif porte son propre geste.
- Le trait du temps restant n'est pas annoncé à chaque battement : seule l'annonce de palier (`aria-live="polite"`, à 30, 10 et 5 secondes selon ce que le budget permet d'atteindre) l'est, en région masquée visuellement.
- Le nom accessible des boutons Garder et Jeter est leur libellé visible, sans rien y concaténer.

## Hors périmètre

L'écran de verdict, et les jeux voisins du même groupe — qui gardent chacun leur propre surface, jamais celle-ci recopiée.
