/**
 * Ce que le verdict ne pourra pas asseoir sur un historique tant que le champ
 * dépôt reste vide : ce que le joueur fait du travail de l'IA, et le nombre
 * de chantiers qu'il mène de front. Ce sont les deux seuls axes qu'un dépôt
 * sait prouver sans jeton depuis le navigateur — voir
 * `aidd_docs/backlog/spikes/preuves-du-depot-calculables-sans-jeton.md` — les
 * trois autres dimensions du référentiel restent mesurées par le parcours
 * seul, avec ou sans dépôt désigné.
 *
 * Le texte ne recopie pas les libellés officiels de `config/grid.json` : les
 * nommer prévient le joueur de ce qui est noté, et un joueur prévenu de ce
 * qu'on note joue un personnage plutôt que lui-même. Les deux axes sont donc
 * dits en mots ordinaires, jamais avec leur libellé de référentiel.
 *
 * Purement présentationnel : texte fixe, sans propriété.
 */
export const MissingRepositoryNotice = () => (
  <p className="border-plane-rule border-l pl-4 text-plane-foreground/70 text-sm">
    Entrer sans dépôt est un usage prévu&nbsp;: le parcours se joue en entier.
    Sans dépôt à lire, ce que vous faites du travail de l'IA et le nombre de
    chantiers que vous menez de front ne reposeront que sur ce seul parcours.
  </p>
)
