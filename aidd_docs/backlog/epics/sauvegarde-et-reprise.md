---
type: epic
status: proposed
goal: aidd_docs/product/laivel-eval.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
depends_on:
  - aidd_docs/backlog/epics/deroule-du-parcours.md
order: 6
---

# Epic: Une partie se garde, se rend et se reprend hors du navigateur

Une personne télécharge sa partie et son évaluation dans un fichier, et peut la recharger plus tard, sur une autre machine, pour la rejouer ou la reprendre où elle s'était arrêtée.

## Context and Value

Aujourd'hui une partie ne vit que dans le stockage du navigateur. Elle ne survit ni à un changement de machine, ni à un nettoyage, et elle ne peut pas être montrée à quelqu'un d'autre.

Un fichier change trois choses. Il rend le verdict **opposable** : on rejoue le même faisceau, on retombe sur le même niveau, et c'est la démonstration de la reproductibilité que le produit revendique. Il rend une partie **transportable**, ce qui permet à qui le souhaite de rassembler plusieurs évaluations sans que l'outil ait à connaître la notion d'équipe. Et il rend une partie **reprenable** au-delà d'un navigateur.

Le port de persistance existe déjà et le stockage navigateur en est une implémentation. Un fichier en est une seconde, par la même porte — celle qu'une base de données prendra en v2.

## Boundaries

- Includes : l'écriture d'une partie et de son évaluation dans un fichier téléchargeable, et sa relecture pour rejouer ou reprendre.
- Includes : le refus explicite d'un fichier qui ne respecte pas son contrat, en nommant ce qui cloche.
- Excludes : tout serveur, tout compte, tout envoi hors de la machine.
- Excludes : la base de données, prévue pour une v2 et qui prendra la même porte.
- Excludes : toute vue agrégée de plusieurs parties. Qui veut agréger le fait avec les fichiers.

## Success Evidence

Une partie exportée puis rechargée sur une autre machine rend exactement le même verdict, au caractère près. Une partie interrompue puis rechargée reprend au jeu suivant, pas au début. Un fichier modifié à la main ou issu d'une version antérieure est refusé avec sa raison, pas silencieusement accepté.

## Dependencies and Unknowns

| Item | Kind | Handling |
| --- | --- | --- |
| Le format est agnostique et passe par le port de persistance existant | décision | Une base de données doit pouvoir le remplacer sans toucher au domaine |
| Le fichier sert à la fois la reprise et la preuve du verdict | décision | C'est ce qui rend le résultat opposable |
| Ce qui se passe quand le fichier vient d'une version antérieure du parcours | unknown | À trancher : refus net, ou reprise partielle |
| Un fichier lisible à l'œil invite à être modifié pour gonfler son niveau | unknown | À accepter ou à traiter ; l'outil n'a pas d'enjeu de fraude |
| Une personne pense à exporter avant de fermer l'onglet | assumption | Acceptée ; le stockage navigateur reste le filet |
