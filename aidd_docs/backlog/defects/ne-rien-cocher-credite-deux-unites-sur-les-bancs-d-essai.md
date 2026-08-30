---
type: defect
status: proposed
parent: aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
source: aidd_docs/tasks/2026_08/2026_08_30_jeu-practice-map/challenge.md
order: 1
---

# Defect: Ne rien cocher crédite deux unités sur les bancs d'essai restants

## Observé

Sur `g2-1` et `g2-3`, tous deux encore des `test-bench` placeholders, un joueur qui ne coche **aucune** proposition et soumet encaisse une unité par jeu, soit **deux unités sur les dix** de la dimension `pilotage-contexte`, **avec certitude**.

Deux causes qui se cumulent :

- `src/games/test-bench/components/composites/test-bench-game.tsx:52` — le bouton de soumission n'a pas de `disabled` : une réponse vide part sans obstacle.
- `src/games/test-bench/test-bench.evaluator.ts:57-60` — la règle `no-unexpected-selected` évalue un `every` sur l'ensemble vide, donc **vrai** par vacuité. Ne rien retenir satisfait « aucune proposition non vérifiable n'a été retenue ».

## Pourquoi ça compte

Relevé pendant le challenge de `practice-map`, en cherchant ailleurs le bruit qu'on soupçonnait dans ce jeu. Le rapport de force est l'inverse de ce qu'on croyait : l'exploit résiduel de `practice-map` rapporte une unité une fois sur deux et ne fait franchir aucun seuil ; celui-ci en rapporte deux à coup sûr, sans un clic.

C'est exactement la classe de triche que l'épique demande de fermer — « un joueur qui tente de tricher un jeu n'obtient pas un cran supérieur » — et elle est ouverte sur la dimension que `practice-map` vient d'être construit pour mesurer proprement.

## Ce qu'on attend

Une soumission vide ne crédite rien. La règle de vacuité se tranche explicitement plutôt que par le comportement par défaut d'`every` : soit un plancher de sélection, soit un refus de soumettre à vide, soit les deux.

## Portée

Touche le jeu `test-bench` lui-même, donc les quatre placeholders qui l'utilisent encore. Se referme aussi, jeu par jeu, à mesure que chaque placeholder est remplacé par un vrai jeu — mais rien ne garantit que tous le seront avant le rendu, et la correction du `test-bench` est bien moins chère que quatre jeux.
