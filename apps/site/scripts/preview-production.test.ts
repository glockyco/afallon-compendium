import { afterEach, expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { startProductionPreview } from "./preview-production";

const roots: string[] = [];
const servers: Bun.Server<unknown>[] = [];

afterEach(async () => {
  for (const server of servers.splice(0)) await server.stop(true);
  for (const root of roots.splice(0)) await rm(root, { recursive: true, force: true });
});

test("build preview falls back when the default port is occupied", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-preview-"));
  roots.push(root);
  await Promise.all([
    writeFile(join(root, "_headers"), "/*\n  X-Preview: yes\n"),
    writeFile(join(root, "index.html"), "<title>Preview fixture</title>"),
    writeFile(join(root, "404.html"), "not found"),
  ]);

  const blocker = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response("occupied") });
  servers.push(blocker);
  const preview = startProductionPreview(root, blocker.port);
  servers.push(preview);

  expect(preview.port).not.toBe(blocker.port);
  const response = await fetch(preview.url);
  expect(response.status).toBe(200);
  expect(response.headers.get("x-preview")).toBe("yes");
  expect(await response.text()).toContain("Preview fixture");
});
