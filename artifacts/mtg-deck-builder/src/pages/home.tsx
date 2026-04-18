import { useState, useRef, useEffect } from "react";
import { Send, Loader2, BookmarkPlus, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCreateOpenaiConversation, useSaveDeck } from "@workspace/api-client-react";
import { ChatMessage } from "@/components/chat-message";
import { DeckDisplay, ParsedDeck } from "@/components/deck-display";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Aggressive red goblin deck for Modern",
  "Blue/White control deck for Standard",
  "Green stompy ramp for Commander",
  "Black discard deck for Pioneer",
];

export function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [generatedDeck, setGeneratedDeck] = useState<ParsedDeck | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

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

  const handleSend = async (text?: string) => {
    const userMsg = (text ?? input).trim();
    if (!userMsg || isStreaming) return;
    setInput("");

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
      setMessages((prev) => prev.filter((_, i) => i !== prev.length - 1));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
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

  return (
    <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 py-4 gap-4 h-[calc(100dvh-3.5rem)]">
      {/* Chat area */}
      <div className={`flex flex-col transition-all duration-500 ${generatedDeck ? "h-[38vh] min-h-0" : "flex-1"}`}>
        <div className="flex-1 flex flex-col rounded-xl border border-border bg-card overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-5">
                  <Wand2 className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-1">Build your MTG deck</h2>
                <p className="text-sm text-muted-foreground max-w-sm mb-8">
                  Describe the deck you want — format, strategy, colors — and the AI will recommend cards and build the full list.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      data-testid={`suggestion-${s}`}
                      onClick={() => handleSend(s)}
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

          {/* Input area */}
          <div className="p-3 border-t border-border bg-background/60">
            <div className="max-w-3xl mx-auto flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the deck you want to build..."
                disabled={isStreaming}
                rows={1}
                data-testid="input-message"
                className="flex-1 resize-none bg-secondary/40 border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-colors disabled:opacity-50 min-h-[40px] max-h-[120px] overflow-y-auto"
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                }}
              />
              <Button
                type="button"
                size="icon"
                disabled={!input.trim() || isStreaming}
                onClick={() => handleSend()}
                data-testid="button-send"
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
            <Button
              onClick={handleSaveDeck}
              disabled={isSaving}
              variant="outline"
              size="sm"
              data-testid="button-save-deck"
              className="gap-2"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BookmarkPlus className="w-3.5 h-3.5" />}
              Save Deck
            </Button>
          </div>
          <DeckDisplay deck={generatedDeck} />
        </div>
      )}
    </div>
  );
}
