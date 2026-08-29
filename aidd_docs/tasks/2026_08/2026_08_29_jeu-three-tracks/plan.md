---
objective: "Le jeu three-tracks se joue de bout en bout dans le parcours et produit un score sur l'axe parallele, sans qu'aucun contrat existant ne bouge."
status: pending
---

# Plan: Le jeu `three-tracks`, l'allocation d'attention

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Mesurer combien de chantiers un joueur mène de front jusqu'au bout, et fermer le faux positif de celui qui en ouvre quatre pour en abandonner trois |
| **Source** | `aidd_docs/backlog/stories/mener-plusieurs-chantiers-de-front.md` · `aidd_docs/backlog/epics/parcours-couvrant-les-axes.md` · `aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md` |

## Phases

| # | Phase | File |
| --- | --- | --- |
| 1 | Les contrats et la simulation pure | [`phase-1.md`](./phase-1.md) |
| 2 | L'évaluateur et ses quatre règles | [`phase-2.md`](./phase-2.md) |
| 3 | Le jeu à l'écran et son câblage | [`phase-3.md`](./phase-3.md) |
| 4 | Le jeu dans le parcours | [`phase-4.md`](./phase-4.md) |

## Decisions

| Decision | Why |
| --- | --- |
| Le jeu reprend le gabarit de `checkpoints` : simulation pure partagée, trace du déroulé comme `answer`, évaluateur qui rejoue | C'est la ligne posée par le premier jeu à état et validée en revue. Deux jeux du même groupe qui structurent leur état différemment obligeraient à relire la mécanique à chaque fois |
| L'évaluateur rejoue la partie depuis les seules allocations ; l'avancement, les morts et le compte de vivants écrits dans la trace sont un journal | Une trace dont les compteurs seraient forgés ne doit changer aucun verdict. Même règle que `checkpoints`, où les coûts de la trace ne sont jamais lus |
| Un chantier « vivant » est un chantier non mort, **le mergé compris** | Compter le mergé comme éteint punirait la réussite : merger tôt ferait baisser la médiane. La médiane mesure ce que le joueur a tenu, pas ce qu'il a laissé en cours |
| La médiane, jamais le maximum, et sur tous les tours de la partie | Le référentiel dit « habituellement » : un pic isolé ne compte pas. C'est ce qui rend « ouvrir quatre puis en perdre trois » sans effet sur le cran, et c'est le garde-fou du jeu |
| Quatre critères là où la source en annonce trois : le cran « zéro, un, ou trois » se code en **deux paliers** `merged-at-least` | Un critère est un booléen. Un seul ne peut pas porter trois graduations. Deux paliers de poids 2 posent le score exactement sur les bandes 0, 0.33 et 1 de `parallele` |
| Une dérive coûte une unité d'attention à la reprise, avant tout avancement | C'est ce qui donne un prix à la négligence sans introduire d'aléa. Le joueur qui revient tard paie sa remise en route, et la partie reste rejouable à l'identique |
| Aucun aléa, aucune horloge : les tours, les seuils et le travail de chaque chantier sont déclarés dans le parcours | Deux parties aux mêmes allocations rendent le même verdict, condition du mode rejeu et du pari de reproductibilité du produit |
| La configuration refuse au chargement une mort qui précéderait la dérive | La story exige que la dérive soit visible avant la mort. Un barème qui l'empêche rendrait la partie injouable sans qu'aucun test ne le voie |
| **Un tour se clôt à tout moment, même sans avoir placé une seule unité** | Avec quatre chantiers et un plafond de deux, exiger que les trois unités soient placées **force** le parallélisme que le jeu prétend mesurer, et rend la bande basse de `parallele` inatteignable : n'importe qui finissant la partie décrocherait le cran « 1 chantier » sans l'avoir prouvé. Le joueur doit pouvoir refuser de servir, et en payer le prix |
| Le barème retenu est **volontairement clément** : étaler une unité partout atteint le cran le plus haut | Un barème serré exigeait de deviner des seuils volontairement cachés, ce qui aurait mesuré la résolution d'énigme et rendu Copper presque inatteignable. Étaler son attention sur quatre chantiers **est** le comportement que l'axe décrit ; ce qui doit être puni, c'est d'en ouvrir quatre pour en lâcher trois, et ça retombe à un tiers |
| Les seuils, le budget d'attention et le travail des chantiers restent réglables, mais leur barème a été **vérifié contre le moteur** sur six parties | Aucun test ne dit si un barème rend le jeu trivial, mais rejouer six stratégies dans la simulation le dit. Le tableau vit dans `phase-4.md` et devient le contrat du test d'intégration |
