import { Link, useLocation } from "wouter";
import { BookOpen, Library, Sparkles } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-md">
        <div className="container flex h-16 items-center max-w-6xl mx-auto px-4">
          <Link href="/" className="flex items-center gap-2 mr-6 text-primary hover:text-primary/80 transition-colors">
            <Sparkles className="h-6 w-6" />
            <span className="font-serif font-bold text-xl tracking-wider">Grimoire</span>
          </Link>
          
          <nav className="flex items-center gap-6 text-sm font-medium">
            <Link 
              href="/" 
              className={`flex items-center gap-2 transition-colors ${location === "/" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <BookOpen className="h-4 w-4" />
              Craft
            </Link>
            <Link 
              href="/decks" 
              className={`flex items-center gap-2 transition-colors ${location.startsWith("/decks") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Library className="h-4 w-4" />
              Tome
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
