import { expect, test } from "bun:test";
import { chmod, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PUBLICATION_ESSENTIAL_BUDGET, type StaticCoverage, type StaticDocument, type StaticPages, type StaticRootManifest, type StaticSearchIndex } from "@afallon/contracts/public";
import { writeStaticJson } from "./resources";
import { selectPublication, type PublicationCandidateResource } from "./selection";
import { publishFromPlan } from "./application";
import { publicationFixture } from "./publication-fixture.test";

type StaticItemDocument = Extract<StaticDocument, { kind: "items" }>;

const gate = { accepted: true, complete: false };

function replaceResource(resources: readonly PublicationCandidateResource[], priorPath: string, next: PublicationCandidateResource): PublicationCandidateResource[] {
  return resources.map((resource) => resource.reference.path === priorPath ? next : resource);
}

test("rejects broken v3 edges and damaged reuse without replacing the selected publication", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-publication-select-"));
  try {
    const { store, plan, options } = await publicationFixture(root);
    const generated = await publishFromPlan(store, plan, { ...options, select: false });
    const publicationRoot = join(root, "publication");
    const selected = await selectPublication(store, publicationRoot, generated.root, generated.resources, generated.assets, gate);
    const selectedBytes = await readFile(join(publicationRoot, "selected.json"), "utf8");
    await selectPublication(store, publicationRoot, generated.root, generated.resources, generated.assets, gate);

    const coverageCandidate = generated.resources.find((resource) => resource.reference.schemaId === "compendium.static-coverage.v1")!;
    await expect(selectPublication(store, publicationRoot, generated.root, generated.resources.filter((resource) => resource !== coverageCandidate), generated.assets, gate)).rejects.toThrow("missing");
    await expect(selectPublication(store, publicationRoot, { reference: { ...generated.root.reference, sha256: "f".repeat(64) }, identity: generated.root.identity }, generated.resources, generated.assets, gate)).rejects.toThrow("reference");
    await expect(selectPublication(store, publicationRoot, generated.root, generated.resources, generated.assets, { ...gate, accepted: false })).rejects.toThrow("catalog gate");

    const unsafeRoot = await writeStaticJson(store, generated.manifest.schemaVersion, { ...generated.manifest, coverage: { ...generated.manifest.coverage, path: "../escape.json" } });
    await expect(selectPublication(store, publicationRoot, unsafeRoot, generated.resources, generated.assets, gate)).rejects.toThrow();

    const coverage = JSON.parse(await readFile(store.objectPath(coverageCandidate.identity.sha256), "utf8")) as StaticCoverage;
    const wrongCoverage = await writeStaticJson<StaticCoverage>(store, coverage.schemaVersion, { ...coverage, buildId: "other" });
    const wrongBuildRoot = await writeStaticJson<StaticRootManifest>(store, generated.manifest.schemaVersion, { ...generated.manifest, coverage: wrongCoverage.reference });
    await expect(selectPublication(store, publicationRoot, wrongBuildRoot, replaceResource(generated.resources, coverageCandidate.reference.path, wrongCoverage), generated.assets, gate)).rejects.toThrow("build mismatch");

    const largeCoverage = await writeStaticJson<StaticCoverage>(store, coverage.schemaVersion, { ...coverage, messages: ["x".repeat(PUBLICATION_ESSENTIAL_BUDGET)] });
    const oversizedRoot = await writeStaticJson<StaticRootManifest>(store, generated.manifest.schemaVersion, { ...generated.manifest, coverage: largeCoverage.reference });
    await expect(selectPublication(store, publicationRoot, oversizedRoot, replaceResource(generated.resources, coverageCandidate.reference.path, largeCoverage), generated.assets, gate)).rejects.toThrow();
    expect(await readFile(join(publicationRoot, "selected.json"), "utf8")).toBe(selectedBytes);

    const document = generated.resources.find((resource) => resource.reference.schemaId === "compendium.static-item.v1")!;
    const copiedDocument = join(publicationRoot, selected.directory, document.reference.path);
    await chmod(copiedDocument, 0o644);
    await writeFile(copiedDocument, "damaged");
    await expect(selectPublication(store, publicationRoot, generated.root, generated.resources, generated.assets, gate)).rejects.toThrow("mismatch");
    expect(await readFile(join(publicationRoot, "selected.json"), "utf8")).toBe(selectedBytes);
  } finally { await rm(root, { recursive: true, force: true }); }
}, 60_000);

test("names the referencing document and key when a referenced document is not published", async () => {
  const root = await mkdtemp(join(tmpdir(), "afallon-publication-reference-audit-"));
  try {
    const { store, plan, options } = await publicationFixture(root);
    const generated = await publishFromPlan(store, plan, { ...options, select: false });
    const itemCandidate = generated.resources.find((resource) => resource.reference.schemaId === "compendium.static-item.v1")!;
    const item = JSON.parse(await readFile(store.objectPath(itemCandidate.identity.sha256), "utf8")) as StaticItemDocument;
    const badItem = await writeStaticJson<StaticItemDocument>(store, item.schemaVersion, {
      ...item,
      document: { ...item.document, facts: { ...item.document.facts, enchantment: { key: "items:404", kind: "items", name: "Missing item", slug: "missing-item" } } },
    });

    const pagesCandidate = generated.resources.find((resource) => resource.reference.schemaId === "compendium.static-pages.v1")!;
    const pages = JSON.parse(await readFile(store.objectPath(pagesCandidate.identity.sha256), "utf8")) as StaticPages;
    const badPages = await writeStaticJson<StaticPages>(store, pages.schemaVersion, { ...pages,
      entries: pages.entries.map((entry) => entry.document.path === itemCandidate.reference.path ? { ...entry, document: badItem.reference } : entry) });
    const searchCandidates = generated.resources.filter((resource) => resource.reference.schemaId === "compendium.static-search.v3");
    const badSearch = await Promise.all(searchCandidates.map(async (candidate) => {
      const search = JSON.parse(await readFile(store.objectPath(candidate.identity.sha256), "utf8")) as StaticSearchIndex;
      return await writeStaticJson<StaticSearchIndex>(store, search.schemaVersion, { ...search,
        entries: search.entries.map((entry) => entry.document?.path === itemCandidate.reference.path ? { ...entry, document: badItem.reference } : entry) });
    }));
    const searchByPath = new Map(searchCandidates.map((candidate, index) => [candidate.reference.path, badSearch[index]!]));
    const badRoot = await writeStaticJson<StaticRootManifest>(store, generated.manifest.schemaVersion, { ...generated.manifest,
      pages: badPages.reference, search: generated.manifest.search.map((reference) => searchByPath.get(reference.path)?.reference ?? reference) });
    let resources = replaceResource(generated.resources, itemCandidate.reference.path, badItem);
    resources = replaceResource(resources, pagesCandidate.reference.path, badPages);
    for (const candidate of searchCandidates) resources = replaceResource(resources, candidate.reference.path, searchByPath.get(candidate.reference.path)!);
    await expect(selectPublication(store, options.publicationRoot, badRoot, resources, generated.assets, gate))
      .rejects.toThrow(new RegExp(`Reference to an unpublished entity items:404 in resources/${badItem.identity.sha256}\\.json`));
  } finally { await rm(root, { recursive: true, force: true }); }
}, 60_000);
