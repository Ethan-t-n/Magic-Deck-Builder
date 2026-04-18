import { cn } from "@/lib/utils";
import { Sparkles, User } from "lucide-react";
import { ParsedDeck } from "./deck-display";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  // Strip out the deck-json block for the chat bubble display
  const displayContent = content.replace(/```deck-json[\s\S]*?```/g, "");
  
  if (!displayContent.trim()) return null;

  const isUser = role === "user";

  return (
    <div className={cn("flex w-full mb-6", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[80%] gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
        <div className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center border",
          isUser 
            ? "bg-secondary/50 border-secondary text-secondary-foreground" 
            : "bg-primary/20 border-primary text-primary"
        )}>
          {isUser ? <User size={20} /> : <Sparkles size={20} />}
        </div>
        
        <div className={cn(
          "px-5 py-4 rounded-2xl",
          isUser 
            ? "bg-secondary/30 border border-secondary/50 text-foreground rounded-tr-sm" 
            : "bg-card border border-border/50 text-foreground rounded-tl-sm shadow-sm"
        )}>
          <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-background/50 prose-pre:border prose-pre:border-border">
            {displayContent.split('\n').map((line, i) => (
              <span key={i}>
                {line}
                {i !== displayContent.split('\n').length - 1 && <br />}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
