---
objective: "Un joueur lit sa position sur la rampe quel que soit son écran et sans lire une couleur, retrouve exactement son jeu courant après un rechargement, et voit noir sur blanc qu'une réponse soumise est définitive — sans qu'aucun écran ne devienne adressable par lien."
status: implemented
---

# Plan: Traverser le parcours sans se perdre

## Overview

| Field | Value |
| --- | --- |
| **Goal** | Rendre le déroulé du parcours tenable de bout en bout : la position se lit, elle survit à un rechargement, et le verrou de soumission s'annonce au lieu de se deviner |
| **Source** | `aidd_docs/backlog/stories/avancer-en-sachant-ou-j-en-suis.md` · `aidd_docs/backlog/stories/retrouver-ma-place-apres-un-rechargement.md` · `aidd_docs/backlog/stories/revenir-sur-un-jeu-deja-soumis.md` · `aidd_docs/backlog/epics/deroule-du-parcours.md` |

## Phases

| # | Phase | File |
| --- | --- | --- |
| 1 | La rampe se lit sans la couleur, et sur mobile aussi | [`phase-1.md`](./phase-1.md) |
| 2 | Le rechargement ramène au jeu courant | [`phase-2.md`](./phase-2.md) |
| 3 | Une réponse soumise est définitive, et ça se voit | [`phase-3.md`](./phase-3.md) |
| 4 | Réparer ce que la revue et la QA navigateur ont trouvé | [`phase-4.md`](./phase-4.md) |

## Decisions

| Decision | Why |
| --- | --- |
| **La reprise devient automatique.** Un snapshot lisible ouvre directement l'écran où le joueur s'était arrêté — parcours, ou verdict si la partie est finie | Renverse la décision inscrite dans `use-onboarding.hook.ts` (« La reprise n'est jamais automatique — l'accueil montre la partie enregistrée et laisse le joueur choisir »), posée pour l'épique d'onboarding. L'acceptance de la story est explicite et ne laisse pas de marge : « Un rechargement en plein parcours ramène au jeu courant, pas au début du groupe ni du parcours ». Arbitré le 31/08. Le coût est réel et assumé : la promesse « une partie survit à une interruption » cesse d'être démontrée par une carte visible, elle devient un fait silencieux |
| **« Repartir de zéro » déménage dans l'en-tête du parcours**, derrière une confirmation | Conséquence mécanique de la décision précédente : la carte `ResumeRun` de l'accueil devient inatteignable dès qu'une partie existe, et avec elle le seul chemin de sortie. Sans échappatoire, un joueur qui veut recommencer doit vider son LocalStorage — friction inacceptable un jour de démo. L'action est discrète et confirmée : elle détruit une partie, elle ne doit pas se déclencher au passage du curseur |
| **`ResumeRun` et la reprise manuelle sont supprimées**, pas conservées « au cas où » | Aucun chemin ne les atteint plus. Un composant mort qu'un test garde en vie ment sur ce que le produit fait. L'épique `sauvegarde-et-reprise` chargera un **fichier**, pas le stockage navigateur : elle ne reprendra pas cette carte telle quelle |
| **Verrou de soumission : une réponse soumise est définitive, partout, sans exception par jeu** | Tranche l'inconnue ouverte de l'épique (« Le joueur peut vouloir revenir sur un jeu déjà soumis »). Arbitré le 31/08. Cohérent avec la promesse produit — le verdict se calcule, il ne se négocie pas — et avec la reproductibilité du rejeu : un jeu rejouable rend le faisceau de preuves dépendant du nombre de tentatives, pas de ce qui a été livré. Les jeux à ressource rare (passes, attention, indices) perdraient tout leur sens à la seconde tentative |
| **Le refus se rend au niveau du parcours, jamais dans un jeu** | L'acceptance exige le même comportement partout, sans exception par jeu. Rendu par `CourseView`, il est structurellement uniforme : les treize autres jeux n'ont rien à câbler, et un jeu à venir ne peut pas y déroger par omission |
| **Le refus est un affordance désactivé qui porte sa raison**, pas un bouton absent | « Si le retour est refusé, il est refusé visiblement, pas par un bouton absent ». Un joueur qui ne trouve pas de retour ne conclut pas qu'il n'y en a pas : il le cherche. Le nommer coûte une ligne et ferme la question une fois pour toutes |
| **Aucun écran ne devient adressable**, la position reste lue sur le snapshot | Contrainte de l'épique et conséquence du déploiement en base relative. La reprise automatique aurait pu passer par un fragment d'URL ; elle passe par la façade, comme le reste |

## Contradictions levées

| Où | Ce qui devient faux |
| --- | --- |
| `src/features/onboarding/hooks/use-onboarding.hook.ts` | Le commentaire « La reprise n'est jamais automatique » — réécrit en phase 2 |
| `src/features/onboarding/components/composites/resume-run.tsx` | « Une partie en cours n'est plus reprise en silence » — le fichier est supprimé en phase 2 |
| `aidd_docs/tasks/2026_08/2026_08_30_jeu-practice-map/phase-3.md` | « le parcours autorise de rejouer un jeu déjà soumis », invoqué pour ne pas révéler les zones attendues. La conclusion tient toujours ; sa raison ne tient plus. Document historique, laissé tel quel — la décision fait foi dans l'épique |
| `aidd_docs/memory/navigation.md` | « un rechargement repart du LocalStorage » reste vrai, mais l'écran d'arrivée change — mis à jour en phase 2 |
