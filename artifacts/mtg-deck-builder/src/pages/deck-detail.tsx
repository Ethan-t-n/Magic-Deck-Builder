import { useGetDeck, useDeleteDeck } from "@workspace/api-client-react";
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

export function DeckDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const { data: deck, isLoading, error } = useGetDeck(Number(id));
  const deleteMutation = useDeleteDeck();

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !deck) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-muted-foreground">Deck not found.</p>
        <Link href="/decks" className="text-sm text-primary hover:underline">Back to My Decks</Link>
      </div>
    );
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ id: Number(id) });
      toast({ title: "Deck deleted", description: "The deck has been removed." });
      setLocation("/decks");
    } catch {
      toast({ variant: "destructive", title: "Delete failed", description: "Please try again." });
    }
  };

  const parsedDeck: ParsedDeck = {
    name: deck.name,
    format: deck.format,
    colors: deck.colors,
    strategy: deck.strategy,
    cards: deck.cards.map((c) => ({
      cardName: c.cardName,
      quantity: c.quantity,
      section: c.section,
      manaCost: c.manaCost || undefined,
      typeLine: c.typeLine || undefined,
    })),
  };

  return (
    <div className="max-w-5xl mx-auto w-full py-6 px-4 h-[calc(100dvh-3.5rem)] flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <Link href="/decks" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          My Decks
        </Link>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2 border-destructive/30 text-destructive hover:bg-destructive/10">
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-card border-border">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-foreground">Delete this deck?</AlertDialogTitle>
              <AlertDialogDescription className="text-muted-foreground">
                This action cannot be undone. The deck will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-transparent border-border text-foreground hover:bg-secondary">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <DeckDisplay deck={parsedDeck} />
      </div>
    </div>
  );
}
