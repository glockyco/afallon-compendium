import { expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { ArtifactStore } from "@afallon/artifacts";
import { isStaticDocument, staticResourceEdges, type StaticResource, type VerifiedPublicationGraph, type StaticRootManifest } from "@afallon/contracts/public";
import { writeStaticJson } from "../../../packages/publication/src/resources";
import { selectPublication, verifyPublicationGraph, type PublicationCandidateResource } from "../../../packages/publication/src/selection";
import { publishFromPlan } from "../../../packages/publication/src/application";
import { publicationFixture } from "../../../packages/publication/src/publication-fixture.test";
import { verifyPublicationGraph as verifyFileGraph } from "../../site/scripts/publication-graph";
import { stagePublication } from "../../site/scripts/stage-publication";
import { verifyPublicationParity } from "../../site/scripts/publication-parity";

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
  await mkdir(join(directory, "art"), { recursive: true });
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
    await mkdir(join(site, "static"), { recursive: true });
    stagePublication(options.publicationRoot, site, selectedDirectory);
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
        name: "page-document-identity", error: "Page document identity mismatch",
        mutate: (_publication, resources) => {
          for (const resource of resources.values()) if (isStaticDocument(resource)) {
            resource.document.ref.key = `${resource.document.ref.kind}:other`;
            break;
          }
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
      expect(() => stagePublication(handoffRoot, site, selectedDirectory)).toThrow(corruption.error);
      expect(await readFile(metadataPath)).toEqual(metadataBytes);
      for (const [file, bytes] of stagedBytes) expect(await readFile(join(stagedDirectory, file))).toEqual(bytes);
    }

    const parityDirectory = join(root, "parity-candidate");
    await writeUncheckedGraph(store, parityDirectory, candidate.root, candidate.resources, candidate.assets);
    const parityGraph = verifyFileGraph(parityDirectory, candidate.root.reference);
    await rm(parityDirectory, { recursive: true });
    verifyPublicationParity(parityGraph, selectedDirectory);
    const regressive = await rewriteGraph(store, graph, (_publication, resources) => {
      for (const resource of resources.values()) {
        if (resource.schemaVersion === "compendium.static-map.v2") resource.placements = [];
        if (resource.schemaVersion === "compendium.static-geometry.v1") resource.placements = [];
      }
    });
    const regressiveDirectory = join(handoffRoot, "regressive");
    await writeUncheckedGraph(store, regressiveDirectory, regressive.root, regressive.resources, candidate.assets);
    const regressiveGraph = verifyFileGraph(regressiveDirectory, regressive.root.reference);
    expect(() => verifyPublicationParity(regressiveGraph, selectedDirectory)).toThrow("placement coverage");
    await writeFile(join(handoffRoot, "selected.json"), JSON.stringify({ root: regressive.root.reference, directory: "regressive" }));
    expect(() => stagePublication(handoffRoot, site, selectedDirectory)).toThrow("placement coverage");
    expect(await readFile(metadataPath)).toEqual(metadataBytes);
    for (const [file, bytes] of stagedBytes) expect(await readFile(join(stagedDirectory, file))).toEqual(bytes);
  } finally { await rm(root, { recursive: true, force: true }); }
}, 60_000);
