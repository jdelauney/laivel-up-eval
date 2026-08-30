---
type: defect
status: proposed
related_to:
  - aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
  - aidd_docs/backlog/stories/trouver-les-erreurs-sans-liste.md
order: 4
---

# Defect: Le chronomètre d'un jeu minuté repart à zéro après un rechargement

## Context

`src/games/defect-hunt/hooks/use-elapsed-seconds.hook.ts`, l'instant de départ posé dans une `ref` au premier rendu du composant.

Trouvé à la revue indépendante du jeu `defect-hunt`, le 30/08/2026. Le défaut est nommé ici plutôt que corrigé dans le jeu parce que **son correctif ne vit pas dans le jeu** : voir « Cause ».

## Expected

Un joueur ne doit pas pouvoir améliorer son critère de temps en rechargeant la page. Le temps mesuré est celui qu'il a réellement passé sur la situation.

## Observed

`g1-2` est la première situation minutée du parcours. Le chemin, sans aucun outillage :

1. Ouvrir la situation, lire l'extrait à loisir — dix minutes s'il le veut.
2. Recharger la page. `g1-2` n'est pas soumise, l'accueil propose « Reprendre ».
3. Reprendre : le composant se remonte, `startedAt` reprend la valeur de `Date.now()`.
4. Marquer les lignes déjà repérées en vingt secondes, rendre.

`g1-2-c4` — « La revue a-t-elle été rendue dans le temps imparti ? » — ressort satisfait après dix minutes de lecture réelle.

Le joueur perd ses marques au rechargement, mais pas sa lecture, et la lecture est la partie coûteuse. C'est exactement le genre de contournement que l'epic classe en triche : « Un joueur qui tente de tricher un jeu n'obtient pas un cran supérieur. »

## Reproduce

1. `npm run dev`, atteindre la situation `g1-2`.
2. Laisser passer plus de trois minutes — le cadran affiche le dépassement.
3. Recharger la page, cliquer « Reprendre ».
4. Le cadran repart à `03:00 RESTANT`.

## Cause

L'instant de départ vit dans le composant du jeu, et l'instantané de session n'en garde rien.

`src/core/contracts/session-snapshot.schema.ts` porte `playerName`, `repository`, `groupIndex`, `gameIndex` et `submissions` : **aucun état intra-jeu**. C'était sans conséquence tant qu'aucun jeu ne mesurait de durée. `defect-hunt` est le premier, et il ne sera pas le dernier.

Le correctif appartient donc à la couche session, pas au jeu : il faut que l'instant d'ouverture de la situation courante survive au rechargement. Le tenir dans `defect-hunt` seul reviendrait à le réécrire dans chaque jeu minuté à venir.

## Fix envisagé

Un champ optionnel `currentGameStartedAt` dans l'instantané, sur le modèle de `repository` — optionnel exactement pour la même raison, une partie enregistrée avant son arrivée n'en porte pas, et la rendre requise ferait disparaître toutes ces parties.

La façade le pose à l'ouverture d'une situation et le remet à zéro au passage à la suivante. Reste à trancher **comment le jeu le reçoit** : `GameComponentProps` vaut aujourd'hui `{ config, onSubmit }`, et l'élargir touche le contrat des cinq jeux livrés. C'est la vraie décision, et elle mérite son propre lot.

## Notes

Poids réel du contournement : le critère du temps pèse 1 sur les 7 points de `g1-2`. Le gain est donc borné, mais il est réel, et il récompense précisément le geste que le produit prétend ne pas récompenser.
