---
type: story
status: proposed
parent: aidd_docs/backlog/epics/onboarding-du-joueur.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
related_to:
  - aidd_docs/backlog/stories/voir-mon-verdict-plafonne.md
order: 3
---

# Story: Comprendre ce que me coûte l'absence de dépôt

**As** un développeur évalué
**I want** savoir dès l'entrée ce que je perds si je ne désigne pas de dépôt
**So that** je choisisse en sachant ce que l'outil pourra ou ne pourra pas m'annoncer

## Acceptance

- Sans dépôt saisi, l'accueil nomme ce que le verdict ne pourra pas asseoir sur un historique : ce que la personne fait du travail de l'IA, et le nombre de chantiers qu'elle mène de front. Ce sont les deux seuls axes qu'un dépôt sait prouver sans jeton, d'après `aidd_docs/backlog/spikes/preuves-du-depot-calculables-sans-jeton.md`.
- Ces deux axes sont dits en mots ordinaires. Aucun libellé de `config/grid.json` n'est recopié à l'accueil : une personne prévenue de ce qui est mesuré joue un personnage, ce que l'Epic exclut.
- L'annonce est factuelle et ne culpabilise pas : entrer sans dépôt reste un usage nominal.
- Saisir un dépôt fait disparaître l'annonce.
- L'annonce dit que le verdict sera plafonné. **Reporté le 29/08/2026, décision produit.** Aucun plafond n'existe encore : `src/core/scoring/helpers/level-resolver.helper.ts` n'en pose aucun et l'écran de verdict ne mentionne jamais le dépôt. Annoncer à l'entrée ce que la sortie contredit serait faux. Cette ligne se lève avec `voir-mon-verdict-plafonne.md`, et la Story ne se ferme pas avant.
