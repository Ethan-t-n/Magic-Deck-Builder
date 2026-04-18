import { useListDecks } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { Library, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function Decks() {
  const { data: decks, isLoading } = useListDecks();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-12 px-4">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 rounded-full bg-secondary/20 border border-secondary/30 flex items-center justify-center">
          <Library className="w-6 h-6 text-secondary" />
        </div>
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground">The Grimoire</h1>
          <p className="text-muted-foreground mt-1 font-serif italic">Your inscribed collections of power</p>
        </div>
      </div>

      {!decks || decks.length === 0 ? (
        <div className="text-center py-20 bg-card/30 border border-border/50 rounded-2xl backdrop-blur-sm">
          <Sparkles className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-2xl font-serif text-muted-foreground mb-2">The pages are empty</h3>
          <p className="text-muted-foreground/70 max-w-md mx-auto mb-8">
            You have not yet inscribed any decks. Return to the crafting interface to summon your first collection.
          </p>
          <Link href="/" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
            Craft a Deck
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/decks/${deck.id}`}>
              <Card className="h-full bg-card/60 hover:bg-card/80 border-border/50 hover:border-primary/50 transition-all duration-300 cursor-pointer group hover:shadow-[0_0_30px_rgba(var(--primary),0.1)]">
                <CardHeader className="pb-4 border-b border-border/30">
                  <div className="flex justify-between items-start gap-4">
                    <h3 className="text-xl font-serif font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {deck.name}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground border-secondary/30">
                      {deck.format}
                    </Badge>
                    <Badge variant="outline" className="border-border/50 text-muted-foreground">
                      {deck.colors}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="py-4">
                  <p className="text-sm text-muted-foreground line-clamp-2 italic">
                    {deck.strategy}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 text-xs text-muted-foreground/60 flex justify-between items-center">
                  <span>Inscribed {format(new Date(deck.createdAt), 'MMM d, yyyy')}</span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
