# QA navigateur — le jeu `confidence-bet`

Relevé sur la branche `feat/miser-ma-confiance-a-l-aveugle`, contre `npm run dev`, dans Chromium, à 1440×900 et 390×844. Deux passes, datées du 30/08.

Le harnais est volontairement hors du dépôt : la suite Playwright du projet n'existe toujours pas, elle est suivie par [amorcer-la-suite-playwright-declaree.md](../../../../backlog/tasks/amorcer-la-suite-playwright-declaree.md). Ce qui est versionné ici, ce sont les preuves, pas le moyen de les reproduire. Le pilote de ces passes a été monté à la racine du dépôt puis supprimé une fois les six captures produites.

## Le parcours joué

Accueil, pseudo saisi (**Alice**), puis le jeu — `confidence-bet` est le premier jeu du premier groupe, il n'y a rien à traverser pour l'atteindre.

| Capture | Ce que l'écran montre |
| --- | --- |
| `tour-1` | Le premier extrait, la règle vierge, aucun repère. « Engager la mise » est indisponible tant qu'aucune position n'est choisie |
| `tour-2` | La mise engagée à 90 sur un extrait sain. L'échelle a cédé la place à la révélation ; la règle porte le repère du joueur et celui de la vérité, tous deux sur la même graduation. Le relevé s'ouvre sur sa première ligne |
| `tour-3` | Cinq extraits joués, dont le cinquième est indécidable et a reçu une mise franche. La règle passe en pointillé, ne pose aucun repère de vérité, et la phrase « Aucune position n'était justifiable sur cette règle » l'énonce. Le relevé porte cinq règles en réduction, alignées |

## Ce que les captures établissent

| Capture | Ce qu'elle prouve |
| --- | --- |
| `desktop-tour-1.png` · `mobile-tour-1.png` | La règle se lit comme un instrument : embouts, graduations de longueur inégale, origine plus haute. Les cinq chiffres partagent une seule ligne de base — c'est le correctif de la seconde passe |
| `desktop-tour-2.png` · `mobile-tour-2.png` | Après l'engagement, l'échelle n'est plus à l'écran : elle a cédé la place, elle ne s'est pas grisée. Le repère du joueur (triangle plein) et celui de la vérité (losange évidé) se distinguent par la forme, pas par la couleur |
| `desktop-tour-3.png` · `mobile-tour-3.png` | Sur l'extrait indécidable, aucun repère de vérité n'est posé. Le relevé aligne les règles en réduction : la colonne de marques se lit d'un coup d'œil |

Aux trois moments et aux deux gabarits, l'écran ne porte **aucun seuil, aucune bande, aucun critère de notation**.

## Ce que la première passe a trouvé

Un seul défaut, invisible en Vitest : **les chiffres de la règle ne partageaient pas la même ligne de base.** La graduation de la mise neutre est plus haute que ses voisines, et comme le chiffre suivait la graduation dans une colonne flex, `50` tombait plus bas que `10` et `30`. La règle cessait de se lire comme un instrument.

Remède : la graduation pend depuis le filet dans un fût de hauteur fixe, elle varie en longueur à l'intérieur. Les chiffres retrouvent une ligne de base commune sans que l'état cesse d'être une quantité. Appliqué aux trois échelles — celle qu'on engage, celle de la révélation, celle du relevé.

Les six captures ci-dessus sont de la seconde passe et font foi.

## Largeurs et débordement

| Moment | 1440×900 | 390×844 |
| --- | --- | --- |
| tour 1 | `scrollWidth` 1440 / `clientWidth` 1440 | `scrollWidth` 401 / `clientWidth` 390 |
| tour 2 | `scrollWidth` 1440 / `clientWidth` 1440 | `scrollWidth` 401 / `clientWidth` 390 |
| tour 3 | `scrollWidth` 1440 / `clientWidth` 1440 | `scrollWidth` 515 / `clientWidth` 390 |

**Le débordement à 390 n'appartient pas à ce jeu.** Il vient de la rampe des groupes et persiste identique avec la colonne du jeu entièrement masquée dans la page — mesuré, pas supposé. Il est déposé au backlog : [la-rampe-deborde-sur-mobile.md](../../../../backlog/defects/la-rampe-deborde-sur-mobile.md).

Sa conséquence visible ici : le conteneur de page est mis en page à 401 puis 491 px au lieu de 390, donc le jeu dispose de **plus** de largeur que le gabarit réel, et la ligne « CERTITUDE » de la règle sort du cadre visible alors qu'elle tiendrait à 390. Les captures mobiles sont donc fidèles au produit tel qu'il est aujourd'hui, pas à ce que le jeu rendra une fois la rampe corrigée.

## Ce qui reste non vérifié

Aucune capture entre 390 et 1440. Le rendu du jeu à une largeur de 390 px réellement disponible n'a pas été capturé — il ne le sera qu'une fois le défaut de rampe corrigé. Le sixième extrait et la soumission de la partie ne sont pas capturés : la trace soumise est couverte en Vitest, pas en navigateur.
