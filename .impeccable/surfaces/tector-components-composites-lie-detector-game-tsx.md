---
version: 1
slug: "tector-components-composites-lie-detector-game-tsx"
primary_target: "src/games/lie-detector/components/composites/lie-detector-game.tsx"
related_targets: []
---

# Le jeu `lie-detector` — le lot qui se compare

Sixième jeu à état du parcours, et le troisième du groupe « Jugement critique ». Il prend la place du banc d'essai placeholder `g1-3`.

**Chaque jeu a sa propre surface, et cette fiche ne vaut que pour celle-ci.** `defect-hunt` est une épreuve d'imprimeur qu'on balaie ; `confidence-bet` un instrument gradué qu'on relève une fois. Celui-ci n'a **ni code, ni chronomètre, ni compteur** : quatre phrases de longueur voisine, dont une ment. Le seul objet de cette surface est le lot lui-même — pas un artefact qu'on regarde à côté, le lot EST l'écran.

Les cinq règles communes à tous les jeux — coût annoncé et conséquence tue, partie dans le composant et trace comme réponse, état porté par une quantité, relevé qui ne chasse pas la décision, avancée discrète — vivent dans [DESIGN.md](../../DESIGN.md), section « La surface d'un jeu ». Elles ne se rediscutent pas ici.

## Périmètre et mode

Une surface, mode **Operate**. Elle occupe la colonne de droite de `CourseView` ; la coquille, l'en-tête de parcours et la rampe restent en place et ne sont pas redessinées.

## Public et métier

Le développeur évalué, seul, à la troisième situation du parcours. Une manche : une mise en situation, quatre affirmations proches, une seule menteuse. Il en désigne une — le clic verrouille — puis l'assistant objecte, avec aplomb, sur une cible écrite d'avance dans le corpus (jamais calculée depuis ce que le joueur vient de désigner). Il tient ou se dédit, une fois, puis la manche se révèle.

Ce qui est mesuré n'est pas la première intuition, mais deux choses distinctes : **a-t-il identifié la menteuse** (sur la désignation finale), et **a-t-il tenu sa position juste sous une contradiction avec aplomb** (jamais un simple « n'a-t-il pas changé d'avis » — capituler, c'est abandonner une désignation qui était juste). Rien de tout cela ne s'énonce à l'écran.

## Action et preuve

Il compare, il désigne, il tient ou se dédit. Le succès de l'écran, c'est que le joueur **lise réellement les quatre affirmations les unes contre les autres** avant de trancher, plutôt que de repérer la menteuse à la forme du texte ou de suivre par réflexe ce que l'assistant vient de dire.

## Le concept

**La grille de comparaison.** Les quatre affirmations vivent en grille à deux colonnes (une seule sous `sm`), jamais en liste verticale empilée : le geste réel du joueur est un aller-retour entre elles, et une colonne unique ne les fait lire qu'une fois, de haut en bas — exactement la lecture superficielle que ce jeu mesure. La grille partage un hairline `--plane-rule` en fond (`gap-px`) plutôt qu'un double filet entre tuiles.

| Bande | Ce qu'elle porte | Pourquoi elle est là |
| --- | --- | --- |
| Tête | La mise en situation du lot | Ce sur quoi l'assistant affirme, rend les quatre comparables |
| Grille | Les quatre affirmations, deux colonnes | Le moment focal, la comparaison |
| Sous la grille | Le coût annoncé (« un clic verrouille »), en phase de désignation seulement | Le prix du geste, avant qu'il soit posé |
| Objection | Le mot de l'assistant, une fois posé | Ce qui presse la décision |
| Pied | L'action de manche (« Je maintiens »), quand elle existe | Ce que le joueur produit au second temps |

L'action de passage à la manche suivante vit **hors** de la feuille, dans la racine du jeu — comme chez `defect-hunt` — parce qu'elle appartient au parcours des manches, pas au contenu d'une manche donnée.

## Ce qui ne se négocie pas

- **La triade `--nominal` / `--caution` / `--missed` reste hors de cette surface.** Elle note la performance du joueur ailleurs dans le produit (trouvé / manqué / à côté). Ici, « menteuse » et « vraie » sont des faits sur l'affirmation, pas un verdict sur le joueur : les colorer avec cette triade ferait dire à la couleur qu'une désignation juste est une erreur, ou qu'une désignation fausse est un succès, selon ce que le joueur a cliqué. Le fait (menteuse / vraie) se porte par un poids de glyphe (`Disc` plein contre `Circle` fin) et un libellé texte, jamais par la couleur.
- **« La vôtre » est un canal séparé.** Un anneau structurel (`ring-inset`) autour de la tuile de la désignation finale, indépendant du glyphe menteuse/vraie : les deux peuvent coexister sur la même tuile sans se confondre, et aucun des deux n'est un jugement de réussite.
- **L'objection ne reçoit jamais sa propre nature.** `ObjectionNote` ne prend qu'un `argument: string` en prop — il ne peut pas recevoir « fondée » ou « creuse », et ne peut donc pas laisser fuiter par le ton ce que le composant ne sait pas. Verrouillé par un test qui compare l'arbre rendu d'une objection fondée et d'une objection creuse : la structure doit être identique au caractère près, seul le texte de l'argument change.
- **Le coût est annoncé avant tout clic, jamais après.** Une légende dédiée (« Un clic verrouille votre désignation », avec un glyphe `Lock`) vit sous la grille, visible dès le premier temps — pas seulement dans la consigne globale du jeu, qui reste un rappel de cadre et non l'endroit où on lit le prix du geste précis qu'on s'apprête à poser.
- **Rien ne fuite avant la révélation.** Le hook n'expose ni `lying` ni l'objection avant la première désignation ; `ClaimCard` ne reçoit jamais de `verdict` ni de `verification` tant que la manche n'est pas révélée. C'est une propriété du hook (phase 3), pas un effet de bord de cette passe — elle ne rouvre pas ce chemin pour un rendu plus riche.
- **L'avancée reste discrète.** Aucune des trois bascules de temps (désigner → objection → révélation) n'anime de transition d'écran ; React remonte le contenu par cran, jamais par fondu. La seule animation tolérée — une entrée qui apparaît, `motion-safe:fade-in slide-in-from-bottom-1`, empruntée telle quelle à `DefectReveal` de `defect-hunt` — s'applique à l'objection qui arrive et aux vérifications de la révélation (décalées de 70 ms l'une de l'autre), jamais à un changement d'état pur.

## Ce que l'écran ne dit jamais

Le cadre s'annonce dans la consigne, jamais les critères.

| S'énonce | Se tait |
| --- | --- |
| Qu'une seule affirmation ment par manche | Laquelle, et à quoi elle se repère |
| Que la désignation se verrouille au clic | Que la première désignation n'est pas ce qui est noté |
| Que l'assistant donnera son avis, et qu'on pourra désigner autrement une fois | Que l'assistant se trompe parfois, et à quelle fréquence |
| La manche courante sur le total | Le compte des manches déjà réussies, et les seuils |

Un signal propre à ce jeu, distinct des cinq autres : **le ton de l'objection ne doit jamais trahir sa nature.** Une formulation hésitante sur les objections creuses et affirmative sur les fondées suffirait à faire gagner une politique fixe sans lire, et le corpus n'y peut rien — ce serait la surface qui trahirait. `ObjectionNote` ne reçoit structurellement pas de quoi le faire.

## Vérifié

Aucune tournée de navigateur réel n'a eu lieu pour cette passe : le projet n'a pas encore de harnais Playwright amorcé (`aidd_docs/memory/testing.md`), et la vérification s'est donc faite par la voie que ce projet utilise réellement — assertions Testing Library sur le rendu produit, dans `lie-detector-game.test.tsx`. Elles verrouillent : le coût annoncé avant tout clic, un glyphe et un libellé texte sur chaque état de tuile (indépendant de toute couleur), l'arbre rendu identique entre une objection fondée et une objection creuse, et l'ordre de parcours au clavier qui suit l'ordre du corpus. Une tournée de navigateur réel — desktop et mobile, débordement horizontal, désaturation — reste à faire avant d'documenter ce point comme clos.
