import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardImage } from "./card-image";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useScryfallCard } from "@/lib/scryfall";
import { useToast } from "@/hooks/use-toast";
import { checkCommander, type CommanderCheck } from "@/lib/commander-check";
import { Badge } from "@/components/ui/badge";

export interface ParsedDeckCard {
  cardName: string;
  quantity: number;
  section: string;
  manaCost?: string;
  typeLine?: string;
}

export interface ParsedDeck {
  name: string;
  format: string;
  colors: string;
  strategy: string;
  cards: ParsedDeckCard[];
}

const SECTION_ORDER = ["Commander", "Creatures", "Spells", "Enchantments", "Artifacts", "Planeswalkers", "Lands"];

export function DeckDisplay({ deck }: { deck: ParsedDeck }) {
  const [selectedCard, setSelectedCard] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [check, setCheck] = useState<{ deck: ParsedDeck; result: CommanderCheck } | null>(null);
  const { card, loading, error } = useScryfallCard(selectedCard ?? "");
  const { toast } = useToast();
  const commander = deck.format.trim().toLowerCase() === "commander";

  async function copyDeck() {
    const sections = [deck.cards.filter(c => c.section.toLowerCase() === "commander"),
      deck.cards.filter(c => c.section.toLowerCase() !== "commander")];
    const lines = (cards: ParsedDeckCard[]) => cards.map(c => `${c.quantity} ${c.cardName}`).join("\n");
    const text = sections[0].length
      ? `Commander\n${lines(sections[0])}\n\nDeck\n${lines(sections[1])}`
      : lines(sections[1]);
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Decklist copied" });
    } catch {
      toast({ title: "Could not copy the decklist", variant: "destructive" });
    }
  }

  async function validate() {
    setChecking(true);
    const result = await checkCommander(deck.cards);
    setCheck({ deck, result });
    setChecking(false);
  }

  const sections = SECTION_ORDER.filter((s) => deck.cards.some((c) => c.section === s))
    .concat(deck.cards.map((c) => c.section).filter((s) => !SECTION_ORDER.includes(s)).filter((s, i, a) => a.indexOf(s) === i));

  const grouped = sections.reduce((acc, section) => {
    acc[section] = deck.cards.filter((c) => c.section === section);
    return acc;
  }, {} as Record<string, ParsedDeckCard[]>);

  const totalCards = deck.cards.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="flex-1 min-h-0 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <Tabs defaultValue="gallery" className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2 border-b border-border bg-background/40">
          <TabsList className="h-8 bg-secondary/40">
            <TabsTrigger value="gallery" className="text-xs h-6 px-3">Gallery</TabsTrigger>
            <TabsTrigger value="list" className="text-xs h-6 px-3">Card List</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-normal">{deck.format}</Badge>
            <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary">{deck.colors}</Badge>
            <span className="text-xs text-muted-foreground">{totalCards} cards</span>
            <Button size="sm" variant="outline" onClick={copyDeck}>Copy decklist</Button>
            {commander && <Button size="sm" variant="outline" onClick={validate} disabled={checking}>{checking ? "Checking…" : "Check Commander rules"}</Button>}
          </div>
        </div>

        {check?.deck === deck && <details className="border-b border-border px-4 py-2 text-sm" open>
          <summary>{check.result.summary}</summary>
          {check.result.issues.length > 0 && <ul className="list-disc pl-5 mt-1">
            {check.result.issues.map(issue => <li key={issue}>{issue}</li>)}
          </ul>}
        </details>}

        <div className="flex-1 overflow-y-auto">
          <TabsContent value="list" className="mt-0 p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {sections.map((section) => {
                const cards = grouped[section];
                const total = cards.reduce((sum, c) => sum + c.quantity, 0);
                return (
                  <div key={section}>
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border/60">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{total}</span>
                    </div>
                    <ul className="space-y-1">
                      {cards.map((card, i) => (
                        <li key={i} className="flex items-center gap-2 group">
                          <span className="text-xs font-mono text-muted-foreground w-5 text-right shrink-0">
                            {card.quantity}
                          </span>
                          <button type="button" onClick={() => setSelectedCard(card.cardName)} className="text-sm text-left text-foreground flex-1 hover:text-primary transition-colors truncate">
                            {card.cardName}
                          </button>
                          {card.manaCost && (
                            <span className="text-xs font-mono text-muted-foreground/60 shrink-0">
                              {card.manaCost}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="gallery" className="mt-0 p-4">
            <div className="space-y-8">
              {sections.map((section) => {
                const cards = grouped[section];
                const total = cards.reduce((sum, c) => sum + c.quantity, 0);
                return (
                  <div key={section}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{section}</span>
                      <div className="h-px flex-1 bg-border/40" />
                      <span className="text-xs text-muted-foreground tabular-nums">{total}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                      {cards.map((card, i) => (
                        <button key={i} type="button" onClick={() => setSelectedCard(card.cardName)} aria-label={`View ${card.cardName}, ${card.quantity} copies`}>
                          <CardImage cardName={card.cardName} quantity={card.quantity} />
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </div>
      </Tabs>
      <Dialog open={selectedCard !== null} onOpenChange={open => { if (!open) setSelectedCard(null); }}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{selectedCard}</DialogTitle></DialogHeader>
          {loading && <p>Loading card details…</p>}
          {error && <p>Could not find this card in Scryfall.</p>}
          {card && (card.card_faces?.length ? card.card_faces : [card]).map(face => (
            <div key={face.name} className="space-y-2">
              {face.image_uris && <img src={face.image_uris.normal} alt={face.name} className="w-40 rounded-lg" />}
              <p className="font-medium">{face.name}</p>
              <p className="text-sm text-muted-foreground">{face.type_line}</p>
              <p className="whitespace-pre-line text-sm">{face.oracle_text}</p>
            </div>
          ))}
        </DialogContent>
      </Dialog>
    </div>
  );
}
