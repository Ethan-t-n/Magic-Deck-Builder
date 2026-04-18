import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CardImage } from "./card-image";
import { ScrollArea } from "@/components/ui/scroll-area";
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

interface DeckDisplayProps {
  deck: ParsedDeck;
}

export function DeckDisplay({ deck }: DeckDisplayProps) {
  const sections = Array.from(new Set(deck.cards.map((c) => c.section)));
  
  const groupedCards = sections.reduce((acc, section) => {
    acc[section] = deck.cards.filter((c) => c.section === section);
    return acc;
  }, {} as Record<string, ParsedDeckCard[]>);

  const totalCards = deck.cards.reduce((sum, card) => sum + card.quantity, 0);

  return (
    <div className="w-full h-full flex flex-col gap-4">
      <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
        <h2 className="text-3xl font-serif font-bold text-primary mb-2">{deck.name}</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <Badge variant="secondary" className="font-serif">{deck.format}</Badge>
          <Badge variant="outline" className="border-primary/50 text-primary/90">{deck.colors}</Badge>
          <Badge variant="outline">{totalCards} Cards</Badge>
        </div>
        <p className="text-muted-foreground italic text-sm">{deck.strategy}</p>
      </div>

      <Tabs defaultValue="gallery" className="flex-1 flex flex-col h-full overflow-hidden">
        <TabsList className="w-full justify-start bg-card/50 border border-border/50 rounded-t-xl rounded-b-none p-1">
          <TabsTrigger value="gallery" className="font-serif tracking-wide">Card Gallery</TabsTrigger>
          <TabsTrigger value="list" className="font-serif tracking-wide">Card List</TabsTrigger>
        </TabsList>
        
        <div className="flex-1 bg-card/30 border border-t-0 border-border/50 rounded-b-xl overflow-hidden relative">
          <ScrollArea className="h-[600px] w-full p-6">
            <TabsContent value="gallery" className="mt-0">
              <div className="space-y-12">
                {sections.map((section) => {
                  const sectionCards = groupedCards[section];
                  const sectionTotal = sectionCards.reduce((sum, c) => sum + c.quantity, 0);
                  
                  return (
                    <div key={section} className="space-y-6">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl font-serif font-semibold text-foreground/90">{section}</h3>
                        <div className="h-px flex-1 bg-border/50"></div>
                        <span className="text-muted-foreground font-serif">{sectionTotal}</span>
                      </div>
                      
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {sectionCards.map((card, idx) => (
                          <CardImage key={idx} cardName={card.cardName} quantity={card.quantity} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>
            
            <TabsContent value="list" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {sections.map((section) => {
                  const sectionCards = groupedCards[section];
                  const sectionTotal = sectionCards.reduce((sum, c) => sum + c.quantity, 0);
                  
                  return (
                    <div key={section} className="space-y-4">
                      <h3 className="text-lg font-serif font-semibold text-primary border-b border-border/50 pb-2">
                        {section} <span className="text-muted-foreground text-sm ml-2">({sectionTotal})</span>
                      </h3>
                      <ul className="space-y-2">
                        {sectionCards.map((card, idx) => (
                          <li key={idx} className="flex items-start justify-between group">
                            <span className="text-muted-foreground w-6 text-right mr-3 font-mono text-sm group-hover:text-primary transition-colors">
                              {card.quantity}x
                            </span>
                            <span className="flex-1 font-medium group-hover:text-primary transition-colors">
                              {card.cardName}
                            </span>
                            {card.manaCost && (
                              <span className="text-xs font-mono text-muted-foreground ml-2">
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
          </ScrollArea>
        </div>
      </Tabs>
    </div>
  );
}
