---
type: defect
status: ready
related_to:
  - aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
order: 2
---

# Defect: La révélation d'une manche pousse son action hors de l'écran

## Context

Deux jeux du groupe 1, au moment de leur révélation — l'état terminal où le joueur lit ce qu'il vient de jouer avant de passer à la suite.

- `lie-detector` (`g1-3`), `src/games/lie-detector/components/composites/lie-detector-game.tsx` : la révélation déplie les quatre vérifications d'une manche, puis l'action « Manche suivante ».
- `defect-hunt` (`g1-2`), `src/games/defect-hunt/components/composites/defect-hunt-game.tsx:90-114` : même structure — la liste des défauts révélés, puis l'action de passage.

Relevé pendant la tournée navigateur de `lie-detector`, aux deux gabarits. Le défaut est antérieur à ce jeu : il est arrivé avec `defect-hunt` et n'avait pas été vu par sa propre tournée.

## Expected

`DESIGN.md`, section « La surface d'un jeu » : « Un relevé qui s'allonge ne pousse jamais la décision courante hors de l'écran. Un journal, une pile de tours, une liste de choix passés se plafonne et se replie. Sans ça, le dernier tour d'une partie longue oblige à faire défiler pour agir. »

L'action de passage reste atteignable sans défiler, quelle que soit la longueur de ce que la révélation déplie.

## Actual

L'action passe sous la ligne de flottaison dès que la révélation est ouverte.

| Gabarit | Dépassement sur `lie-detector`, manche `r1` |
| --- | --- |
| 390 × 844 | **597 px**, mesuré à `scrollY = 0` vérifié |
| 1440 × 900 | **383 px**, mesure valide |

**Les premiers chiffres mobiles étaient faux, et de beaucoup — la mesure desktop, elle, a toujours tenu.** La tournée annonçait 185 px sur mobile. Le navigateur piloté fait défiler la page pour amener un bouton hors écran dans sa zone cliquable avant de le cliquer, et ce décalage survivait au passage de manche puisque l'application ne recharge jamais : la mesure mobile était donc courte de l'offset accumulé, et reprise au bon repère, elle ressort plus de trois fois pire (597 px, pas 185).

La mesure desktop n'a jamais souffert de cette contamination : `qa/README.md` (point 3) le précise — `document.documentElement.scrollHeight` porte sur le document entier, pas sur la position de défilement, donc les 383 px restent la mesure prise, quel que soit le `scrollY` au moment de la lecture.

## Reproduction

1. Ouvrir le parcours, atteindre le groupe « Jugement critique ».
2. Jouer une manche de `g1-3` jusqu'à sa révélation, ou rendre la revue de `g1-2`.
3. Chercher l'action de passage sans faire défiler.

## Impact

**Relevé après correction de la mesure.** Le premier triage disait « modéré » sur la foi de 185 px, soit un cinquième d'écran. Le chiffre réel est 597 px sur mobile : sept dixièmes d'une hauteur d'écran séparent la fin de la lecture de l'action qui la clôt. Ce n'est plus une gêne de défilement, c'est une sortie hors champ.

Ce qui ne change pas : **le verdict n'est pas faussé.** Le joueur lit avant d'agir, aucun critère ne dépend de la position du bouton, et rien ne se perd s'il défile. C'est la règle du produit qui est enfreinte, pas la mesure. Le report en backlog plutôt qu'une correction dans la branche du jeu tient donc toujours, pour la raison énoncée plus bas : la correction ne peut pas être locale à un jeu.

Ce qui change : sur mobile, rien à l'écran n'indique qu'une action attend en dessous. Un joueur qui a fini de lire ses quatre vérifications peut raisonnablement croire la manche terminée et chercher ailleurs comment continuer. C'est le premier écran du produit où la sortie est réellement introuvable sans geste exploratoire, et c'est ce qui justifie de ne pas le laisser dormir.

La règle existe précisément pour ça : une liste qui s'allonge finit par cacher la sortie. Les deux jeux concernés ont une révélation de taille bornée aujourd'hui ; un corpus plus fourni l'allonge sans que rien n'alerte.

## Ce que la correction ne doit pas être

Un traitement dans un seul des deux jeux. La structure est identique chez les deux, et `aidd_docs/tasks/2026_08/2026_08_30_jeu-lie-detector/qa/README.md` établit qu'il s'agit du même motif, pas de deux défauts qui se ressemblent. Une barre d'action collante posée pour un seul jeu introduirait un motif d'interface que le produit n'a nulle part ailleurs.

## Un troisième jeu, relevé le 31/08 : `ambiguity-scan`

`ambiguity-scan` (`g6-2`), `src/games/ambiguity-scan/components/composites/ambiguity-scan-game.tsx`, état de révélation. Mesuré au navigateur piloté pendant la passe de surface de la réparation, session posée sur `g6-2`, à `scrollY = 0` vérifié :

| Gabarit | Avant resserrage | Après resserrage |
| --- | --- | --- |
| 1440 × 900 | 136 px | **0 px** — tient |
| 390 × 844 | 517 px | **364 px** — dépasse toujours |

Le resserrage — `leading-snug` et paddings réduits sur le texte non interactif de la révélation, où la cible tactile de `leading-loose` n'a plus lieu d'être — a suffi sur desktop et pas sur mobile. Ce qui reste est hors de portée d'un correctif local : la coquille partagée du parcours — rampe des groupes repliée à l'horizontale, en-tête « Situation *n* sur *N* », titre du jeu, `LockedAnswerNotice` — pèse à elle seule environ 340 px des 844 px du gabarit mobile, avant le premier caractère du jeu.

Ce jeu **confirme le diagnostic** : trois révélations sur trois jeux différents, trois structures de contenu différentes, le même dépassement mobile. Ce n'est pas la longueur d'une liste qui déborde, c'est la hauteur disponible qui n'existe pas. Une correction jeu par jeu ne peut donc pas y arriver, et la piste à instruire est la compression de la coquille sur petit écran, pas le contenu des jeux.

## Evidence

- `aidd_docs/tasks/2026_08/2026_08_30_jeu-lie-detector/qa/README.md` — les mesures et leurs captures, aux deux gabarits.
- `aidd_docs/tasks/2026_08/2026_08_31_jeu-ambiguity-scan/review.md` — la passe de surface qui a produit les mesures du 31/08.
- `.impeccable/surfaces/ity-scan-components-composites-ambiguity-scan-game-tsx.md` — le dépassement mobile résiduel, assumé par écrit plutôt que masqué.
- `DESIGN.md`, « La surface d'un jeu » — la règle enfreinte, énoncée pour les vingt jeux.
