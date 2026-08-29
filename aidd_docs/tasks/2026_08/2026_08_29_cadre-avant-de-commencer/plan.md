---
objective: "L'accueil énonce la durée indicative, le déroulé par groupes et le fait que la mesure porte sur ce qu'on fait, sans énoncer nulle part un critère de notation."
status: reviewed
---

# Plan: Le cadre énoncé avant la première situation

## Overview

| Field      | Value                                                                                                                       |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Goal**   | Ajouter la durée indicative au cadre de l'accueil, calculée depuis le parcours, et prouver par des tests les trois acceptations |
| **Source** | `aidd_docs/backlog/stories/savoir-a-quoi-je-m-engage.md` · `aidd_docs/backlog/epics/onboarding-du-joueur.md` · arbitrage du 29/08 sur le budget de temps |

## Phases

| #   | Phase                              | File                         |
| --- | ---------------------------------- | ---------------------------- |
| 1   | La durée, calculée et énoncée      | [`phase-1.md`](./phase-1.md) |

## Decisions

| Decision                                                                                             | Why                                                                                                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| La durée se calcule depuis le nombre de situations du parcours, jamais écrite en dur dans la vue        | Le parcours bouge encore : le brief annonce quatorze jeux, `config/course.json` en porte vingt. Une durée figée dans le JSX ment au premier jeu ajouté, et personne ne s'en aperçoit puisque rien ne la contredit               |
| Le budget est de 1,5 minute par situation, arrondi au multiple de cinq                                  | Arbitrage du 29/08 : moyenne entre les jeux courts et les jeux à état. L'arrondi empêche l'estimation de se lire comme un chronomètre, ce que le mot « indicative » de l'acceptation exclut                                     |
| Le calcul vit dans un helper de la feature `onboarding`, pas dans le domaine                            | C'est une estimation d'expérience produit, pas une règle de session. Le domaine ne rend aucun verdict à partir du temps, et `courseShape()` fournit déjà ce dont le calcul a besoin                                             |
| La durée s'ajoute au bandeau de chiffres, pas en phrase libre                                           | Le bandeau porte déjà les trois autres grandeurs du cadre. Une quatrième phrase allongerait un écran dont l'acceptation exige des phrases courtes                                                                             |
| L'absence de critère de notation est tenue par un test à vocabulaire explicite                          | C'est une acceptation négative : sans test, elle n'est vérifiée par rien et tombe à la première copie ajoutée. La liste est nommée terme par terme plutôt qu'en motif large, pour qu'un faux échec se corrige en la lisant       |
