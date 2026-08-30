/**
 * L'avis de l'assistant : du texte de configuration, présenté comme un avis,
 * jamais comme une alerte. Une seule formulation, qui ne change pas selon
 * la nature de l'objection — fondée ou creuse, la présentation est
 * identique. Voir le cadrage de la passe impeccable pour ce que ce jeu
 * refuse de laisser fuiter par le ton.
 *
 * Purement présentationnel : il affiche l'argument qu'on lui donne, il ne
 * sait pas s'il est fondé.
 */
export const ObjectionNote = ({ argument }: { argument: string }) => (
  <div className="border border-plane-rule bg-plane-foreground/[0.03] px-4 py-3">
    <p className="font-medium text-[10px] text-plane-foreground/50 uppercase tracking-[0.16em]">
      L'assistant
    </p>
    <p className="mt-1.5 max-w-[62ch] text-plane-foreground text-sm leading-relaxed">
      {argument}
    </p>
  </div>
)
