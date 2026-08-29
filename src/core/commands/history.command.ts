import type { SubmitAnswerCommand } from './submit-answer.command'

/** La pile ordonnée des commandes, seule source de la trace d'audit. */
export class CommandHistory {
  private readonly commands: SubmitAnswerCommand[] = []

  push(command: SubmitAnswerCommand): void {
    this.commands.push(command)
  }

  entries(): readonly SubmitAnswerCommand[] {
    return [...this.commands]
  }

  clear(): void {
    this.commands.length = 0
  }
}
