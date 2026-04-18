import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { decksTable, deckCardsTable } from "@workspace/db";
import {
  SaveDeckBody,
  GetDeckParams,
  DeleteDeckParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/decks", async (_req, res): Promise<void> => {
  const decks = await db
    .select()
    .from(decksTable)
    .orderBy(desc(decksTable.createdAt));
  res.json(decks);
});

router.post("/decks", async (req, res): Promise<void> => {
  const parsed = SaveDeckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { cards, ...deckData } = parsed.data;

  const [deck] = await db.insert(decksTable).values(deckData).returning();

  if (cards && cards.length > 0) {
    await db.insert(deckCardsTable).values(
      cards.map((card) => ({
        deckId: deck.id,
        cardName: card.cardName,
        quantity: card.quantity,
        section: card.section,
        scryfallId: card.scryfallId ?? null,
        imageUri: card.imageUri ?? null,
        manaCost: card.manaCost ?? null,
        typeLine: card.typeLine ?? null,
      }))
    );
  }

  res.status(201).json(deck);
});

router.get("/decks/:id", async (req, res): Promise<void> => {
  const params = GetDeckParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deck] = await db
    .select()
    .from(decksTable)
    .where(eq(decksTable.id, params.data.id));

  if (!deck) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }

  const cards = await db
    .select()
    .from(deckCardsTable)
    .where(eq(deckCardsTable.deckId, params.data.id));

  res.json({ ...deck, cards });
});

router.delete("/decks/:id", async (req, res): Promise<void> => {
  const params = DeleteDeckParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  await db
    .delete(deckCardsTable)
    .where(eq(deckCardsTable.deckId, params.data.id));

  const [deleted] = await db
    .delete(decksTable)
    .where(eq(decksTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "Deck not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
