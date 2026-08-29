# QA navigateur — le jeu `confidence-bet`

Relevé sur la branche `feat/miser-ma-confiance-a-l-aveugle`, contre `npm run dev`, dans Chromium, à 1440×900 et 390×844. Trois passes, datées du 30/08.

Le harnais est volontairement hors du dépôt : la suite Playwright du projet n'existe toujours pas, elle est suivie par [amorcer-la-suite-playwright-declaree.md](../../../../backlog/tasks/amorcer-la-suite-playwright-declaree.md). Ce qui est versionné ici, ce sont les preuves, pas le moyen de les reproduire. Le pilote de ces passes a été monté à la racine du dépôt puis supprimé une fois les captures produites.

**Les huit captures ci-dessous sont de la troisième passe et font seules foi.** Celles des deux premières portaient l'ancien corpus, remplacé après revue.

## Le parcours joué

Accueil, pseudo saisi (**Alice**), puis le jeu — `confidence-bet` est le premier jeu du premier groupe, il n'y a rien à traverser pour l'atteindre. Les mises jouées suivent l'ordre déclaré du corpus : `x1` 10, `x2` 50, `x3` 90, `x4` 10, `x5` 50, `x6` 90.

| Capture | Ce que l'écran montre |
| --- | --- |
| `tour-1` | Le premier extrait, la règle vierge, aucun repère. « Engager la mise » est indisponible tant qu'aucune position n'est choisie |
| `tour-2` | La mise engagée à 10 sur `x1`, défectueux. L'échelle a cédé la place à la révélation ; les deux repères tombent sur la même graduation, le joueur a vu juste. Le relevé s'ouvre sur sa première ligne |
| `tour-3` | Cinq extraits derrière, et `x6`, indécidable, joué à 90. La règle passe en pointillé, ne pose aucun repère de vérité, et la phrase « Aucune position n'était justifiable sur cette règle » l'énonce. Le relevé porte cinq règles en réduction, alignées |

## Ce que les captures établissent

| Capture | Ce qu'elle prouve |
| --- | --- |
| `desktop-tour-1.png` · `mobile-tour-1.png` | La règle se lit comme un instrument : embouts, graduations de longueur inégale, origine plus haute. Les cinq chiffres partagent une seule ligne de base — correctif de la première passe |
| `desktop-tour-2.png` · `mobile-tour-2.png` | Après l'engagement, l'échelle n'est plus à l'écran : elle a cédé la place, elle ne s'est pas grisée. Le repère du joueur (triangle plein) et celui de la vérité (losange évidé) se distinguent par la forme, pas par la couleur — y compris posés sur la même graduation |
| `desktop-tour-3.png` · `mobile-tour-3.png` | Sur l'extrait indécidable, aucun repère de vérité n'est posé. Le relevé aligne les règles en réduction : la colonne de marques se lit d'un coup d'œil |
| `colonne-390-tour-1.png` · `colonne-390-tour-2.png` | La colonne du jeu forcée à 390 px, contournant l'élargissement dû à la rampe. `scrollWidth` 390 / `clientWidth` 390 aux deux moments : **le jeu tient à 390** |

Aux trois moments et aux deux gabarits, l'écran ne porte **aucun seuil, aucune bande, aucun critère de notation**.

## Ce que les passes ont trouvé

**Première passe — les chiffres de la règle ne partageaient pas la même ligne de base.** La graduation de la mise neutre est plus haute que ses voisines, et comme le chiffre suivait la graduation dans une colonne flex, `50` tombait plus bas que `10` et `30`. La règle cessait de se lire comme un instrument. Remède : la graduation pend depuis le filet dans un fût de hauteur fixe, elle varie en longueur à l'intérieur. Appliqué aux trois échelles — celle qu'on engage, celle de la révélation, celle du relevé.

**Troisième passe — le corpus a changé après revue**, les captures de la deuxième ne montraient plus le jeu réel. Rejouées à l'identique sur le nouveau corpus, plus la mesure de la colonne isolée à 390.

## Largeurs et débordement

| Moment | 1440×900 | 390×844, page entière | 390, colonne du jeu isolée |
| --- | --- | --- | --- |
| tour 1 | 1440 / 1440 | 523 / 390 | **390 / 390** |
| tour 2 | 1440 / 1440 | 523 / 390 | **390 / 390** |
| tour 3 | 1440 / 1440 | 515 / 390 | — |

**Le débordement de la page à 390 n'appartient pas à ce jeu.** Il vient de la rampe des groupes et persiste avec la colonne du jeu masquée — mesuré, pas supposé. Déposé au backlog : [la-rampe-deborde-sur-mobile.md](../../../../backlog/defects/la-rampe-deborde-sur-mobile.md).

Sa conséquence sur les captures mobiles : le conteneur de page est mis en page à 523 puis 515 px au lieu de 390, donc le jeu y dispose de **plus** de largeur que le gabarit réel, et la ligne « CERTITUDE » de la règle sort du cadre visible. La colonne isolée lève le doute : à 390 réellement disponible, le jeu ne déborde pas.

## Le bloc de code défile, il ne se replie pas

À 390, une ligne de code plus longue que la colonne est coupée au bord du bloc, qui défile horizontalement. C'est voulu : replier du code changerait ce que le joueur doit juger, dans un jeu dont c'est précisément l'objet. La contrepartie est qu'un ascenseur en surimpression peut ne pas se voir tant qu'on n'a pas commencé à faire défiler — limite connue, non corrigée.

## Ce qui reste non vérifié

Aucune capture entre 390 et 1440. Le sixième extrait et la soumission de la partie ne sont pas capturés : la trace soumise est couverte en Vitest, pas en navigateur. La colonne isolée à 390 n'a été mesurée qu'aux deux premiers moments, pas sur le relevé à cinq lignes.
