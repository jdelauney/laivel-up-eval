---
type: epic
status: proposed
goal: aidd_docs/product/laivel-eval.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
depends_on:
  - aidd_docs/backlog/epics/onboarding-du-joueur.md
  - aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
order: 3
---

# Epic: Le joueur traverse le parcours du début à la fin sans se perdre

Une personne enchaîne groupe après groupe, jeu après jeu, sait à tout moment où elle en est et ce qu'il reste, et arrive au bout sans revenir en arrière ni rester bloquée.

## Context and Value

Un parcours complet est long. Ce n'est pas une suite de questions indépendantes : c'est un engagement que le produit doit honorer, et chaque friction est une occasion d'abandonner en cours.

La progression se lit sur la rampe des groupes, qui remplace la barre d'avancement : une barre dit combien il reste, la rampe dit de quoi c'est fait. L'invariant de progression existe déjà dans le domaine — on ne passe pas au groupe suivant sans avoir soumis les jeux du groupe courant — mais rien ne le donne à voir ni ne le rend supportable sur sept groupes.

L'aiguillage ne passe pas par l'URL : aucun écran n'est adressable, et c'est une conséquence assumée du déploiement statique. La position vient donc de l'état de session, et elle doit survivre à un rechargement.

## Boundaries

- Includes : l'enchaînement des groupes et des jeux, la position visible, ce qui se passe entre deux jeux et entre deux groupes.
- Includes : ce que voit un joueur qui recharge la page, et ce qui se passe quand la configuration du parcours est refusée au chargement.
- Excludes : le contenu et les mécaniques des jeux.
- Excludes : le verdict et sa restitution.
- Excludes : tout routage par URL et tout écran adressable par lien.

## Success Evidence

Une personne va de l'onboarding au dernier jeu sans jamais se demander où elle en est ni comment continuer. Un rechargement en plein parcours la remet exactement où elle était. Un parcours dont la configuration est invalide ne s'ouvre pas et dit quel champ est en cause, au lieu de casser en cours de route.

## Dependencies and Unknowns

| Item | Kind | Handling |
| --- | --- | --- |
| L'invariant de progression du domaine | décision | Déjà implémenté dans l'entité de session |
| La position vient de l'état, jamais de l'URL | décision | Conséquence de la base relative du déploiement |
| Sept groupes tiennent sur la rampe, y compris sur mobile | unknown | La rampe passe à l'horizontale au-dessus du contenu ; à éprouver avec sept mondes |
| Le joueur peut vouloir revenir sur un jeu déjà soumis | décision | Tranché le 31/08 : une réponse soumise est définitive, partout, sans exception par jeu. Le refus se rend une seule fois, au niveau du parcours (`CourseView`), comme un affordance désactivé qui porte sa raison — jamais un bouton absent. Aucun jeu ne connaît ni ne peut déroger au verrou |
| Un parcours long reste supportable sans jalon intermédiaire | assumption | Acceptée ; se vérifie en jouant |
