// Operator tool: loads the configured research character from the main menu and waits until the world scene is
// active, so that `scan` and `capture` find a loaded character.
// usage: bun tools/update/load-character.ts CONFIG
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { loadConfig } from "../../apps/compendium-cli/src/config";
import { withRuntime } from "@afallon/runtime";

if (!Bun.argv[2]) throw new Error("usage: load-character CONFIG");
const config = await loadConfig(Bun.argv[2]);
const loadSource = await Bun.file(resolve(import.meta.dir, "load-character.csx")).text();
const stateSource = `return new { scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name, loaded = Il2Cpp.GameState.playerEntity != null, menu = Il2CppBLINK.RPGBuilder.Managers.MainMenuManager.Instance != null };`;
const output = resolve("artifacts/.work/load-character");
await mkdir(output, { recursive: true });

await withRuntime(config, async (runtime) => {
  const state = async () => (await runtime.probe(stateSource, resolve(output, "state.json"), { timeoutMs: 30000 })).value as { scene: string; loaded: boolean; menu: boolean };
  if ((await state()).menu) console.log(JSON.stringify((await runtime.probe(loadSource, resolve(output, "load.json"), { parameters: { researchCharacter: config.character }, timeoutMs: 60000 })).value));
  const deadline = Date.now() + 300000;
  while (Date.now() < deadline) {
    await Bun.sleep(2000);
    const current = await state();
    if (current.loaded && !current.menu) { console.log(JSON.stringify(current)); return; }
  }
  throw new Error("The research character did not finish loading.");
});
