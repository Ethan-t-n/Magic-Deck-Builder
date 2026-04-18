import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Save, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useCreateOpenaiConversation, useSaveDeck } from "@workspace/api-client-react";
import { ChatMessage } from "@/components/chat-message";
import { DeckDisplay, ParsedDeck } from "@/components/deck-display";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [generatedDeck, setGeneratedDeck] = useState<ParsedDeck | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const createConversation = useCreateOpenaiConversation();
  const saveDeckMutation = useSaveDeck();

  // Scroll to bottom when messages change
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
      } catch (e) {
        console.error("Failed to parse deck JSON", e);
        return null;
      }
    }
    return null;
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;

    const userMsg = input.trim();
    setInput("");
    
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setGeneratedDeck(null); // Clear previous deck when user sends a new message

    try {
      setIsStreaming(true);
      let currentConvId = conversationId;

      if (!currentConvId) {
        const conv = await createConversation.mutateAsync({
          data: { title: userMsg.substring(0, 50) }
        });
        currentConvId = conv.id;
        setConversationId(conv.id);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const response = await fetch(`/api/openai/conversations/${currentConvId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMsg }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop()!;
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.content) {
                fullContent += data.content;
                setMessages((prev) => {
                  const newMsgs = [...prev];
                  newMsgs[newMsgs.length - 1].content = fullContent;
                  return newMsgs;
                });
              }
              if (data.done) {
                const deck = extractDeckJson(fullContent);
                if (deck) {
                  setGeneratedDeck(deck);
                }
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Arcane interference",
        description: "Failed to communicate with the grimoire. Please try again.",
      });
    } finally {
      setIsStreaming(false);
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
          conversationId: conversationId,
          cards: generatedDeck.cards.map(c => ({
            cardName: c.cardName,
            quantity: c.quantity,
            section: c.section,
            manaCost: c.manaCost,
            typeLine: c.typeLine
          }))
        }
      });
      
      toast({
        title: "Deck preserved",
        description: `${generatedDeck.name} has been inscribed in your tome.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to save",
        description: "The spell faded before the deck could be saved.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-4 gap-6 h-[calc(100dvh-4rem)]">
      {/* Chat Section */}
      <div className={`flex flex-col ${generatedDeck ? 'h-[40vh]' : 'flex-1'} transition-all duration-500 ease-in-out`}>
        <div className="flex-1 bg-card/40 border border-border/50 rounded-2xl overflow-hidden flex flex-col backdrop-blur-sm relative shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-b from-background/10 to-background/40 pointer-events-none" />
          
          <ScrollArea className="flex-1 p-6 relative z-10">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-70 mt-20">
                <div className="w-20 h-20 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(var(--primary),0.2)]">
                  <Sparkles className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-2xl font-serif text-primary mb-2 tracking-wide">Consult the Grimoire</h2>
                <p className="max-w-md text-muted-foreground">
                  Speak your desires into the void. What kind of deck shall we weave today?
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-2 max-w-lg">
                  {["Aggressive Red Goblins", "Blue/Black Control", "Dinosaur Tribal", "Green Ramp"].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => setInput(`${suggestion} deck for Standard`)}
                      className="px-4 py-2 rounded-full border border-border/50 bg-background/50 hover:bg-primary/10 hover:border-primary/30 transition-colors text-sm text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto pb-4">
                {messages.map((msg, i) => (
                  <ChatMessage key={i} role={msg.role} content={msg.content} />
                ))}
                {isStreaming && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex justify-start mb-6">
                    <div className="flex max-w-[80%] gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border bg-primary/20 border-primary text-primary">
                        <Loader2 className="w-5 h-5 animate-spin" />
                      </div>
                      <div className="px-5 py-4 rounded-2xl bg-card border border-border/50 text-foreground rounded-tl-sm flex items-center">
                        <span className="flex space-x-1">
                          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={scrollRef} />
              </div>
            )}
          </ScrollArea>

          <div className="p-4 border-t border-border/50 bg-background/60 backdrop-blur-md relative z-10">
            <form onSubmit={handleSend} className="max-w-3xl mx-auto relative flex items-center">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Command the arcane..."
                disabled={isStreaming}
                className="w-full bg-card/80 border-border/50 h-14 pl-6 pr-14 rounded-full shadow-inner focus-visible:ring-primary/50 text-lg placeholder:font-serif placeholder:italic"
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={!input.trim() || isStreaming}
                className="absolute right-2 h-10 w-10 rounded-full"
              >
                {isStreaming ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              </Button>
            </form>
          </div>
        </div>
      </div>

      {/* Deck Display Section */}
      {generatedDeck && (
        <div className="flex-1 min-h-[50vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-serif text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Deck Materialized
            </h2>
            <Button 
              onClick={handleSaveDeck} 
              disabled={isSaving}
              variant="outline"
              className="border-primary/50 hover:bg-primary/20 font-serif"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Inscribe in Tome
            </Button>
          </div>
          <DeckDisplay deck={generatedDeck} />
        </div>
      )}
    </div>
  );
}
