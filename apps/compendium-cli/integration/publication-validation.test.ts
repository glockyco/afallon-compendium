import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactStore } from "@afallon/artifacts";
import { PUBLICATION_SCHEMA_VERSION, expandEssentialPlacement, staticResourceEdges, type PublicationData, type StaticResource, type VerifiedPublicationGraph, type StaticRootManifest } from "@afallon/contracts/public";
import { writeStaticJson } from "../../../packages/publication/src/resources";
import { selectPublication, verifyPublicationGraph, type PublicationCandidateResource } from "../../../packages/publication/src/selection";
import { publishFromPlan } from "../../../packages/publication/src/application";
import { publicationFixture } from "../../../packages/publication/src/publication-fixture.test";
import { verifyPublicationGraph as verifyFileGraph } from "../../site/scripts/publication-graph";
import { stagePublication } from "../../site/scripts/stage-publication";
import { verifyPublicationParity } from "../../site/scripts/publication-parity";

function baselineFromGraph({ publication, resources }: VerifiedPublicationGraph): PublicationData {
  const baseline: PublicationData = {
    schemaVersion: PUBLICATION_SCHEMA_VERSION, buildId: publication.buildId, mode: publication.mode,
    coverage: { complete: publication.complete, messages: [], excludedPlacements: 0 },
    world: publication.world,
    maps: publication.maps.map(({ mapSpaceId, label, bounds }) => ({ mapSpaceId, label, bounds })),
    placements: [], regions: [], entityIndex: [], itemIndex: [], tileLayers: [],
  };
  for (const resource of resources.values()) {
    switch (resource.schemaVersion) {
      case "compendium.static-map.v2":
        baseline.placements.push(...resource.placements.map((placement) => expandEssentialPlacement(placement, resource.mapSpaceId)));
        baseline.regions.push(...resource.regions);
        break;
      case "compendium.static-imagery.v2":
        baseline.tileLayers.push(...resource.layers.map((layer) => ({ ...layer, tiles: layer.tiles.map(({ schemaId: _, ...tile }) => tile) })));
        break;
      case "compendium.static-entity-search.v2":
        baseline.entityIndex.push(...resource.entities.map(({ detail, ...entity }) => ({ ...entity, detailPath: detail.path })));
        break;
      case "compendium.static-item-search.v2":
        baseline.itemIndex.push(...resource.items.map(({ detail, source: _, ...item }) => ({ ...item, detailPath: detail.path })));
        break;
    }
  }
  return baseline;
}

async function rewriteGraph(store: ArtifactStore, graph: VerifiedPublicationGraph, mutate: (root: StaticRootManifest, resources: Map<string, StaticResource>) => void) {
  const root = structuredClone(graph.publication);
  const values = structuredClone(new Map(graph.resources));
  mutate(root, values);
  const rewritten = new Map<string, PublicationCandidateResource>();
  const rewrite = async (value: StaticResource): Promise<PublicationCandidateResource> => {
    for (const edge of staticResourceEdges(value)) {
      if (edge.schemaId !== "image/webp" && !rewritten.has(edge.path)) rewritten.set(edge.path, await rewrite(values.get(edge.path)!));
    }
    const updated: StaticResource = JSON.parse(JSON.stringify(value, (_key, entry: unknown) => {
      if (entry !== null && typeof entry === "object" && "path" in entry && typeof entry.path === "string") return rewritten.get(entry.path)?.reference ?? entry;
      return entry;
    }));
    return await writeStaticJson(store, updated.schemaVersion, updated);
  };
  const rootResource = await rewrite(root);
  return { root: rootResource, resources: [...rewritten.values()] };
}

async function writeUncheckedGraph(store: ArtifactStore, directory: string, root: PublicationCandidateResource, resources: readonly PublicationCandidateResource[], assets: readonly { path: string; identity: { sha256: string; bytes: number } }[]) {
  await mkdir(join(directory, "resources"), { recursive: true });
  await mkdir(join(directory, "assets"), { recursive: true });
  for (const file of [{ path: "publication.json", identity: root.identity }, ...resources.map((resource) => ({ path: resource.reference.path, identity: resource.identity })), ...assets]) {
    await writeFile(join(directory, file.path), await readFile(store.objectPath(file.identity.sha256)));
  }
}

test("rejects rehashed semantic corruption at both readers without replacing selectors or staged files", async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), "afallon-publication-semantics-")));
  try {
    const { store, plan, options } = await publicationFixture(root, "build", true);
    const candidate = await publishFromPlan(store, plan, options);
    const graph = await verifyPublicationGraph(store, candidate.root, candidate.resources, candidate.assets, candidate.gate);
    const selectedDirectory = join(options.publicationRoot, candidate.selection!.directory);
    const fileGraph = verifyFileGraph(selectedDirectory, candidate.root.reference);
    expect(fileGraph.publication).toEqual(graph.publication);
    expect([...fileGraph.references.keys()].sort()).toEqual([...graph.references.keys()].sort());
    for (const reference of fileGraph.references.values()) {
      expect(await readFile(join(selectedDirectory, reference.path))).toEqual(await readFile(store.objectPath(reference.sha256)));
    }
    expect(await readFile(join(selectedDirectory, "publication.json"))).toEqual(await readFile(store.objectPath(candidate.root.identity.sha256)));

    const site = join(root, "site");
    const baselinePath = join(site, "static", "data", "publication.json");
    await mkdir(join(site, "static", "data"), { recursive: true });
    await writeFile(baselinePath, JSON.stringify(baselineFromGraph(graph)));
    stagePublication(options.publicationRoot, site);
    const stagedDirectory = join(site, ".stage", "production", "static", "data");
    const stagedGraph = verifyFileGraph(stagedDirectory);
    const stagedBytes = new Map(await Promise.all([...stagedGraph.files].map(async (file) => [file, await readFile(join(stagedDirectory, file))] as const)));
    const selectedBytes = await readFile(join(options.publicationRoot, "selected.json"));
    const metadataPath = join(site, ".stage", "production", "static", "_deployment.json");
    const metadataBytes = await readFile(metadataPath);
    const handoffRoot = join(root, "handoff");

    const corruptions: Array<{ name: string; error: string; mutate: Parameters<typeof rewriteGraph>[2] }> = [
      {
        name: "foreign-geometry", error: "Geometry placement is missing from its map",
        mutate: (publication, resources) => {
          const world = publication.maps.find((map) => map.mapSpaceId === "world")!;
          const empty = publication.maps.find((map) => map.mapSpaceId === "empty")!;
          empty.optionalGeometry = world.optionalGeometry;
          world.optionalGeometry = [];
          for (const resource of resources.values()) {
            if (resource.schemaVersion === "compendium.static-map.v2" && resource.mapSpaceId === "world") for (const placement of resource.placements) placement[8] = null;
            if (resource.schemaVersion === "compendium.static-geometry.v1" && resource.mapSpaceId === "world") resource.mapSpaceId = "empty";
          }
        },
      },
      {
        name: "travel-state", error: "Travel marker state differs from its geometry",
        mutate: (_publication, resources) => {
          for (const resource of resources.values()) if (resource.schemaVersion === "compendium.static-geometry.v1") {
            for (const placement of resource.placements) if (placement.travel) placement.travel.enabled = !placement.travel.enabled;
          }
        },
      },
      {
        name: "detail-identity", error: "detail identity mismatch",
        mutate: (_publication, resources) => {
          for (const resource of resources.values()) if (resource.schemaVersion === "compendium.static-entity-detail.v1") resource.entity.entityKey = "items:other";
        },
      },
      {
        name: "coverage", error: "coverage does not match its root",
        mutate: (_publication, resources) => {
          for (const resource of resources.values()) if (resource.schemaVersion === "compendium.static-coverage.v1") resource.complete = !resource.complete;
        },
      },
    ];
    for (const corruption of corruptions) {
      const invalid = await rewriteGraph(store, graph, corruption.mutate);
      await expect(selectPublication(store, options.publicationRoot, invalid.root, invalid.resources, candidate.assets, candidate.gate)).rejects.toThrow(corruption.error);
      expect(await readFile(join(options.publicationRoot, "selected.json"))).toEqual(selectedBytes);
      const directory = join(handoffRoot, corruption.name);
      await writeUncheckedGraph(store, directory, invalid.root, invalid.resources, candidate.assets);
      expect(() => verifyFileGraph(directory, invalid.root.reference)).toThrow(corruption.error);
      await writeFile(join(handoffRoot, "selected.json"), JSON.stringify({ root: invalid.root.reference, directory: corruption.name }));
      expect(() => stagePublication(handoffRoot, site)).toThrow(corruption.error);
      expect(await readFile(metadataPath)).toEqual(metadataBytes);
      for (const [file, bytes] of stagedBytes) expect(await readFile(join(stagedDirectory, file))).toEqual(bytes);
    }

    const parityDirectory = join(root, "parity-candidate");
    await writeUncheckedGraph(store, parityDirectory, candidate.root, candidate.resources, candidate.assets);
    const parityGraph = verifyFileGraph(parityDirectory, candidate.root.reference);
    await rm(parityDirectory, { recursive: true });
    verifyPublicationParity(parityGraph, baselinePath);
    const regressive = await rewriteGraph(store, graph, (_publication, resources) => {
      for (const resource of resources.values()) {
        if (resource.schemaVersion === "compendium.static-map.v2") resource.placements = [];
        if (resource.schemaVersion === "compendium.static-geometry.v1") resource.placements = [];
      }
    });
    const regressiveDirectory = join(handoffRoot, "regressive");
    await writeUncheckedGraph(store, regressiveDirectory, regressive.root, regressive.resources, candidate.assets);
    const regressiveGraph = verifyFileGraph(regressiveDirectory, regressive.root.reference);
    expect(() => verifyPublicationParity(regressiveGraph, baselinePath)).toThrow("placement coverage");
    await writeFile(join(handoffRoot, "selected.json"), JSON.stringify({ root: regressive.root.reference, directory: "regressive" }));
    expect(() => stagePublication(handoffRoot, site)).toThrow("placement coverage");
    expect(await readFile(metadataPath)).toEqual(metadataBytes);
    for (const [file, bytes] of stagedBytes) expect(await readFile(join(stagedDirectory, file))).toEqual(bytes);
  } finally { await rm(root, { recursive: true, force: true }); }
}, 60_000);
