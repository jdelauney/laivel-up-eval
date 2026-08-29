---
version: 1
slug: "kpoints-components-composites-checkpoints-game-tsx"
primary_target: "src/games/checkpoints/components/composites/checkpoints-game.tsx"
related_targets: ["src/components/group-rail/composites/group-rail.tsx"]
---

# Le jeu `checkpoints` — et la rampe à sept mondes

Premier jeu à état du parcours.

**Chaque jeu a sa propre surface, et cette fiche ne vaut que pour celle-ci.** `three-tracks` répartit une attention sur quatre pistes, `task-board` est un tableau à trois modes de délégation, `scope-break` un regroupement par glisser-déposer, `repo-kit` une boutique suivie de vagues. Aucun ne se compose comme une frise de six étapes, et chacun demandera sa propre passe.

Ce qui se transmet d'un jeu à l'autre, et qui est décidé ici pour la première fois :

- La partie vit dans le hook du jeu ; la réponse soumise est la trace du déroulé.
- Le coût d'un geste est annoncé, sa conséquence ne l'est jamais.
- Un état est une quantité — remplissage, taille, filet — jamais une couleur seule, jamais une opacité.
- Un relevé qui s'allonge derrière la décision courante ne doit jamais pousser cette décision hors de l'écran.
- L'avancée est un changement discret. Aucune animation, aucun retour de satisfaction.

Ce qui ne se transmet pas : la composition, les régions, les plages, et tout ce qui suit.

## Périmètre et mode

Une surface, mode **Operate**. Elle occupe la colonne de droite de `CourseView` ; la coquille, l'en-tête de parcours et la rampe restent en place et ne sont pas redessinés — la rampe est amendée en fin de fiche parce qu'elle affiche sept mondes pour la première fois.

## Public et métier

Le développeur évalué, seul, déjà engagé depuis plusieurs jeux. Il exécute, il ne contemple pas. Ce qu'il doit saisir en trois secondes à chaque étape : où il en est, ce que l'IA vient de produire, ce que chaque réponse lui coûte. Rien d'autre.

## Action et preuve

Il tranche six fois, puis la partie part d'un coup. Le succès de l'écran, c'est qu'il ait tranché **sur le fond** — la sortie de l'IA — et jamais sur la mécanique du jeu. Un écran qui se laisse lire comme un système de points a échoué : il mesurerait la lecture des règles, pas la pratique.

Vrai ici et nulle part ailleurs : le coût de chaque réponse est annoncé, la conséquence de la refuser ne l'est jamais.

## Thèse structurelle

**Une seule décision à l'écran à la fois, posée sur un relevé qui s'allonge derrière elle.** Le passé s'accumule, le présent est unique, l'avenir n'est pas montré.

Le moment focal est le bloc de sortie de l'IA. Position, budget, frise et journal sont de l'appareillage périphérique : ils doivent se lire sans être regardés.

## Régions, de haut en bas

### 1. Ligne de position

`ÉTAPE 3 SUR 6 · BUDGET 7`. `text-xs`, majuscules, interlettrage `0.12em` à `0.18em`, chiffres en `tabular-nums`. Une seule ligne, jamais deux.

### 2. Frise des six étapes

Six jetons alignés, reliés par un filet. L'état passe par trois quantités, jamais par la couleur.

| État | Jeton | Filet entrant | Libellé |
| --- | --- | --- | --- |
| Franchie | plein, taille de base | plein | poids normal, opacité pleine |
| Courante | plein, agrandi, anneau | plein | `font-semibold` |
| À venir | évidé, taille de base | pointillé | poids normal |

Les six libellés sont visibles sur écran large. Sous `md`, seul celui de l'étape courante reste ; les autres jetons demeurent, sans texte.

### 3. Bloc de sortie de l'IA

Deux gabarits, un seul cadre.

- Cadrage et plan : deux à quatre lignes de prose, corps courant.
- Génération, revue, tests, merge : deux lignes de prose, puis un extrait monospace.

Cadre neutre sur le plan de relevé : filet fin, fond `--plane`. **Aucune marque, aucune teinte, aucune icône ne varie selon qu'une étape porte un défaut ou non.** L'extrait monospace est borné à douze lignes visibles et défile au-delà. Le bloc ne dépasse jamais la moitié de la hauteur utile, pour que les choix restent atteignables sans faire défiler la page.

### 4. Les trois choix

Trois cartes de largeur égale, côte à côte au-dessus de `md`, empilées en dessous. Chacune porte son libellé et son coût en `tabular-nums`.

Non négociable : **ce sont trois réponses à une même question, pas trois actions.** Aucune n'est primaire, aucune n'est plus lourde qu'une autre — même poids, même filet, même surface. Une seule prend l'anneau : celle qu'a le focus clavier.

Traiter « laisser passer » comme secondaire, ou « re-cadrer » comme dangereuse, orienterait la réponse et fausserait la mesure. C'est la règle la plus facile à enfreindre par réflexe d'interface.

### 5. Journal

Liste en ajout seul, la plus récente en bas, `étape · choix · coût`. Aucun retour en arrière n'est offert : ni actif, ni grisé, ni caché. Il n'existe pas.

Plafonné à quatre entrées visibles ; au-delà, les plus anciennes se replient derrière une ligne de compte. C'est ce qui l'empêche de pousser les choix hors de l'écran au sixième tour.

**Le journal ne porte que les coûts des choix du joueur.** La ligne de position porte le budget réel, surcoûts compris. L'écart entre les deux est voulu, et n'est jamais expliqué avant le verdict — c'est ce qui empêche le joueur de déduire la mécanique et de rattraper par calcul. Ce n'est pas une incohérence à corriger.

## États et plages

- Budget : entier, de sa valeur de départ jusqu'au négatif. Sous zéro il devient une dette, en `--missed`, avec le poids qui va avec, signe moins présent.
- Extrait de code : de zéro à une trentaine de lignes ; douze visibles, le reste défile.
- Prose : deux à quatre lignes, jamais plus.
- Journal : de zéro à six entrées, quatre visibles.
- Ni état vide, ni chargement, ni erreur réseau : tout est en mémoire.

## Mouvement

Le passage d'une étape à la suivante est un **changement discret**, pas une transition. Le monde avance par crans, il ne fond pas.

Une seule exception : l'entrée d'une ligne au journal, en fondu court, parce qu'une apparition sèche en bas de liste se rate. Aucun retour de satisfaction, aucun compteur animé, aucune couleur qui célèbre.

## La rampe à sept mondes

`DESIGN.md` annonçait qu'elle prendrait sa forme complète quand les sept groupes existeraient. C'est le cas.

- Sept onglets, chacun sa teinte `--group-1` à `--group-7`, pleine force.
- La colonne a une **hauteur bornée** et les onglets s'y partagent la place en proportion de leur nombre de jeux. Une proportion exprimée en pourcentage de la plus grande fait déborder la rampe hors de l'écran dès sept groupes : la somme dépasse 100 %.
- La hauteur d'un onglet encode le nombre de jeux de son groupe, **avec un plancher** : un groupe de deux jeux reste lisible et cliquable à côté d'un groupe de cinq.
- Un groupe non atteint **garde sa teinte**, portée par le filet. La rendre grise fait disparaître six mondes sur sept, puisqu'un seul groupe est courant à la fois.
- Groupe non atteint : filet pointillé, fond évidé, teinte présente mais non remplie. On le voit, on ne le devine pas.
- Groupe courant : anneau et poids de texte plus fort.
- Sous `md`, la rampe passe à l'horizontale au-dessus du contenu, sept onglets sur une ligne, les libellés tombent, seuls les jetons restent.

## Accessibilité

- Les trois choix forment un vrai groupe de boutons radio, atteignables au clavier, avec un nom accessible portant l'étape et le coût.
- La frise est décorative pour le lecteur d'écran ; la position vient de la ligne 1, annoncée en région `status`.
- Le changement de budget est annoncé poliment, jamais en assertif : ce n'est pas une alerte.
- Aucun état ne repose sur la couleur seule, budget négatif compris — il porte aussi le signe et le poids.

## Ce qu'un implémenteur ne doit pas inventer

- Signaler un défaut par le cadre, une icône, une teinte ou un mot.
- Hiérarchiser les trois choix.
- Expliquer l'écart entre le budget et la somme du journal.
- Offrir un retour en arrière.
- Ajouter une barre de progression : la frise et la rampe la remplacent.
- Animer l'avancée d'étape.

## Hors périmètre

L'écran de verdict, la restitution des surcoûts, et les quatre autres jeux du groupe 7 — qui hériteront de ce gabarit une fois celui-ci construit.
