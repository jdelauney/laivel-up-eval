---
objective: "Un catalogue de signaux entièrement déclaré en JSON alimente les cinq axes depuis un faisceau de preuves normalisé, et les quatre profils de calibration retombent sur leur niveau attendu."
status: pending
---

# Plan: Catalogue de signaux et mapping des axes

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Lire un dossier de preuves, en tirer un score et un statut de mesure par axe, sans qu'un seuil vive dans le code |
| **Source** | `aidd_docs/BRIEF.md` §3, §3.1, §4, §5, §8 · `aidd_docs/TECHNICAL.md` §5 · `E:\IA-PULSE\hackaton\ressources\laivel-up-main` (`levels/aidd.md`, `profiles/`) |
| **Socle** | Domaine, jeux, infrastructure, frontend et `composition-root.ts` en place et verts : 123 tests sur 19 fichiers. `config/` porte `grid.json`, `course.json`, `signature.json` — le catalogue les rejoint |

## Phases

| # | Phase | File |
| --- | --- | --- |
| 1 | Les contrats : faisceau de preuves et catalogue | [`phase-1.md`](./phase-1.md) |
| 2 | Les règles de lecture et le catalogue JSON | [`phase-2.md`](./phase-2.md) |
| 3 | L'adapter dossier et le scoring par axe | [`phase-3.md`](./phase-3.md) |
| 4 | Le banc de calibration | [`phase-4.md`](./phase-4.md) |

## Resources

| Source | Verified |
| --- | --- |
| `laivel-up-main/levels/aidd.md` | Sept niveaux portant un `rank` 0→6, quatre axes, règle du minimum |
| `laivel-up-main/profiles/README.md` | Les trous sont dissymétriques d'un profil à l'autre, et la trace de l'outil n'est pas rangée au même endroit |
| `laivel-up-main/profiles/*/git-activity.json` | Les quatre axes officiels sont lisibles sans reconstruction |
| `laivel-up-main/profiles/leodagan/.claude/` | Un hook `PostToolUse` qui sort en `exit 2` est un garde-fou, pas une boucle |

## Decisions

| Decision | Why |
| --- | --- |
| Le catalogue est un fichier JSON à part (`config/signals.json`), pas une extension de `course.json` | Les signaux de dépôt et les critères de parcours sont deux familles d'origine différente qui alimentent les mêmes axes ; les fusionner rendrait impossible la règle « quand les deux parlent, le dépôt tranche » |
| Un type de règle = une Strategy, résolue par un registre de règles | Ajouter une lecture ne modifie aucun fichier existant hors le point de câblage, comme pour les jeux |
| Le statut de mesure est porté par le score d'axe, pas déduit au verdict | Un axe non mesuré plafonne le niveau annonçable ; le déduire tard obligerait le résolveur à connaître l'origine des signaux, ce que le faisceau de preuves lui cache exprès |
| La reconnaissance des artefacts de harness se fait par familles de motifs de chemin déclarées en JSON | Le sujet annonce explicitement que les profils inconnus utiliseront d'autres outils ; coder une marque en dur perd le critère de justesse |
| Un mécanisme de relance n'est accordé que sur preuve d'itération, jamais sur la présence d'un hook | C'est le seuil qui sépare Copper de Silver, et le banc ne contient aucun exemple positif pour le rattraper |
