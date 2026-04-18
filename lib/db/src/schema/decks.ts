import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const decksTable = pgTable("decks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  format: text("format").notNull(),
  colors: text("colors").notNull(),
  strategy: text("strategy").notNull(),
  conversationId: integer("conversation_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const deckCardsTable = pgTable("deck_cards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull(),
  cardName: text("card_name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  section: text("section").notNull(),
  scryfallId: text("scryfall_id"),
  imageUri: text("image_uri"),
  manaCost: text("mana_cost"),
  typeLine: text("type_line"),
});

export const insertDeckSchema = createInsertSchema(decksTable).omit({ id: true, createdAt: true });
export const insertDeckCardSchema = createInsertSchema(deckCardsTable).omit({ id: true });
export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type InsertDeckCard = z.infer<typeof insertDeckCardSchema>;
export type Deck = typeof decksTable.$inferSelect;
export type DeckCard = typeof deckCardsTable.$inferSelect;
