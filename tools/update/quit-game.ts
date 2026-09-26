// Operator tool: quits Afallon through the owned HotRepl connection, as the runtime skill requires.
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "../../apps/compendium-cli/src/config";
import { withRuntime } from "@afallon/runtime";
// usage: bun tools/update/quit-game.ts CONFIG
if (!Bun.argv[2]) throw new Error("usage: quit-game CONFIG");
const config = await loadConfig(Bun.argv[2]);
const output = resolve("artifacts/.work/quit-game");
await mkdir(output, { recursive: true });
await withRuntime(config, async (runtime) => {
  await runtime.probe("UnityEngine.Application.Quit(); return UnityEngine.Time.frameCount;", resolve(output, "quit.json"), { timeoutMs: 30000 });
}).catch((error) => console.log(`quit requested; ${error instanceof Error ? error.message.slice(0, 120) : String(error)}`));
