import { Link, useLocation } from "wouter";
import { Zap, LayoutGrid } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex h-14 items-center max-w-5xl mx-auto px-4 gap-8">
          <Link href="/" className="flex items-center gap-2 text-foreground hover:text-foreground/80 transition-colors">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">DeckForge</span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                location === "/"
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Build
            </Link>
            <Link
              href="/decks"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
                location.startsWith("/decks")
                  ? "bg-secondary text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              My Decks
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full">
        {children}
      </main>
    </div>
  );
}
