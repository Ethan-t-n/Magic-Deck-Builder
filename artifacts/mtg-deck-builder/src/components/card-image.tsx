import { useScryfallCard } from "@/lib/scryfall";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CardImageProps {
  cardName: string;
  quantity?: number;
  className?: string;
}

export function CardImage({ cardName, quantity, className }: CardImageProps) {
  const { card, loading, error } = useScryfallCard(cardName);

  if (loading) {
    return <Skeleton className={cn("w-full aspect-[488/680] rounded-lg", className)} />;
  }

  const image = card?.image_uris ?? card?.card_faces?.[0]?.image_uris;
  if (error || !card || !image) {
    return (
      <div className={cn("w-full aspect-[488/680] rounded-lg bg-card border border-border flex items-center justify-center text-center p-4", className)}>
        <span className="text-muted-foreground font-serif text-sm">{cardName}</span>
      </div>
    );
  }

  return (
    <div className={cn("relative group", className)}>
      <img
        src={image.normal}
        alt={card.name}
        className="w-full h-auto rounded-[4.75%] object-cover shadow-md transition-transform duration-300 group-hover:scale-105 group-hover:shadow-xl group-hover:shadow-primary/20"
        loading="lazy"
      />
      {quantity !== undefined && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground font-bold font-serif w-8 h-8 rounded-full flex items-center justify-center shadow-lg border-2 border-background z-10">
          {quantity}
        </div>
      )}
    </div>
  );
}
