# Tournée navigateur — `practice-map`

31/08/2026, **quatrième tournée**, après correction d'un défaut mesuré sur la disposition des pôles d'intensité — la mise en page du plan n'a pas été redessinée, seulement mesurée et recalée. Chromium via Playwright (`node` + le paquet `playwright` du projet), sur `npm run dev` (port 5173), aux deux gabarits `1440×900` et `390×844`, session posée directement sur `g2-2` (`groupIndex:1, gameIndex:1`) via `laivel-eval.session`. Le harnais qui a piloté cette tournée est resté hors du dépôt (script jetable, supprimé après capture).

**Les quatre tours, en bref** — chacun a remplacé les captures du précédent, ce fichier ne documente que l'état final :

1. Quatre constats mesurés sur la première livraison : jetons illisibles une fois posés, jetons débordant du cadre, plan minuscule dans une colonne bien plus large, vide excessif sous la consigne.
2. Deux constats chiffrés sur la reprise : les quatre libellés de quadrant débordaient de leur cellule ; le plan restait trop petit.
3. Un changement de conception : les jetons posés deviennent des badges ronds numérotés, la réserve devient une légende permanente à `16rem`.
4. **Ce tour.** Un défaut mesuré sur la disposition des pôles d'intensité, en colonnes latérales dans la rangée du plan : 112px pris sur 265px de colonne, le plan n'en gardait que 145px. Corrigé en déplaçant les pôles sous le plan. La légende à `16rem` est remesurée face à `13rem` pour confirmer le choix.

**Méthode de mesure.** Chaque capture et chaque mesure part de `window.scrollTo(0, 0)`, `window.scrollY` **vérifié explicitement à 0** juste avant — le script lève une erreur s'il ne l'est pas. Toutes les captures sont en page pleine (`fullPage: true`), sauf `*-0-viewport-sans-defilement.png`, explicitement en viewport.

## Le parcours joué

Le corpus réel de `g2-2`, sept pratiques, lu depuis `config/course.json` :

| # | `label` (légende, nom accessible) | `shortLabel` (révélé au focus/à la saisie) |
| --- | --- | --- |
| 1 | Relancer le même prompt quand la réponse ne convient pas | Relance identique |
| 2 | Relire soi-même chaque diff avant de l'accepter | Relire chaque diff |
| 3 | Brancher une boucle qui relance l'agent tant que la commande du projet échoue | Boucle de relance |
| 4 | Écrire le fichier de contexte du dépôt avant la première tâche | Fichier contexte |
| 5 | Confier une tâche floue à un agent en autonomie, pull request comprise | Tâche en autonomie |
| 6 | Écrire la fonction soi-même sans rien demander | Fonction soi-même |
| 7 | Poser un hook qui bloque le commit et rend la main | Hook bloquant |

Les quatre quadrants (`quadrants`, `config/course.json`) : `highRigorLowIntensity` = « Outillé, à la main », `highRigorHighIntensity` = « Outillé, délégué », `lowRigorLowIntensity` = « À la main, sans filet », `lowRigorHighIntensity` = « Délégué, sans filet ».

Sur chaque gabarit : ouverture (légende pleine, rien posé, croix et quadrants visibles) → `2` posé exactement sur le croisement des deux axes → `1` et `3` posés aux extrémités opposées des deux axes (« placement en cours ») → les quatre restants posés (« légende après sept poses ») → soumission (« révélation »).

## Ce qui est capturé

12 fichiers, 6 par gabarit : `{gabarit}-0-ouverture`, `{gabarit}-0-viewport-sans-defilement`, `{gabarit}-1-p2-sur-le-croisement`, `{gabarit}-2-placement-en-cours`, `{gabarit}-3-legende-apres-sept-poses`, `{gabarit}-4-revelation`. Toutes refaites ce tour, aucune reprise d'un tour précédent.

## Point 1 — le plan récupère sa largeur entière ; le côté mesuré aux deux gabarits

**Avant.** Les deux pôles d'intensité occupaient chacun une colonne latérale de `3.5rem` (56px) **dans** la rangée du plan. À eux deux, 112px pris sur les 265px de la colonne de contenu desktop : le plan n'en gardait que 145px, plus étroit que la légende juste à côté — sur le seul écran où le joueur agit. Les quatre quadrants s'y trouvaient réduits à des cellules de 72px.

**Après.** Les pôles d'intensité descendent sous le plan, aux deux extrémités d'une rangée à trois colonnes qui porte aussi la rigueur basse en son centre (`practice-plane.tsx`, commentaire de tête du 31/08). Le plan garde la largeur entière de sa colonne.

Mesuré en DOM, aux deux gabarits, à l'ouverture (plan vide) :

| Gabarit | Côté du plan | Carré ? |
| --- | --- | --- |
| Desktop 1440×900 | 264×264px | oui — largeur = hauteur, exact |
| Mobile 390×844 | 342×342px | oui — largeur = hauteur, exact |

Contre 144×144px (desktop) et 238×238px (mobile) mesurés au tour précédent : le plan gagne 120px de côté sur desktop, 104px sur mobile, sans qu'aucune règle de proportion n'ait changé — `aspect-square` avec `minmax(0, 1fr)` aux deux niveaux de grille, inchangés depuis le deuxième tour, appliqués maintenant à une colonne qui ne perd plus 112px au profit de pôles latéraux.

## Point 2 — la cellule de quadrant grandit ; les quatre noms tiennent sans troncature

Mesure directement demandée par le mandat de ce tour : la cellule de quadrant est la moitié du plan sur chaque axe, puisque la croix tombe à 50/50.

| Gabarit | Largeur d'une cellule de quadrant | Plafond structurel d'un libellé (`calc(50% - 0.5rem)`) | Texte le plus large mesuré | Troncature |
| --- | --- | --- | --- | --- |
| Desktop 1440×900 | 132×132px | 124px | 91.5px (« À la main, sans filet ») | **non** |
| Mobile 390×844 | 171×171px | 163px | 91.5px (« À la main, sans filet ») | **non** |

Vérifié par script, aux deux gabarits, sur les huit combinaisons (quatre libellés × deux gabarits) : `scrollWidth` égal à `clientWidth` pour chacun, aucun `truncate` de Tailwind effectivement déclenché. Contre 112px de cellule au tour précédent, où les mêmes quatre libellés (24 caractères plafonnés par le contrat) se tronquaient visuellement en charabia (« Outillé, à la… », « main, s… ») malgré l'ancrage au coin introduit au tour 2 — l'ancrage bornait la médiane, il ne garantissait pas la lisibilité à une cellule aussi étroite. La cellule n'a pas changé de définition ; c'est le plan entier, remis à sa pleine largeur, qui la fait grandir.

Aucune valeur de `quadrants` dans `config/course.json` n'a été raccourcie pour obtenir ce résultat — les quatre chaînes sont les mêmes qu'au tour précédent.

## Point 3 — le dépassement vertical, mesuré à chaque état, aux deux gabarits

Le plan plus grand pousse la page différemment selon le gabarit : sur desktop, il partage sa rangée avec la légende (`grid-cols-[minmax(0,1fr)_16rem]`, au-dessus du point de rupture `sm:`) ; sur mobile, tout s'empile dans une seule colonne, donc toute hauteur gagnée par le plan s'ajoute directement à la hauteur du document.

| État | Desktop — hauteur document | Desktop — dépassement (fenêtre 900px) | Mobile — hauteur document | Mobile — dépassement (fenêtre 844px) |
| --- | --- | --- | --- | --- |
| Ouverture | 1093px | 193px | 1557px | 713px |
| `p2` sur le croisement | 1093px | 193px | 1557px | 713px |
| Placement en cours (`p1`, `p3` posés) | 1093px | 193px | 1557px | 713px |
| Légende après sept poses | 1108px | 208px | 1557px | 713px |
| Révélation | 1145px | 245px | 1619px | 775px |

Desktop reste proche du chiffre unique relevé au tour précédent (208px, qui correspond exactement à l'état « légende après sept poses » mesuré ici) : le plan et la légende se partagent la même rangée, la croissance du plan ne s'ajoute pas à celle de la légende. Mobile, en revanche, s'aggrave : 713-775px contre 609px au tour précédent, parce que le plan y a grandi de 104px (238px → 342px) sur une mise en page qui empile tout — ce gain de largeur sur le seul écran où le joueur agit se paie en hauteur ajoutée à la page entière.

Le plan lui-même reste dans le premier écran aux deux gabarits (264×264px desktop, 342×342px mobile) ; seule l'action de soumission, plus bas dans le document, est concernée — inchangé depuis les tours précédents.

## Point 4 — la légende à `16rem` remesurée face à `13rem` : reconduite, chiffres à l'appui

Le plan (~264px) et la légende (`16rem` = 256px) sont désormais proches en largeur sur desktop. Rétrécir la légende à `13rem` (208px) donnerait de la largeur au plan ; le mandat de ce tour demandait de mesurer les deux côtés avant de trancher, plutôt que de rouvrir un arbitrage déjà tranché sur une intuition.

Mesuré en DOM, desktop 1440×900 (mobile ne change pas — voir plus bas) :

| Largeur de colonne | Côté du plan | Hauteur de la légende (7 posées) | Hauteur du document (ouverture) | Dépassement (ouverture) |
| --- | --- | --- | --- | --- |
| `16rem` (retenu) | 264×264px | 611px | 1093px | 193px |
| `13rem` (testé, écarté) | 312×312px | 771px | 1268px | 368px |

`13rem` donne un plan plus grand de 48px de côté (+18 %), mais une légende plus haute de 160px (771px contre 611px) — un écart net, pas marginal — qui aggrave le dépassement desktop d'autant (368px contre 193px, +175px). La largeur de plan gagnée ne compense pas une légende qui pousse la page bien plus bas : `16rem` est reconduit, exactement le critère qui avait guidé le choix au tour précédent (l'écart de hauteur commande, il n'est pas faible ici).

**Mobile n'est affecté par aucun des deux réglages.** À 390px de large, le point de rupture `sm:` (640px) n'est jamais atteint : la grille reste `grid-cols-1`, la seconde piste (`16rem` ou `13rem`) ne s'applique jamais. Vérifié : les deux réglages donnent exactement les mêmes mesures mobiles (plan 342×342px, légende 536px, document 1557px à l'ouverture).

## Point 5 — les jetons et la légende, inchangés, revérifiés

Ce tour n'a touché ni les badges ronds numérotés, ni la légende permanente à sept lignes, ni `shortLabel`, ni le nom accessible, ni la croix continue, ni le bornage des badges dans le cadre — le mandat de ce tour était de mesurer la disposition des pôles, pas de retoucher ces points. Revérifié visuellement sur les captures de ce tour (`desktop-2-placement-en-cours.png`, `mobile-3-legende-apres-sept-poses.png`) : les sept badges restent dans le cadre du plan à toute coordonnée, y compris aux extrémités (`1` et `3` posés en coins opposés) ; la légende garde ses sept lignes, marquées posées ou non, une fois toutes les pratiques posées.

## Verdict

**Tenu, mesuré au pixel et en DOM, aux deux gabarits, après quatre tours** : le plan reste carré aux deux gabarits (264×264px desktop, 342×342px mobile) et récupère sa largeur entière ; les quatre libellés de quadrant ne se tronquent plus à aucun gabarit (cellule de 132px desktop, 171px mobile, contre 112px avant ce tour) ; la légende à `16rem` est reconduite après remesure face à `13rem`, l'écart de hauteur (160px) commandant sur le gain de largeur (48px).

**Non tenu, mesuré et assumé par écrit plutôt que caché.** L'action de soumission reste hors du premier écran aux deux gabarits. Desktop reste proche de son chiffre précédent (193-245px selon l'état, contre 208px au tour précédent). Mobile s'aggrave (713-775px selon l'état, contre 609px) : le plan agrandi de 104px pousse d'autant une page qui empile tout en une seule colonne. Défaut de backlog mis à jour avec ces chiffres : `aidd_docs/backlog/defects/practice-map-pousse-la-soumission-hors-de-l-ecran-mobile.md`.

Revalidé après ce quatrième tour : `npm run typecheck` (muet), `npx biome check .`, `npm run test` — sortie complète dans `phase-5.md`.
