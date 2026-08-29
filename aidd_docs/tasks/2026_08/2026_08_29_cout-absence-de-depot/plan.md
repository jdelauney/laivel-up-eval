---
objective: "L'accueil dit, tant que le champ dépôt est vide, quels axes le verdict ne pourra pas asseoir sur un historique, sans jamais reprocher cette absence."
status: in-progress
---

# Plan: Comprendre le coût de l'absence de dépôt

## Overview

| Field      | Value                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| **Goal**   | Annoncer à l'entrée le plafond que pose un parcours sans dépôt, et nommer les deux axes concernés |
| **Source** | [`comprendre-le-cout-de-l-absence-de-depot.md`](../../../backlog/stories/comprendre-le-cout-de-l-absence-de-depot.md) |

## Phases

| #   | Phase                                            | File                         |
| --- | ------------------------------------------------ | ---------------------------- |
| 1   | Nommer dans le domaine les axes que le dépôt prouve | [`phase-1.md`](./phase-1.md) |
| 2   | Énoncer le plafond tant que le dépôt manque      | [`phase-2.md`](./phase-2.md) |

## Resources

| Source | Verified |
| ------ | -------- |
| [`preuves-du-depot-calculables-sans-jeton.md`](../../../backlog/spikes/preuves-du-depot-calculables-sans-jeton.md) | Les quatre preuves lisibles sans jeton portent sur les commits correctifs après ouverture de PR, les PR mergées sans édition humaine, les branches concurrentes, et les commits co-signés. Elles alimentent `intervention` et `parallele`, et elles seules. |
| [`config/grid.json`](../../../../config/grid.json) | Les libellés officiels des deux axes sont « Reprise humaine du travail de l'IA » et « Chantiers menés en parallèle ». Le référentiel est une donnée, jamais du code. |
| [`level-resolver.helper.ts`](../../../../src/core/scoring/helpers/level-resolver.helper.ts) | Une dimension non mesurée ne satisfait aucune condition. Aucun mécanisme de plafond n'existe encore : il appartient à l'Epic des preuves du dépôt. |
| [`scoring-vocabulary.ts`](../../../../__tests__/fixtures/scoring-vocabulary.ts) | Le balayage de l'accueil interdit vingt formes du vocabulaire de notation. La formulation retenue n'en emploie aucune. |

## Decisions

| Decision | Why |
| -------- | --- |
| Les deux axes sont nommés dans le domaine, pas dans l'écran | L'accueil et l'écran de verdict diront la même chose ; deux listes tenues à la main auraient divergé au premier ajustement. Le libellé reste lu dans la grille, qui est une donnée. |
| L'annonce nomme `intervention` et `parallele`, jamais « aucun niveau au-dessus de White » | La formule de l'Epic est fausse contre le code : `config/course.json` alimente les cinq dimensions et le parcours seul les rend mesurées. Annoncer un plafond que le produit ne pose pas serait un mensonge à l'entrée. |
| L'annonce disparaît dès que le champ porte autre chose que du blanc | La règle porte sur l'intention de désigner un dépôt, pas sur la validité de la saisie. Maintenir l'annonce pendant la frappe transformerait un constat en insistance, et le champ dit déjà lui-même ce qu'il refuse. |
