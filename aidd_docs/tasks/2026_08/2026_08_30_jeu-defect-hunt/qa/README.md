# Tournée navigateur — `defect-hunt`

30/08/2026, Chromium via Playwright, `deviceScaleFactor: 2`, sur `npm run dev`.

La session est posée directement sur la situation `g1-2` en écrivant un instantané dans `laivel-eval.session` puis en rechargeant : jouer les six extraits de `confidence-bet` avant chaque capture n'apprend rien sur cette surface.

## Ce qui est capturé

| Fichier | État |
| --- | --- |
| `desktop-1-avant-marque.png` · `mobile-1-avant-marque.png` | La feuille ouverte, aucune marque, le cadran en cours |
| `desktop-2-en-cours.png` · `mobile-2-en-cours.png` | Quatre lignes marquées, le pied qui suit le compte |
| `desktop-3-focus-clavier.png` · `mobile-3-focus-clavier.png` | Le focus posé sur la feuille, deux flèches plus bas |
| `desktop-4-verdict.png` · `mobile-4-verdict.png` | La revue rendue : les trois verdicts sur la feuille, les annotations dessous |
| `desktop-5-depassement.png` · `mobile-5-depassement.png` | Le budget épuisé, le cadran en dépassement, la feuille toujours jouable |

## Mesures

Débordement horizontal, `document.documentElement` :

| Gabarit | `scrollWidth` | `clientWidth` | Verdict |
| --- | --- | --- | --- |
| 1440 × 900 | 1440 | 1440 | aucun débordement |
| 390 × 844 | 390 | 390 | aucun débordement |

Le code ne défile jamais horizontalement : une ligne longue se replie. C'est le choix qui ferme le débordement aux deux gabarits, et il est délibéré — ce jeu se perd si un seul caractère de l'extrait est hors de vue.

## Ce que la première tournée a trouvé, et qui est corrigé

1. **Le cadran mentait après le rendu.** Il restait figé sur « 02:59 RESTANT » alors que la partie ne courait plus, et le pied annonçait par ailleurs la durée réelle : deux affirmations contradictoires sur le même fait. Le cadran bascule désormais sur « RENDUE EN », et le pied ne porte plus la durée.
2. **La consigne repoussait la feuille sous la ligne de flottaison.** Huit lignes de texte à 68 caractères de mesure : à 1440 × 900, le joueur ne voyait que le titre et la consigne. La copie a été resserrée à 54 caractères de mesure, et deux formulations qui disaient le barème en ont été retirées — voir la fiche de surface.
3. **L'entête des annotations était à l'étroit** sous son propre filet, moins d'air en dessous qu'au-dessus.

La seconde tournée confirme les trois, et rien d'autre n'a été repris.
