---
type: defect
status: ready
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

## Notes

Le défaut grandit avec le catalogue : il était déjà présent avant `confidence-bet`, et chaque jeu ajouté au parcours l'aggrave. Trois voies possibles, non tranchées — laisser la rampe défiler horizontalement, plafonner l'encodage de l'étendue sous `md`, ou ne montrer sur mobile que le groupe courant et ses voisins.
