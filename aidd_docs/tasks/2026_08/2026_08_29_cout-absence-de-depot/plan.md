---
objective: "L'accueil dit, tant que le champ dépôt est vide, que le parcours se joue en entier sans dépôt, sans jamais reprocher cette absence ni promettre une lecture qu'aucune Story livrée ne tient."
status: implemented
---

# Plan: Comprendre le coût de l'absence de dépôt

## Overview

| Field      | Value                                                                     |
| ---------- | ------------------------------------------------------------------------- |
| **Goal**   | Annoncer à l'entrée qu'entrer sans dépôt est un usage prévu, sans recopier les libellés du référentiel ni promettre un plafond que le produit ne pose pas |
| **Source** | [`comprendre-le-cout-de-l-absence-de-depot.md`](../../../backlog/stories/comprendre-le-cout-de-l-absence-de-depot.md) |

## Phases

| #   | Phase                                            | File                         |
| --- | ------------------------------------------------ | ---------------------------- |
| 1   | ~~Nommer dans le domaine les axes que le dépôt prouve~~ — annulée | [`phase-1.md`](./phase-1.md) |
| 2   | Énoncer que le parcours se joue en entier sans dépôt | [`phase-2.md`](./phase-2.md) |

## Resources

| Source | Verified |
| ------ | -------- |
| [`preuves-du-depot-calculables-sans-jeton.md`](../../../backlog/spikes/preuves-du-depot-calculables-sans-jeton.md) | Les quatre preuves lisibles sans jeton portent sur les commits correctifs après ouverture de PR, les PR mergées sans édition humaine, les branches concurrentes, et les commits co-signés. Elles alimentent `intervention` et `parallele`, et elles seules — d'où les deux axes que le composant décrit en mots ordinaires. |
| [`config/grid.json`](../../../../config/grid.json) | Les libellés officiels des deux axes sont « Reprise humaine du travail de l'IA » et « Chantiers menés en parallèle ». Le référentiel est une donnée, jamais du code — et ne se recopie plus dans l'accueil, décision produit après revue. |
| [`level-resolver.helper.ts`](../../../../src/core/scoring/helpers/level-resolver.helper.ts) | Une dimension non mesurée ne satisfait aucune condition. Aucun mécanisme de plafond n'existe encore : il appartient à l'Epic des preuves du dépôt, l'annonce ne le promet plus. |
| [`scoring-vocabulary.ts`](../../../../__tests__/fixtures/scoring-vocabulary.ts) | Le balayage de l'accueil interdit vingt formes du vocabulaire de notation. La formulation retenue n'en emploie aucune. |

## Decisions

| Decision | Why |
| -------- | --- |
| L'accueil ne recopie pas les libellés officiels de `config/grid.json` | Décision produit après revue : les nommer prévient le joueur de ce qui est noté, contre `.impeccable/surfaces/onboarding-components-sections-onboarding-view-tsx.md` et l'exclusion d'Epic. L'accueil nomme les deux axes en mots ordinaires. |
| L'annonce ne promet plus de plafond | Décision produit après revue : aucun plafond n'existe dans le code, la phrase était fausse contre le produit livré. Elle part. |
| Phase 1 annulée | Les deux décisions ci-dessus retirent tout appelant de l'aide de domaine, de la méthode de façade et du câblage du hook : code mort, retiré plutôt que gardé « pour l'Epic 4 ». |
| L'annonce disparaît dès que le champ porte autre chose que du blanc | La règle porte sur l'intention de désigner un dépôt, pas sur la validité de la saisie. Maintenir l'annonce pendant la frappe transformerait un constat en insistance, et le champ dit déjà lui-même ce qu'il refuse. |
