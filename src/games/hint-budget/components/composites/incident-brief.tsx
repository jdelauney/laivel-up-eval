/**
 * Le symptôme et le rapport : ce qui est observé, puis les faits déjà en
 * main, gratuits, toujours visibles. C'est la matière du cadrage.
 */
export const IncidentBrief = ({
  symptom,
  report,
}: {
  symptom: string
  report: readonly string[]
}) => (
  <section className="border border-plane-rule bg-plane px-4 py-3">
    <p className="text-plane-foreground text-sm leading-relaxed">{symptom}</p>
    <ul className="mt-2 flex flex-col gap-1 border-plane-rule border-t pt-2">
      {report.map((fact) => (
        <li
          key={fact}
          className="text-plane-foreground/75 text-sm leading-relaxed"
        >
          {fact}
        </li>
      ))}
    </ul>
  </section>
)
