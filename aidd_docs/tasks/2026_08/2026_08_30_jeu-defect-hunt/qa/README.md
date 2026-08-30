# Tournée navigateur — `defect-hunt`

30/08/2026, Chromium via Playwright, `deviceScaleFactor: 2`, sur `npm run dev`.

La session est posée directement sur la situation `g1-2` en écrivant un instantané dans `laivel-eval.session` puis en rechargeant : jouer les six extraits de `confidence-bet` avant chaque capture n'apprend rien sur cette surface.

## Ce qui est capturé

| Fichier | État |
| --- | --- |
| `desktop-1-avant-marque.png` · `mobile-1-avant-marque.png` | La feuille ouverte, aucune marque, le cadran en cours |
| `desktop-2-en-cours.png` · `mobile-2-en-cours.png` | Cinq lignes marquées — les défauts 2, 10, 11, 16 et une ligne saine — le pied qui suit le compte |
| `desktop-3-focus-clavier.png` · `mobile-3-focus-clavier.png` | Le focus posé sur la feuille, deux flèches plus bas |
| `desktop-4-verdict.png` · `mobile-4-verdict.png` | La revue rendue : les trois verdicts sur la feuille, le score net au pied, les annotations dessous |
| `desktop-5-depassement.png` · `mobile-5-depassement.png` | Le budget épuisé, le cadran en dépassement, la feuille toujours jouable |

## Mesures

Débordement horizontal, `document.documentElement` :

| Gabarit | `scrollWidth` | `clientWidth` | Verdict |
| --- | --- | --- | --- |
| 1440 × 900 | 1440 | 1440 | aucun débordement |
| 390 × 844 | 390 | 390 | aucun débordement |

Le code ne défile jamais horizontalement : une ligne longue se replie. C'est le choix qui ferme le débordement aux deux gabarits, et il est délibéré — ce jeu se perd si un seul caractère de l'extrait est hors de vue.

## Ce que le premier passage a trouvé, et qui est corrigé

1. **Le cadran mentait après le rendu.** Il restait figé sur « 02:59 RESTANT » alors que la partie ne courait plus, et le pied annonçait par ailleurs la durée réelle : deux affirmations contradictoires sur le même fait. Le cadran bascule désormais sur « RENDUE EN », et le pied ne porte plus la durée.
2. **La consigne repoussait la feuille sous la ligne de flottaison.** La copie a été resserrée à 54 caractères de mesure.
3. **L'entête des annotations était à l'étroit** sous son propre filet, moins d'air en dessous qu'au-dessus.

## Ce que la revue indépendante a trouvé ensuite

1. **Le nom accessible d'une ligne masquait le code.** Sur une `option`, `aria-label` remplace le contenu : un lecteur d'écran annonçait « Ligne 3 » sans jamais dire ce qu'elle contenait, ce qui rendait injouable un jeu qui consiste à lire du code. Le libellé porte désormais le code.
2. **Le contour de focus reposait sur le défaut du navigateur.** Il est explicite, à deux pixels sur le jeton du plan.
3. **Le corpus punissait le relecteur exhaustif.** Quatre lignes saines y restaient légitimement signalables, dont `client.release()` — visible marquée « à côté » dans la capture de la première tournée, alors que c'est l'endroit naturel où un relecteur signale la fuite.

## Ce que la seconde revue a trouvé

Le correctif ci-dessus n'avait pas suffi, et l'échec était au même endroit.

Le corpus déclarait alors la fuite sur `client.release` sans parenthèses — marqueur unique dans tout le fichier, donc le garde-fou passait — mais le bloc n'avait **pas de `finally`**. Le correctif complet vivait donc sur deux lignes : les parenthèses, et le `finally` manquant. Pire : `page` vaut `NaN` dès qu'une requête arrive sans `?page`, donc `OFFSET NaN` fait toujours échouer la requête, donc le chemin d'erreur était le chemin par défaut et la ligne du `release` n'était jamais atteinte.

Un relecteur qui diagnostiquait complètement et marquait les deux lignes sortait à `+1 − 1 = 0`. Celui qui n'en voyait que la moitié sortait à `+1`. **Le jeu payait mieux la lecture superficielle.**

L'extrait a été réécrit une troisième fois : le `finally` existe, seules les parenthèses manquent, un contrôle d'autorisation visible ferme la ligne du routeur, et la réponse ne promet plus de pagination.

## Ce que la vérification ciblée a trouvé

La troisième écriture fermait bien la fuite, mais faisait apparaître **la même forme sur l'injection SQL** : lier un paramètre oblige à passer le tableau de valeurs au site d'appel, donc `e4` avait lui aussi deux lieux de correction — la construction de la requête et son appel. Le constat n'avait pas disparu comme classe, il s'était déplacé d'un cran et se trouvait absorbé par un budget à zéro marge.

Une troisième ligne saine défendable a également été signalée : `let client` sans type, implicitement `any`.

Quatrième écriture, et la dernière : la requête et son appel tiennent sur une seule ligne, `let client` est typé. Il ne reste **qu'une** ligne saine défendable — `res.json({ items: rows })`, sans total ni curseur — pour une tolérance de deux. La marge est délibérée, et la liste vit sous le nom `DEBATABLE_LINES` dans le test d'intégration, avec le test du relecteur exhaustif qui casse si elle s'allonge à trois.

Un second test, qui affirmait que le budget n'avait aucune marge, a été retiré : il épinglait une coïncidence de l'écriture d'alors, passait précisément dans le cas où il prétendait alerter, et son commentaire décrivait l'inverse de ce qu'il faisait.

## Ce que la décision produit du 30/08 a changé

Le nombre de défauts **n'est plus annoncé**, et le barème le remplace : un point par ligne fautive marquée, un de moins par ligne saine marquée, rien pour une ligne laissée de côté. Le joueur décide seul quand rendre sa revue.

Les captures de cette page sont celles d'après cette décision. Sur `desktop-1-avant-marque.png`, la tête de feuille ne porte que l'intitulé, la langue et le cadran : aucun compte. Le total n'apparaît qu'au pied, une fois la revue verrouillée — `4 TROUVÉS SUR 5 · 1 MARQUE À CÔTÉ · +3 POINTS`.
