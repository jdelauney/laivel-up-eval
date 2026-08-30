---
type: defect
status: proposed
parent: aidd_docs/backlog/epics/restitution-du-verdict.md
source: aidd_docs/tasks/2026_08/2026_08_30_jeu-practice-map/challenge.md
order: 1
---

# Defect: Le verdict ne peut pas nommer le geste qui a manqué un critère

## Observé

Le port `GameEvaluator` ne rend, par critère, qu'un `{ criterionId, satisfied }`. Tout ce qui a produit ce verdict est calculé puis jeté.

Le cas le plus net vient de `practice-map` : `readPlacements` calcule un `inZone` **par pratique**, donc sait exactement lesquelles des sept étaient mal situées. `c1` sort « manqué » et cette liste disparaît. Mais le problème n'est pas propre à ce jeu — les huit jeux livrés jettent de la même façon le détail qui explique leur verdict.

## Pourquoi ça compte

La story `savoir-quelle-action-me-ferait-monter` demande de nommer l'action qui ferait monter le joueur d'un cran. Sur un critère manqué, la restitution ne dispose aujourd'hui que du libellé de la question — elle peut dire « ce critère n'est pas satisfait », jamais « ces trois pratiques-là ne sont pas là où elles se tiennent ». Le « on comprend pourquoi » du `BRIEF.md` est un critère de jury, et c'est précisément ce niveau de détail qui le sert.

## Ce qu'on attend

Une décision, pas encore une implémentation. Le port est partagé par huit jeux : l'élargir se fait une fois, ou pas du tout.

Deux pistes à peser :

- un champ optionnel de détail attribuable sur `CriterionResult`, que chaque jeu remplit s'il a mieux qu'un booléen ;
- la restitution rejoue la trace d'audit — déjà persistée par `SubmitAnswerCommand` — à travers le helper de lecture du jeu, sans toucher au port.

La seconde préserve le port et n'ajoute rien à la trace, mais oblige la restitution à connaître le helper de chaque jeu.

## Portée

À trancher **avant** de construire la restitution, pas après. Relevé pendant le challenge de `practice-map` ; ne bloque pas sa livraison, puisque le jeu fournit bien les critères attribuables que son propre contrat exige.
