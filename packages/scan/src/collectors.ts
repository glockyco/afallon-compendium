import { relative, resolve } from "node:path";
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
  PlacementIdentityResultSchema,
  SceneSourceIssuesSchema,
  SerializedAssetIndexSchema,
  SceneCatalogSchema,
  type CompendiumConfig,
  RelationshipsSchema,
  ScanCoverageSchema,
  SupportSchema,
  WorldInventorySchema,
  WorldSourcesSchema,
  canonicalJson,
  schemaRegistry,
  validateCanonicalIdentityAndCounts,
  type ObservationContext,
  type ScanCollectorFamily,
  type ScanCoverage,
  type ScanEvidenceArtifact,
  type ScanTarget,
} from "@afallon/contracts";
import { createProbeBundle, type ProbeBundle, type Runtime } from "@afallon/runtime";
import { collectorApplicability, targetIdentity } from "./plan";
import { collectSceneCatalog } from "@afallon/contracts/spatial";
import { PlacementRolesSchema } from "@afallon/contracts/catalog";
import { prepareSceneIdentities } from "./scene-identities";
import { collectPlacementRoles } from "./placement-roles";
import { collectNpcRoleFacts } from "./npc-roles";
import { collectFactionRoleFacts } from "./faction-roles";
import { ScanCollectionError, validateInventoryContext, validateObservationContext, validateTargetContext } from "./observation";

import canonicalSource from "./probes/collectors/canonical.csx" with { type: "text" };
import localizationSource from "./probes/collectors/localization.csx" with { type: "text" };
import { createWorldInventoryBundle } from "./inventory-probe";
import addressable_locationsSource from "./probes/collectors/addressable-locations.csx" with { type: "text" };
import npc_producersSource from "./probes/collectors/npc-producers.csx" with { type: "text" };
import world_sourcesSource from "./probes/collectors/world-sources.csx" with { type: "text" };
import placement_snapshotSource from "./probes/collectors/placement-snapshot.csx" with { type: "text" };
import faction_rolesSource from "./probes/collectors/faction-roles.csx" with { type: "text" };
import relationshipsSource from "./probes/collectors/relationships.csx" with { type: "text" };
import loot_rulesSource from "./probes/collectors/loot-rules.csx" with { type: "text" };
import supportSource from "./probes/collectors/support.csx" with { type: "text" };
import map_geometrySource from "./probes/collectors/map-geometry.csx" with { type: "text" };
import navigation_geometrySource from "./probes/collectors/navigation-geometry.csx" with { type: "text" };
import conditionsSource from "./probes/collectors/conditions.csx" with { type: "text" };

const COLLECTOR_SOURCES: Record<string, string> = {
  "canonical": canonicalSource,
  "localization": localizationSource,
  "addressable-locations": addressable_locationsSource,
  "npc-producers": npc_producersSource,
  "world-sources": world_sourcesSource,
  "placement-snapshot": placement_snapshotSource,
  "faction-roles": faction_rolesSource,
  "relationships": relationshipsSource,
  "loot-rules": loot_rulesSource,
  "support": supportSource,
  "map-geometry": map_geometrySource,
  "navigation-geometry": navigation_geometrySource,
  "conditions": conditionsSource,
};

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
  return Promise.all([
    ...DEFINITIONS.map(async definition => ({
      family: definition.family,
      name: definition.name,
      bundle: await createProbeBundle({
        id: `scan/${definition.name}`,
        schema: definition.schema,
        modules: definition.modules.map(name => ({ id: `collector/${name}`, source: COLLECTOR_SOURCES[name]! })),
      }),
    })),
    createWorldInventoryBundle().then(bundle => ({ family: "inventory" as const, name: "world-inventory", bundle })),
  ]);
}

type ContentIdentity = ScanEvidenceArtifact["content"];
export type ScanEvidenceRegistrar = (file: string, name: string, schemaId: string | null, inputs: readonly ContentIdentity[]) => Promise<ContentIdentity>;

export const DERIVED_SCAN_SCHEMAS = [PlacementIdentityResultSchema, PlacementRolesSchema, SceneSourceIssuesSchema, SerializedAssetIndexSchema, SceneCatalogSchema, ScanCoverageSchema] as const;

export class ScanCollectorSuite {
  constructor(
    private readonly runtime: Runtime,
    private readonly config: CompendiumConfig,
    private readonly buildId: string,
    private readonly bundles: readonly ScanCollectorBundle[],
  ) {}

  async collect(target: ScanTarget, outputDirectory: string, register: ScanEvidenceRegistrar, expected?: ObservationContext["started"]): Promise<readonly CollectedScanEvidence[]> {
    const applicable = new Set(collectorApplicability(target).filter(row => row.status === "collect").map(row => row.family));
    const results: CollectedScanEvidence[] = [];
    const byName = new Map<string, CollectedScanEvidence>();
    let boundary = expected;
    const derive = async (family: ScanCollectorFamily, name: string, schema: TSchema, value: unknown, observationContext: ObservationContext | null, context: ContentIdentity | null, inputs: readonly ContentIdentity[], identities: readonly string[] = []): Promise<CollectedScanEvidence> => {
      Assert(schema, value);
      const file = resolve(outputDirectory, `${name}.json`);
      await Bun.write(file, `${canonicalJson(value)}\n`);
      const registered = schemaRegistry.identify(schema);
      const content = await register(file, `${name}.json`, registered.id, [...inputs, ...(context === null ? [] : [context])]);
      const entry: CollectedScanEvidence = { artifact: { family, name, schema: { id: registered.id, sha256: registered.sha256 }, content, observationContext: context, inputs: [...inputs], authoredIdentities: [...new Set(identities)].sort() }, value, observationContext };
      results.push(entry);
      byName.set(name, entry);
      return entry;
    };
    try {
      for (const collector of this.bundles) {
        if (!applicable.has(collector.family)) continue;
        const outputFile = resolve(outputDirectory, `${collector.name}.json`);
        const result = await this.runtime.runProbe(collector.bundle, outputFile, { parameters: { researchCharacter: this.config.character }, captureContext: true });
        const content = await register(outputFile, `${collector.name}.json`, collector.bundle.schemaIdentity.id, []);
        if (content.sha256 !== result.reference.sha256 || content.bytes !== result.reference.byteSize) throw new Error(`Collector ${collector.name} changed before registration.`);
        const contextFile = resolve(outputDirectory, `${collector.name}.context.json`);
        await Bun.write(contextFile, `${canonicalJson(result.observationContext)}\n`);
        const contextIdentity = await register(contextFile, `${collector.name}.context.json`, schemaRegistry.identify(ObservationContextSchema).id, []);
        const context = validateObservationContext(result.observationContext, this.config.character, `Collector ${collector.name}`, boundary);
        validateTargetContext(target, context);
        boundary ??= context.started;
        const entry: CollectedScanEvidence = { artifact: { family: collector.family, name: collector.name, schema: collector.bundle.schemaIdentity, content, observationContext: contextIdentity, inputs: [], authoredIdentities: [] }, value: result.value, observationContext: context };
        results.push(entry);
        byName.set(collector.name, entry);
      }
      const required = (name: string): CollectedScanEvidence => {
        const entry = byName.get(name);
        if (entry === undefined) throw new Error(`Required collector ${name} is missing.`);
        return entry;
      };
      const snapshotEntry = required("placement-snapshot");
      const snapshot = snapshotEntry.value;
      const graph = required("addressable-locations").value;
      const inventoryEntry = required("world-inventory");
      const inventory = inventoryEntry.value;
      Assert(PlacementSnapshotSchema, snapshot);
      Assert(AddressableGraphSchema, graph);
      Assert(WorldInventorySchema, inventory);
      validateInventoryContext(inventory, inventoryEntry.observationContext!);
      if (target.kind === "streamed-source") {
        const sources = inventory.addressableSources.filter(source => source.sourceKey === target.sourceKey && "scene" in source.owner && source.owner.scene.currentGameSceneNativeId === target.sceneNativeId);
        const source = sources.length === 1 ? sources[0] : undefined;
        const guid = source !== undefined && "assetGuid" in source ? source.assetGuid : null;
        const streams = guid === null ? [] : snapshot.streams.filter(stream => stream.assetGuid === guid);
        const stream = streams.length === 1 ? streams[0] : undefined;
        if (stream === undefined || !stream.isLoaded || stream.isLoading || !stream.hasInstanceHandle || stream.loadedRootInstanceId === null) throw new Error(`Streamed target ${target.sourceKey} has no unambiguous loaded root in its placement evidence.`);
      }
      const context = snapshotEntry.observationContext!;
      if (snapshot.context.character !== this.config.character || snapshot.context.scene.handle !== context.started.scene.handle || snapshot.context.scene.path !== context.started.scene.path || snapshot.context.gameSceneNativeId !== context.started.gameSceneNativeId) throw new Error("Placement snapshot does not match its observation context.");
      const rawInputs = new Map<string, ContentIdentity>();
      const prepared = await prepareSceneIdentities(this.config, this.runtime, this.buildId, snapshot, graph, outputDirectory, async (file, expected) => {
        if (rawInputs.has(expected.sha256)) return;
        const identity = await register(file, `serialized-inputs/${expected.sha256}`, null, []);
        if (identity.sha256 !== expected.sha256 || identity.bytes !== expected.bytes) throw new Error("Installed serialized input changed during extraction.");
        rawInputs.set(identity.sha256, identity);
      });
      const indexInputs: ContentIdentity[] = [];
      for (const index of prepared.indexes) {
        const inputs = [index.value.source, ...index.value.dependencies].map(file => ({ sha256: file.sha256, bytes: file.bytes }));
        const name = relative(outputDirectory, index.path).replaceAll("\\", "/").replace(/\.json$/, "");
        const entry = await derive("placements", name, SerializedAssetIndexSchema, index.value, context, snapshotEntry.artifact.observationContext, inputs);
        indexInputs.push(entry.artifact.content);
      }
      await derive("placements", "source-issues", SceneSourceIssuesSchema, prepared.issues, context, snapshotEntry.artifact.observationContext, [snapshotEntry.artifact.content, required("addressable-locations").artifact.content, ...indexInputs]);
      const identities = await derive("placements", "placement-identities", PlacementIdentityResultSchema, prepared.result, context, snapshotEntry.artifact.observationContext, [snapshotEntry.artifact.content, ...indexInputs], prepared.result.identities.flatMap(row => [row.placementId, row.sourceId]));
      const npc = required("npc-producers").value;
      const world = required("world-sources").value;
      const canonical = required("canonical").value;
      const relationships = required("relationships").value;
      const faction = required("faction-roles").value;
      Assert(NpcProducersSchema, npc);
      Assert(WorldSourcesSchema, world);
      Assert(CanonicalSchema, canonical);
      validateCanonicalIdentityAndCounts(canonical);
      Assert(RelationshipsSchema, relationships);
      Assert(FactionRolesSchema, faction);
      const roles = collectPlacementRoles(snapshot, prepared.result, npc, world, collectNpcRoleFacts(canonical, relationships, collectFactionRoleFacts(faction)));
      await derive("roles", "placement-roles", PlacementRolesSchema, roles, context, snapshotEntry.artifact.observationContext, [identities.artifact.content, ...["placement-snapshot", "npc-producers", "world-sources", "canonical", "relationships", "faction-roles"].map(name => required(name).artifact.content)], roles.placements.map(row => row.placementId));
      await derive("spatial", "scene-catalog", SceneCatalogSchema, collectSceneCatalog(this.buildId, inventory), inventoryEntry.observationContext, inventoryEntry.artifact.observationContext, [inventoryEntry.artifact.content]);
      await derive("coverage", "coverage", ScanCoverageSchema, buildCoverage(target, results), null, null, results.map(entry => entry.artifact.content));
      return results;
    } catch (error) {
      throw new ScanCollectionError(results.map(entry => entry.artifact), error);
    }
  }
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
