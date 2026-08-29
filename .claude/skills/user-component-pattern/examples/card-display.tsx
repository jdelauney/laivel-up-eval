// Dumb: Pure UI component
import type { Card } from "@prisma/client";

type CardDisplayProps = {
  card: Card;
  onEdit: () => void;
  onDelete: () => void;
};

export function CardDisplay({ card, onEdit, onDelete }: CardDisplayProps) {
  return (
    <div className="border p-4 rounded-lg">
      <h3 className="font-bold">{card.name}</h3>
      <p className="text-sm text-muted-foreground">{card.title}</p>
      <div className="flex gap-2 mt-4">
        <Button onClick={onEdit}>Edit</Button>
        <Button variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
