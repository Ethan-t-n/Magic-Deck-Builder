import { cn } from "@/lib/utils";
import { Sparkles, User } from "lucide-react";

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  onOptionSelect?: (option: string) => void;
}

function parseInline(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[2] !== undefined) {
      parts.push(<strong key={idx++} className="font-semibold text-foreground">{match[2]}</strong>);
    } else if (match[3] !== undefined) {
      parts.push(<em key={idx++} className="italic">{match[3]}</em>);
    } else if (match[4] !== undefined) {
      parts.push(
        <code key={idx++} className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[0.8em] font-mono">
          {match[4]}
        </code>
      );
    }
    last = match.index + match[0].length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

interface ParsedContent {
  preamble: string[];
  options: { label: string; value: string }[];
  postamble: string[];
}

function parseContent(raw: string): ParsedContent {
  const lines = raw.split("\n");
  const optionRegex = /^(\d+)[.)]\s+(.+)$/;
  const bulletRegex = /^[-•*]\s+(.+)$/;

  let optionStart = -1;
  let optionEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (optionRegex.test(trimmed) || bulletRegex.test(trimmed)) {
      if (optionStart === -1) optionStart = i;
      optionEnd = i;
    } else if (optionStart !== -1 && trimmed !== "") {
      break;
    }
  }

  if (optionStart === -1) {
    return { preamble: lines, options: [], postamble: [] };
  }

  const preamble = lines.slice(0, optionStart).filter((l) => l.trim() !== "" || optionStart === 0);
  const postamble = lines.slice(optionEnd + 1).filter((l) => l.trim() !== "");
  const options: { label: string; value: string }[] = [];

  for (let i = optionStart; i <= optionEnd; i++) {
    const trimmed = lines[i].trim();
    const numMatch = optionRegex.exec(trimmed);
    const bulletMatch = bulletRegex.exec(trimmed);
    if (numMatch) {
      options.push({ label: numMatch[2], value: numMatch[2] });
    } else if (bulletMatch) {
      options.push({ label: bulletMatch[1], value: bulletMatch[1] });
    }
  }

  return { preamble, options, postamble };
}

export function ChatMessage({ role, content, onOptionSelect }: ChatMessageProps) {
  const displayContent = content.replace(/```deck-json[\s\S]*?```/g, "").trim();
  if (!displayContent) return null;

  const isUser = role === "user";

  if (isUser) {
    return (
      <div className="flex w-full py-1.5 justify-end">
        <div className="flex max-w-[80%] gap-2.5 items-end flex-row-reverse">
          <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center bg-primary/20 text-primary shadow-sm">
            <User size={13} />
          </div>
          <div className="px-4 py-2.5 rounded-2xl rounded-br-sm text-sm leading-relaxed bg-primary text-primary-foreground shadow-md shadow-primary/20">
            {displayContent}
          </div>
        </div>
      </div>
    );
  }

  const { preamble, options, postamble } = parseContent(displayContent);
  const hasOptions = options.length >= 2;

  return (
    <div className="flex w-full py-1.5 justify-start">
      <div className="flex max-w-[88%] gap-2.5 items-start flex-row">
        <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 bg-gradient-to-br from-primary to-violet-600 text-white shadow-md shadow-primary/30">
          <Sparkles size={13} />
        </div>

        <div className="flex flex-col gap-2 min-w-0">
          <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-secondary/50 border border-border/60 text-foreground shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] to-transparent pointer-events-none" />
            <div className="relative space-y-1">
              {preamble.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2" />;
                return (
                  <p key={i}>{parseInline(trimmed)}</p>
                );
              })}
            </div>
          </div>

          {hasOptions && (
            <div className="flex flex-wrap gap-2 pl-1">
              {options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => onOptionSelect?.(opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-150 border",
                    "bg-secondary/40 border-border/60 text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary hover:shadow-md hover:shadow-primary/25 hover:scale-[1.03] active:scale-100"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {postamble.length > 0 && (
            <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed bg-secondary/50 border border-border/60 text-foreground shadow-sm">
              {postamble.map((line, i) => {
                const trimmed = line.trim();
                if (!trimmed) return <div key={i} className="h-2" />;
                return <p key={i}>{parseInline(trimmed)}</p>;
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
