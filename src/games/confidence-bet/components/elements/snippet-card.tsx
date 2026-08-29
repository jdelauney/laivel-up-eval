/**
 * L'extrait à juger : l'intitulé, le langage annoncé et le code en lecture
 * seule, monospace, sans coloration syntaxique — la coloration jugerait à sa
 * place.
 *
 * C'est le moment focal de l'écran, et il est traité comme tel : le code y
 * est le contenu le plus lisible, tout le reste — position, capital, relevé —
 * est de l'appareillage qui se lit sans être regardé.
 *
 * La sélection et l'ascenseur du bloc sont habillés sur les jetons du plan.
 * Ce sont deux surfaces que le navigateur dessine par défaut, et une seule
 * suffit à trahir un écran assemblé plutôt que dessiné.
 *
 * Purement présentationnel : il affiche ce qu'on lui donne, il ne connaît ni
 * la nature de l'extrait ni sa révélation.
 */
export const SnippetCard = ({
  label,
  language,
  code,
}: {
  label: string
  language: string
  code: string
}) => (
  <figure className="border border-plane-rule bg-plane">
    <figcaption className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-plane-rule border-b px-4 py-3">
      <span className="font-semibold text-plane-foreground">{label}</span>
      <span className="font-medium text-[11px] text-plane-foreground/45 uppercase tracking-[0.16em]">
        {language}
      </span>
    </figcaption>
    <pre className="max-h-72 overflow-auto px-4 py-4 font-mono text-[13px] text-plane-foreground leading-[1.65] selection:bg-plane-foreground selection:text-plane [&::-webkit-scrollbar-thumb]:bg-plane-foreground/25 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar]:w-1.5">
      <code>{code}</code>
    </pre>
  </figure>
)
