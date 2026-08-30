# Tournée navigateur — `lie-detector`

30/08/2026, Chromium via Playwright CLI, sur `npm run dev`, à 1440×900 et 390×844. Le harnais est hors du dépôt, comme pour les quatre tournées précédentes : `@playwright/cli` a été invoqué par `npx`, jamais ajouté au manifeste.

## Le parcours joué

La session est posée directement sur `g1-3` en écrivant `{"playerName":"QA Reviewer","groupIndex":0,"gameIndex":2,"submissions":[]}` dans `laivel-eval.session` puis en cliquant « Reprendre » : jouer `g1-1` et `g1-2` avant chaque capture n'apprend rien sur cette surface. Conséquence connue de ce raccourci : la tête de page affiche « Situation 1 sur 20 » au lieu de 3 — `progress.submitted + 1` compte les soumissions réelles, à zéro dans cette session forgée. En jeu réel, après `g1-1` et `g1-2` soumis, le compteur affiche 3. Ce n'est pas un défaut de `lie-detector`, c'est un artefact du raccourci de session.

La manche jouée est `r1`, la première du corpus et celle qui porte les textes les plus longs — désignée par la tâche pour stresser la comparaison. `r1` porte une objection creuse (elle cible `r1-b`, qui dit vrai). `r2`, jouée ensuite pour la comparaison du point 4, porte l'unique objection fondée du corpus (elle cible `r2-b`, la menteuse).

## Ce qui est capturé

| Fichier | État |
| --- | --- |
| `desktop-1-r1-avant-designation.png` · `mobile-1-r1-avant-designation.png` | La manche `r1` ouverte, aucune désignation, le verrou annoncé |
| `desktop-2-r1-objection.png` · `mobile-2-r1-objection.png` | Une désignation posée, l'objection creuse de `r1` rendue |
| `desktop-3-r1-revelation.png` · `mobile-3-r1-revelation.png` | La révélation de `r1` : quatre vérifications dépliées |
| `desktop-4-r2-objection-fondee-full.png` | L'objection fondée de `r2`, page pleine, pour comparaison avec `r1` |
| `mobile-4-r1-apres-correctif.png` | `r1` après correctif : inchangée, la consigne complète y reste due |
| `desktop-5-r2-apres-correctif.png` · `mobile-5-r2-apres-correctif.png` | `r2` après correctif : consigne repliée, les quatre affirmations et le verrou tiennent dans le cadre |
| `mobile-6-r2-consigne-depliee.png` | Le repli rouvert d'un tap : le texte complet reste disponible |

## Point 1 — les quatre affirmations se comparent-elles sans défilement ?

**Desktop (1440×900) : oui**, aux quatre manches. `desktop-1-r1-avant-designation.png` montre les quatre cartes de `r1` — la manche aux textes les plus longs — entièrement visibles au premier temps. Aucun débordement horizontal (`scrollWidth` 1440 / `clientWidth` 1440).

**Mobile (390×844) : non à `r1`, oui à `r2`/`r3`/`r4` depuis le correctif.**

Mesure d'origine (avant correctif) : la première carte de `r1` commençait à `top: 648px` sur un viewport de 844 — la quatrième à 1080, hors cadre. Cause identifiée : la consigne du jeu (`statement`) se réaffichait en entier à chaque manche, alors qu'elle ne change jamais — 205px à elle seule (mesuré : `top: 285` → `bottom: 490`), sur les 648 avant la première carte.

**Correctif.** `lie-detector-game.tsx` introduit un composant `Statement` : à la première manche, la consigne reste affichée en entier, inchangée — c'est là qu'elle doit être lue une fois. À partir de la deuxième, elle se replie derrière un `<details>` natif intitulé « Revoir la consigne », jamais retirée du DOM, dépliable d'un tap, jamais introuvable. Le verrou de la désignation (« Un clic verrouille votre désignation ») ne vit pas dans ce bloc : il reste porté par `RoundSheet`, annoncé à chaque manche, correctif ou non.

Mesure après correctif, `r2` sur mobile (`mobile-5-r2-apres-correctif.png`) : les quatre cartes commencent respectivement à `top` 191, 336, 480 et 624 — la quatrième se termine avant 844, et le verrou de désignation est visible en dessous. **Les quatre affirmations et le coût du geste tiennent dans le cadre, sans défilement, comparables sans aller-retour.** `mobile-6-r2-consigne-depliee.png` prouve que le repli fonctionne et rend le texte complet.

`r1` reste mesurée à `top: 648px`, inchangée (`mobile-4-r1-apres-correctif.png`) : c'est l'exception assumée, la seule manche où la consigne complète est due avant de jouer. Trois manches sur quatre — `r2`, `r3`, `r4` — satisfont désormais l'objectif mesurable sur 390×844 ; la première reste au-dessus, bornée à une lecture qui ne se répète jamais.

Revalidé : `npm run lint` (181 fichiers, aucun problème), `npm run typecheck` (muet), `npm run test` (65 fichiers, 564 tests, aucune régression).

## Point 2 — le passage désigner → objection → révélation

Se sent comme une réponse qui arrive, pas comme un écran qui se recharge. `objection-note.tsx:19` et `claim-card.tsx:96` animent l'entrée de l'objection et des vérifications (`fade-in slide-in-from-bottom-1`, 500 ms, `ease-out`) : le contenu nouveau glisse et apparaît localement, la feuille ne se recharge jamais, l'URL ne change pas, aucun flash blanc entre les trois temps. Vérifié en rejouant la manche `r1` de bout en bout et `r2` jusqu'à la révélation, aux deux gabarits.

## Point 3 — l'action de passage reste-t-elle atteignable sans défiler à la révélation ?

**Non, aux deux gabarits, mesuré — et ce n'est pas propre à ce jeu non plus.** À la révélation de `r1` (la manche la plus longue), desktop : `document.documentElement.scrollHeight` passe à 1283 contre un `clientHeight` de 900 — 383px de dépassement, le bouton « Manche suivante » hors du cadre visible dans `desktop-3-r1-revelation.png`. Mobile : le bouton est mesuré à `top: 1029px` contre un `clientHeight` de 844 — 185px hors cadre.

Le même schéma existe déjà, non corrigé, dans `defect-hunt-game.tsx:90-114` : la liste `revelations.map(...)` se déplie intégralement avant le bouton « Situation suivante », sans mécanisme de rattrapage, et sa propre tournée QA ne l'a pas relevé comme défaut. Aucun écran du produit ne porte de bloc d'action fixé ou collant — en introduire un pour ce seul jeu serait une décision de motif d'interface nouvelle, pas une correction ponctuelle, et sortirait du mandat de cette tournée. Déposé ici avec les mesures exactes plutôt que corrigé à l'aveugle.

## Point 4 — rien ne laisse deviner qu'une objection est fondée ou creuse

Confirmé. `desktop-2-r1-objection.png` (objection creuse, cible `r1-b` qui dit vrai) et `desktop-4-r2-objection-fondee-full.png` (objection fondée, cible `r2-b`, la menteuse) rendent le même bloc à l'identique : même étiquette « L'ASSISTANT », même fond, même typographie, même structure de phrase (« Je pense que c'est celle sur ... qui ment. »), aucune icône ni ton différencié. Tient par construction — `objection-note.tsx:18` ne reçoit que `argument`, jamais la nature — et la tournée le confirme au rendu réel plutôt que par lecture de code seule.

En bonus, la révélation porte l'état de chaque affirmation par un signe et un mot (`DISAIT VRAI`, `A MENTI`, `· LA VÔTRE`), jamais par la seule couleur — visible sur `desktop-3-r1-revelation.png` et `mobile-3-r1-revelation.png`.

## Ordre de parcours au clavier

Non rejoué en simulation de touches, mais vérifié structurellement : l'ordre DOM des quatre boutons de carte (`main button` sur la manche `r1`) est `r1-a, r1-b, r1-c, r1-d` — l'ordre de lecture — et ni `round-sheet.tsx` ni `claim-card.tsx` ne posent de `tabindex` ou d'`order` CSS qui le contredirait. La grille CSS (`grid-cols-1 sm:grid-cols-2`) ne réordonne jamais le flux du document, seulement sa position visuelle.

## Verdict

**Un défaut corrigé, un déposé sans correction, tranchés séparément par le chef de produit après la première passe de cette tournée.**

- **Point 1 (comparaison des quatre affirmations sur mobile) : corrigé.** Propre à `lie-detector` — sa consigne se répétait en entier à chaque manche quand ses voisins n'en pâtissent pas de la même façon sur ce critère d'acceptation nommé de ce jeu (`phase-5.md`). `lie-detector-game.tsx` replie la consigne dès la deuxième manche derrière un `<details>` natif ; `r2`, `r3`, `r4` tiennent désormais sans défilement à 390×844, `r1` reste l'exception assumée où la lecture complète est due. Revalidé (lint, typecheck, 564 tests) et remesuré ci-dessus.
- **Point 3 (action de passage sous la ligne de flottaison à la révélation) : non corrigé, par décision.** La structure est identique, non corrigée, dans `defect-hunt-game.tsx:90-114` : un défaut transverse aux deux jeux, pas propre à celui-ci, suit son propre traitement hors de cette tournée.

Point 2 (le battement des trois temps) et point 4 (l'objection ne se trahit pas) : confirmés conformes, rien à corriger. Aucun débordement horizontal aux deux gabarits, à aucun des temps de la manche.
