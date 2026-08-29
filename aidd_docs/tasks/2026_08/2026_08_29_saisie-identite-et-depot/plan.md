---
objective: "Le joueur se nomme et désigne un dépôt facultatif sous une forme normalisée, sans qu'aucun réseau soit sollicité, et la saisie reste lisible du premier écran au verdict."
status: in-progress
---

# Plan: La saisie d'identité et de dépôt à l'entrée du parcours

## Overview

| Field      | Value                                                                                                                                                          |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Goal**   | Ajouter le dépôt à l'accueil, normalisé vers `proprietaire/depot`, persisté avec la session et visible pendant toute la partie                                    |
| **Source** | `aidd_docs/backlog/stories/saisir-son-identite-et-son-depot.md` · `aidd_docs/backlog/epics/onboarding-du-joueur.md` · `aidd_docs/backlog/spikes/preuves-du-depot-calculables-sans-jeton.md` |

## Phases

| #   | Phase                                | File                         |
| --- | ------------------------------------ | ---------------------------- |
| 1   | Le contrat du dépôt désigné          | [`phase-1.md`](./phase-1.md) |
| 2   | Le dépôt traverse la session         | [`phase-2.md`](./phase-2.md) |
| 3   | La saisie à l'accueil                | [`phase-3.md`](./phase-3.md) |
| 4   | La saisie visible pendant la partie  | [`phase-4.md`](./phase-4.md) |

## Resources

| Source                                                                                       | Verified                                                                                                                             |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| https://github.com/tanstack/form/blob/main/docs/framework/react/guides/submission-handling.md | TanStack Form passe **l'entrée brute** à `onSubmit`, jamais la sortie transformée du schéma. Pour obtenir le slug normalisé, il faut re-parser la valeur avec le schéma dans `onSubmit`. |

## Decisions

| Decision                                                                                                                | Why                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| La normalisation du dépôt vit dans un contrat de `core/contracts/`, pas dans le schéma du formulaire                      | Le slug est persisté dans l'instantané de session et sera relu par l'Epic des preuves du dépôt. Le poser dans `features/onboarding/` obligerait le domaine à importer une feature, à contresens du sens des dépendances |
| Le formulaire valide avec le schéma et re-parse la valeur à la soumission pour obtenir le slug                            | Vérifié dans la doc TanStack Form : `onSubmit` reçoit l'entrée, pas la sortie. Sans ce second parse, l'URL complète serait persistée telle quelle et l'acceptation « retient la seconde forme » tomberait               |
| `repository` est **optionnel** dans `sessionSnapshotSchema`                                                              | Une partie enregistrée avant ce lot n'a pas le champ. Le rendre requis ferait échouer `safeParse`, et la façade ignore silencieusement un instantané hors contrat : toutes les parties en cours disparaîtraient        |
| Seule la racine du dépôt est acceptée en URL, avec tolérance du `.git` final et du slash final                            | `https://github.com/o/d/pull/3` désigne une PR, pas un dépôt. L'accepter demanderait de deviner l'intention ; le refus nomme la forme attendue et laisse le joueur trancher                                            |
| On valide la **forme**, jamais l'existence ni les règles de nommage exactes de GitHub                                     | La story interdit toute confrontation réseau ici. Reproduire les règles de nommage de GitHub en dur les figerait à la date du lot sans rien garantir de plus                                                          |
| Le dépôt n'entre dans aucun calcul de score, et un test le prouve                                                        | « Rien de ce qui est saisi ici n'entre dans un score » est une acceptation négative : sans test dédié, elle ne serait vérifiée par rien et se perdrait au premier lot suivant                                          |
| La lisibilité du dépôt n'est pas vérifiée dans ce lot                                                                    | C'est le sujet entier de `savoir-en-jouant-que-mon-depot-est-illisible.md`, et l'acceptation exige ici que l'entrée dans le parcours n'attende aucun réseau                                                           |
