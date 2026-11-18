import { Router, type IRouter } from "express";
import { ollamaChat } from "../../lib/ollamaChat";
import { cardContext } from "../../lib/cardContext";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { conversations, messages } from "@workspace/db";
import { openai, aiConfigured, isOllama } from "@workspace/integrations-openai-ai-server/client";
import {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
  GetOpenaiConversationParams,
  DeleteOpenaiConversationParams,
  ListOpenaiMessagesParams,
  SendOpenaiMessageParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const MTG_SYSTEM_PROMPT = `You are a specialized Magic: The Gathering deck-building assistant. Your ONLY purpose is to help users build and discuss MTG decks.

STRICT SCOPE RULES:
- You ONLY discuss Magic: The Gathering deck building, card choices, formats, strategies, and rules.
- If a user asks about ANYTHING unrelated to MTG (e.g. other games, general topics, coding, writing, advice, etc.), you MUST politely decline and redirect them back to MTG deck building. Example: "I'm only here to help with Magic: The Gathering decks. What kind of deck would you like to build?"
- Never engage with off-topic requests, even if they seem harmless.

DECK BUILDING PROCESS:
1. Clarify only when missing information would materially change the build. If the user's request is sufficiently specific, build the full deck immediately and state any assumptions.

2. FULL DECK: Produce a complete list for the selected format.
   Include a special JSON block in EXACTLY this format:
   \`\`\`deck-json
   {
     "name": "Deck Name Here",
     "format": "Standard",
     "colors": "Red",
     "strategy": "Brief strategy description",
     "cards": [
       { "cardName": "Goblin Guide", "quantity": 4, "section": "Creatures", "manaCost": "{R}", "typeLine": "Creature — Goblin Scout" },
       { "cardName": "Lightning Bolt", "quantity": 4, "section": "Spells", "manaCost": "{R}", "typeLine": "Instant" },
       { "cardName": "Mountain", "quantity": 20, "section": "Lands", "manaCost": "", "typeLine": "Basic Land — Mountain" }
     ]
   }
   \`\`\`

   For Commander, mark the commander with the section "Commander" and include it in the total.
   Valid section values: "Commander", "Creatures", "Spells", "Lands", "Artifacts", "Enchantments", "Planeswalkers"
   Target card counts: 60 for Standard/Modern/Pioneer/Legacy, 40 for Draft/Sealed, 100 for Commander (including commander).
   After the JSON, briefly explain the key synergies.

3. FOLLOW-UPS: If a user wants to adjust the deck (swap cards, change strategy), help them refine it. Always use real, legal cards for the specified format.

Be concise, knowledgeable, and direct. Use proper MTG terminology.`;

router.get("/conversations", async (req, res): Promise<void> => {
  const convos = await db
    .select()
    .from(conversations)
    .orderBy(desc(conversations.createdAt));
  res.json(convos);
});

router.post("/conversations", async (req, res): Promise<void> => {
  const parsed = CreateOpenaiConversationBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [convo] = await db
    .insert(conversations)
    .values({ title: parsed.data.title })
    .returning();
  res.status(201).json(convo);
});

router.get("/conversations/:id", async (req, res): Promise<void> => {
  const params = GetOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [convo] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, params.data.id));
  if (!convo) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(messages.createdAt);
  res.json({ ...convo, messages: msgs });
});

router.delete("/conversations/:id", async (req, res): Promise<void> => {
  const params = DeleteOpenaiConversationParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [deleted] = await db
    .delete(conversations)
    .where(eq(conversations.id, params.data.id))
    .returning();
  if (!deleted) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }
  res.sendStatus(204);
});

router.get("/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = ListOpenaiMessagesParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const msgs = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, params.data.id))
    .orderBy(messages.createdAt);
  res.json(msgs);
});

router.post("/conversations/:id/messages", async (req, res): Promise<void> => {
  const params = SendOpenaiMessageParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const body = SendOpenaiMessageBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  if (!aiConfigured) {
    res.status(503).json({ error: "Chat needs an AI model. For a free local model, configure Ollama in .env as shown in LOCAL_DEVELOPMENT.md, then restart pnpm dev." });
    return;
  }

  const conversationId = params.data.id;
  const userContent = body.data.content;

  const [convo] = await db
    .select()
    .from(conversations)
    .where(eq(conversations.id, conversationId));
  if (!convo) {
    res.status(404).json({ error: "Conversation not found" });
    return;
  }

  await db.insert(messages).values({
    conversationId,
    role: "user",
    content: userContent,
  });

  const history = await db
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);

  const catalogContext = await cardContext(userContent);
  const chatMessages = [
    { role: "system" as const, content: MTG_SYSTEM_PROMPT },
    ...(catalogContext ? [{ role: "system" as const, content: catalogContext }] : []),
    ...history.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
  ];

  let stream;
  try {
    const model = process.env.OPENAI_MODEL ?? "gpt-5.2";
    stream = isOllama
      ? await ollamaChat(chatMessages, model,
          process.env.AI_INTEGRATIONS_OPENAI_BASE_URL ?? process.env.OPENAI_BASE_URL!, catalogContext ? 512 : 8192)
      : await openai.chat.completions.create({
          model,
          max_completion_tokens: 8192,
          messages: chatMessages,
          stream: true,
        });
  } catch (error) {
    req.log.error({ err: error }, "AI request failed");
    res.status(502).json({ error: "Could not reach the AI model. Check that your configured model server is running and the model is installed." });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  let fullResponse = "";
  try {

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content;
    if (content) {
      fullResponse += content;
      res.write(`data: ${JSON.stringify({ content })}\n\n`);
    }
  }

  if (!fullResponse.trim()) {
    res.write(`data: ${JSON.stringify({ error: "The model finished without an answer. Try a short question, and check the Ollama server output." })}\n\n`);
    res.end();
    return;
  }

  await db.insert(messages).values({
    conversationId,
    role: "assistant",
    content: fullResponse,
  });

  res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
  res.end();
  } catch (error) {
    req.log.error({ err: error }, "AI stream failed");
    res.write(`data: ${JSON.stringify({ error: "The AI response was interrupted. Please try again." })}\n\n`);
    res.end();
  }
});

export default router;
