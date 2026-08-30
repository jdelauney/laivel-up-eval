---
status: done
---

# Instruction: L'évaluateur et ses quatre règles

## Architecture projection

> Tree of the final files. ✅ create · ✏️ modify · ❌ delete

```txt
.
├── src/games/
│   ├── defect-hunt/
│   │   └── defect-hunt.evaluator.ts          ✅ le point de contact public avec le port
│   └── register-games.ts                     ✏️ un bloc de plus, rien d autre ne bouge
└── __tests__/unit/games/defect-hunt/
    └── evaluator.test.ts                     ✅
```

## User Journey

```mermaid
flowchart TD
  A[le moteur soumet une réponse, une config et des critères] --> B[la config et la trace passent leurs contrats]
  B --> C[la revue est lue une fois]
  C --> D{le type de chaque règle}
  D -->|net-score-at-least| E[le score net atteint-il le seuil]
  D -->|found-ratio-at-least| F[le ratio atteint-il le seuil]
  D -->|kinds-found-including| G[chaque nature exigée est-elle parmi les trouvées]
  D -->|within-time-budget| H[la durée tient-elle dans le budget déclaré]
  D -->|inconnue| I[le refus nomme la règle et le jeu]
  E --> J[un verdict binaire par critère]
  F --> J
  G --> J
  H --> J
```

## Test Scope

```mermaid
---
title: Test scope
---
journey
  section Setup
    câbler l évaluateur sur une configuration de cinq défauts et un budget de cent quatre-vingts secondes => les quatre règles sont résolubles: 5: api
  section Happy path
    évaluer une revue de cinq défauts sur cinq, une marque à côté, rendue en cent secondes => les quatre critères ressortent satisfaits: 5: api
  section Edge case - le score net pile sur le seuil
    évaluer une revue de cinq bonnes réponses et une mauvaise contre un seuil de quatre => le critère est satisfait, le point négatif se soustrait vraiment: 1: api
  section Edge case - le ratio pile sur le seuil
    évaluer une revue de quatre défauts sur cinq contre un seuil de 0,8 => le critère est satisfait, la borne est incluse: 1: api
  section Edge case - le budget pile épuisé
    évaluer une revue rendue à la seconde exacte du budget => le critère du temps est satisfait, le budget n est pas dépassé: 1: api
  section Edge case - le dépassement
    évaluer une revue rendue une seconde après le budget => seul le critère du temps est manqué, les trois autres gardent leur verdict: 1: api
  section Edge case - la saturation
    évaluer une revue qui marque toutes les lignes de l extrait => la couverture est pleine et le score net s effondre: 1: api
  section Edge case - la nature exigée manquée
    évaluer une revue qui trouve quatre défauts sans la dépendance hallucinée => le critère de nature est manqué alors que le ratio tient: 1: api
  section Edge case - une règle inconnue
    évaluer un critère dont le type n est pas connu du jeu => le refus nomme la règle et le jeu: 1: api
```

## Tasks to do

### `1)` Les quatre règles

> Des règles déclaratives : déplacer un seuil se fait dans le parcours, jamais ici.

1. Créer `defect-hunt.evaluator.ts` **à la racine du dossier du jeu**, jamais sous `actions/` : c'est le point de contact public avec le port `GameEvaluator`.
2. Valider la configuration par son schéma, la trace par `parseDefectHuntTrace`, puis lire la revue **une seule fois** par `readReview`. Les quatre règles lisent la même lecture.
3. `net-score-at-least` — `{ threshold }`, comparaison **inclusive**. Le score net de la revue : un point par ligne fautive marquée, un de moins par ligne saine marquée, rien pour une ligne laissée de côté. Il peut être négatif.
4. `found-ratio-at-least` — `{ threshold }`, comparaison **inclusive**. La story dit « au moins 80 % » : atteindre le seuil suffit, comme les bornes de la grille.

> **Repris le 30/08, après la décision produit.** La règle `false-positives-at-most` a existé et a été retirée. Le barème fait déjà payer chaque marque fausse un point ; un second critère qui les aurait recomptées contre un seuil séparé les aurait punies deux fois pour la même marque. Le garde-fou contre la saturation est désormais le barème lui-même : marquer toutes les lignes de l'extrait rend cinq bonnes réponses et vingt-deux mauvaises. La règle retirée ne survit nulle part — un type déclaratif que plus aucun parcours n'appelle serait du code mort.
5. `kinds-found-including` — `{ kinds: string[] }`, satisfait quand **chaque** nature listée figure parmi les natures trouvées. Un `every`, jamais un `some` : la règle nomme un ensemble d'exigences, pas un choix.
6. `within-time-budget` — **sans seuil**. Elle lit `timeLimitSeconds` de la configuration et vérifie `elapsedSeconds <= timeLimitSeconds`. Documenter pourquoi : un seuil séparé dans la règle permettrait qu'un écran montre trois minutes pendant qu'un critère en note deux, et le jeu mentirait au joueur.
7. Une règle inconnue lève une erreur nommée qui cite la règle et le jeu, sur le modèle de `UnknownRuleError` de `confidence-bet`.
8. Aucun accès au store, aucun effet de bord, aucune connaissance des autres jeux.

### `2)` Le câblage domaine

1. Ajouter le bloc `registry.register('defect-hunt', …)` dans `src/games/register-games.ts`, avec l'évaluateur et les deux schémas.
2. Rien d'autre ne bouge dans ce fichier : c'est le contrat du système de plugins, et il tient à ce qu'un jeu s'ajoute par un bloc.

### `3)` Les tests

1. Un test par règle, satisfaite puis manquée.
2. Verrouiller les deux bornes incluses : le ratio pile sur le seuil, et la revue rendue à la seconde exacte du budget.
3. Verrouiller l'indépendance des critères : une revue rendue en retard garde ses trois autres verdicts inchangés. C'est la décision « le temps coûte un critère, pas la partie », et elle doit casser un test si elle est reprise par accident.
4. Verrouiller le cas discriminant : quatre défauts trouvés sur cinq **sans** la dépendance hallucinée satisfont le ratio et manquent le critère de nature.
5. Vérifier qu'une règle inconnue lève, et que le message nomme la règle et le jeu.

## Test acceptance criteria

| Task | Acceptance criteria |
| --- | --- |
| 1 | Une revue qui trouve exactement 80 % des défauts satisfait le critère de ratio |
| 1 | Cinq bonnes réponses et une mauvaise valent le même score net que quatre bonnes et aucune : le point négatif se soustrait vraiment |
| 1 | Deux marques fausses par-dessus cinq bonnes font manquer le score net, alors que la couverture reste pleine |
| 1 | Une revue qui trouve tous les défauts sauf la dépendance hallucinée manque le critère de nature |
| 1 | Une revue rendue à la seconde exacte du budget satisfait le critère du temps |
| 1 | Une revue rendue une seconde au-delà du budget manque le critère du temps, et lui seul |
| 1 | Le budget noté est celui de la configuration : aucune règle ne porte de seuil de temps |
| 1 | Un type de règle inconnu lève une erreur qui nomme la règle et le jeu |
| 2 | Le registre résout `defect-hunt` vers son évaluateur et ses deux schémas |
| 3 | Une revue qui marque toutes les lignes satisfait le ratio et manque le score net : le barème ferme la saturation à lui seul |
