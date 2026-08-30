import type { ReactNode } from 'react'
import type { LineVerdict } from '../../hooks/use-defect-hunt.hook'
import { useRovingFocus } from '../../hooks/use-roving-focus.hook'
import { CodeLine } from '../elements/code-line'
import { TimeDial } from '../elements/time-dial'

/**
 * L'épreuve de relecture : une feuille imprimée, sa marge réglée, et le temps
 * en cadran dans le bandeau de tête. C'est le concept de cette surface et de
 * nulle autre — `confidence-bet` est un instrument gradué qu'on relève une
 * fois, `three-tracks` une table qui se réécrit tour après tour ; ici on
 * balaie une feuille et on frappe la marge.
 *
 * Un seul objet, trois bandes : la tête donne ce qu'on reçoit — l'extrait, sa
 * langue, le temps qui reste ; le corps est la feuille ; le pied porte ce
 * qu'on produit — les marques posées, puis l'action. Cette séparation est la
 * raison d'être de la composition : on ne mélange pas ce que le jeu donne et
 * ce que le joueur rend.
 *
 * La tête ne dit **jamais** combien de défauts l'extrait porte. Le joueur n'a
 * pas de règle d'arrêt : il marque autant qu'il veut et décide lui-même quand
 * sa revue est finie. C'est le barème — un point par ligne fautive, un de
 * moins par ligne saine — qui remplace le compte annoncé.
 *
 * Le code n'est jamais coloré syntaxiquement : une coloration jugerait à la
 * place du joueur et attirerait l'œil là où la teinte tombe, pas là où le
 * défaut est. Il ne défile pas non plus horizontalement — une ligne longue se
 * replie plutôt que de sortir de l'écran, parce que ce jeu se perd si un seul
 * caractère de l'extrait est hors de vue.
 */
export const ReviewSheet = ({
  label,
  language,
  elapsedSeconds,
  timeLimitSeconds,
  lines,
  markedLines,
  lineVerdict,
  locked,
  onToggleLine,
  foot,
}: {
  label: string
  language: string
  elapsedSeconds: number
  timeLimitSeconds: number
  lines: readonly string[]
  markedLines: ReadonlySet<number>
  lineVerdict: (line: number) => LineVerdict
  locked: boolean
  onToggleLine?: (line: number) => void
  foot: ReactNode
}) => {
  const { activeIndex, containerRef, handleKeyDown, setActiveIndex } =
    useRovingFocus(lines.length, (index) => onToggleLine?.(index + 1))

  const rows = lines.map((code, index) => {
    const lineNumber = index + 1

    return (
      <CodeLine
        key={lineNumber}
        lineNumber={lineNumber}
        rovingIndex={index}
        code={code}
        marked={markedLines.has(lineNumber)}
        verdict={lineVerdict(lineNumber)}
        active={index === activeIndex}
        locked={locked}
        onToggle={onToggleLine}
        onFocusLine={setActiveIndex}
      />
    )
  })

  return (
    <section className="border border-plane-rule bg-plane">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-plane-rule border-b px-4 py-3">
        {/* La tête ne porte aucun compte de défauts : le joueur n'a pas de
         * règle d'arrêt, il décide lui-même quand sa revue est finie. */}
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-plane-foreground">{label}</h3>
          <p className="font-medium text-[10px] text-plane-foreground/45 uppercase tracking-[0.18em]">
            {language}
          </p>
        </div>

        <TimeDial
          elapsedSeconds={elapsedSeconds}
          timeLimitSeconds={timeLimitSeconds}
          locked={locked}
        />
      </header>

      {/* Une fois la revue rendue, la feuille n'est plus un contrôle : ni rôle
       * de liste, ni clavier, ni focus. Deux branches plutôt qu'un seul nœud
       * aux attributs conditionnels — un `role` calculé se relit mal et se
       * vérifie mal. */}
      {locked ? (
        <div className="py-2">{rows}</div>
      ) : (
        // Un seul arrêt de tabulation pour toute la feuille. La liste porte le
        // focus et le clavier, les lignes ne sont que des options.
        <div
          ref={containerRef}
          role="listbox"
          aria-multiselectable
          aria-label="Lignes de l’extrait"
          onKeyDown={handleKeyDown}
          className="py-2 -outline-offset-2"
        >
          {rows}
        </div>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-plane-rule border-t px-4 py-3">
        {foot}
      </footer>
    </section>
  )
}
