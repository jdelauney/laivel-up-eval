---
type: defect
status: proposed
related_to:
  - aidd_docs/backlog/epics/deroule-du-parcours.md
order: 5
---

# Defect: Deux situations du même type se réconcilient au lieu de se remonter

## Context

`src/features/group-navigation/components/sections/course-view.tsx`, le rendu du composant de jeu résolu par le registre.

Trouvé à la revue indépendante du jeu `defect-hunt`, le 30/08/2026, et **sans rapport avec ce jeu** : le défaut est préexistant et vit dans le déroulé, pas dans un jeu.

## Expected

Passer d'une situation à la suivante ouvre une partie neuve, quel que soit le type des deux situations.

## Observed

`<Game config={config} onSubmit={onSubmit} />` est rendu sans `key`. Quand deux situations consécutives partagent le même `type`, React reconnaît le même élément à la même position et **réconcilie** l'instance au lieu de la remonter : l'état interne du jeu — marques posées, trace figée, garde de soumission unique, chronomètre — traverse la frontière entre les deux situations.

Le groupe `groupe-pilotage` du parcours réel enchaîne trois situations de type `test-bench` (`g2-1`, `g2-2`, `g2-3`). Le groupe `groupe-jugement` en enchaîne deux (`g1-2` était l'une d'elles avant de devenir `defect-hunt` ; `g1-3` reste un `test-bench`).

## Reproduce

1. `npm run dev`, atteindre `g2-1`.
2. Répondre, passer à `g2-2` — même type.
3. L'état du jeu précédent est encore là.

## Cause

Sans `key` stable, React n'a aucun moyen de distinguer deux rendus successifs du même type de composant à la même position. C'est le comportement documenté de la réconciliation, pas un bug de React.

## Fix envisagé

`key={game.id}` sur le rendu du composant de jeu. Une ligne. L'identifiant de la situation est déjà à portée dans `useCourse`.

## Notes

Le défaut ne se voit pas encore sur les jeux à état, qui sont tous en instance unique dans le parcours : `checkpoints`, `three-tracks`, `confidence-bet` et `defect-hunt` n'apparaissent qu'une fois chacun. Il est atteignable dès aujourd'hui sur `test-bench`, et il le deviendra pour tout jeu à état dont le parcours porterait deux exemplaires.
