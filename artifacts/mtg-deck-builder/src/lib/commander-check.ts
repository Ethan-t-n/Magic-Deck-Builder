import type { ScryfallCard } from "./scryfall";

type CardEntry = { cardName: string; quantity: number; section: string };
export type CommanderCheck = { summary: string; issues: string[] };

type CollectionResponse = { data: ScryfallCard[]; not_found: { name: string }[] };

function normalized(name: string) {
  return name.trim().toLowerCase();
}

export async function checkCommander(entries: CardEntry[]): Promise<CommanderCheck> {
  const issues: string[] = [];
  const total = entries.reduce((sum, entry) => sum + entry.quantity, 0);
  if (total !== 100) issues.push(`Commander requires 100 cards including the commander. This deck has ${total}.`);
  if (entries.some(entry => !Number.isSafeInteger(entry.quantity) || entry.quantity < 1)) {
    issues.push("Every card must have a positive whole-number quantity.");
  }
  const commanders = entries.filter(entry => normalized(entry.section) === "commander");
  if (commanders.length !== 1 || commanders[0]?.quantity !== 1) {
    return {
      summary: "Commander check incomplete",
      issues: [...issues, "This check supports one commander. Mark one card as Commander to run the remaining checks."],
    };
  }

  const names = [...new Map(entries.map(entry => [normalized(entry.cardName), entry.cardName.trim()])).values()];
  const cards = new Map<string, ScryfallCard>();
  try {
    for (let offset = 0; offset < names.length; offset += 75) {
      if (offset > 0) await new Promise(resolve => setTimeout(resolve, 120));
      const response = await fetch("https://api.scryfall.com/cards/collection", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ identifiers: names.slice(offset, offset + 75).map(name => ({ name })) }),
      });
      if (!response.ok) throw new Error("Scryfall lookup failed");
      const page: CollectionResponse = await response.json();
      for (const card of page.data) {
        cards.set(normalized(card.name), card);
        for (const face of card.card_faces ?? []) cards.set(normalized(face.name), card);
      }
    }
  } catch {
    return { summary: "Commander check unavailable", issues: [...issues, "Scryfall could not be reached. Try again."] };
  }

  const commander = cards.get(normalized(commanders[0].cardName));
  const commanderFace = commander?.card_faces?.[0] ?? commander;
  const commanderRules = commanderFace?.oracle_text ?? "";
  if (commander && !/^Legendary(?:\s+\w+)*\s+Creature\b/i.test(commanderFace?.type_line ?? "") &&
      !/can be your commander\b/i.test(commanderRules)) {
    issues.push(`${commander.name} cannot be a solo commander.`);
  }
  const quantities = new Map<string, { card: ScryfallCard; quantity: number }>();
  for (const entry of entries) {
    const card = cards.get(normalized(entry.cardName));
    if (!card) {
      issues.push(`Scryfall could not resolve ${entry.cardName}.`);
      continue;
    }
    const key = card.oracle_id ?? normalized(card.name);
    quantities.set(key, { card, quantity: (quantities.get(key)?.quantity ?? 0) + entry.quantity });
  }
  for (const { card, quantity } of quantities.values()) {
    if (card.legalities?.commander !== "legal") issues.push(`${card.name} is not legal in Commander.`);
    if (commander && card.color_identity?.some(color => !commander.color_identity?.includes(color))) {
      issues.push(`${card.name} is outside ${commander.name}’s color identity.`);
    }
    const rules = card.oracle_text ?? card.card_faces?.[0]?.oracle_text ?? "";
    const unlimited = /a deck can have any number of cards named /i.test(rules);
    const exception = /a deck can have up to (\w+) cards named /i.exec(rules);
    const limits: Record<string, number> = { seven: 7, nine: 9 };
    const limit = exception ? limits[exception[1].toLowerCase()] ?? Number(exception[1]) : 1;
    if (!/^Basic Land\b/i.test(card.type_line ?? "") && !unlimited) {
      if (!Number.isFinite(limit)) issues.push(`Check the copy limit for ${card.name} manually.`);
      else if (quantity > limit) issues.push(`${card.name} has ${quantity} copies, above its limit of ${limit}.`);
    }
  }
  return {
    summary: issues.length ? "Commander check found issues" : "Passed the supported Commander checks",
    issues: [...new Set(issues)],
  };
}
