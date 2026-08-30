---
type: story
status: done
parent: aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
order: 3
---

# Story: Miser ma confiance sur du code IA avant de savoir s'il tient

**As** un développeur évalué
**I want** engager une mise de confiance sur chaque extrait avant toute révélation
**So that** on mesure si je sais reconnaître ce que je ne peux pas évaluer

## Acceptance

- Chaque extrait reçoit une mise avant révélation, et la mise ne peut plus changer ensuite.
- Le critère « confiance sous 30 % sur les extraits bugués » ressort satisfait ou manqué.
- Le critère « confiance au-dessus de 70 % sur les extraits corrects » ressort satisfait ou manqué.
- La calibration globale est comparée à son seuil, et le gain ou la perte est proportionnel à la mise.

> Les deux seuils sont **symétriques autour de la mise neutre**, 30 et 70 de part et d'autre de 50. La première écriture disait « sous 50 % », et la conséquence a été mesurée après coup : sur deux extraits et une échelle à cinq valeurs, « moyenne sous 50 » était satisfait par 6 des 15 paires possibles, « moyenne au-dessus de 70 » par 2 seulement. Se méfier du mauvais code était trois fois plus facile que faire confiance au bon, ce qui sous-créditait la confiance justifiée dans un produit qui porte précisément sur du code d'IA. Corrigé le 30/08 : les deux critères demandent désormais le même engagement, chacun dans son sens.
