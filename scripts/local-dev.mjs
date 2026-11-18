import { spawn, spawnSync } from "node:child_process";
import net from "node:net";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
process.chdir(root);
if (existsSync(".env")) process.loadEnvFile(".env");
const env = { ...process.env, LOCAL_DEV: "1", NODE_ENV: "development" };
const children = [];
let stopping = false;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill("SIGTERM");
  const wait = children.map(child => child.exitCode !== null || child.signalCode !== null
    ? Promise.resolve()
    : new Promise(resolve => child.once("exit", resolve)));
  Promise.all(wait).then(() => process.exit(code));
  setTimeout(() => process.exit(code), 5000).unref();
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());

for (const port of [3001, 5173]) {
  await new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(port, "127.0.0.1", () => probe.close(resolve));
  }).catch(() => {
    console.error(`Port ${port} is already in use. Stop the previous dev server and retry.`);
    process.exit(1);
  });
}

const build = spawnSync("pnpm", ["--filter", "@workspace/api-server", "build"], { env, stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);

const api = spawn(process.execPath, ["--enable-source-maps", "artifacts/api-server/dist/index.mjs"], {
  env: { ...env, PORT: "3001" }, stdio: "inherit",
});
children.push(api);
api.on("error", error => { console.error(error.message); stop(1); });
api.on("exit", code => { if (!stopping) stop(code ?? 1); });

let ready = false;
for (let attempt = 0; attempt < 120 && !stopping; attempt++) {
  try {
    const response = await fetch("http://127.0.0.1:3001/api/healthz", { signal: AbortSignal.timeout(500) });
    if (response.ok) { ready = true; break; }
  } catch {}
  await new Promise(resolve => setTimeout(resolve, 500));
}
if (!ready) {
  console.error("The backend could not start. Check the error above.");
  stop(1);
} else {
  const webRoot = path.join(root, "artifacts/mtg-deck-builder");
  const web = spawn(process.execPath, [path.join(webRoot, "node_modules/vite/bin/vite.js"), "--config", "vite.config.ts", "--host", "127.0.0.1"], {
    cwd: webRoot,
    env: { ...env, PORT: "5173", BASE_PATH: "/", LOCAL_API_URL: "http://127.0.0.1:3001" },
    stdio: "inherit",
  });
  children.push(web);
  web.on("error", error => { console.error(error.message); stop(1); });
  web.on("exit", code => { if (!stopping) stop(code ?? 1); });
  console.log("\nOpen http://localhost:5173. Decks are saved in .local/decksmith.");
  console.log("For local AI, see LOCAL_DEVELOPMENT.md. Press Ctrl+C to stop both servers.\n");
}
