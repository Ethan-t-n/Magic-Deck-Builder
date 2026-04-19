import { useState, useRef, useEffect } from "react";
import { Send, Loader2, BookmarkPlus, Wand2, MessageSquare, Sliders, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCreateOpenaiConversation, useSaveDeck } from "@workspace/api-client-react";
import { ChatMessage } from "@/components/chat-message";
import { DeckDisplay, ParsedDeck } from "@/components/deck-display";
import { GuidedBuilder } from "@/components/guided-builder";
import { useAuth } from "@workspace/replit-auth-web";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

type Mode = "chat" | "guided";

export function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [generatedDeck, setGeneratedDeck] = useState<ParsedDeck | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const { isAuthenticated, login } = useAuth();

  const createConversation = useCreateOpenaiConversation();
  const saveDeckMutation = useSaveDeck();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  const extractDeckJson = (content: string): ParsedDeck | null => {
    const match = content.match(/```deck-json\n([\s\S]*?)\n```/);
    if (match && match[1]) {
      try {
        return JSON.parse(match[1]) as ParsedDeck;
      } catch {
        return null;
      }
    }
    return null;
  };

  const sendMessage = async (text: string) => {
    const userMsg = text.trim();
    if (!userMsg || isStreaming) return;
    setInput("");

    // Switch to chat view when a message is sent
    setMode("chat");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setGeneratedDeck(null);

    try {
      setIsStreaming(true);
      let currentConvId = conversationId;

      if (!currentConvId) {
        const conv = await createConversation.mutateAsync({
          data: { title: userMsg.substring(0, 50) },
        });
        currentConvId = conv.id;
        setConversationId(conv.id);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const response = await fetch(`/api/openai/conversations/${currentConvId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: userMsg }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop()!;

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setMessages((prev) => {
                  const next = [...prev];
                  next[next.length - 1] = { role: "assistant", content: fullContent };
                  return next;
                });
              }
              if (data.done) {
                const deck = extractDeckJson(fullContent);
                if (deck) setGeneratedDeck(deck);
              }
            } catch {
              // ignore partial chunks
            }
          }
        }
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "Failed to get a response. Please try again.",
      });
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleSaveDeck = async () => {
    if (!generatedDeck) return;
    try {
      setIsSaving(true);
      await saveDeckMutation.mutateAsync({
        data: {
          name: generatedDeck.name,
          format: generatedDeck.format,
          colors: generatedDeck.colors,
          strategy: generatedDeck.strategy,
          conversationId,
          cards: generatedDeck.cards.map((c) => ({
            cardName: c.cardName,
            quantity: c.quantity,
            section: c.section,
            manaCost: c.manaCost,
            typeLine: c.typeLine,
          })),
        },
      });
      toast({ title: "Deck saved", description: `${generatedDeck.name} has been saved.` });
    } catch {
      toast({ variant: "destructive", title: "Failed to save", description: "Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 py-4 gap-4 h-[calc(100dvh-3.5rem)]">
      {/* Chat/Builder area */}
      <div className={cn(
        "flex flex-col transition-all duration-500",
        generatedDeck ? "h-[42vh] min-h-0" : "flex-1"
      )}>
        <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden min-h-0">

          {/* Mode toggle — only show when no messages yet */}
          {!hasMessages && (
            <div className="flex items-center gap-2 px-4 pt-3 pb-0">
              <button
                onClick={() => setMode("chat")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  mode === "chat"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/15 text-primary hover:bg-primary/25"
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
              </button>
              <button
                onClick={() => setMode("guided")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  mode === "guided"
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/15 text-primary hover:bg-primary/25"
                )}
              >
                <Sliders className="w-3.5 h-3.5" />
                Guided Builder
              </button>
            </div>
          )}

          {/* Main content area */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {mode === "guided" && !hasMessages ? (
              /* Guided builder wizard */
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <GuidedBuilder onBuild={sendMessage} disabled={isStreaming} />
              </div>
            ) : (
              /* Chat messages */
              <div className="flex-1 overflow-y-auto p-4">
                {!hasMessages ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                      <Wand2 className="w-6 h-6 text-primary" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mb-1">Build your MTG deck</h2>
                    <p className="text-sm text-muted-foreground max-w-sm mb-8">
                      Describe the deck you want — or switch to <strong className="text-foreground">Guided Builder</strong> for step-by-step options.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                      {[
                        "Aggressive red goblin deck for Modern",
                        "Blue/White control deck for Standard",
                        "Green stompy ramp for Commander",
                        "Black discard deck for Pioneer",
                      ].map((s) => (
                        <button
                          key={s}
                          onClick={() => sendMessage(s)}
                          className="px-4 py-2.5 text-sm text-left rounded-lg border border-border bg-background hover:bg-secondary/60 hover:border-border/80 transition-colors text-muted-foreground hover:text-foreground"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-1 pb-2">
                    {messages.map((msg, i) => (
                      <ChatMessage key={i} role={msg.role} content={msg.content} />
                    ))}
                    {isStreaming && messages[messages.length - 1]?.role === "user" && (
                      <div className="flex justify-start py-2">
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-secondary/40 border border-border/50">
                          <span className="flex space-x-1">
                            {[0, 150, 300].map((delay) => (
                              <span
                                key={delay}
                                className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-bounce"
                                style={{ animationDelay: `${delay}ms` }}
                              />
                            ))}
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={scrollRef} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Input — always visible */}
          <div className="p-3 border-t border-border bg-background/60 shrink-0">
            <div className="max-w-3xl mx-auto flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={mode === "guided" && !hasMessages ? "Or type your request directly..." : "Describe the deck you want to build..."}
                disabled={isStreaming}
                rows={1}
                className="flex-1 resize-none bg-secondary/40 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors disabled:opacity-50 min-h-[40px] max-h-[120px] overflow-y-auto"
                onInput={(e) => {
                  const t = e.target as HTMLTextAreaElement;
                  t.style.height = "auto";
                  t.style.height = `${Math.min(t.scrollHeight, 120)}px`;
                }}
              />
              <Button
                type="button"
                size="icon"
                disabled={!input.trim() || isStreaming}
                onClick={() => sendMessage(input)}
                className="h-10 w-10 rounded-lg shrink-0"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Deck Display */}
      {generatedDeck && (
        <div className="flex-1 min-h-0 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-semibold text-foreground">{generatedDeck.name}</h2>
              <p className="text-xs text-muted-foreground">{generatedDeck.format} · {generatedDeck.colors}</p>
            </div>
            {isAuthenticated ? (
              <Button
                onClick={handleSaveDeck}
                disabled={isSaving}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
                Save Deck
              </Button>
            ) : (
              <Button
                onClick={login}
                variant="outline"
                size="sm"
                className="gap-2 border-primary/40 text-primary hover:bg-primary/10"
              >
                <LogIn className="w-3.5 h-3.5" />
                Log in to save
              </Button>
            )}
          </div>
          <DeckDisplay deck={generatedDeck} />
        </div>
      )}
    </div>
  );
}
