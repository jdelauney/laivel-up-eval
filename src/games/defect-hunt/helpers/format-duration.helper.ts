/**
 * `MM:SS`, jamais signé. Le cadran et le relevé de fin lisent la même durée :
 * deux implémentations auraient divergé au premier ajustement de format, et le
 * temps affiché pendant la partie ne serait plus celui affiché après.
 *
 * Le dépassement se dit par le libellé qui accompagne le nombre, jamais par un
 * signe moins : l'appelant passe une valeur absolue et nomme le sens.
 */
export const formatDuration = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60

  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}
