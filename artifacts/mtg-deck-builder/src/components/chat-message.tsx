import { cn } from "@/lib/utils";
import { Wand2, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
}

export function ChatMessage({ role, content }: ChatMessageProps) {
  const displayContent = content.replace(/```deck-json[\s\S]*?```/g, "").trim();
  if (!displayContent) return null;

  const isUser = role === "user";

  return (
    <div className={cn("flex w-full py-2", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex max-w-[85%] gap-2.5 items-start", isUser ? "flex-row-reverse" : "flex-row")}>
        <div className={cn(
          "flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5",
          isUser
            ? "bg-primary/15 text-primary"
            : "bg-secondary text-muted-foreground"
        )}>
          {isUser ? <User size={14} /> : <Wand2 size={14} />}
        </div>

        <div className={cn(
          "px-4 py-2.5 rounded-xl text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground rounded-tr-sm"
            : "bg-secondary/60 border border-border/50 text-foreground rounded-tl-sm"
        )}>
          {displayContent.split("\n").map((line, i, arr) => (
            <span key={i}>
              {line}
              {i < arr.length - 1 && <br />}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
