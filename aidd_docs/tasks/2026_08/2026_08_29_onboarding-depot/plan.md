---
objective: "L'accueil montre le parcours au repos, accepte un dépôt facultatif, et prévient pendant la partie quand ce dépôt n'est pas lisible."
status: pending
---

# Plan: Le dépôt entre dans l'onboarding

## Overview

| Field      | Value                   |
| ---------- | ----------------------- |
| **Goal**   | Corriger la rampe au repos, saisir un dépôt facultatif, et sonder sa lisibilité pendant le parcours. |
| **Source** | `aidd_docs/backlog/defects/l-accueil-marque-le-premier-groupe-comme-courant.md`, `aidd_docs/backlog/stories/saisir-son-identite-et-son-depot.md`, `aidd_docs/backlog/stories/savoir-en-jouant-que-mon-depot-est-illisible.md`, `aidd_docs/backlog/spikes/preuves-du-depot-calculables-sans-jeton.md` |

La lecture complète des preuves du dépôt est hors de ce lot. Elle attend deux décisions produit ouvertes dans `aidd_docs/backlog/epics/preuves-du-depot-git.md` : la fenêtre d'analyse retenue, et le sort d'un dépôt dépassant le plafond de requêtes.

## Phases

| #   | Phase        | File                         |
| --- | ------------ | ---------------------------- |
| 1   | La rampe au repos | [`phase-1.md`](./phase-1.md) |
| 2   | Le dépôt saisi et retenu | [`phase-2.md`](./phase-2.md) |
| 3   | La sonde de lisibilité | [`phase-3.md`](./phase-3.md) |

## Resources

| Source | Verified          |
| ------ | ----------------- |
| `GET https://api.github.com/rate_limit` | Sans jeton, `core` plafonne à 60 requêtes par heure et par IP ; `graphql` est à 0, donc fermé. |
| `GET https://api.github.com/repos/{owner}/{repo}` avec en-tête `Origin` tiers | `Access-Control-Allow-Origin: *`. L'appel part du navigateur, aucun relais à monter. |
| `GET https://api.github.com/repos/` sur un nom inventé, puis sur un dépôt privé | Les deux rendent `404` avec le même corps. La cause n'est pas nommable sans jeton. |
| https://docs.github.com/en/rest/commits/commits | `409 Conflict` est documenté sur la liste des commits, sans cause précisée. Hors de ce lot, retenu pour la suite. |

## Decisions

| Decision   | Why   |
| ---------- | ----- |
| La référence de dépôt a un contrat unique dans `core/contracts/`, réutilisé par le formulaire | Le projet interdit deux définitions de validation pour une même donnée. Le formulaire et le snapshot doivent lire la même règle, sinon une partie reprise peut porter une référence que la saisie aurait refusée. |
| `repository` est facultatif dans le snapshot de session | Toute partie enregistrée avant ce lot n'en a pas. Un champ requis les rendrait toutes irrécupérables au clic sur « Reprendre ». |
| La sonde passe par un port et un adapter, comme l'horloge et la persistance | C'est le premier appel réseau de l'application. Le poser hors du domaine garde `core/` pur et rend la sonde substituable en test sans toucher au réseau. |
| La sonde part une fois par session, jamais au montage d'un composant | Le budget est de 60 requêtes par heure et par IP. Une sonde qui repart à chaque rendu épuiserait le quota du joueur avant même la lecture des preuves. |
