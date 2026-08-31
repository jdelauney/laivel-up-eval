# Preuves navigateur — déroulé du parcours

Vérification indépendante des trois stories de la tâche, dans Chromium, contre
`npm run dev` (port 5178). Pilotage Playwright hors dépôt (`E:/tmp/qa-traverser/run.mjs`),
29 vérifications sur 33 passées. Le journal complet des assertions et leurs valeurs
mesurées sont dans `E:/tmp/qa-traverser/run.log` et `findings.json`.

Le parcours joué est le vrai : nom saisi à l'accueil, six extraits de
`confidence-bet` engagés un par un jusqu'à la soumission de la situation 1.
Aucun état n'a été injecté dans `localStorage`.

## Ce que chaque capture établit

| Fichier | Ce qu'elle prouve |
| --- | --- |
| `01-accueil-desktop.png` | L'accueil d'un joueur sans partie enregistrée. Il ne porte aucune action « Abandonner cette partie » : il n'y a rien à abandonner avant d'avoir commencé. |
| `02-desktop-situation-1-avant-soumission.png` | La situation 1 sur 20 s'ouvre après le démarrage. Le refus de retour est rendu entre l'en-tête de situation et la surface du jeu. |
| `03-desktop-rampe-verticale-anneau.png` | En 1440×900 la rampe est verticale (sept onglets alignés en x=296, y croissants), l'onglet courant porte son anneau — et lui seul —, et les libellés visibles sont là. |
| `04-desktop-refus-retour-inerte-apres-clic.png` | État de l'écran après un clic souris réel au centre du contrôle « Revenir en arrière ». La situation reste « Situation 1 sur 20 » et le compteur « 0/20 situations » : le contrôle est inerte, pas seulement grisé. |
| `05-desktop-situation-2-AVANT-rechargement.png` | Après soumission : situation 2 sur 20, compteur 1/20, jeu « Combien d'erreurs voyez-vous ? », pseudo « Alice QA » dans l'en-tête. C'est l'état de référence du rechargement. |
| `06-desktop-situation-2-APRES-rechargement.png` | Le même écran après `reload()`. Le parcours se rouvre directement sur la situation courante, sans passer par l'accueil : même situation, même jeu, même compteur, même pseudo. |
| `07-desktop-dialogue-abandon.png` | « Abandonner cette partie » ouvre un dialogue qui chiffre ce qu'il détruit, avec « Annuler » et « Effacer ». |
| `08-desktop-partie-intacte-apres-annulation.png` | Après « Annuler » : situation 2 sur 20 et compteur 1/20 inchangés. L'annulation ne détruit rien. |
| `09-desktop-accueil-apres-confirmation.png` | Après « Effacer » : retour à l'accueil, `localStorage` vide (0 clé). |
| `10-desktop-accueil-apres-rechargement-post-abandon.png` | Un rechargement après confirmation reste sur l'accueil : la partie effacée ne revient pas. |
| `11-mobile-accueil.png` | L'accueil en 390×844. Rampe horizontale, aucune action d'abandon, pas de débordement horizontal. |
| `12-mobile-parcours-rampe-horizontale.png` | Le parcours en 390×844. La rampe est en rangée au-dessus du contenu (bas de rampe à 141 px, titre du jeu à 205 px), le bloc de libellé visible tombe, le refus de retour reste rendu. |
| `13-mobile-rampe-horizontale-detail.png` | Détail de la rampe mobile : sept onglets alignés sur la même ligne (y=133), x croissants 24→287, l'onglet courant plein et cerclé, les suivants en filet pointillé. |
| `14-mobile-en-tete-deborde.png` | **Défaut.** L'en-tête du parcours en 390 px : le pseudo n'apparaît pas et « Abandonner cette partie » est tranché par le bord de la fenêtre. |
| `15-mobile-emulation-telephone-parcours-dezoome.png` | **Défaut.** Le même écran sous émulation téléphone : Chrome élargit la fenêtre de mise en page à 536 px pour absorber le débordement, et tout le texte du parcours rétrécit d'un quart. |
| `rampe-mobile.aria.txt` | L'arbre d'accessibilité de la rampe, relevé en 390×844 : chaque `listitem` porte son nom complet — libellé, étendue, état. C'est la preuve demandée par le rôle, pas par une classe CSS. |

## Défauts que ces preuves établissent

1. **L'en-tête du parcours déborde en 390 px.** `document.documentElement.scrollWidth`
   vaut 536 pour une fenêtre de 390. Le seul responsable est le bouton
   « Abandonner cette partie » : masqué en JavaScript, la largeur du document
   revient à 390. L'accueil, qui ne porte pas ce bouton, ne déborde pas.
   Voir `14-…` et `15-…`.
2. **Le pseudo est invisible sur mobile.** Dans la même barre, la cellule
   d'identité est comprimée à 0 px de large — présente dans le DOM, illisible à
   l'écran. Les trois autres cellules sont `shrink-0` et ne cèdent rien.

## Ce qui n'est pas couvert ici

Le changement de groupe et le jeu inconnu du registre — deux cas que la phase 3
énonce — ne sont pas rejoués en navigateur : ils demandent de soumettre trois
situations enchaînées. Ils sont couverts par `__tests__/unit/features/group-navigation/course-view.test.tsx`.
