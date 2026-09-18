import { expect, test } from "bun:test";
import { chmod, mkdir, mkdtemp, open, readdir, rm, writeFile } from "node:fs/promises";
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

test("temporary cleanup cannot hide an object stream failure", async () => fixture(async store => {
  const primary = new Error("source stream failed");
  await expect(store.putStream((async function* () {
    yield new TextEncoder().encode("partial evidence");
    const names = await readdir(store.temporaryRoot);
    expect(names).toHaveLength(1);
    const temporary = join(store.temporaryRoot, names[0]!);
    await rm(temporary);
    await mkdir(temporary);
    throw primary;
  })())).rejects.toBe(primary);
}));

test("temporary cleanup cannot hide a no-replace installation failure", async () => fixture(async store => {
  await expect(store.putBytes(new TextEncoder().encode("evidence"), {
    async protectPending() {
      const names = await readdir(store.temporaryRoot);
      expect(names).toHaveLength(1);
      const temporary = join(store.temporaryRoot, names[0]!);
      await rm(temporary);
      await mkdir(temporary);
    },
    async protect() { throw new Error("Unexpected successful object installation."); },
  })).rejects.toMatchObject({ code: "EPERM", syscall: "link" });
}));

test("verification rejects corruption beyond the first megabyte", async () => fixture(async store => {
  const block = new Uint8Array(1024 * 1024).fill(73);
  const stored = await store.putStream((async function* () {
    yield block;
    yield block;
    yield block;
    yield new Uint8Array([91]);
  })());
  expect((await store.verify(stored)).bytes).toBe(3 * block.byteLength + 1);
  const objectPath = store.objectPath(stored.sha256);
  await chmod(objectPath, 0o644);
  const handle = await open(objectPath, "r+");
  try { await handle.write(new Uint8Array([92]), 0, 1, stored.bytes - 1); }
  finally { await handle.close(); }
  await expect(store.verify(stored)).rejects.toMatchObject({ name: "ObjectIntegrityError", expectedSha256: stored.sha256 });
}));
