import { expect, test } from "bun:test";
import type { StaticResourceReference, StaticRootManifest } from "@afallon/contracts/public";
import { AtlasDataLoader } from "./atlas-data";

function resource(value: unknown, schemaId: string): { bytes: Uint8Array; reference: StaticResourceReference } {
  const bytes = new TextEncoder().encode(`${JSON.stringify(value)}\n`);
  const sha256 = new Bun.CryptoHasher("sha256").update(bytes).digest("hex");
  return { bytes, reference: { path: `resources/${sha256}.json`, sha256, bytes: bytes.byteLength, schemaId } };
}

test("deduplicates loaded and failed atlas requests with stable states", async () => {
  const identity = { buildId: "build", catalogId: "c".repeat(64) };
  const entityIndex = resource({ schemaVersion: "compendium.static-entity-search.v1", ...identity, entities: [] }, "compendium.static-entity-search.v1");
  const itemIndex = resource({ schemaVersion: "compendium.static-item-search.v1", ...identity, items: [] }, "compendium.static-item-search.v1");
  const coverage = resource({ schemaVersion: "compendium.static-coverage.v1", ...identity, complete: false, unresolvedIssueCount: 1, occurrenceCount: 1, exclusionCount: 0, messages: ["Incomplete"] }, "compendium.static-coverage.v1");
  const root: StaticRootManifest = { schemaVersion: "compendium.static-root.v1", ...identity, mode: "preview", complete: false, maps: [{ mapSpaceId: "missing", label: "Missing", bounds: { min: { x: 0, y: 0 }, max: { x: 1, y: 1 } }, data: { ...coverage.reference, schemaId: "compendium.static-map.v1" }, imagery: { ...coverage.reference, schemaId: "compendium.static-imagery.v1" } }], entitySearch: entityIndex.reference, itemSearch: itemIndex.reference, guides: { overview: coverage.reference }, coverage: coverage.reference };
  const bodies = new Map<string, Uint8Array>([
    ["publication.json", new TextEncoder().encode(JSON.stringify(root))],
    [entityIndex.reference.path, entityIndex.bytes],
    [itemIndex.reference.path, itemIndex.bytes],
  ]);
  const counts = new Map<string, number>();
  const fetcher = async (input: string | URL | Request): Promise<Response> => {
    const pathname = new URL(input instanceof Request ? input.url : input).pathname.replace(/^\/data\//, "");
    counts.set(pathname, (counts.get(pathname) ?? 0) + 1);
    const body = bodies.get(pathname);
    return body ? new Response(new TextDecoder().decode(body)) : new Response("missing", { status: 404 });
  };
  const loader = new AtlasDataLoader(fetcher, "https://atlas.invalid/data/");
  const [first, second] = await Promise.all([loader.loadIndexes(), loader.loadIndexes()]);
  expect(second).toEqual(first);
  expect(counts).toEqual(new Map([["publication.json", 1], [entityIndex.reference.path, 1], [itemIndex.reference.path, 1]]));
  expect(loader.state(entityIndex.reference.path)).toEqual({ status: "loaded" });

  const failure = loader.loadMap("missing");
  await expect(failure).rejects.toThrow("request failed");
  await expect(loader.loadMap("missing")).rejects.toThrow("request failed");
  expect(counts.get(coverage.reference.path)).toBe(1);
  expect(loader.state(coverage.reference.path)).toMatchObject({ status: "error" });
  expect(counts.get("publication.json")).toBe(1);
});
