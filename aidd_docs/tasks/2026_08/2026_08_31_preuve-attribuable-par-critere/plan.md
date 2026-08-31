---
objective: "Un critère manqué nomme ce qui l'a manqué — « ces trois pratiques-là ne sont pas là où elles se tiennent » — au lieu de rendre un booléen et de jeter le détail qui l'explique."
status: implemented
---

# Plan: La preuve attribuable par critère

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Fermer le défaut : le port rend, par critère, le détail que le jeu a déjà calculé |
| **Source** | `aidd_docs/backlog/defects/le-verdict-ne-peut-pas-nommer-le-geste-qui-l-a-manque.md` |
| **Suit** | `aidd_docs/tasks/2026_08/2026_08_31_restitution-du-verdict/` — la restitution est en place, elle n'a rien à afficher de plus fin que la question du critère |

## Phases

| # | Phase | File |
| --- | --- | --- |
| 1 | Le port porte le détail, et il traverse jusqu'à l'écran | [`phase-1.md`](./phase-1.md) |
| 2 | Les sept autres jeux cessent de jeter ce qu'ils savent | [`phase-2.md`](./phase-2.md) |

## Decisions

| Decision | Why |
| --- | --- |
| **Un champ optionnel de détail attribuable sur `CriterionResult`**, pas un rejeu de la trace d'audit à travers le helper de chaque jeu | Le défaut pose les deux pistes. La seconde préserve le port mais oblige la restitution à connaître le helper de lecture de chaque jeu : un couplage qui grossit à chaque jeu ajouté, dans un système dont l'argument est qu'on ajoute un jeu avec un dossier et deux blocs de registre. La première garde un contrat unique, reste facultative jeu par jeu, et chaque évaluateur a déjà le détail sous la main au moment où il le jette |
| **Le champ s'appelle `attributions`, pas `evidence`** | `evidence` est déjà pris deux fois dans ce domaine : sur `CriterionMapping` il vaut `measured`/`inferred`, et `proof` sur une bande de la grille nomme ce qui validerait une action. Un troisième sens du même mot rendrait les trois illisibles |
| **Une attribution porte un libellé destiné au joueur, jamais un identifiant technique** | « ces trois pratiques-là » suppose de les nommer. `p3`, `g7-1-c2` ou `step-4` ne disent rien à personne. L'évaluateur a la config sous la main : c'est lui qui résout le libellé, une fois |
| **Le champ est optionnel et le reste** | Huit jeux existent, trois autres arrivent. Un champ requis obligerait chaque évaluateur à inventer un détail même quand son critère est réellement binaire. L'absence de détail est un cas nominal, pas un trou |
| **Le contrat d'instantané l'accepte, optionnel lui aussi** | `SubmitAnswerCommand` persiste les résultats. Sans extension du schéma, une partie reprise perdrait le détail et l'écran de verdict deviendrait plus pauvre après un rechargement qu'avant — exactement le genre d'incohérence que la story de reprise a coûté cher à fermer. Optionnel parce qu'une partie enregistrée avant ce champ n'en porte pas, et qu'un instantané hors contrat est ignoré en silence |
| **Le détail s'affiche là où le joueur conteste** : sous le signal nommé d'un axe, et sous le critère dans la trace | Ce sont les deux endroits où une question apparaît. Ailleurs, c'est du bruit |

## Validation

`npm run typecheck`, `npm run test`, `biome check`. Aucune phase close sur du rouge.
