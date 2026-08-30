---
type: defect
status: done
related_to:
  - aidd_docs/backlog/epics/deroule-du-parcours.md
order: 3
---

# Defect: La rampe des groupes déborde l'écran sur mobile

## Context

`src/components/group-rail/composites/group-rail.tsx`, à 390 px de large, sous le point de rupture `md` où la rampe passe à l'horizontale.

Trouvé pendant la tournée navigateur du jeu `confidence-bet`, le 30/08/2026, et **sans rapport avec ce jeu** : le débordement persiste avec la colonne du jeu entièrement masquée dans la page.

## Expected

À 390 px, la page ne déborde pas horizontalement : `scrollWidth` égale `clientWidth`, comme aux autres gabarits.

## Observed

À 390 px, `scrollWidth` vaut 401 quand un seul jeu du groupe courant est ouvert, et 491 une fois le parcours entamé. Le conteneur de page entier s'élargit à la largeur que la rampe réclame, et tout le contenu suit — la ligne « CERTITUDE » du jeu courant, par exemple, sort du cadre visible alors que sa mise en page tiendrait à 390.

Chaque segment de la rampe encode l'étendue de son groupe par sa taille. En vertical (desktop) c'est une hauteur, et l'espace est abondant. En horizontal (mobile) c'est une largeur, et vingt jeux répartis sur sept groupes réclament plus que 390 px. Les segments portent `shrink-0` : ils ne peuvent pas céder.

## Reproduce

1. `npm run dev`, fenêtre à 390×844.
2. Saisir un pseudo à l'accueil, valider.
3. Mesurer `document.documentElement.scrollWidth` et `clientWidth`.

## Cause

Ce n'est pas la rampe qui refusait de rétrécir, c'est la grille qui ne le lui demandait pas. `CourseView` et `OnboardingView` déclaraient `md:grid-cols-[minmax(11rem,16rem)_1fr]`, donc sous `md` la grille tombait sur sa colonne implicite, qui vaut `auto` — dimensionnée par le contenu minimal, jamais par la fenêtre. La rampe en rangée imposait son minimum, la colonne l'adoptait, et toute la page suivait. C'est pourquoi masquer la rampe ne réduisait pas la page : la colonne gardait sa largeur.

## Resolution

Corrigé le 30/08 sur `fix/la-rampe-deborde-sur-mobile`.

- Les deux grilles déclarent leurs colonnes à tous les gabarits, en `minmax(0, 1fr)` : une colonne qui peut descendre sous son contenu minimal, donc suivre la fenêtre. La seconde colonne du gabarit large passe de `1fr` à `minmax(0, 1fr)` pour la même raison.
- La rampe porte `min-w-0` : en rangée, sa largeur minimale est celle de son contenu, et rien ne l'autorisait à céder.
- **Sa hauteur est plafonnée à 90 % de la fenêtre.** Les 30 rem visés étaient une constante posée à sept groupes ; sur un écran court la rampe passait sous la ligne de flottaison. Le plafond laisse voir qu'il y a une page en dessous.
- Le plancher de ligne passe de 36 à 40 px : à 36, la compression sur fenêtre courte rognait les descendantes d'un libellé sur deux lignes. Défaut trouvé en vérifiant le correctif, pas présent avant lui.

### Mesures

`scrollWidth` / `clientWidth` du document, accueil et parcours, sur le corpus réel à vingt jeux.

| Gabarit | Accueil | Parcours | Hauteur de rampe |
| --- | --- | --- | --- |
| 390 × 844 | 390 / 390 | 390 / 390 | en rangée |
| 1440 × 900 | 1440 / 1440 | 1440 / 1440 | 480 px, plafond de 810 non atteint |
| 1440 × 700 | 1440 / 1440 | 1440 / 1440 | 480 px, plafond de 630 non atteint |
| 1280 × 420 | 1280 / 1280 | 1280 / 1280 | **378 px, exactement le plafond** |

Preuves : [`qa/rampe-mobile.png`](qa/rampe-mobile.png) et [`qa/rampe-desktop-court.png`](qa/rampe-desktop-court.png).

## Notes

Le défaut grandissait avec le catalogue ; la correction n'en dépend plus. La rampe suit la fenêtre au lieu de la lui imposer, quel que soit le nombre de groupes et de jeux.
