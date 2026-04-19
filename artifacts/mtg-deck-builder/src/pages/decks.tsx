import { useListDecks } from "@workspace/api-client-react";
import { Link } from "wouter";
import { format } from "date-fns";
import { LayoutGrid, Loader2, Wand2, LogIn } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@workspace/replit-auth-web";

export function Decks() {
  const { data: decks, isLoading } = useListDecks();
  const { isAuthenticated, isLoading: authLoading, login } = useAuth();

  if (isLoading || authLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-5xl mx-auto w-full py-8 px-4">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <LayoutGrid className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">My Decks</h1>
            <p className="text-xs text-muted-foreground">Your saved MTG decks</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-border bg-card">
          <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
            <LogIn className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-base font-medium text-foreground mb-1">Log in to see your decks</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            Create an account or log in to save and manage your MTG decks.
          </p>
          <button
            onClick={login}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Log in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto w-full py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
          <LayoutGrid className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-foreground">My Decks</h1>
          <p className="text-xs text-muted-foreground">Your saved MTG decks</p>
        </div>
      </div>

      {!decks || decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center rounded-xl border border-border bg-card">
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center mb-4">
            <Wand2 className="w-6 h-6 text-muted-foreground" />
          </div>
          <h3 className="text-base font-medium text-foreground mb-1">No decks yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mb-6">
            Build your first deck using the AI assistant and save it here.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Build a Deck
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/decks/${deck.id}`}>
              <div className="rounded-xl border border-border bg-card hover:bg-card/80 hover:border-primary/40 transition-all duration-200 cursor-pointer group p-4 h-full flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 text-sm">
                    {deck.name}
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant="secondary" className="text-xs font-normal">{deck.format}</Badge>
                  <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary">{deck.colors}</Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2 flex-1 mb-3">
                  {deck.strategy}
                </p>
                <p className="text-xs text-muted-foreground/50">
                  {format(new Date(deck.createdAt), "MMM d, yyyy")}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
