import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardImage } from "./card-image";
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

const SECTION_ORDER = ["Creatures", "Spells", "Enchantments", "Artifacts", "Planeswalkers", "Lands"];

export function DeckDisplay({ deck }: { deck: ParsedDeck }) {
  const sections = SECTION_ORDER.filter((s) => deck.cards.some((c) => c.section === s))
    .concat(deck.cards.map((c) => c.section).filter((s) => !SECTION_ORDER.includes(s)).filter((s, i, a) => a.indexOf(s) === i));

  const grouped = sections.reduce((acc, section) => {
    acc[section] = deck.cards.filter((c) => c.section === section);
    return acc;
  }, {} as Record<string, ParsedDeckCard[]>);

  const totalCards = deck.cards.reduce((sum, c) => sum + c.quantity, 0);

  return (
    <div className="flex-1 min-h-0 rounded-xl border border-border bg-card overflow-hidden flex flex-col">
      <Tabs defaultValue="list" className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background/40">
          <TabsList className="h-8 bg-secondary/40">
            <TabsTrigger value="list" className="text-xs h-6 px-3">Card List</TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs h-6 px-3">Gallery</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs font-normal">{deck.format}</Badge>
            <Badge variant="outline" className="text-xs font-normal border-primary/30 text-primary">{deck.colors}</Badge>
            <span className="text-xs text-muted-foreground">{totalCards} cards</span>
          </div>
        </div>

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
                          <span className="text-sm text-foreground flex-1 group-hover:text-primary transition-colors truncate">
                            {card.cardName}
                          </span>
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
                        <CardImage key={i} cardName={card.cardName} quantity={card.quantity} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
