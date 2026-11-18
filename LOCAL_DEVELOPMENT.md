# Run on your computer

Requires Node.js 22.15+ (Node 24 is also supported) and pnpm.

From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://localhost:5173. The command starts the backend and frontend together. It creates a local Postgres-compatible database automatically in `.local/decksmith`. Saved decks and conversations survive restarts. This mode signs you in as a single local player and listens on your computer's loopback interface. Stop it with Ctrl+C. Run only one instance per project directory.

Card lookup and Commander checks require an internet connection to Scryfall. Chat requires a running AI provider. Until one is configured, sending a message shows setup instructions.

## Free local chat with Ollama

Install Ollama from https://ollama.com/download and start its application. In another terminal, install a model that fits your computer, for example:

```sh
ollama pull qwen3:8b
```

This downloads model weights and uses your computer's RAM and processor when answering. Speed and deck quality depend on the model and hardware. Smaller models may struggle with a complete Commander list.

Copy `.env.example` to `.env`. Enable these settings:

```dotenv
OPENAI_BASE_URL=http://localhost:11434/v1
OPENAI_MODEL=qwen3:8b
OPENAI_API_KEY=ollama
```

Restart `pnpm dev`. You can also configure an OpenAI-compatible hosted provider using its base URL, API key, and model. Provider usage may incur charges. Replit's managed credentials are selected first when present.

## Replit

The original Replit start commands continue to use the configured PostgreSQL database and Replit authentication. Use `pnpm dev` for single-user development on your own computer.
