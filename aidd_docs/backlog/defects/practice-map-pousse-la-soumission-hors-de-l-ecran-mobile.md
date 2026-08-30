---
type: defect
status: ready
related_to:
  - aidd_docs/backlog/epics/parcours-couvrant-les-axes.md
  - aidd_docs/backlog/defects/la-revelation-pousse-l-action-hors-de-l-ecran.md
order: 6
---

# Defect: `practice-map` pousse l'action de soumission hors de l'écran, aux deux gabarits

## Context

`practice-map` (`g2-2`), `src/games/practice-map/components/composites/practice-map-game.tsx`. L'écran empile une consigne, l'annonce de position, le plan carré et sa réserve (devenue légende permanente au troisième tour de la passe de surface), puis l'action « Soumettre la lecture ».

Relevé pendant la tournée navigateur de la phase 5, tour après tour, dernière mesure dans `aidd_docs/tasks/2026_08/2026_08_30_jeu-practice-map/qa/README.md`, « Point 3 », aux deux gabarits, en pages pleines mesurées à `scrollY = 0` vérifié.

**Titre inchangé depuis sa création, portée élargie.** Ce ticket ne couvrait à l'origine que le gabarit mobile — desktop tenait sans défilement aux deux premiers tours de la passe. Le troisième tour a changé cela : voir « Ce qui a changé au troisième tour » ci-dessous. Le quatrième tour (31/08), qui a corrigé un défaut de largeur sur le plan sans toucher à la légende, a aggravé le dépassement mobile en le mesurant à nouveau : voir « Ce qui a changé au quatrième tour ».

## Ce que ce défaut n'est pas

`aidd_docs/backlog/defects/la-revelation-pousse-l-action-hors-de-l-ecran.md` couvre l'**état de révélation** de `lie-detector` et `defect-hunt`. Ici, c'est la **phase de pose** qui pousse la soumission hors de l'écran.

## Expected

`DESIGN.md`, section « La surface d'un jeu » : « Un relevé qui s'allonge ne pousse jamais la décision courante hors de l'écran. » L'action de soumission reste atteignable sans défiler, ou l'écart est mesuré et nommé.

## Actual

Mesuré sur le corpus réel de `g2-2`, page pleine, `scrollY = 0` vérifié, à l'état final du troisième tour (réserve devenue légende permanente, sept lignes toujours affichées, plan encore réduit par les pôles en colonnes latérales) :

| Gabarit | Hauteur du document | Hauteur de viewport | Dépassement |
| --- | --- | --- | --- |
| Desktop 1440×900 | 1108px | 900px | **208px** |
| Mobile 390×844 | 1453px | 844px | **609px** |

Le plan lui-même restait dans le premier écran aux deux gabarits (144×144px sur desktop, 238×238px sur mobile) ; seule l'action de soumission, plus bas dans le document, était concernée.

**Remesuré au quatrième tour (31/08), après correction de la largeur du plan** — détail complet dans `qa/README.md`, Points 1 à 3 de ce tour, à chacun des cinq états de la partie :

| Gabarit | État | Hauteur du document | Hauteur de viewport | Dépassement |
| --- | --- | --- | --- | --- |
| Desktop 1440×900 | Ouverture / croisement / placement en cours | 1093px | 900px | 193px |
| Desktop 1440×900 | Légende après sept poses | 1108px | 900px | 208px |
| Desktop 1440×900 | Révélation | 1145px | 900px | 245px |
| Mobile 390×844 | Ouverture / croisement / placement en cours / légende après sept poses | 1557px | 844px | 713px |
| Mobile 390×844 | Révélation | 1619px | 844px | 775px |

Le plan mesure maintenant 264×264px sur desktop, 342×342px sur mobile — toujours entièrement dans le premier écran aux deux gabarits ; seule l'action de soumission reste concernée.

## Ce qui a changé au troisième tour

Aux deux premiers tours, seul mobile dépassait (328px réserve pleine, 123px réserve vide dans la mesure du deuxième tour), et la cause dominante était la coquille du produit partagée par les vingt jeux (jusqu'à 285px) et la consigne du corpus réel de `g2-2` (234px) — desktop tenait sans défilement aux deux états.

Au troisième tour, un changement de conception décidé par le chef transforme la réserve en **légende permanente** : les sept pratiques restent toujours listées, posées ou non, parce qu'un jeton posé sur le plan n'affiche plus qu'un numéro et que le joueur doit pouvoir résoudre ce numéro à tout instant. Le plafonnement-repli à trois entrées visibles, qui neutralisait jusque-là le risque de hauteur, est retiré dans le même mouvement — une décision assumée, documentée dans `qa/README.md` et la fiche de surface, pas un oubli. Sept lignes pleines, chacune sur deux à quatre lignes de texte, ajoutent à elles seules plusieurs centaines de pixels : **desktop dépasse désormais aussi**, du jamais-vu dans cette phase jusqu'ici, et le dépassement mobile est passé de 328px à 609px.

## Ce qui a changé au quatrième tour

Le quatrième tour (31/08) a corrigé un défaut distinct, mesuré sur la disposition du plan lui-même : les deux pôles d'intensité, en colonnes latérales de `3.5rem` dans la rangée du plan, prenaient 112px sur les 265px de la colonne de contenu desktop, ne laissant que 145px au plan. Corrigé en déplaçant ces pôles sous le plan, qui récupère sa largeur entière — voir la fiche de surface, point 8, et `qa/README.md`, Points 1 et 2 de ce tour.

**Cette correction n'a pas touché à la légende ni à son plafonnement**, mais elle a un effet de bord mesuré sur ce défaut précisément : le plan, plus grand de 104px sur mobile (238px → 342px), pousse d'autant une page qui empile tout en une seule colonne. Le dépassement mobile passe de 609px à 713-775px selon l'état. Desktop, où le plan partage sa rangée avec la légende plutôt que de s'empiler avec elle, n'hérite pas de ce coût : 193-245px selon l'état, proche du chiffre unique précédent (208px). L'arbitrage `16rem` contre `13rem` pour la colonne de la légende a été remesuré à cette occasion et reconduit en faveur de `16rem` — voir `qa/README.md`, Point 4 de ce tour : `13rem` aggrave le dépassement desktop de 175px pour un gain de 48px de côté sur le plan, sans aucun effet sur mobile (le point de rupture `sm:` n'y est jamais atteint).

## Reproduction

1. Ouvrir le parcours, atteindre le groupe « Pilotage du contexte », `g2-2`.
2. Chercher le bouton « Soumettre la lecture » sans faire défiler, à l'ouverture comme après avoir posé les sept pratiques — absent aux deux gabarits.

## Impact

Un joueur doit désormais faire défiler pour agir, aux deux gabarits, même une fois sa lecture complète. Le geste que `g2-2-c1` et `g2-2-c3` observent (la position finale soumise) n'est jamais empêché — le joueur peut toujours atteindre le bouton en défilant — mais l'écran ne tient pas la promesse de `DESIGN.md` sur ce point précis.

## Ce que la correction ne doit pas être

Un raccourci propre à ce seul jeu (bouton flottant, barre d'action collante) qui introduirait un motif d'interface que le reste du parcours ne porte pas — vingt jeux, vingt surfaces, mais pas vingt motifs de secours. Replier de nouveau la légende romprait aussi la décision du troisième tour : la friction qu'elle a supprimée (résoudre un numéro qu'on a sous les yeux) reviendrait.

## Ce qui borne la correction

La colonne de la réserve a déjà été élargie de `11rem` à `16rem` pendant la passe pour réduire la hauteur de la légende (~930px à ~600px sur desktop, mesuré) — un compromis testé, `14rem` donnant un résultat pire (731px) par l'effet non linéaire du nombre de mots par ligne. Remesuré au quatrième tour face à `13rem`, une fois le plan rendu à sa pleine largeur : `13rem` donne un plan plus grand (312px contre 264px) mais une légende plus haute de 160px (771px contre 611px), aggravant le dépassement desktop de 175px sans le moindre effet sur mobile (`sm:` n'y est jamais atteint) — `16rem` reste la meilleure mesure trouvée. Trois pistes de correction réelle, aucune dans le périmètre d'une passe de surface propre à un seul jeu :

- **Raccourcir la consigne du corpus réel de `g2-2`** — contenu de phase 4, hors mandat d'une passe de surface.
- **Alléger la coquille du produit** partagée par les vingt jeux (`course-view.tsx`, `group-rail`) — hors du périmètre d'un seul jeu.
- **Revoir la densité de la légende elle-même** (par exemple des libellés plus courts dans la réserve, ou une mise en page à deux colonnes pour les sept lignes) — reste dans le périmètre de `practice-map`, mais n'a pas été tenté dans le temps imparti à ce troisième tour.

## Evidence

- `aidd_docs/tasks/2026_08/2026_08_30_jeu-practice-map/qa/README.md` — mesures et captures en page pleine, aux deux gabarits, état final de la passe.
- `.impeccable/surfaces/ce-map-components-composites-practice-map-game-tsx.md` — le constat consigné dans la fiche de surface, section « Ce que ce choix coûte ».
