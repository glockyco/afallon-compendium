import { expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readCaptureArtifactJson } from "./capture-cache";

const bytes = Buffer.from('{"state":"dirty"}');
const reference = { path: "receipt.json", bytes: bytes.byteLength, sha256: createHash("sha256").update(bytes).digest("hex") };

test("capture receipt decoding rejects replacement bytes of the same length", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-cache-"));
  try {
    await Bun.write(join(root, reference.path), bytes);
    expect(await readCaptureArtifactJson(root, reference)).toEqual({ state: "dirty" });
    await Bun.write(join(root, reference.path), '{"state":"clean"}');
    await expect(readCaptureArtifactJson(root, reference)).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("a matching capture receipt hash cannot authorize an escaping symlink", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-cache-"));
  try {
    const run = join(root, "run");
    await mkdir(run);
    const outside = join(root, "outside.json");
    await Bun.write(outside, bytes);
    await symlink(outside, join(run, reference.path));
    await expect(readCaptureArtifactJson(run, reference)).rejects.toThrow();
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
