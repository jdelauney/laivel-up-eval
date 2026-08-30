# Tournée navigateur — `lie-detector`

30/08/2026, Chromium via Playwright CLI, sur `npm run dev`, à 1440×900 et 390×844. Le harnais est hors du dépôt, comme pour les quatre tournées précédentes : `@playwright/cli` a été invoqué par `npx`, jamais ajouté au manifeste.

**Repère de mesure.** Chaque capture et chaque mesure de cette page part de `window.scrollTo(0, 0)`, explicitement exécuté juste avant, et `window.scrollY` est vérifié à `0` avant toute lecture de position. Une première passe de cette tournée a rapporté des chiffres `r2` faux — contaminés par le défilement que Playwright applique automatiquement pour amener un bouton hors cadre (« Je maintiens », « Manche suivante ») dans la zone cliquable avant de cliquer ; ce défilement reste ensuite en l'état, l'application étant une SPA qui ne se recharge jamais entre deux manches. La revue l'a détecté et l'a chiffré avec précision (~269px), avant toute autre vérification. Le détail est au point 1.

## Le parcours joué

La session est posée directement sur `g1-3` en écrivant `{"playerName":"QA Reviewer","groupIndex":0,"gameIndex":2,"submissions":[]}` dans `laivel-eval.session` puis en cliquant « Reprendre » : jouer `g1-1` et `g1-2` avant chaque capture n'apprend rien sur cette surface. Conséquence connue de ce raccourci : la tête de page affiche « Situation 1 sur 20 » au lieu de 3 — `progress.submitted + 1` compte les soumissions réelles, à zéro dans cette session forgée. En jeu réel, après `g1-1` et `g1-2` soumis, le compteur affiche 3. Ce n'est pas un défaut de `lie-detector`, c'est un artefact du raccourci de session.

La manche jouée est `r1`, la première du corpus et celle qui porte les textes les plus longs — désignée par la tâche pour stresser la comparaison. `r1` porte une objection creuse (elle cible `r1-b`, qui dit vrai). `r2`, jouée ensuite pour la comparaison du point 4 et pour vérifier le correctif du point 1, porte l'unique objection fondée du corpus (elle cible `r2-b`, la menteuse).

## Ce qui est capturé

Toutes les images ci-dessous sont de la passe finale, au même repère (`scrollY = 0`), sur le code après les deux correctifs de cette page.

| Fichier | État |
| --- | --- |
| `desktop-1-r1-avant-designation.png` · `mobile-1-r1-avant-designation.png` | La manche `r1` ouverte, aucune désignation, le verrou annoncé |
| `desktop-2-r1-objection.png` · `mobile-2-r1-objection.png` | Une désignation posée, l'objection creuse de `r1` rendue |
| `desktop-3-r1-revelation.png` · `mobile-3-r1-revelation.png` | La révélation de `r1` : quatre vérifications dépliées |
| `desktop-4-r2-objection-fondee-full.png` | L'objection fondée de `r2`, page pleine, pour comparaison avec `r1` |
| `desktop-5-r2-consigne-repliee.png` | `r2` sur desktop : la consigne repliée derrière « Revoir la consigne » |
| `mobile-4-r2-scrolly0-debordement-confirme.png` | `r2` sur mobile, à `scrollY = 0`, **avant** le second correctif : la quatrième carte et le verrou sont hors cadre — la preuve que la revue avait raison |
| `mobile-5-r2-scrolly0-corrige.png` | `r2` sur mobile, à `scrollY = 0`, **après** le second correctif : les quatre cartes et le verrou tiennent sous 844 |
| `mobile-6-r2-consigne-depliee.png` | Le repli rouvert d'un tap, à `scrollY = 0` : le texte complet reste disponible |

## Point 1 — les quatre affirmations se comparent-elles sans défilement ?

### Ce que la première passe a rapporté, et pourquoi c'était faux

La première mesure de `r2` « après correctif » donnait les quatre cartes entre 191px et 768px, sous 844 — un succès en apparence. La revue a contesté ce chiffre : les captures `r2` ne portaient plus le chrome du parcours (bannière, rampe de groupe, « Situation 1 sur 20 », titre) visible sur les captures `r1`, alors que `course-view.tsx:16` est une grille nue, sans `overflow` ni conteneur de défilement propre au jeu — ce chrome vit dans le même flux de document, présent à `scrollY = 0` à toutes les manches.

Vérifié : la mesure `r2` avait été prise après une séquence de clics (désigner → « Je maintiens » → « Manche suivante ») dont les deux derniers boutons sont hors cadre. Playwright fait défiler la page jusqu'au bouton avant de cliquer dessus (comportement par défaut, pas une action explicite de ma part) ; ce défilement — mesuré à `window.scrollY = 268` juste avant la mesure contestée — n'est jamais réinitialisé, l'application ne rechargeant jamais la page entre deux manches. Les coordonnées `getBoundingClientRect().top` que j'avais prises sont relatives au viewport **courant**, pas au document : sous ce défilement de 268px, elles sous-estimaient la position réelle de chaque carte d'exactement ce montant.

Remises dans le repère réel (`scrollY = 0`, chrome inclus) : les quatre cartes de `r2` tombaient à 459 / 604 / 748 / 892, le verrou à 1035 — la quatrième carte et le verrou hors cadre de 844. **La revue avait raison, chiffres bruts confirmés à l'unité près de son estimation (~269px).** Capture : `mobile-4-r2-scrolly0-debordement-confirme.png`.

### Le premier correctif (consigne repliée) restait donc insuffisant sur mobile

Il retirait 205px de consigne répétée, mais le chrome du parcours (285px : bannière + rampe + « Situation X sur Y » + titre) et le contenu propre au jeu sous ce chrome (consigne repliée, numéro de manche, en-tête de la feuille, quatre cartes, verrou) ne tenaient toujours pas sous 844 une fois mesurés depuis le vrai sommet du document.

### Le second correctif : la carte d'affirmation resserrée sur mobile

Le chrome du parcours n'appartient pas à ce jeu — `course-view.tsx` n'a pas été touché. Ce qui lui appartient, la feuille de manche et sa carte, a été resserré, uniquement sous `sm` (640px), desktop inchangé à l'octet près (vérifié : cartes desktop toujours entre 484 et 817 sur 900, aucune régression) :

- `claim-card.tsx` : `p-4` → `p-2`, `gap-4` → `gap-1`, `mt-3` → `mt-1` sur la ligne d'état, `leading-relaxed` → `leading-snug` sur le texte de l'affirmation — toujours `sm:p-4 sm:gap-4 sm:mt-3 sm:leading-relaxed` au-delà de 640px.
- `round-sheet.tsx` : l'en-tête de la feuille (`py-3` → `py-2`) et le bandeau de verrou (`py-2.5` → `py-1.5`) suivent le même schéma responsive.
- `lie-detector-game.tsx` : l'espacement vertical entre les blocs du jeu (`gap-6` → `gap-3`) suit le même schéma.

### Mesure finale, `r2`, mobile, `scrollY = 0`

| Élément | `top` | `bottom` |
| --- | --- | --- |
| Carte 1 | 417 | 514 |
| Carte 2 | 515 | 611 |
| Carte 3 | 612 | 709 |
| Carte 4 | 710 | 807 |
| Verrou de désignation | 807 | 835 |

Budget : 844px. Le verrou se termine à 835 — **9px de marge, sans défilement, à `scrollY = 0` vérifié.** Aucun débordement horizontal (`scrollWidth` 390 / `clientWidth` 390). Capture : `mobile-5-r2-scrolly0-corrige.png`. `r3` et `r4` n'ont pas été mesurées individuellement : leurs affirmations sont de longueur comparable ou inférieure à `r2` (corpus vérifié en phase 4, aucune n'approche celle de `r1`), donc à l'intérieur du même budget.

`r1`, mesurée dans le même repère : cartes à 606 / 703 / 801 / 899, verrou à 996–1024 — toujours hors cadre, l'exception assumée et documentée où la consigne complète reste due (voir plus bas). Le resserrement de la carte lui profite aussi (606 contre 648 avant, -42px), mais ne suffit pas à compenser la consigne intégrale : ce n'est pas son rôle, cette manche n'est pas dans le périmètre de l'objectif mesurable.

Revalidé après le second correctif : `npm run lint` (181 fichiers, aucun problème), `npm run typecheck` (muet), `npm run test` (65 fichiers, 564 tests, aucune régression).

## Point 2 — le passage désigner → objection → révélation

Se sent comme une réponse qui arrive, pas comme un écran qui se recharge. `objection-note.tsx:19` et `claim-card.tsx:96` animent l'entrée de l'objection et des vérifications (`fade-in slide-in-from-bottom-1`, 500 ms, `ease-out`) : le contenu nouveau glisse et apparaît localement, la feuille ne se recharge jamais, l'URL ne change pas, aucun flash blanc entre les trois temps. Vérifié en rejouant la manche `r1` de bout en bout et `r2` jusqu'à la révélation, aux deux gabarits.

## Point 3 — l'action de passage reste-t-elle atteignable sans défiler à la révélation ?

**Non, aux deux gabarits, mesuré à `scrollY = 0` — et ce n'est pas propre à ce jeu.** À la révélation de `r1` (la manche la plus longue) :

- Desktop : `document.documentElement.scrollHeight` = 1283 contre un `clientHeight` de 900 — 383px de dépassement. Cette mesure ne dépend pas de la position de défilement (`scrollHeight` porte sur le document entier), donc non affectée par l'erreur ci-dessus.
- Mobile, remesuré à `scrollY = 0` après les deux correctifs (le chiffre initial de 185px était lui aussi contaminé par le même défilement résiduel que le point 1, dans le même sens — sous-estimé) : le bouton « Manche suivante » est à `top: 1441px`, `scrollHeight` 1521 contre un `clientHeight` de 844 — **597px de dépassement**, pas 185.

Le même schéma existe déjà, non corrigé, dans `defect-hunt-game.tsx:90-114` : la liste `revelations.map(...)` se déplie intégralement avant le bouton « Situation suivante », sans mécanisme de rattrapage, et sa propre tournée QA ne l'a pas relevé comme défaut. Décision du chef de produit : défaut transverse aux deux jeux, suivi séparément (`aidd_docs/backlog/defects/la-revelation-pousse-l-action-hors-de-l-ecran.md`), non traité dans cette tournée.

## Point 4 — rien ne laisse deviner qu'une objection est fondée ou creuse

Confirmé. `desktop-2-r1-objection.png` (objection creuse, cible `r1-b` qui dit vrai) et `desktop-4-r2-objection-fondee-full.png` (objection fondée, cible `r2-b`, la menteuse) rendent le même bloc à l'identique : même étiquette « L'ASSISTANT », même fond, même typographie, même structure de phrase (« Je pense que c'est celle sur ... qui ment. »), aucune icône ni ton différencié. Tient par construction — `objection-note.tsx:18` ne reçoit que `argument`, jamais la nature — et la tournée le confirme au rendu réel plutôt que par lecture de code seule.

En bonus, la révélation porte l'état de chaque affirmation par un signe et un mot (`DISAIT VRAI`, `A MENTI`, `· LA VÔTRE`), jamais par la seule couleur — visible sur `desktop-3-r1-revelation.png` et `mobile-3-r1-revelation.png`.

## Ordre de parcours au clavier

Non rejoué en simulation de touches, mais vérifié structurellement : l'ordre DOM des quatre boutons de carte (`main button` sur la manche `r1`) est `r1-a, r1-b, r1-c, r1-d` — l'ordre de lecture — et ni `round-sheet.tsx` ni `claim-card.tsx` ne posent de `tabindex` ou d'`order` CSS qui le contredirait. La grille CSS (`grid-cols-1 sm:grid-cols-2`) ne réordonne jamais le flux du document, seulement sa position visuelle.

## Verdict

**Deux correctifs pour le point 1** (consigne repliée dès la deuxième manche, puis carte d'affirmation resserrée sur mobile) **après qu'une première mesure erronée a été contestée par la revue et confirmée fausse une fois vérifiée à `scrollY = 0`.** `r2`, `r3`, `r4` tiennent désormais les quatre affirmations et le verrou de désignation sous 844px sans défilement, marge de 9px vérifiée sur `r2` ; `r1` reste l'exception assumée où la consigne complète est due.

**Point 3, non corrigé, par décision** : défaut identique dans `defect-hunt`, transverse, suivi séparément — remesuré à `scrollY = 0` cette fois (597px de dépassement mobile, pas les 185 rapportés en premier lieu, l'écart venant de la même contamination de défilement, sans en changer la conclusion : ce point reste hors cadre, aux deux gabarits).

Point 2 (le battement des trois temps) et point 4 (l'objection ne se trahit pas) : confirmés conformes, rien à corriger. Aucun débordement horizontal aux deux gabarits, à aucun des temps de la manche.
