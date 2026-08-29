# QA navigateur — le jeu `three-tracks`

Relevé sur la branche `feat/mener-plusieurs-chantiers-de-front`, contre `npm run dev`, dans Chromium, à 1440×900 et 390×844. Cinquième passe, datée du 30/08.

Le harnais est volontairement hors du dépôt : la suite Playwright du projet n'existe toujours pas, elle est suivie par [amorcer-la-suite-playwright-declaree.md](../../../../backlog/tasks/amorcer-la-suite-playwright-declaree.md). Ce qui est versionné ici, ce sont les preuves, pas le moyen de les reproduire. Le pilote de cette passe a été monté à la racine du dépôt puis supprimé une fois les six captures produites.

Les six captures ci-dessous sont **la seule version à faire foi** : elles remplacent celles des quatre passes précédentes, dont l'historique reste ci-dessous pour mémoire.

## Ce que cette passe corrige

Le chef de projet a regardé les captures de la passe précédente et signalé un défaut mobile : à 390 px, les quatre colonnes fixes du tableau retenu par la passe précédente ne laissent plus que ~60 px à chacune. « La migration de la base » tombe sur quatre lignes, son brief sur six. Aucun débordement, mais illisible — un défaut de lisibilité, pas de structure : le tableau restait un tableau correct, juste trop comprimé pour un petit gabarit.

Le remède retenu : **sous `md`, le tableau cède la place à une liste de blocs empilés**, un chantier par bloc, dans l'ordre libellé + mention d'état, brief, avancement, puis les trois pastilles de choix. Au-dessus de `md`, rien ne change — le tableau à quatre colonnes fixes de la passe précédente reste identique, largeurs comprises.

Un tableau ne s'empile pas sans cesser d'en être un : forcer `display: block` sur ses `tr`/`td` casse la sémantique de ligne et de cellule pour les lecteurs d'écran, qui n'en retiennent plus que du texte plat. La liste de blocs est donc une structure distincte, pas le même tableau restylé — et jamais rendue en même temps que le tableau : le choix entre les deux passe par un hook React qui lit la largeur de fenêtre réelle (`useIsNarrowViewport`), pas par du CSS qui rendrait les deux arbres et en masquerait un. Un lecteur d'écran ne reçoit donc jamais le registre en double.

Chaque bloc mobile porte ses propres libellés (Description, Avancement, la fraction du tour et le mot Attention) puisqu'il n'y a plus d'en-tête de colonne partagé pour les porter à sa place — c'est le même texte que celui du tableau, relogé à côté de son contenu. Le nom accessible d'un bloc est calculé exactement comme celui d'une tête de ligne du tableau : le libellé et la mention d'état, jamais le brief, qui reste dans sa propre cellule de texte, atteignable en navigation.

Aucun de ces changements ne touche à la mécanique, à l'évaluateur, aux schémas de réponse ni au barème : la trace soumise ne change pas d'un octet. La consigne, son champ de configuration et son texte ne changent pas non plus.

## Le parcours joué

Accueil, nom saisi (**Alice**), quinze fois « Valider » (les jeux `test-bench`), six fois un bouton « Laisser passer… » (le jeu `checkpoints`), puis le jeu. La partie capturée ne place **aucune unité** : c'est la voie qui traverse les trois états d'une ligne en quatre tours, en clôturant le tour sans rien poser.

| Tour | Ce que l'écran montre |
| --- | --- |
| 1 | La consigne (avec la phrase sur le geste), quatre chantiers ouverts, l'attention entière à placer ; sur mobile, quatre blocs empilés, chacun ouvert sur `1/7 · Attention` |
| 3 | Les quatre chantiers en dérive, filet pointillé et mention `DÉRIVE` — sur la ligne du tableau comme dans le libellé du bloc |
| 5 | Les quatre chantiers perdus, filet creusé et mention `PERDU`, choix barré d'un simple filet, la ligne de position dit qu'aucune unité ne peut être placée |

C'est la preuve de l'acceptance de la story : **la dérive est visible avant la mort**, portée par le filet et la mention du libellé, jamais par un seuil énoncé à l'écran — aux deux gabarits.

## Ce que les captures établissent

| Capture | Ce qu'elle prouve |
| --- | --- |
| `desktop-tour-1.png` | Identique aux passes précédentes : le tableau à quatre colonnes fixes (Chantier, Description, `1/7 · Attention`, Avancement) n'a pas bougé. Aucun chantier n'est mis en avant : même poids, même filet, même surface |
| `mobile-tour-1.png` | Sous `md`, une liste de quatre blocs empilés remplace le tableau. Chaque bloc porte, dans l'ordre, le libellé, sa `DESCRIPTION` (le brief, en entier, jamais tronqué), son `AVANCEMENT` (la jauge à crans), puis `1/7 · ATTENTION` et les trois pastilles. Aucun débordement horizontal malgré un libellé de 24 caractères |
| `desktop-tour-3.png` · `mobile-tour-3.png` | L'état `DÉRIVE` se lit sans la couleur, aux deux gabarits : filet pointillé (ligne de tableau ou bordure de bloc) et mention en petites capitales à côté du libellé |
| `desktop-tour-5.png` · `mobile-tour-5.png` | L'état `PERDU` garde un filet, donc deux positions perdues consécutives restent séparées. La zone de choix d'une position hors jeu est barrée sans texte répété, aux deux gabarits. La ligne de position dit « aucune unité ne peut être placée » au lieu d'annoncer un nombre faux |

## Largeurs et débordement

Aucun débordement horizontal, à aucun des deux gabarits ni à aucun des trois tours : `scrollWidth` égale `clientWidth` partout, avant comme après le changement de structure sous `md`.

| Tour | 1440×900 | 390×844 |
| --- | --- | --- |
| 1 | `scrollWidth` 1440 / `clientWidth` 1440 | `scrollWidth` 390 / `clientWidth` 390 |
| 3 | `scrollWidth` 1440 / `clientWidth` 1440 | `scrollWidth` 390 / `clientWidth` 390 |
| 5 | `scrollWidth` 1440 / `clientWidth` 1440 | `scrollWidth` 390 / `clientWidth` 390 |

Sur desktop, `table-layout: fixed` donne toujours à « Chantier » et « Avancement » une largeur mesurée sur leur contenu le moins compressible, « Description » absorbe le reste — inchangé depuis la passe précédente.

Sur mobile, il n'y a plus de colonnes à répartir : chaque bloc prend toute la largeur disponible, son contenu texte (libellé, brief) se replie sur autant de lignes que nécessaire, sans jamais forcer un débordement latéral.

### Le brief hors du nom accessible, aux deux gabarits

Nom accessible de la première tête de ligne (desktop) et du premier bloc (mobile), lu depuis `aria-labelledby`/le contenu du `th scope="row"` — jamais depuis un `aria-label` posé à la main :

| Tour | Nom accessible (desktop, `th scope="row"`) | Nom accessible (mobile, premier `<li>`) |
| --- | --- | --- |
| 1 | `La migration de la base` | `La migration de la base` |
| 3 | `La migration de la base DÉRIVE` | `La migration de la base DÉRIVE` |
| 5 | `La migration de la base PERDU` | `La migration de la base PERDU` |

Le brief (« Le schéma passe en deux temps, sans coupure de service. ») n'apparaît dans aucun des deux noms, aux trois tours. Il reste lisible dans sa propre cellule (desktop) ou son propre paragraphe (`DESCRIPTION`, mobile), atteignable en navigation cellule par cellule ou séquentielle.

## Ce qui reste non vérifié

Aucune capture entre 390 et 1440 : les largeurs intermédiaires n'ont pas été inspectées, y compris la largeur exacte à laquelle la structure bascule (`md`, 768 px, non testée directement — seulement 390 et 1440, de part et d'autre). La colonne/le champ d'avancement est dimensionné sur les chantiers déclarés dans `course.json` aujourd'hui (six crans au plus) ; un chantier notablement plus long n'a pas été vérifié.

## Historique des passes précédentes

- **29/08, première passe.** Cinq défauts trouvés en navigateur, absents de la couverture Vitest : le brief d'un chantier n'était affiché nulle part, les pastilles débordaient de leur colonne sur écran large, la ligne de position annonçait des unités à placer sans qu'aucun chantier ne puisse en recevoir, une ligne de chantier perdu perdait tout filet, et l'en-tête de colonne repliée occupait trois lignes sur mobile. Toutes corrigées ; les six captures de l'époque sont remplacées par celles de la passe suivante.
- **29/08, deuxième passe.** Revue du barème de notation (poids des merges) et de l'accessibilité de la tête de ligne (nom accessible court, `aria-hidden` du filet décoratif). Deux captures desktop (`tour-3`, `tour-5`) remplacées pour vérifier visuellement les correctifs.
- **29/08, troisième passe.** Consigne ajoutée, chiffre visible sur chaque pastille, préfixe `T` sur les en-têtes de tour, colonne « Description » dédiée et repliée sous `md`, texte `sr-only` répété retiré des cellules barrées. Six captures remplacées. C'est cette structure — une colonne par tour, repliée sous `md` — qu'une passe suivante a abandonnée : elle a produit deux fois le même défaut (brief invisible sur mobile) et un troisième (colonnes de texte affamées sur desktop).
- **30/08, quatrième passe.** Passage à quatre colonnes fixes et définitives (Chantier, Description, choix du tour, Avancement), aucune ne se repliant plus jamais. Réglait les trois défauts de la passe précédente, mais comprimait chaque colonne à ~60 px sous 390 px : lisible sans déborder, mais à la limite. Six captures remplacées. C'est cette compression que la présente passe corrige, en gardant le tableau intact au-dessus de `md`.
