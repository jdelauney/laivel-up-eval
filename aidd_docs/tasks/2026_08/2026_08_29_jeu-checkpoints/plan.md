---
objective: "Le jeu checkpoints se joue de bout en bout dans le parcours et produit un score sur l'axe intervention, sans qu'aucun contrat existant ne bouge."
status: implemented
---

# Plan: Le jeu `checkpoints`, premier jeu à état

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Mesurer où un joueur reprend la main sur une tâche menée par l'IA, et poser le gabarit des jeux à état |
| **Source** | `aidd_docs/backlog/stories/reprendre-la-main-aux-bons-moments.md` · `aidd_docs/backlog/epics/parcours-couvrant-les-axes.md` · `aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md` |

## Phases

| # | Phase | File |
| --- | --- | --- |
| 1 | Les contrats et la simulation pure | [`phase-1.md`](./phase-1.md) |
| 2 | L'évaluateur et ses trois règles | [`phase-2.md`](./phase-2.md) |
| 3 | Le jeu à l'écran et son câblage | [`phase-3.md`](./phase-3.md) |
| 4 | Le groupe 7 dans le parcours | [`phase-4.md`](./phase-4.md) |

## Decisions

| Decision | Why |
| --- | --- |
| Un jeu à état garde sa partie dans son hook et soumet **la trace du déroulé** comme `answer` | Le contrat de plugin n'expose qu'un `onSubmit` unique. Faire porter l'état par le moteur aurait demandé de changer `GameEvaluator`, `GameRegistry` et `GameComponentProps` pour un seul jeu, et cassé la ligne ouvert/fermé que le registre existe pour tenir |
| La simulation est un helper pur, séparé du hook et de l'évaluateur | La même fonction sert à faire avancer la partie à l'écran et à rejouer la trace au scoring. Deux implémentations auraient divergé au premier ajustement de coût |
| Aucun aléatoire : la propagation d'un défaut est entièrement déterminée par la configuration | Deux parties aux mêmes choix doivent rendre le même verdict, sinon le pari de reproductibilité du produit tombe |
| Le jeu n'utilise pas l'horloge | Le budget de la story est un coût en unités de jeu, pas du temps mural. Injecter `Clock` aurait ajouté une dépendance sans rien mesurer de plus |
| Le coût d'un choix est affiché, la conséquence de le refuser ne l'est pas | Un joueur qui voit le coût réel d'un défaut avant de trancher joue les règles, pas l'arbitrage. C'est ce qui sépare une mesure d'un quiz |
| Trois critères, dont un garde-fou | « L'IA a produit l'essentiel du livrable » n'évalue pas le talent du joueur : il ferme le faux positif où quelqu'un qui corrige tout obtient un `intervention` maximal |
| Les six étapes s'appellent cadrage, **plan**, génération, revue, tests, merge | Le jeu « Reconstruction de chronologie » du groupe 5 ordonne le même flux et disait « prompt ». Deux jeux qui nomment différemment les mêmes étapes montrent deux flux au même joueur. « Plan » est ce que dit le manifeste ; « prompt » est un moyen, pas une étape |
| Les deux seuls défauts sont en amont, dans la prose ; le code des étapes techniques est propre | Le code sert de leurre assumé. Un joueur scrute le diff, n'y trouve rien, et découvre que le défaut était dans le cadrage pendant qu'il relisait. C'est la leçon du jeu — ne pas y ajouter un défaut visible dans le code pour le rendre plus facile |
| Les coûts et le budget sont provisoires, à régler en jouant | Aucun test ne peut dire si un barème rend le jeu trivial ou arbitraire. Ils vivent dans `course.json` : les ajuster ne touche pas une ligne de code |
