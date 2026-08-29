// Smart: Container with logic
"use client";
import { useCards } from "../hooks/use-cards";
import { CardDisplay } from "../ui/card-display";

export function CardsListContainer() {
  const { data: cards, isLoading } = useCards();
  const [selectedId, setSelectedId] = useState<string>();

  if (isLoading) return <Skeleton />;
  if (!cards?.length) return <EmptyState />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card) => (
        <CardDisplay
          key={card.id}
          card={card}
          onEdit={() => setSelectedId(card.id)}
          onDelete={() => handleDelete(card.id)}
        />
      ))}
    </div>
  );
}
