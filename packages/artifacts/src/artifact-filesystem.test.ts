import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createImmutableFile, replaceFileAtomically } from "./artifact-filesystem";

test("concurrent immutable creation admits one file without overwriting it", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-immutable-file-"));
  try {
    const destination = join(root, "manifest.json");
    const values = ["first\n", "second\n"];
    const attempts = await Promise.allSettled(values.map(value => createImmutableFile(destination, value, { finalMode: 0o444 })));
    const accepted = attempts.flatMap((attempt, index) => attempt.status === "fulfilled" ? [index] : []);
    expect(accepted).toHaveLength(1);
    const rejected = attempts.find(attempt => attempt.status === "rejected");
    expect(rejected).toMatchObject({ status: "rejected", reason: { code: "EEXIST" } });
    expect(await readFile(destination, "utf8")).toBe(values[accepted[0]!]!);
    expect(await readdir(root)).toEqual(["manifest.json"]);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test("failed atomic replacement retains the destination and removes its temporary file", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-atomic-file-"));
  try {
    const destination = join(root, "latest-success.json");
    await mkdir(destination);
    const retained = join(destination, "retained.json");
    await writeFile(retained, "retained selection\n");
    await expect(replaceFileAtomically(destination, "replacement\n")).rejects.toMatchObject({ code: "EISDIR" });
    expect(await readFile(retained, "utf8")).toBe("retained selection\n");
    expect(await readdir(root)).toEqual(["latest-success.json"]);
  } finally { await rm(root, { recursive: true, force: true }); }
});
