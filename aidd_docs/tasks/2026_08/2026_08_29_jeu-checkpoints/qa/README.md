# QA navigateur — le jeu `checkpoints` et la rampe à sept mondes

Preuves demandées par les deux constats `functional` de [review.md](../review.md), phase 4. Relevées le 29/08 sur `main` augmenté de la branche de clôture, contre `npm run dev` sur `http://localhost:5173`, dans Chromium.

Le harnais est volontairement hors du dépôt : la suite Playwright du projet n'existe pas encore, elle est suivie par [amorcer-la-suite-playwright-declaree.md](../../../../backlog/tasks/amorcer-la-suite-playwright-declaree.md). Ce qui est versionné ici, ce sont les preuves, pas le moyen de les reproduire.

## Scénario 1 — La partie va au bout et rend la main

`parcours-de-bout-en-bout.webm`

Chemin : accueil, nom saisi, puis les quinze situations `test-bench` des groupes 1 à 6, puis le jeu à état.

| Étape | Choix | Budget affiché |
| --- | --- | --- |
| 1 cadrage | Corriger | 10 |
| 2 plan | Corriger | 8 |
| 3 génération | Laisser passer | 6 |
| 4 revue | Laisser passer | 6 |
| 5 tests | Laisser passer | 6 |
| 6 merge | Laisser passer | 6 |

Après la sixième décision, l'écran passe à `Situation 17 sur 20` et le banc d'essai suivant s'affiche : le parcours a repris la main.

Le budget final de 6 est exactement ce que le barème de [phase-4.md](../phase-4.md) annonce pour la ligne « corrige au cadrage et au plan, puis laisse courir ». Les deux défauts ayant été corrigés à leur source, aucun surcoût n'éclate plus loin, et les étapes 3 à 6 laissent le budget immobile.

Captures : `01-checkpoints-etape-1.png` (frise à l'étape 1, trois choix de même poids), `02-checkpoints-journal.png` (étape 4, journal à trois entrées, extrait monospace), `03-retour-au-parcours.png` (situation 17).

## Scénario 2 — Sept teintes distinctes, aux deux largeurs

`rampe-sept-teintes.webm`

Teinte peinte par le navigateur pour chacun des sept onglets — fond pour un groupe atteint, filet pour un groupe non atteint — identique en 1440×900 et en 390×844 :

```
oklch(0.628 0.164 47)   oklch(0.79 0.152 84)    oklch(0.598 0.136 146)
oklch(0.585 0.098 202)  oklch(0.472 0.176 266)  oklch(0.508 0.172 306)
oklch(0.52 0.168 338)
```

Sept valeurs, sept angles de teinte distincts. Aucune collision.

La rampe ne déborde à aucune des deux largeurs : `scrollWidth` égale `clientWidth` (256 px en colonne sur écran large, 342 px en ligne sous `md`). C'est ce que le `flex-grow` proportionnel sur base nulle protège, et que le `flex-basis` en pourcentage cassait à sept groupes.

Captures : `04-rampe-large.png`, `04-rampe-mobile.png`.
