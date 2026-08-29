# QA navigateur — le jeu `three-tracks`

Relevé le 29/08 sur la branche `feat/mener-plusieurs-chantiers-de-front`, contre `npm run dev` sur `http://localhost:5173`, dans Chromium, à 1440×900 et 390×844.

Le harnais est volontairement hors du dépôt : la suite Playwright du projet n'existe toujours pas, elle est suivie par [amorcer-la-suite-playwright-declaree.md](../../../../backlog/tasks/amorcer-la-suite-playwright-declaree.md). Ce qui est versionné ici, ce sont les preuves, pas le moyen de les reproduire.

## Pourquoi cette passe existe

Le jeu a été construit et validé sous Vitest et Testing Library, qui n'ont ni moteur de rendu ni requêtes média. Cinq défauts n'étaient visibles que dans un vrai navigateur, dont un qui vidait le jeu de sa substance : **le `brief` de chaque chantier, déclaré dans `course.json`, n'était affiché nulle part**. Le joueur voyait quatre noms nus et n'avait aucune matière pour arbitrer entre eux.

Les quatre autres : les pastilles d'attention débordaient de leur colonne sur écran large, la ligne de position annonçait des unités à placer alors que plus aucun chantier ne pouvait en recevoir, une ligne de chantier perdu perdait tout filet et se collait à sa voisine, et l'en-tête de la colonne repliée occupait trois lignes sur mobile au-dessus de cellules vides.

Les six captures ci-dessous sont postérieures à la correction.

## Le parcours joué

Accueil, nom saisi, puis les seize situations qui précèdent, puis le jeu. La partie capturée ne place **aucune unité** : c'est la voie qui traverse les trois états d'une ligne en quatre tours.

| Tour | Ce que l'écran montre |
| --- | --- |
| 1 | Quatre chantiers ouverts, l'attention entière à placer, la colonne du tour seule ouverte |
| 3 | Les quatre chantiers en dérive, filet pointillé et mention `DÉRIVE`, deux colonnes de points derrière |
| 5 | Les quatre chantiers perdus, filet creusé et mention `PERDU`, cellules à venir barrées |

C'est la preuve de l'acceptance de la story : **la dérive est visible avant la mort**, et elle se lit sur la suite de points que le joueur a lui-même laissée s'allonger.

## Ce que les captures établissent

| Capture | Ce qu'elle prouve |
| --- | --- |
| `desktop-tour-1.png` · `mobile-tour-1.png` | Le brief de chaque chantier est lisible sous son libellé. Les trois pastilles tiennent sur une ligne aux deux largeurs. Aucun chantier n'est mis en avant : même poids, même filet, même surface |
| `desktop-tour-3.png` · `mobile-tour-3.png` | L'état `DÉRIVE` se lit sans la couleur : filet de ligne pointillé et mention en petites capitales. Les tours écoulés portent un point médian pour chaque tour sans attention |
| `desktop-tour-5.png` · `mobile-tour-5.png` | L'état `PERDU` garde un filet, donc deux lignes perdues consécutives restent séparées. La ligne de position dit « aucune unité ne peut être placée » au lieu d'annoncer un nombre faux |

## Repli et débordement

Aucun débordement horizontal à aucun des deux gabarits ni à aucun des trois tours : `scrollWidth` est égal à `clientWidth`, mesuré à 1440 et à 390.

Sous `md`, le registre replie ses colonnes sur les trois derniers tours écoulés plus la colonne ouverte, précédés d'un en-tête compact `1 TOUR PLUS ANCIEN`. La colonne d'avancement quitte sa colonne dédiée et passe sous le libellé du chantier. C'est le nombre de colonnes qui tombe, jamais leur lisibilité.

## Ce qui reste non vérifié

Aucune capture entre 390 et 1440. Le repli bascule à la borne `md` de Tailwind ; les largeurs intermédiaires n'ont pas été inspectées.
