import { expect, test } from "bun:test";
import { chmod, mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ArtifactStore, ObjectIntegrityError } from "./store";

async function fixture(run: (store: ArtifactStore, root: string) => Promise<void>): Promise<void> {
  const root = await mkdtemp(join(tmpdir(), "afallon-objects-"));
  try {
    await run(new ArtifactStore(root), root);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}

test("byte-identical streams share one immutable object", async () => fixture(async (store, root) => {
  const chunks = async function* () {
    yield new TextEncoder().encode("same ");
    yield new TextEncoder().encode("evidence");
  };
  const first = await store.putStream(chunks());
  const second = await store.putBytes(new TextEncoder().encode("same evidence"));

  expect(second).toEqual(first);
  expect(await readdir(join(root, "objects", "sha256", first.sha256.slice(0, 2)))).toEqual([first.sha256.slice(2)]);
  expect(await store.verify(first)).toEqual(first);
}));

test("a damaged object is rejected instead of replaced", async () => fixture(async (store) => {
  const original = new TextEncoder().encode("immutable evidence");
  const stored = await store.putBytes(original);
  const objectPath = store.objectPath(stored.sha256);
  await chmod(objectPath, 0o644);
  await writeFile(objectPath, "damaged evidence");

  await expect(store.putBytes(original)).rejects.toMatchObject({
    name: "ObjectIntegrityError",
    expectedSha256: stored.sha256,
  });
  await expect(store.verify(stored)).rejects.toBeInstanceOf(ObjectIntegrityError);
  expect(await Bun.file(objectPath).text()).toBe("damaged evidence");
}));
