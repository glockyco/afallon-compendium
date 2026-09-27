// Operator tool: quits Afallon through the owned HotRepl connection. The quit request runs as a runtime cleanup
// callback, so the release writes its clean receipt before the game shuts down at the end of that frame. The tool
// then waits until the HotRepl listener closes.
// usage: bun tools/update/quit-game.ts CONFIG
import { connect } from "node:net";
import { loadConfig } from "../../apps/compendium-cli/src/config";
import { withRuntime } from "@afallon/runtime";

if (!Bun.argv[2]) throw new Error("usage: quit-game CONFIG");
const config = await loadConfig(Bun.argv[2]);
await withRuntime(config, async (runtime) => {
  await runtime.evaluate<boolean>("registerRuntimeCleanup(new System.Action(() => UnityEngine.Application.Quit())) != null");
});

// A TCP connection proves that the listener exists without taking the single WebSocket client.
const listening = (host: string, port: number) => new Promise<boolean>((resolve) => {
  const socket = connect({ host, port });
  socket.once("connect", () => { socket.destroy(); resolve(true); });
  socket.once("error", () => resolve(false));
});
const endpoint = new URL(config.hotreplUrl);
const deadline = Date.now() + 60000;
while (await listening(endpoint.hostname, Number(endpoint.port))) {
  if (Date.now() > deadline) throw new Error(`Afallon still listens on ${endpoint.host} 60 seconds after the quit request.`);
  await Bun.sleep(500);
}
console.log("Afallon quit after a clean runtime release.");
