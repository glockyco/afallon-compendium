import { createHash } from "node:crypto";
import { resolve } from "node:path";
import type { TSchema } from "typebox";
import { Assert } from "typebox/value";
import {
  AddressableGraphSchema,
  CanonicalSchema,
  FactionRolesSchema,
  LocalizationSchema,
  LootRulesSchema,
  MapGeometrySchema,
  NavigationGeometrySchema,
  NpcProducersSchema,
  ObservationContextSchema,
  PlacementSnapshotSchema,
  RelationshipsSchema,
  ScanCoverageSchema,
  SupportSchema,
  WorldInventorySchema,
  WorldSourcesSchema,
  canonicalJson,
  schemaRegistry,
  type ObservationContext,
  type ScanCollectorFamily,
  type ScanCoverage,
  type ScanEvidenceArtifact,
  type ScanTarget,
} from "@afallon/contracts";
import { createProbeBundle, type ProbeBundle, type Runtime } from "@afallon/runtime";
import { collectorApplicability, targetIdentity } from "./plan";

interface CollectorDefinition {
  readonly family: Exclude<ScanCollectorFamily, "coverage">;
  readonly name: string;
  readonly schema: TSchema;
  readonly modules: readonly string[];
}

export interface ScanCollectorBundle {
  readonly family: Exclude<ScanCollectorFamily, "coverage">;
  readonly name: string;
  readonly bundle: ProbeBundle;
}

export interface CollectedScanEvidence {
  readonly artifact: ScanEvidenceArtifact;
  readonly value: unknown;
  readonly observationContext: ObservationContext | null;
}

const DEFINITIONS: readonly CollectorDefinition[] = [
  { family: "canonical", name: "canonical", schema: CanonicalSchema, modules: ["canonical"] },
  { family: "canonical", name: "localization", schema: LocalizationSchema, modules: ["localization"] },
  { family: "inventory", name: "world-inventory", schema: WorldInventorySchema, modules: ["world-inventory"] },
  { family: "inventory", name: "addressable-locations", schema: AddressableGraphSchema, modules: ["addressable-locations"] },
  { family: "producers", name: "npc-producers", schema: NpcProducersSchema, modules: ["conditions", "npc-producers"] },
  { family: "producers", name: "world-sources", schema: WorldSourcesSchema, modules: ["conditions", "world-sources"] },
  { family: "placements", name: "placement-snapshot", schema: PlacementSnapshotSchema, modules: ["placement-snapshot"] },
  { family: "roles", name: "faction-roles", schema: FactionRolesSchema, modules: ["faction-roles"] },
  { family: "relationships", name: "relationships", schema: RelationshipsSchema, modules: ["conditions", "relationships"] },
  { family: "relationships", name: "loot-rules", schema: LootRulesSchema, modules: ["loot-rules"] },
  { family: "relationships", name: "support", schema: SupportSchema, modules: ["support"] },
  { family: "spatial", name: "map-geometry", schema: MapGeometrySchema, modules: ["map-geometry"] },
  { family: "spatial", name: "navigation-geometry", schema: NavigationGeometrySchema, modules: ["navigation-geometry"] },
];

export async function createScanCollectorBundles(): Promise<readonly ScanCollectorBundle[]> {
  return Promise.all(DEFINITIONS.map(async definition => ({
    family: definition.family,
    name: definition.name,
    bundle: await createProbeBundle({
      id: `scan/${definition.name}`,
      schema: definition.schema,
      modules: definition.modules.map(name => ({ id: `collector/${name}`, path: resolve(import.meta.dir, "probes/collectors", `${name}.csx`) })),
    }),
  })));
}

export class ScanCollectorSuite {
  constructor(
    private readonly runtime: Runtime,
    private readonly character: string,
    private readonly bundles: readonly ScanCollectorBundle[],
  ) {}

  async collect(target: ScanTarget, outputDirectory: string): Promise<readonly CollectedScanEvidence[]> {
    const applicable = new Set(collectorApplicability(target).filter(row => row.status === "collect").map(row => row.family));
    const results: CollectedScanEvidence[] = [];
    for (const collector of this.bundles) {
      if (!applicable.has(collector.family)) continue;
      const outputFile = resolve(outputDirectory, `${collector.name}.json`);
      const result = await this.runtime.runProbe(collector.bundle, outputFile, {
        parameters: { researchCharacter: this.character },
        captureContext: true,
      });
      Assert(ObservationContextSchema, result.observationContext);
      const context = result.observationContext;
      if (context.started.researchCharacter !== this.character || context.completed.researchCharacter !== this.character) throw new Error(`Collector ${collector.name} observed another character.`);
      if (context.started.scene.handle !== context.completed.scene.handle || context.started.gameSceneNativeId !== context.completed.gameSceneNativeId || context.completed.frame < context.started.frame) throw new Error(`Collector ${collector.name} crossed its observation boundary.`);
      await Bun.write(resolve(outputDirectory, `${collector.name}.context.json`), `${canonicalJson(context)}\n`);
      results.push({
        artifact: {
          family: collector.family,
          name: collector.name,
          schema: collector.bundle.schemaIdentity,
          content: { sha256: result.reference.sha256, bytes: result.reference.byteSize },
          authoredIdentities: authoredIdentities(result.value),
        },
        value: result.value,
        observationContext: context,
      });
    }
    const coverage = buildCoverage(target, results);
    const coverageText = `${canonicalJson(coverage)}\n`;
    await Bun.write(resolve(outputDirectory, "coverage.json"), coverageText);
    const registered = schemaRegistry.identify(ScanCoverageSchema);
    results.push({
      artifact: {
        family: "coverage",
        name: "coverage",
        schema: { id: registered.id, sha256: registered.sha256 },
        content: { sha256: createHash("sha256").update(coverageText).digest("hex"), bytes: Buffer.byteLength(coverageText) },
        authoredIdentities: [],
      },
      value: coverage,
      observationContext: null,
    });
    return results;
  }
}

function authoredIdentities(value: unknown): string[] {
  const identityKeys = new Set(["placementId", "sourceId", "sourceKey", "sourcePath"]);
  const identities = new Set<string>();
  const visit = (item: unknown): void => {
    if (Array.isArray(item)) {
      for (const child of item) visit(child);
      return;
    }
    if (item === null || typeof item !== "object") return;
    for (const [key, child] of Object.entries(item)) {
      if (identityKeys.has(key) && (typeof child === "string" || typeof child === "number")) identities.add(`${key}:${child}`);
      visit(child);
    }
  };
  visit(value);
  return [...identities].sort();
}

function buildCoverage(target: ScanTarget, evidence: readonly CollectedScanEvidence[]): ScanCoverage {
  const issues: ScanCoverage["issues"] = [];
  const visit = (collector: string, item: unknown, path: string): void => {
    if (Array.isArray(item)) {
      for (const [index, child] of item.entries()) visit(collector, child, `${path}/${index}`);
      return;
    }
    if (item === null || typeof item !== "object") return;
    const record = item as Record<string, unknown>;
    const detail = typeof record.detail === "string" ? record.detail : typeof record.message === "string" ? record.message : null;
    if (detail !== null && (path.includes("/unresolved/") || path.includes("/diagnostics/"))) issues.push({ collector, recordPath: path, detail });
    for (const [key, child] of Object.entries(record)) visit(collector, child, `${path}/${key}`);
  };
  for (const item of evidence) visit(item.artifact.name, item.value, "");
  issues.sort((left, right) => left.collector.localeCompare(right.collector) || left.recordPath.localeCompare(right.recordPath) || left.detail.localeCompare(right.detail));
  return { schemaVersion: "compendium.scan-coverage.v1", targetIdentity: targetIdentity(target), issues };
}
