import { useGetDeck, useDeleteDeck, getGetDeckQueryKey } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Loader2, Trash2, ArrowLeft } from "lucide-react";
import { DeckDisplay, ParsedDeck } from "@/components/deck-display";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";

export function DeckDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: deck, isLoading, error } = useGetDeck(Number(id));
  const deleteMutation = useDeleteDeck();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-primary opacity-50" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <p className="text-destructive font-serif text-xl">The spell failed to resolve.</p>
        <Link href="/decks" className="text-primary hover:underline">Return to Grimoire</Link>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: Number(id) });
      toast({
        title: "Spell unraveled",
        description: "The deck has been erased from the grimoire.",
      });
      setLocation("/decks");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erase failed",
        description: "The arcane bindings could not be broken.",
      });
    }
  };

  // Convert the API Deck model to our ParsedDeck model for the display component
  const parsedDeck: ParsedDeck = {
    name: deck.name,
    format: deck.format,
    colors: deck.colors,
    strategy: deck.strategy,
    cards: deck.cards.map(c => ({
      cardName: c.cardName,
      quantity: c.quantity,
      section: c.section,
      manaCost: c.manaCost || undefined,
      typeLine: c.typeLine || undefined
    }))
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 h-[calc(100dvh-4rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <Link href="/decks" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span className="font-serif">Back to Tome</span>
        </Link>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground">
              <Trash2 className="w-4 h-4 mr-2" />
              Erase
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-serif text-xl text-foreground">Erase this deck?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. The deck will be permanently removed from your grimoire.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-background">Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Erase
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex-1 overflow-hidden">
        <DeckDisplay deck={parsedDeck} />
      </div>
    </div>
  );
}
