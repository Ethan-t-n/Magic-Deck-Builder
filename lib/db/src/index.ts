import { drizzle } from "drizzle-orm/node-postgres";
import { drizzle as drizzleLocal } from "drizzle-orm/pglite";
import { PGlite } from "@electric-sql/pglite";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import pg from "pg";
import * as schema from "./schema";

const local = process.env.LOCAL_DEV === "1";
if (!local && !process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required. For local development, run pnpm dev from the project root.");
}

export const pool = local ? null : new pg.Pool({ connectionString: process.env.DATABASE_URL });
const localPath = process.env.LOCAL_DATABASE_PATH ?? path.resolve(".local/decksmith");
if (local) await mkdir(path.dirname(localPath), { recursive: true });
export const localDatabase = local ? new PGlite(localPath) : null;

if (localDatabase) {
  // Local schema initialization is idempotent. Hosted Postgres uses its existing migrations.
  await localDatabase.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY, title TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS messages (
      id SERIAL PRIMARY KEY, conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      role TEXT NOT NULL, content TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS decks (
      id SERIAL PRIMARY KEY, name TEXT NOT NULL, format TEXT NOT NULL, colors TEXT NOT NULL,
      strategy TEXT NOT NULL, conversation_id INTEGER, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS deck_cards (
      id SERIAL PRIMARY KEY, deck_id INTEGER NOT NULL, card_name TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 1, section TEXT NOT NULL,
      scryfall_id TEXT, image_uri TEXT, mana_cost TEXT, type_line TEXT
    );
  `);
}

export const db = localDatabase
  ? drizzleLocal(localDatabase, { schema })
  : drizzle(pool!, { schema });

export * from "./schema";
