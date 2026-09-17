import { expect, test } from "bun:test";
import { ContentIdentitySchema, SchemaIdentityReferenceSchema } from "@afallon/contracts";
import { createProbeBundle } from "./probes";

test("probe bundle identity covers executable text, module order, and output schema", async () => {
  const definition = {
    id: "smoke.collector",
    schema: ContentIdentitySchema,
    modules: [
      { id: "support", source: "var answer = 41;\n" },
      { id: "collector", source: "return new { value = answer + 1 };\n" },
    ],
  } as const;
  const first = await createProbeBundle(definition);
  const repeated = await createProbeBundle(definition);
  expect(repeated.sha256).toBe(first.sha256);
  expect(repeated.source).toBe(first.source);
  const reordered = await createProbeBundle({ ...definition, modules: [...definition.modules].reverse() });
  expect(reordered.sha256).not.toBe(first.sha256);
  const anotherSchema = await createProbeBundle({ ...definition, schema: SchemaIdentityReferenceSchema });
  expect(anotherSchema.sha256).not.toBe(first.sha256);
  const changed = await createProbeBundle({ ...definition, modules: [{ id: "support", source: "var answer = 42;\n" }, definition.modules[1]] });
  expect(changed.sha256).not.toBe(first.sha256);
  expect(changed.modules[0]?.sha256).not.toBe(first.modules[0]?.sha256);
});
