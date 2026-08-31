---
objective: "Un développeur évalué lit son niveau, l'axe qui l'a plafonné, la preuve derrière chaque axe, sa signature dans un bloc séparé, et l'action vérifiable qui le ferait monter — le tout calculé, jamais rédigé."
status: draft
---

# Spec: La restitution du verdict

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Rendre le verdict traçable : le niveau et son plafond, la preuve par axe, la signature séparée, le plan de progression |
| **Source** | `aidd_docs/backlog/stories/lire-mon-niveau-et-l-axe-qui-plafonne.md` · `aidd_docs/backlog/stories/voir-la-preuve-derriere-chaque-axe.md` · `aidd_docs/backlog/stories/lire-ma-signature-a-cote-du-niveau.md` · `aidd_docs/backlog/stories/savoir-quelle-action-me-ferait-monter.md` · `aidd_docs/backlog/epics/restitution-du-verdict.md` |

## Ce que l'écran doit dire

1. **Le niveau**, sous son libellé officiel — ou, quand la grille n'en autorise aucun, la phrase qui le dit et la raison qui l'explique.
2. **L'axe qui plafonne**, nommé, avec ce qu'il aurait fallu atteindre.
3. **Par axe** : le cran atteint, le signal qui l'a fixé, la valeur observée, le seuil franchi et le seuil manqué.
4. **Le statut de mesure de l'axe**, en trois états distincts qui ne se confondent pas visuellement.
5. **La signature**, dans un bloc qui lui est propre, avec la phrase qui dit qu'elle ne déplace aucun niveau.
6. **Le plan** : pour chaque axe qui bloque le cran suivant, l'action manquante et la preuve qui la validerait, lues dans la grille.

## Décisions de contrat

Les trois inconnues laissées ouvertes par l'épique sont tranchées ici. Aucune ne se rediscute pendant l'implémentation.

### D1 — Le statut de mesure devient ternaire, et il est porté par la donnée

`DimensionScore.measured: boolean` devient `DimensionScore.measurement: 'measured' | 'inferred' | 'unmeasured'`.

Le statut se déduit d'un champ déclaré sur le **mapping** d'un critère, pas sur le critère :

```jsonc
{ "dimension": "harness", "weight": 2, "evidence": "inferred" }
```

`evidence` est optionnel et vaut `'measured'` par défaut — les mappings existants restent valides.

| Contributions de l'axe | Statut |
| --- | --- |
| aucune | `unmeasured` |
| au moins une `measured` | `measured` |
| toutes `inferred` | `inferred` |

**Pourquoi sur le mapping et pas sur le critère.** `g2-3-c1` alimente `pilotage-contexte` — c'est le sujet du jeu — **et** `harness`, par ricochet. Le même critère est donc une mesure pour un axe et une inférence pour un autre. Un champ sur le critère ne pourrait pas l'exprimer.

**Règle de déclaration dans `config/course.json`** : un mapping est `inferred` quand le jeu qui le produit lit un **jugement** au lieu d'un **résultat** — c'est-à-dire quand le jeu est un `test-bench`, ou quand le critère vise un axe dont son groupe n'est pas le sujet. Le joueur agit ou il juge ; ce n'est pas la même preuve, et l'écran ne doit pas les confondre.

État attendu après déclaration :

| Axe | Statut | Ce qui le fixe |
| --- | --- | --- |
| `taille` | `inferred` | g5-1, g5-2, g7-4 — tous des bancs ; `scope-break` n'existe pas |
| `harness` | `inferred` | g2-3, g3-*, g6-*, g7-5 — tous des bancs ; `repo-kit` n'existe pas |
| `intervention` | `measured` | g7-1 `checkpoints`, une simulation ; g4-* en renfort inféré |
| `parallele` | `measured` | g7-2 `three-tracks`, une simulation |
| `initiative` | `inferred` | g7-3 seul, un banc ; `task-board` n'existe pas |
| `verification` | `measured` | g1-1, g1-2, g1-3 — trois jeux réels ; g4-* en renfort inféré |
| `pilotage-contexte` | `measured` | g2-1 `hint-budget`, g2-2 `practice-map` ; g2-3 en renfort inféré |
| `resilience` | `inferred` | g3-1 à g3-3 — trois bancs |

**Un axe inféré compte.** Il satisfait les conditions de niveau exactement comme un axe mesuré : c'est une valeur obtenue indirectement, pas une valeur absente. Le refuser mettrait le référentiel hors d'atteinte, puisque trois de ses cinq axes n'ont aujourd'hui aucun jeu dédié. Ce que l'écran doit faire, c'est le **dire** — pas le déguiser en mesure directe, pas le rétrograder en zéro.

**Tension assumée.** `aidd_docs/memory/architecture.md` pose que « le déclaratif ne monte jamais un niveau ». Trois axes du référentiel montent aujourd'hui sur des bancs de jugement. Le statut `inferred` rend cette dette visible à l'écran au lieu de la laisser silencieuse ; il ne la solde pas. Elle se solde en construisant `scope-break`, `repo-kit` et `task-board`.

### D2 — Aucun niveau annonçable est un état, pas un repli

`resolveLevel` cesse de retomber sur le niveau le plus bas quand les conditions de celui-ci ne tiennent pas. Le repli actuel annonce « ❖ White » à un profil qui n'y a pas droit — un mensonge, sur l'écran où le produit tient ou tombe.

`LevelVerdict.level` devient `Level | undefined`. Quand il est absent, `unranked` porte la raison : les conditions non tenues du niveau le plus bas, chacune avec son axe, sa borne exigée, la valeur observée et le statut de mesure.

Deux causes, une seule forme :

- un axe n'a pas été mesuré, donc aucune condition ne peut tenir ;
- le profil tombe dans un creux du référentiel — au-dessus de White sur `taille`, en dessous de Red sur `parallele`.

L'écran nomme la cause avec les mots de la grille. Il n'invente pas de niveau intermédiaire.

### D3 — L'axe qui plafonne est celui qui manque le plus au cran suivant

Le plafond se lit sur les conditions **non tenues du niveau immédiatement au-dessus** de celui atteint.

Ordre : les axes `unmeasured` d'abord — rien ne peut les ouvrir —, puis l'écart décroissant à la borne, puis l'ordre des dimensions dans la grille. Le premier est l'axe qui plafonne ; l'écran le nomme explicitement.

Au sommet du référentiel, il n'y a pas d'axe qui plafonne, et l'écran le dit. Quand aucun niveau n'est annonçable, le plafond se lit sur les conditions du niveau le plus bas.

### D4 — Le texte des actions vit dans la grille, sur la bande qu'il ouvre

`dimensionBandSchema` accueille deux champs optionnels :

```jsonc
{
  "from": 0.75,
  "label": "L — multi-étapes",
  "action": "Livrer une feature qui traverse plusieurs étapes en une seule passe confiée à l'IA.",
  "proof": "Une PR qui touche au moins trois fichiers de couches différentes, mergée sans commit correctif."
}
```

`action` dit ce qu'il faut faire pour **entrer** dans cette bande. `proof` nomme ce qui la validerait. Les deux sont des données : les modifier ne touche pas au code.

Résolution de la bande cible, pour une condition qui bloque :

- borne `min` : la bande la plus basse dont `from >= min` ;
- borne `max` : la bande la plus haute dont `from <= max`.

Une bande sans `action` ne fait pas inventer de texte : l'écran dit que la grille n'en porte pas pour ce cran. Aucun modèle n'est appelé, à aucun moment.

**Contrainte de rédaction des actions dans `config/grid.json`** : chaque action nomme un geste observable. « Poser une boucle de relance sur une commande du projet » passe ; « améliorer son harness » ne passe pas. Chaque `proof` nomme un artefact ou un compteur qu'on peut aller regarder.

### D5 — Le libellé du cran remplace le pourcentage

`DimensionRow` cesse d'afficher `percent` comme l'objet le plus grand de la ligne. Le libellé de la bande prend sa place. La valeur observée reste lisible sous la forme `earned` sur `possible` contributions — un compte, pas un pourcentage.

Aligné sur `aidd_docs/memory/design.md` : « la triade d'état s'accompagne du libellé du cran (« L — multi-étapes », pas 75 %) ». Le commentaire actuel de `dimension-row.tsx` (« le chiffre est l'objet le plus grand de la ligne ») devient faux et se réécrit.

### D6 — Niveau et signature sont deux blocs, jamais deux sections d'une liste

La signature quitte sa position actuelle — coincée entre les axes et les critères, présentée comme une note — et remonte à côté du niveau, dans un bloc qui porte son propre cadre et sa propre phrase : elle éclaire le niveau, elle ne le décide pas.

Sans `config/signature.json`, le bloc n'existe pas et l'écran reste cohérent : le niveau seul, aucune mention d'une lecture absente.

## Contrats touchés

| Fichier | Changement |
| --- | --- |
| `src/core/contracts/course.schema.ts` | `evidence` optionnel sur `criterionMappingSchema` |
| `src/core/contracts/grid.schema.ts` | `action` et `proof` optionnels sur `dimensionBandSchema` |
| `src/core/ports/scoring-strategy.interface.ts` | `measured: boolean` → `measurement: MeasurementStatus` |
| `src/core/session/game-session.facade.ts` | `Verdict` porte la preuve par axe et le plan de progression |

Les quatre extensions de schéma sont **additives** : `config/course.json` et `config/grid.json` restent valides avant d'être enrichis, et une grille tierce sans `action` charge toujours.

## Hors périmètre

- La rédaction du verdict par un modèle. L'assistant narratif viendra par-dessus un texte déjà produit.
- L'export en fichier, qui appartient à l'épique de sauvegarde.
- Le détail attribuable par critère (`aidd_docs/backlog/defects/le-verdict-ne-peut-pas-nommer-le-geste-qui-l-a-manque.md`). La preuve rendue ici s'arrête au critère et à son poids ; nommer « ces trois pratiques-là étaient mal situées » demande d'élargir le port `GameEvaluator`, ce qui touche les huit jeux livrés. Le défaut reste ouvert et n'est pas soldé par cette livraison.
- Tout classement, palmarès ou comparaison à d'autres joueurs.

## Acceptance consolidée

| # | Vérifiable |
| --- | --- |
| A1 | Un profil qui atteint un niveau lit son libellé officiel |
| A2 | Un profil qui n'atteint aucun niveau lit la phrase qui le dit et la raison qui l'explique, jamais « White » par défaut |
| A3 | L'axe qui plafonne est nommé, avec la borne qu'il aurait fallu atteindre |
| A4 | Chaque axe affiche son cran, le signal qui l'a fixé, la valeur observée, le seuil franchi et le seuil manqué |
| A5 | Un axe inféré porte une marque distincte de celle d'un axe mesuré |
| A6 | Un axe non mesuré le dit en toutes lettres et n'affiche aucun chiffre bas |
| A7 | Aucun pourcentage d'axe n'apparaît à l'écran |
| A8 | Niveau et signature sont deux blocs distincts, et l'écran écrit que la signature ne déplace aucun niveau |
| A9 | Sans fichier de signature, l'écran rend le niveau seul, sans mention d'une lecture absente |
| A10 | Chaque axe qui bloque le cran suivant porte une action et la preuve qui la validerait |
| A11 | Le texte des actions provient de `config/grid.json` : le changer dans le JSON change l'écran, sans toucher au code |
| A12 | Aucun appel réseau, aucun modèle, aucune horloge dans la chaîne qui produit ce texte |
