import { expect, test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ContentIdentitySchema, SchemaIdentityReferenceSchema } from "@afallon/contracts";
import { createProbeBundle } from "./probes";

test("probe bundle identity covers ordered modules and output schema", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-probe-bundle-"));
  try {
    const support = join(root, "support.csx");
    const collector = join(root, "collector.csx");
    await writeFile(support, "var answer = 41;\n");
    await writeFile(collector, "return new { value = answer + 1 };\n");
    const definition = {
      id: "smoke.collector",
      schema: ContentIdentitySchema,
      modules: [{ id: "support", path: support }, { id: "collector", path: collector }],
    } as const;

    const first = await createProbeBundle(definition);
    const repeated = await createProbeBundle(definition);
    expect(repeated.sha256).toBe(first.sha256);
    expect(repeated.source).toBe(first.source);
    expect(first.modules.map(module => module.id)).toEqual(["support", "collector"]);

    const reordered = await createProbeBundle({ ...definition, modules: [...definition.modules].reverse() });
    expect(reordered.sha256).not.toBe(first.sha256);
    const anotherSchema = await createProbeBundle({ ...definition, schema: SchemaIdentityReferenceSchema });
    expect(anotherSchema.sha256).not.toBe(first.sha256);
    await writeFile(support, "var answer = 42;\n");
    const changed = await createProbeBundle(definition);
    expect(changed.sha256).not.toBe(first.sha256);
    expect(changed.modules[0]?.sha256).not.toBe(first.modules[0]?.sha256);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
