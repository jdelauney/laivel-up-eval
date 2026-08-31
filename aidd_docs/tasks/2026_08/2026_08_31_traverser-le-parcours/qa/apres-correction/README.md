# QA navigateur — après correction de l'en-tête

Ces preuves ont été relevées après la correction de
`src/components/layout/app-layout/app-layout.tsx`, qui scinde le bandeau en
deux lignes sous `md` (marque + statut, puis identité + action) et le
recompose en une rangée unique à partir de `md`.

Le dossier parent `qa/` garde les preuves de l'état d'avant. Rien n'y a été
touché.

## Conditions de mesure

- Viewport **nu** de 390x844, sans `isMobile`. Sous émulation téléphone,
  Chrome élargit la fenêtre de mise en page quand le contenu déborde : les
  boîtes mesurées ne sont alors plus dans le repère de l'écran, et le verdict
  est faussé. C'est la leçon de la passe précédente.
- Desktop 1440x900 pour la contre-épreuve.
- Serveur `npm run dev` sur `http://localhost:5178/`.
- Toutes les mesures sont prises page remontée en haut : `getBoundingClientRect`
  et la capture découpée sont tous deux relatifs au viewport.
- L'écran de verdict est atteint par le **chemin de reprise réel** de
  l'application : un instantané complet des 20 soumissions est déposé dans
  `localStorage`, et c'est `facade.resume()` qui ouvre l'écran, comme au retour
  d'un joueur. Jouer les 20 jeux aux 8 interfaces distinctes n'était pas
  praticable dans cette passe. Le verdict rendu est un vrai verdict calculé
  (cf. `05-verdict-390-plein.png`), pas une maquette.

## Ce que chaque preuve établit

| Fichier | Ce qu'il établit | Chiffres |
| --- | --- | --- |
| `01-accueil-390-plein.png` | L'accueil à 390 px n'a pas bougé : aucune identité, aucune action, aucun débordement. | `scrollWidth = 390` pour `innerWidth = 390` |
| `02-accueil-390-en-tete.png` | L'en-tête d'accueil ne porte que la marque, sur une seule ligne. | 1 cellule, `w = 150`, hauteur d'en-tête `53 px` |
| `03-parcours-390-plein.png` | L'écran de parcours à 390 px après une réponse soumise. Plus aucun débordement horizontal. | `scrollWidth = 390` pour `innerWidth = 390` (contre `536` avant correction) |
| `04-parcours-390-en-tete.png` | Le bandeau de parcours sur deux lignes : marque + statut, puis pseudo + action. Le pseudo « Bob QA » est lisible à l'écran. | cellule du pseudo `w = 141`, nœud du pseudo `w = 43` à `x = 24`, non élidé (contre `w = 0` avant correction) |
| `05-verdict-390-plein.png` | L'écran de verdict à 390 px, verdict réellement calculé sur 20 soumissions. Aucun débordement. | `scrollWidth = 390` pour `innerWidth = 390` |
| `06-verdict-390-en-tete.png` | Le bandeau de verdict porte le statut « parcours terminé » et l'action « Effacer ce verdict », avec le pseudo lisible. | cellule du pseudo `w = 186`, non élidé ; action `w = 140` |
| `07-desktop-1440-en-tete.png` | À 1440 px l'en-tête de parcours est redevenu une rangée **unique**, dans l'ordre marque → identité → statut → action. | 4 cellules, bandes verticales `22..42 / 25..41 / 25..41 / 16..48`, recoupement commun ; hauteur d'en-tête `65 px` |
| `08-desktop-1440-parcours.png` | La page de parcours desktop entière, sans débordement. | `scrollWidth = 1440` pour `innerWidth = 1440` |
| `09-desktop-1440-verdict-en-tete.png` | Le verdict desktop garde lui aussi la rangée unique, avec « Effacer ce verdict ». | une seule rangée, hauteur d'en-tête `65 px`, `scrollWidth = 1440 / 1440` |

## Le repli est bien conditionné à la largeur

- 390 px, parcours : hauteur d'en-tête **101 px**, deux bandes disjointes
  (`16..36` et `19..35` pour la première ligne, `52..84` et `61..77` pour la
  seconde). Le bandeau est bien sur deux lignes.
- 390 px, accueil : hauteur d'en-tête **53 px**. Sans identité ni action, le
  séparateur `basis-full` n'est pas rendu et le bandeau reste sur une ligne.
- 1440 px : hauteur d'en-tête **65 px**, séparateur `basis-full` en
  `display: none`. La rangée unique validée à la passe précédente est intacte.

## Balayage de largeurs

Écran de verdict, 14 largeurs de 320 à 1440 px, avec un pseudo court
(« Bob QA ») et un pseudo long (« Jean-Baptiste de la Villemarqué ») :
**28 mesures, 28 fois `scrollWidth === innerWidth`**. Aucune largeur
intermédiaire ne rouvre le débordement, ni juste sous la bascule `md`
(767 px) ni juste au-dessus (768 px).

Cas le plus serré vérifié à part — écran de **parcours** (dont l'action
« Abandonner cette partie » est plus large que « Effacer ce verdict ») à
320 px : `scrollWidth = 320 / 320`, cellule du pseudo `w = 71`.

## Limite connue, hors régression

La classe `truncate` de la cellule d'identité élide un pseudo trop long plutôt
que de le laisser pousser le bandeau. À 390 px sur l'écran de parcours, la
cellule fait 141 px : au-delà d'environ 23 caractères le pseudo s'affiche
tronqué. C'est le comportement voulu de `truncate`, et c'est ce qui garantit
l'absence de débordement — mais la largeur disponible pour l'identité en
mobile reste étroite.

## Erreurs de console

Une seule erreur distincte sur tout le parcours, **préexistante et hors du
diff** :

```
Base UI: A component is changing the uncontrolled value state of RadioGroup
to be controlled.
```

Elle n'apparaît qu'à la phase `parcours-soumission-confidence-bet`, jamais sur
l'accueil, le verdict, ni au rendu de l'en-tête. Elle vient de
`src/games/confidence-bet/components/elements/stake-rule.tsx`, que le diff ne
touche pas (`git status --short src/games/` est vide).

Aucune erreur imputable aux fichiers du diff.
