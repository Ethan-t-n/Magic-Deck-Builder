# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2)

## Applications

### MTG Deck Builder (`artifacts/mtg-deck-builder`)
- AI-powered Magic: The Gathering deck builder web app
- Chat interface where users describe desired decks
- AI provides recommendations first, then generates the full 60-card deck
- Card list view (grouped by section) and card gallery (Scryfall images)
- Saved decks browsing at `/decks`
- Dark arcane "Grimoire" theme

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## AI Integration

Uses Replit AI Integrations (OpenAI) — no API key needed, billed to Replit credits.
Environment vars: `AI_INTEGRATIONS_OPENAI_BASE_URL`, `AI_INTEGRATIONS_OPENAI_API_KEY`

## Database Schema

- `conversations` — Chat conversations (from OpenAI integration template)
- `messages` — Chat messages per conversation
- `decks` — Saved MTG decks
- `deck_cards` — Individual cards in each deck

## API Routes

- `GET/POST /api/openai/conversations` — List/create conversations
- `GET/DELETE /api/openai/conversations/:id` — Get/delete conversation with messages
- `GET/POST /api/openai/conversations/:id/messages` — List messages / send message (SSE stream)
- `GET/POST /api/decks` — List/save decks
- `GET/DELETE /api/decks/:id` — Get/delete deck with cards

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
