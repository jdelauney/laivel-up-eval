/**
 * Les deux axes nommés — ce que le joueur fait du travail de l'IA, et le
 * nombre de chantiers qu'il mène de front — sont les seuls que le spike
 * `aidd_docs/backlog/spikes/preuves-du-depot-calculables-sans-jeton.md` a
 * confirmés lisibles sans jeton depuis un dépôt désigné, dans le budget de
 * requêtes de l'API GitHub ; les trois autres dimensions du référentiel n'ont
 * pas cette preuve et restent mesurées par le parcours seul.
 *
 * Le texte ne recopie pas les libellés officiels de `config/grid.json` : les
 * nommer prévient le joueur de ce qui est noté, et un joueur prévenu de ce
 * qu'on note joue un personnage plutôt que lui-même. Les deux axes sont donc
 * dits en mots ordinaires, jamais avec leur libellé de référentiel.
 *
 * La phrase reste au présent : aucun code de `src/core/scoring/`, de
 * `evaluation-result.entity.ts` ni de `src/features/scoring-summary/` ne lit
 * `repository` aujourd'hui — `designatedRepository()` sur la façade le dit
 * elle-même. Annoncer un effet que rien n'exécute encore ferait saisir un
 * dépôt pour rien.
 *
 * Purement présentationnel : texte fixe, sans propriété.
 */
export const MissingRepositoryNotice = () => (
  <p className="border-plane-rule border-l pl-4 text-plane-foreground/70 text-sm">
    Entrer sans dépôt est un usage prévu&nbsp;: le parcours se joue en entier.
    Aucun dépôt n'est lu pour l'instant&nbsp;: ce que vous faites du travail de
    l'IA comme le nombre de chantiers que vous menez de front se mesurent ici,
    dépôt ou pas.
  </p>
)
