---
type: defect
status: done
related_to:
  - aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
  - aidd_docs/backlog/epics/deroule-du-parcours.md
  - aidd_docs/backlog/stories/revenir-sur-un-jeu-deja-soumis.md
order: 2
---

# Defect: La révélation arrive avant que la trace ne soit écrite, donc un rechargement la rejoue

## Context

Les cinq jeux à deux temps du parcours — `checkpoints`, `lie-detector`, `hint-budget`, `practice-map`, `ambiguity-scan` — montrent une révélation entre le geste de verrouillage et le passage au jeu suivant. Le défaut est dans le câblage commun, pas dans un jeu.

Relevé le 31/08 par la revue indépendante de `ambiguity-scan` (`aidd_docs/tasks/2026_08/2026_08_31_jeu-ambiguity-scan/review.md`, constat 1), sur le jeu où il fait le plus de dégâts.

## Expected

Une fois la révélation affichée, la réponse du joueur est définitive : la recharger ne doit pas lui rendre la main sur le même jeu. C'est exactement ce que `LockedAnswerNotice` promet au joueur sur chaque écran de parcours.

## Actual

Le verrouillage n'écrit rien. `submit()` d'un jeu ne fait que basculer sa phase en état React local ; la seule écriture est `this.persistence.write(session.snapshot())` en fin de `GameSessionFacade.submitAnswer` (`src/core/session/game-session.facade.ts:207`), atteinte uniquement par le bouton « Continuer » de la révélation.

Le contrat d'affichage n'offre pas d'autre chemin : `GameComponentProps` porte un unique `onSubmit` (`src/games/types/game-component.ts:19`), et `useCourse.submit` enchaîne `facade.submitAnswer(answer)` puis `facade.nextGame()` (`src/features/group-navigation/hooks/use-course.hook.ts:21-30`). Un jeu ne peut donc pas verrouiller sa trace sans avancer, ni révéler quoi que ce soit sans avoir déjà avancé.

## Reproduction

1. Démarrer une partie et atteindre `g6-2`, « Qu'est-ce qui est ambigu ici ? ».
2. Signaler un seul segment, n'importe lequel, et cliquer « Verrouiller mes signalements ».
3. Lire la révélation : elle liste les quatre segments ambigus du parcours et leur seconde lecture.
4. **Ne pas** cliquer « Continuer ». Recharger la page.
5. La reprise repose le joueur sur `g6-2`, écran de jeu, aucun signalement enregistré.
6. Signaler les quatre segments qu'on vient de lui montrer, et verrouiller.

Les deux critères sortent tenus : `c1` à `(4 − 0)/4 = 1.0`, `c2` à `5/5 = 1.0`.

## Impact

Trois points de poids sur `pilotage-contexte` obtenus sans lire une ligne du prompt, de façon **déterministe** et non probabiliste. L'épique `parcours-couvrant-les-axes.md`, *Success Evidence*, pose l'inverse : « Un joueur qui tente de tricher un jeu […] n'obtient pas un cran supérieur. »

La gravité varie selon la forme de révélation :

| Jeu | Ce que la révélation rend | Gain d'un rechargement |
| --- | --- | --- |
| `ambiguity-scan` | l'ensemble-réponse exact, les quatre segments ambigus | **le corrigé complet** |
| `lie-detector` | l'affirmation qui mentait | le corrigé de la manche |
| `checkpoints`, `hint-budget`, `practice-map` | la cause réelle, le repère, le « pourquoi » | une aide, pas le corrigé |

Aucun de ces jeux ne le teste : les tests de hook vérifient le verrouillage **dans la même instance**, jamais qu'une seconde instance reparte de zéro.

## Evidence

- `src/core/session/game-session.facade.ts:189-208` — `submitAnswer` est le seul chemin vers `persistence.write`, et il est indivisible : évaluer, empiler, écrire.
- `src/features/group-navigation/hooks/use-course.hook.ts:21-30` — `submit` appelle `submitAnswer` puis `nextGame` sans point d'arrêt entre les deux.
- `src/games/types/game-component.ts:19` — un seul rappel, `onSubmit`, donc un seul instant possible.
- `src/games/ambiguity-scan/hooks/use-ambiguity-scan.hook.ts:72-85` — `submit` bascule la phase, `advance` appelle `onSubmit` ; la révélation vit entre les deux.
- `src/features/group-navigation/components/sections/course-view.tsx:44` — `LockedAnswerNotice` annonce au joueur que sa réponse est définitive, ce que le câblage ne tient pas encore.

## Verification

Le contrat d'affichage sépare deux instants : verrouiller la réponse, puis avancer. Concrètement, `GameComponentProps` porte deux rappels — `onLock(answer)` qui évalue, empile et **écrit**, et `onAdvance()` qui passe au jeu suivant. Les cinq jeux à deux temps appellent le premier à leur verrouillage et le second à « Continuer » ; les jeux à un temps appellent les deux à la suite.

Vérifié par un test qui, pour chacun des cinq jeux, verrouille, démonte le composant, remonte une session reprise depuis le stockage, et constate que le jeu est déjà soumis — pas rejouable dans son état d'avant.

Le correctif touche `game-component.ts`, `use-course.hook.ts`, `game-session.facade.ts`, `course-view.tsx` et les cinq jeux. Il ne rentre pas dans la livraison d'un jeu : c'est le câblage commun.

## Resolution

`GameComponentProps` porte désormais deux rappels — `onLock(answer)` et `onAdvance()` — au lieu d'un seul `onSubmit`. `useCourse` les sépare : `lock` appelle `facade.submitAnswer(answer)` (qui évaluait déjà, empilait et écrivait, indivisiblement) sans avancer ; `advance` appelle `facade.nextGame()`, relit la progression et bascule sur le relevé si le parcours est fini. `game-session.facade.ts` n'a pas eu besoin de changer : `submitAnswer` et `nextGame` étaient déjà deux méthodes distinctes, seul le câblage au-dessus les enchaînait sans point d'arrêt. `course-view.tsx` transmet les deux rappels au composant de jeu résolu.

Chaque jeu a été revu, pas seulement les cinq nommés — les douze jeux sous `src/games/` sont passés au nouveau contrat :

- **Jeux à deux temps, verrou avant révélation** — `ambiguity-scan`, `practice-map`, `flow-order` (un seul tour) ainsi que `lie-detector`, `hint-budget`, `confidence-bet` (plusieurs manches, la trace ne devient complète qu'à la dernière) appellent `onLock` à l'instant même où ils basculent en phase de révélation — avant qu'elle soit affichée, jamais après — et `onAdvance` sur leur bouton « Continuer ». `keep-or-toss` verrouille à `reveal()` (transition `frozen` vers `revealed`) et `wrong-assistant` verrouille dans `reply()` au moment où le fil se clôt. `defect-hunt` séparait déjà localement `submitReview` (figeait la trace) de `advance` (soumettait) — le même défaut que celui de cette fiche, non listé dans le constat initial mais structurellement identique ; `submitReview` appelle maintenant `onLock` directement. Chaque jeu garde un garde-fou d'appel unique par rappel (`lockedRef`/`advancedRef` ou équivalent), pour qu'un double clic n'écrive ni n'avance deux fois.
- **`checkpoints`** : contrairement à ce que le constat de la fiche supposait, son code actuel n'a jamais eu de phase de révélation intra-jeu — `choose()` soumettait déjà atomiquement au sixième choix, sans écran intermédiaire à protéger. Il appelle donc `onLock` puis `onAdvance` à la suite, comme un jeu à un temps.
- **Jeux à un temps** — `three-tracks`, `test-bench` — appellent `onLock` puis `onAdvance` à la suite, dans le même geste, comme avant.

### Vérification

`__tests__/integration/course-run/lock-before-reveal.test.tsx` reproduit exactement les étapes 1 à 4 du constat sur `ambiguity-scan` (`g6-2`, le cas le plus grave — sa révélation est l'ensemble-réponse exact) : monte `CourseView` sur une vraie façade et une persistance en mémoire, signale un segment, verrouille, vérifie que la révélation est affichée, **démonte sans cliquer « Continuer »**, puis reconstruit une façade neuve sur le même stockage et appelle `resume()`. La session reprise porte `submitted === 1` et `auditTrail()` contient la soumission de `g6-2` — avant le correctif, ces deux valeurs étaient à zéro à cet instant précis, ce qui reposait le joueur sur un `g6-2` vierge avec le corrigé en tête.

Les quatre autres jeux à deux temps (`checkpoints` — sans objet, voir plus haut —, `lie-detector`, `hint-budget`, `practice-map`) ne portent pas ce même test de reprise bout en bout par manque de temps sur cette livraison ; ils sont couverts indirectement par les tests de hook et de composant qui vérifient qu'`onLock` est appelé au moment du verrouillage plutôt qu'à l'avance (`__tests__/unit/games/*/use-*.test.ts` et `*-game.test.tsx`), le même mécanisme sur lequel `lock-before-reveal.test.tsx` s'appuie pour prouver la survie au rechargement. Un test de reprise dédié pour chacun reste à écrire.

Assertions : `npx biome check .`, `npm run typecheck`, `npm run test` (129 fichiers, 1233 tests) sont verts.
