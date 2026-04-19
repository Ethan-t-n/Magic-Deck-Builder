import { Link, useLocation } from "wouter";
import { Zap, LayoutGrid, LogIn, LogOut, User } from "lucide-react";
import { useAuth } from "@workspace/replit-auth-web";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="flex h-14 items-center max-w-5xl mx-auto px-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 text-foreground hover:text-foreground/80 transition-colors mr-6">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-[15px] tracking-tight">DeckForge</span>
          </Link>

          {/* Nav */}
          <nav className="flex items-center gap-2 text-sm flex-1">
            <Link
              href="/"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors font-medium ${
                location === "/"
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/15 text-primary hover:bg-primary/25"
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              Build
            </Link>
            <Link
              href="/decks"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors font-medium ${
                location.startsWith("/decks")
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary/15 text-primary hover:bg-primary/25"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              My Decks
            </Link>
          </nav>

          {/* Auth button */}
          <div className="flex items-center gap-2 ml-auto">
            {!isLoading && (
              isAuthenticated ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2">
                    {user?.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.firstName ?? "User"}
                        className="w-7 h-7 rounded-full object-cover ring-1 ring-border"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                    )}
                    {user?.firstName && (
                      <span className="text-sm text-muted-foreground hidden sm:block">
                        {user.firstName}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:block">Log out</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={login}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                  <LogIn className="h-3.5 w-3.5" />
                  Log in
                </button>
              )
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col relative w-full">
        {children}
      </main>
    </div>
  );
}
