---
objective: "Le jeu confidence-bet se joue de bout en bout dans le parcours à la place du placeholder g1-1, et produit un score sur la dimension verification, sans qu'aucun contrat existant ne bouge."
status: implemented
---

# Plan: Le jeu `confidence-bet`, la mise de confiance à l'aveugle

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Mesurer si un joueur engage sa confiance à la hauteur de ce qu'il peut réellement établir, et fermer le faux positif de celui qui mise haut partout ou qui se retranche au milieu |
| **Source** | `aidd_docs/backlog/stories/miser-ma-confiance-a-l-aveugle.md` · `aidd_docs/backlog/epics/parcours-couvrant-les-axes.md` · `config/signature.json` |

## Phases

| # | Phase | File |
| --- | --- | --- |
| 1 | Les contrats et la simulation pure | [`phase-1.md`](./phase-1.md) |
| 2 | L'évaluateur et ses quatre règles | [`phase-2.md`](./phase-2.md) |
| 3 | Le jeu à l'écran et son câblage | [`phase-3.md`](./phase-3.md) |
| 4 | Le jeu dans le parcours | [`phase-4.md`](./phase-4.md) |
| 5 | La passe impeccable de la surface | [`phase-5.md`](./phase-5.md) |

## Decisions

| Decision | Why |
| --- | --- |
| Le jeu reprend le gabarit de `three-tracks` : simulation pure partagée, trace du déroulé comme `answer`, évaluateur qui rejoue depuis les seules mises | C'est la ligne posée par `checkpoints` et confirmée par `three-tracks`. Un troisième jeu à état qui structurerait son état autrement obligerait à relire la mécanique à chaque fois |
| Un extrait porte l'une de **trois** natures : `sound`, `flawed`, `undecidable` | Le « So that » de la story est « on mesure si je sais reconnaître **ce que je ne peux pas évaluer** ». Sans extrait indécidable, le jeu ne mesure que la lecture de code, jamais l'aveu d'ignorance, et la moitié de l'intention tombe |
| La configuration exige **au moins un extrait de chaque nature** | Un corpus sans `flawed` rendrait le critère « confiance sous 50 % sur les défectueux » satisfait par vacuité : un jeu noterait sans rien mesurer. Le refus tombe au chargement, jamais au verdict |
| L'échelle de mises est **discrète, déclarée et symétrique** autour d'une mise neutre elle aussi déclarée | Une échelle continue mesurerait la dextérité au curseur. Une échelle asymétrique rendrait la mise haute et la mise basse inégalement payantes, et la calibration ne se lirait plus dans les deux sens. Le refus de l'asymétrie tombe au chargement |
| Le mouvement de capital est **linéaire** : `mise − neutre` sur un extrait sain, `neutre − mise` sur un défectueux, `−|mise − neutre|` sur un indécidable | La story impose « le gain ou la perte est proportionnel à la mise ». Le linéaire est la seule forme que le joueur lit sans calcul, et une seule formule sert l'écran et le verdict. Sur l'indécidable, aucune direction n'est la bonne : seul l'éloignement du doute se paie, ce qui s'annonce honnêtement dans la consigne sans rien dire des seuils |
| La consigne annonce que **certains extraits ne peuvent pas être tranchés** avec ce qui est montré, et que s'en éloigner coûte | Cacher l'existence de cette nature ferait du garde-fou une énigme, et le jeu mesurerait la résolution d'énigme au lieu de la calibration. C'est l'erreur que le plan de `three-tracks` a déjà nommée. Le cadre s'annonce, la bande et les seuils restent tus |
| La calibration ne lit que les extraits tranchables, le garde-fou ne lit que les indécidables | Sur un indécidable, le meilleur `delta` atteignable est nul : les compter dans la calibration la ferait décroître mécaniquement sans rien mesurer. Le capital porte les deux, chaque critère n'en lit qu'une moitié |
| Quatre critères, pesés **2 · 2 · 2 · 1** sur la seule dimension `verification` | Les trois premiers sont les trois critères nommés par la story et pèsent pareil ; le garde-fou tranche entre deux joueurs qui les satisfont également. Le barème a été vérifié contre le moteur sur six profils, dont le tableau vit dans `phase-4.md` |
| Le jeu ne vise **que** `verification`, la dimension de signature, et abandonne le mapping `intervention` du placeholder | L'epic partage le parcours en deux : six groupes portent la signature, le septième porte les axes officiels. Le placeholder visait `intervention` parce qu'il ne mesurait rien de précis ; un jeu de jugement critique qui monterait un axe du référentiel officiel brouillerait cette frontière |
| La révélation arrive **après** l'engagement, extrait par extrait, et la mise ne se reprend jamais | C'est l'acceptance première de la story. Elle se tient par construction : la trace n'expose aucun chemin pour réécrire une mise posée, sur le modèle du registre en ajout seul de `three-tracks` |
| Aucun aléa, aucune horloge : les extraits, leur nature, l'échelle et les seuils sont déclarés dans le parcours | Deux parties aux mêmes mises rendent le même verdict, condition du mode rejeu et du pari de reproductibilité du produit |
| Les deux seuils de 50 % et 70 % sont repris **tels quels** de la story, avec leur asymétrie assumée | Sur deux extraits et une échelle à cinq valeurs, « moyenne sous 50 » est satisfait par 6 des 15 paires possibles, « moyenne au-dessus de 70 » par 2 seulement — se méfier du mauvais code est trois fois plus facile que faire confiance au bon. C'est une conséquence de l'arithmétique des seuils, pas du barème, et les seuils sont ceux que la story écrit noir sur blanc. Les rééquilibrer est une décision produit, pas une correction : deux leviers existent, descendre `c2` à 60, ou ajouter un troisième extrait sain |
