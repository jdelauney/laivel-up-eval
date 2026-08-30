---
type: story
status: proposed
parent: aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
source: aidd_docs/tasks/2026_08/2026_08_29_parcours-sept-groupes/brainstorm.md
order: 4
---

# Story: Trouver les erreurs d'un extrait sans qu'on me les liste

**As** un développeur évalué
**I want** cliquer les défauts d'un extrait dont on m'annonce seulement le nombre, avant la fin du temps
**So that** on mesure si je lis vraiment le code au lieu de reconnaître des motifs

## Acceptance

- Le nombre d'erreurs est annoncé, leur nature ne l'est pas, et aucune liste de choix n'est fournie.
- Les erreurs couvrent au moins la sécurité, la logique et la dépendance hallucinée.
- Le critère « au moins 80 % des erreurs trouvées » ressort satisfait ou manqué.
- Les faux positifs sont comptés et comparés à leur seuil.
- Le temps imparti est visible et son dépassement fait manquer son critère.

## Seuils retenus

Câblés dans `config/course.json`, situation `g1-2`, et verrouillés par
`__tests__/integration/course-run/defect-hunt-run.test.ts` :

- Ratio de défauts trouvés : au moins **80 %** (`found-ratio-at-least`, 0.8).
- Marques posées à côté d'un défaut : au plus **deux** (`false-positives-at-most`, 2).
- Temps imparti : **trois minutes** (`timeLimitSeconds: 180`), lu par `within-time-budget`, sans seuil propre à la règle.
- Le dépassement du temps ne coûte que son propre critère (`g1-2-c4`) : la partie ne s'arrête pas, et les trois autres critères gardent leur verdict.
