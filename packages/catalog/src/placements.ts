import { createHash } from "node:crypto";
import type { Canonical, LootRules, NpcProducersInput, PlacementIdentityResult, PlacementSnapshot, Relationships, WorldSources, MapGeometry, SpatialResolution } from "@afallon/contracts";
import type { ArtifactReference, NormalizedCondition, NormalizedDatabaseInput, NormalizedEntity, ItemSource, NormalizedPlacement, NormalizedRegion, NormalizedRegionGeometry, NormalizedPatrolPath, NormalizedSource, NormalizedSourceDetail, NormalizedSceneSpawn, NormalizedSpawnCandidate, EntityDetail, CategoryMetadata, CatalogCoverageState, PlacementRoles } from "@afallon/contracts/catalog";
import { entityKey, publicEntityDetails, stableJson } from "@afallon/contracts/catalog";
import { hashRelation } from "./database";
import { record, array, integerOrNull, pointer, sorted, compareText, jsonHash, type SceneContext, type SourceIdentityRow, type Blocker, type Exclusion } from "./context";
export function sourceIdentityRows(value: PlacementIdentityResult): SourceIdentityRow[] {
  return value.identities.map((row, identityIndex) => ({
    identityIndex,
    sourceId: row.sourceId,
    placementId: row.placementId,
    componentInstanceId: row.componentInstanceId,
    gameObjectInstanceId: row.gameObjectInstanceId,
    typeName: row.typeName,
    assembly: row.assembly,
    componentPathId: row.componentPathId,
    sceneSourceSha256: row.sceneSourceSha256,
    sourceSha256: row.sourceSha256,
    serializedFile: row.serializedFile,
    gameObjectPathId: row.gameObjectPathId,
    origin: row.origin,
    loaderSourceId: row.loaderSourceId,
    position: row.position,
  }));
}

type BindingResolution = { binding: NormalizedDatabaseInput["bindings"][number] | null; state: "resolved" | "outside" | "unresolved"; mapPosition: { x: number; y: number } | null; domainBindings: NormalizedDatabaseInput["bindings"] };

function bindingResolution(position: { x: number; y: number; z: number }, profile: NormalizedDatabaseInput["bindings"], resolver: { resolve(sceneNativeId: number, scenePath: string, position: { x: number; y: number; z: number }): SpatialResolution }, sceneNativeId: number, scenePath: string): BindingResolution {
  const resolution = resolver.resolve(sceneNativeId, scenePath, position);
  const candidate = resolution.candidates.length === 1 ? resolution.candidates[0] : undefined;
  if (!candidate) {
    // The position is outside every reviewed box of this scene, so the reviewer's boxes decided
    // against it. Every binding whose box domain rejected it is the evidence for that decision.
    const domainBindings = profile.filter((row) => row.sceneNativeId === sceneNativeId && row.scenePath === scenePath && row.domain.kind === "boxes");
    const outside = domainBindings.length > 0 && resolution.issues.some((issue) => issue.includes("outside the declared domain"));
    return { binding: null, state: outside ? "outside" : "unresolved", mapPosition: null, domainBindings: outside ? domainBindings : [] };
  }
  const binding = profile.find((row) => row.sceneNativeId === sceneNativeId && row.scenePath === scenePath && row.mapSpaceId === candidate.mapSpaceId && candidate.bindingIds.includes(row.id)) ?? null;
  return { binding, state: binding === null ? "unresolved" : "resolved", mapPosition: candidate.mapPosition, domainBindings: [] };
}

function recordPlacementResolution(resolved: BindingResolution, placementId: string, detail: string, profile: NormalizedDatabaseInput["bindings"], profileRef: ArtifactReference, blockers: Blocker[], exclusions: Exclusion[]): void {
  if (resolved.state === "outside") {
    exclusions.push({ kind: "outside-reviewed-domain", key: placementId, detail: "Placement lies outside every reviewed map-space domain box for its scene.", mapSpaceIds: [...new Set(resolved.domainBindings.map((binding) => binding.mapSpaceId))].sort(compareText), provenance: resolved.domainBindings.map((binding) => pointer(profileRef, `/bindings/${profile.indexOf(binding)}/domain`)) });
    return;
  }
  if (resolved.binding === null) blockers.push({ kind: "unresolved-placement-space", key: placementId, detail, provenance: [] });
}

function sourceEvidenceRow(context: SceneContext, value: unknown): SourceIdentityRow | null {
  const row = record(value); const component = row?.componentInstanceId;
  return typeof component === "number" ? context.sourceByComponent.get(component) ?? null : null;
}

export function owningContainerPlacement(path: string | null, sourcesByPath: ReadonlyMap<string, readonly string[]>, placementsBySource: ReadonlyMap<string, string>): string | null {
  if (path === null) return null;
  let separator = path.lastIndexOf("/");
  while (separator > 0) {
    const parent = path.slice(0, separator), placements = new Set((sourcesByPath.get(parent) ?? []).flatMap((sourceId) => { const placementId = placementsBySource.get(sourceId); return placementId === undefined ? [] : [placementId]; }));
    if (placements.size === 1) return [...placements][0]!;
    if (placements.size > 1) return null;
    separator = parent.lastIndexOf("/");
  }
  return null;
}

export function collectPlacements(contexts: SceneContext[], profile: NormalizedDatabaseInput["bindings"], resolver: { resolve(sceneNativeId: number, scenePath: string, position: { x: number; y: number; z: number }): SpatialResolution }, profileRef: ArtifactReference, blockers: Blocker[], exclusions: Exclusion[]): { placements: NormalizedPlacement[]; sources: NormalizedSource[]; roles: NormalizedDatabaseInput["roles"]; sourceForComponent: Map<string, string>; sourcePlacement: Map<string, string> } {
  const placementById = new Map<string, NormalizedPlacement>();
  const sourceById = new Map<string, NormalizedSource>();
  const roles: NormalizedDatabaseInput["roles"] = [];
  const sourceForComponent = new Map<string, string>();
  const sourcePlacement = new Map<string, string>();
  const identityByPlacement = new Map<string, SourceIdentityRow>();
  for (const context of contexts) {
    const roleRows = context.role;
    const identityRef = context.identityReference;
    const containerPlacementsBySource = new Map<string, string>(), containerRolePlacementIds = new Set<string>();
    for (const placement of roleRows.placements) for (const role of placement.roles) if (role.role === "container") { containerRolePlacementIds.add(placement.placementId); for (const sourceId of role.sourceIds) containerPlacementsBySource.set(sourceId, placement.placementId); }
    const sourcesByPath = new Map<string, string[]>();
    for (const collection of ["resourceProducers", "interactions", "containers", "services", "questZones", "transitions", "conditionSources", "mapIcons", "mapZones", "unsupportedSources"] as const) for (const value of context.world[collection]) {
      const row = record(value), source = row?.source, identity = sourceEvidenceRow(context, source), path = record(record(source)?.source)?.hierarchyPath;
      if (!identity || typeof path !== "string") continue;
      const sourceIds = sourcesByPath.get(path) ?? []; sourceIds.push(identity.sourceId); sourcesByPath.set(path, sourceIds);
    }
    const placementAliases = new Map<string, string>();
    for (const [index, value] of context.world.containers.entries()) {
      const row = record(value), source = row?.source, identity = sourceEvidenceRow(context, source), path = record(record(source)?.source)?.hierarchyPath;
      if (!identity || containerPlacementsBySource.has(identity.sourceId) || containerRolePlacementIds.has(identity.placementId)) continue;
      const ownerPlacementId = owningContainerPlacement(typeof path === "string" ? path : null, sourcesByPath, containerPlacementsBySource);
      if (ownerPlacementId !== null && ownerPlacementId !== identity.placementId) placementAliases.set(identity.sourceId, ownerPlacementId);
      else if (ownerPlacementId === null) blockers.push({ kind: "unresolved-container-owner", key: identity.sourceId, detail: "Container loot component has no unique ancestor placement with the container role.", provenance: [pointer(context.worldReference, `/containers/${index}/source`)] });
    }
    const identities = sourceIdentityRows(context.identities).map((row) => placementAliases.has(row.sourceId) ? { ...row, placementId: placementAliases.get(row.sourceId)! } : row);
    for (const row of identities) {
      const existing = sourceById.get(row.sourceId);
      if (existing && (existing.placementId !== row.placementId || existing.componentType !== row.typeName || existing.sceneSourceSha256 !== row.sceneSourceSha256 || existing.sourceSha256 !== row.sourceSha256 || existing.serializedFile !== row.serializedFile || existing.gameObjectPathId !== row.gameObjectPathId || existing.componentPathId !== row.componentPathId || existing.assembly !== row.assembly || existing.origin !== row.origin || existing.loaderSourceId !== row.loaderSourceId)) throw new Error(`Conflicting repeated source identity ${row.sourceId}.`);
      sourceById.set(row.sourceId, existing ?? { sourceId: row.sourceId, placementId: row.placementId, buildId: "", componentType: row.typeName, componentInstanceId: row.componentInstanceId, gameObjectInstanceId: row.gameObjectInstanceId, sceneSourceSha256: row.sceneSourceSha256, sourceSha256: row.sourceSha256, serializedFile: row.serializedFile, gameObjectPathId: row.gameObjectPathId, componentPathId: row.componentPathId, assembly: row.assembly, origin: row.origin, loaderSourceId: row.loaderSourceId, families: [], provenance: [pointer(identityRef, `/identities/${row.identityIndex}`)] });
      if (existing) existing.provenance.push(pointer(identityRef, `/identities/${row.identityIndex}`));
      if (!placementAliases.has(row.sourceId)) {
        const priorPlacementIdentity = identityByPlacement.get(row.placementId);
        if (priorPlacementIdentity && priorPlacementIdentity.sourceSha256 !== row.sourceSha256) throw new Error(`Conflicting repeated placement identity ${row.placementId}.`);
        if (!priorPlacementIdentity) identityByPlacement.set(row.placementId, row);
      }
      sourceForComponent.set(`${context.snapshotId}:${row.componentInstanceId}`, row.sourceId);
      sourcePlacement.set(row.sourceId, row.placementId);
    }
    const sources = new Map(roleRows.sources.map((row) => [row.sourceId, row]));
    for (const [sourceId, raw] of sources) {
      const normalized = sourceById.get(sourceId);
      if (!normalized) { blockers.push({ kind: "unresolved-source-identity", key: sourceId, detail: "Placement role source has no matching verified serialized source identity.", provenance: [] }); continue; }
      normalized.families = [...new Set([...normalized.families, ...raw.families])].sort(compareText);
      normalized.provenance.push(...raw.evidence.map((evidence) => pointer(context.roleEvidenceReferences[evidence.artifact], evidence.pointer)));
    }
    for (const [roleIndex, row] of roleRows.placements.entries()) {
      const position = row.position;
      const resolved = bindingResolution({ x: position.x, y: position.y, z: position.z }, profile, resolver, context.sceneNativeId, context.scenePath);
      recordPlacementResolution(resolved, row.placementId, `No reviewed map-space binding resolves ${context.scenePath}.`, profile, profileRef, blockers, exclusions);
      const requestedSourceIds = [...row.sourceIds].sort(compareText);
      for (const sourceId of requestedSourceIds) if (!sourceById.has(sourceId)) blockers.push({ kind: "unresolved-source-identity", key: sourceId, detail: `Placement ${row.placementId} references an unverified source identity.`, provenance: [] });
      const sourceIds = requestedSourceIds.filter((sourceId) => sourceById.has(sourceId));
      const identity = identityByPlacement.get(row.placementId);
      const placement: NormalizedPlacement = { placementId: row.placementId, buildId: "", sceneNativeId: context.sceneNativeId, scenePath: context.scenePath, identity: identity ? { sceneSourceSha256: identity.sceneSourceSha256, sourceSha256: identity.sourceSha256, serializedFile: identity.serializedFile, gameObjectPathId: identity.gameObjectPathId, origin: identity.origin, loaderSourceId: identity.loaderSourceId } : null, label: typeof row.label === "string" ? row.label : null, mapSpaceId: resolved.binding?.mapSpaceId ?? null, worldPosition: { x: position.x, y: position.y, z: position.z }, mapPosition: resolved.mapPosition, sourceIds, roles: [], shape: null, provenance: [pointer(profileRef, resolved.binding ? `/bindings/${profile.indexOf(resolved.binding)}` : ""), pointer(context.roleReference, `/placements/${roleIndex}`)] };
      const previous = placementById.get(placement.placementId);
      if (previous) {
        if (previous.sceneNativeId !== placement.sceneNativeId || previous.scenePath !== placement.scenePath) throw new Error(`Conflicting repeated placement identity ${placement.placementId}.`);
        if (stableJson(previous.worldPosition) !== stableJson(placement.worldPosition)) blockers.push({ kind: "placement-observation-position", key: placement.placementId, detail: "Repeated observations have different positions. The first admitted observation supplies the representative placement coordinates.", provenance: [...previous.provenance, ...placement.provenance] });
        if (previous.label !== null && placement.label !== null && previous.label !== placement.label) throw new Error(`Conflicting repeated placement label ${placement.placementId}.`);
        if (previous.label === null) previous.label = placement.label;
        previous.sourceIds = [...new Set([...previous.sourceIds, ...sourceIds])].sort(compareText);
        previous.provenance.push(...placement.provenance);
      } else placementById.set(placement.placementId, placement);
      for (const role of row.roles) {
        const npcId = role.npcId;
        for (const sourceId of [...role.sourceIds].sort(compareText)) {
          if (!sourceById.has(sourceId)) { blockers.push({ kind: "unresolved-source-identity", key: sourceId, detail: `Role ${role.role} has no verified source identity.`, provenance: [] }); continue; }
          roles.push({ placementId: row.placementId, sourceId, role: role.role, npcId, scope: role.scope, evidence: role.evidence.map((evidence) => pointer(context.roleEvidenceReferences[evidence.artifact], evidence.pointer)) });
        }
      }
    }
    for (const identity of identities) {
      const existing = placementById.get(identity.placementId);
      if (existing) {
        if (!existing.sourceIds.includes(identity.sourceId)) existing.sourceIds.push(identity.sourceId);
        existing.provenance.push(pointer(identityRef, `/identities/${identity.identityIndex}`));
        continue;
      }
      const resolved = bindingResolution(identity.position, profile, resolver, context.sceneNativeId, context.scenePath);
      recordPlacementResolution(resolved, identity.placementId, "Identity-only placement has no reviewed map-space binding.", profile, profileRef, blockers, exclusions);
      placementById.set(identity.placementId, { placementId: identity.placementId, buildId: "", sceneNativeId: context.sceneNativeId, scenePath: context.scenePath, identity: { sceneSourceSha256: identity.sceneSourceSha256, sourceSha256: identity.sourceSha256, serializedFile: identity.serializedFile, gameObjectPathId: identity.gameObjectPathId, origin: identity.origin, loaderSourceId: identity.loaderSourceId }, label: null, mapSpaceId: resolved.binding?.mapSpaceId ?? null, worldPosition: identity.position, mapPosition: resolved.mapPosition, sourceIds: [identity.sourceId], roles: [], shape: null, provenance: [pointer(profileRef, resolved.binding ? `/bindings/${profile.indexOf(resolved.binding)}` : ""), pointer(identityRef, `/identities/${identity.identityIndex}`)] });
    }
    for (const row of roleRows.unplacedSources) {
      blockers.push({ kind: "unplaced-source", key: `${context.sceneNativeId}:${stableJson(row)}`, detail: "Role evidence has no verified serialized placement and remains unplaced.", provenance: [] });
    }
    for (const row of roleRows.unresolved) {
      blockers.push({ kind: "placement-role-issue", key: `${context.sceneNativeId}:${stableJson(row)}`, detail: row.detail, provenance: [] });
    }
  }
  for (const placement of placementById.values()) {
    const identity = identityByPlacement.get(placement.placementId);
    if (identity !== undefined && placement.identity === null) placement.identity = { sceneSourceSha256: identity.sceneSourceSha256, sourceSha256: identity.sourceSha256, serializedFile: identity.serializedFile, gameObjectPathId: identity.gameObjectPathId, origin: identity.origin, loaderSourceId: identity.loaderSourceId };
  }
  const uniqueRoles = new Map<string, NormalizedDatabaseInput["roles"][number]>();
  for (const role of roles) {
    const key = `${role.placementId}:${role.sourceId}:${role.role}:${role.npcId ?? ""}:${role.scope}`;
    const previous = uniqueRoles.get(key);
    if (previous) previous.evidence.push(...role.evidence);
    else uniqueRoles.set(key, role);
  }
  return { placements: sorted(placementById.values(), (a, b) => compareText(a.placementId, b.placementId)), sources: sorted(sourceById.values(), (a, b) => compareText(a.sourceId, b.sourceId)), roles: sorted(uniqueRoles.values(), (a, b) => a.placementId.localeCompare(b.placementId) || a.sourceId.localeCompare(b.sourceId) || a.role.localeCompare(b.role)), sourceForComponent, sourcePlacement };
}

type WorldXZ = [number, number];
type RegionCorners = [WorldXZ, WorldXZ, WorldXZ, WorldXZ];
type WorldVector = { x: number; y: number; z: number };
type RegionGeometryWithWorld = { geometry: NormalizedRegionGeometry; points: WorldVector[] };

type RegionShape = MapGeometry["regions"][number]["colliders"][number]["shape"];
function boxRegionGeometry(shape: RegionShape): RegionGeometryWithWorld | null {
  if (shape?.kind !== "box") return null;
  const lowest = [...shape.worldCorners].sort((a, b) => a.y - b.y || a.x - b.x || a.z - b.z).slice(0, 4);
  const center = { x: lowest.reduce((sum, point) => sum + point.x, 0) / 4, z: lowest.reduce((sum, point) => sum + point.z, 0) / 4 };
  lowest.sort((a, b) => Math.atan2(a.z - center.z, a.x - center.x) - Math.atan2(b.z - center.z, b.x - center.x));
  const corners: RegionCorners = [[lowest[0]!.x, lowest[0]!.z], [lowest[1]!.x, lowest[1]!.z], [lowest[2]!.x, lowest[2]!.z], [lowest[3]!.x, lowest[3]!.z]];
  return { geometry: { kind: "box", corners }, points: lowest };
}
function sphereRegionGeometry(shape: RegionShape): RegionGeometryWithWorld | null {
  if (shape?.kind !== "sphere") return null;
  return { geometry: { kind: "sphere", center: [shape.worldCenter.x, shape.worldCenter.z], radius: shape.worldRadius }, points: [shape.worldCenter] };
}

function projectRegionGeometry(region: RegionGeometryWithWorld, context: SceneContext, resolver: { resolve(sceneNativeId: number, scenePath: string, position: { x: number; y: number; z: number }): SpatialResolution }): { mapSpaceId: string; geometry: NormalizedRegionGeometry } | null {
  const candidates = resolver.resolve(context.sceneNativeId, context.scenePath, region.points[0]!).candidates;
  if (candidates.length !== 1) return null;
  const mapSpaceId = candidates[0]!.mapSpaceId;
  const projected: Array<[number, number]> = [];
  for (const point of region.points) {
    const pointCandidates = resolver.resolve(context.sceneNativeId, context.scenePath, point).candidates;
    const candidate = pointCandidates.length === 1 && pointCandidates[0]!.mapSpaceId === mapSpaceId ? pointCandidates[0] : undefined;
    if (!candidate) return null;
    projected.push([candidate.mapPosition.x, candidate.mapPosition.y]);
  }
  if (region.geometry.kind === "box") return { mapSpaceId, geometry: { kind: "box", corners: projected as RegionCorners } };
  const center = region.points[0]!;
  const edgeCandidates = resolver.resolve(context.sceneNativeId, context.scenePath, { x: center.x + region.geometry.radius, y: center.y, z: center.z }).candidates;
  const edge = edgeCandidates.length === 1 && edgeCandidates[0]!.mapSpaceId === mapSpaceId ? edgeCandidates[0] : undefined;
  if (!edge) return null;
  const dx = edge.mapPosition.x - projected[0]![0];
  const dy = edge.mapPosition.y - projected[0]![1];
  return { mapSpaceId, geometry: { kind: "sphere", center: projected[0]!, radius: Math.hypot(dx, dy) } };
}

export function collectRegions(contexts: SceneContext[], buildId: string, resolver: { resolve(sceneNativeId: number, scenePath: string, position: { x: number; y: number; z: number }): SpatialResolution }, blockers: Blocker[]): NormalizedRegion[] {
  const regions = new Map<string, NormalizedRegion>();
  for (const context of contexts) {
    const worldRegions = context.world.regions;
    const geometryByComponent = new Map<number, { index: number; row: MapGeometry["regions"][number] }>();
    for (const [index, row] of context.mapGeometry.regions.entries()) {
      const component = row.source.componentInstanceId;
      if (component === null) continue;
      if (geometryByComponent.has(component)) {
        blockers.push({ kind: "region-issue", key: `${context.sceneNativeId}:geometry:${component}`, detail: "Map geometry contains duplicate region source component identities.", provenance: [pointer(context.mapGeometryReference, `/regions/${index}`)] });
        continue;
      }
      geometryByComponent.set(component, { index, row });
    }
    for (const [index, row] of worldRegions.entries()) {
      const component = row.source.componentInstanceId;
      const key = `${context.sceneNativeId}:region:${index}`;
      const provenance = [pointer(context.worldReference, `/regions/${index}`)];
      if (component === null) {
        blockers.push({ kind: "region-issue", key, detail: "Region has no source component identity for the same-step geometry join.", provenance });
        continue;
      }
      const template = row.regionTemplate;
      const name = template && typeof template.name === "string" && template.name.length > 0 ? template.name : null;
      if (!template) {
        blockers.push({ kind: "region-issue", key, detail: "Region has no RegionTemplate.", provenance: [...provenance, pointer(context.worldReference, `/regions/${index}/regionTemplate`)] });
        continue;
      }
      if (!name) {
        blockers.push({ kind: "region-issue", key, detail: "RegionTemplate has no name.", provenance: [...provenance, pointer(context.worldReference, `/regions/${index}/regionTemplate/name`)] });
        continue;
      }
      const geometryRow = geometryByComponent.get(component);
      if (!geometryRow) {
        blockers.push({ kind: "region-issue", key, detail: "Region has no matching map-geometry observation in this traversal step.", provenance: [...provenance, pointer(context.mapGeometryReference, "/regions")] });
        continue;
      }
      const regionGeometry = geometryRow.row.colliders.map((collider) => collider.shape).map((shape) => boxRegionGeometry(shape) ?? sphereRegionGeometry(shape)).find((value): value is RegionGeometryWithWorld => value !== null);
      if (!regionGeometry) {
        blockers.push({ kind: "region-issue", key, detail: "Region has no supported Box or Sphere collider geometry.", provenance: [...provenance, pointer(context.mapGeometryReference, `/regions/${geometryRow.index}/colliders`)] });
        continue;
      }
      const identity = context.sourceByComponent.get(component);
      if (!identity) {
        blockers.push({ kind: "unresolved-region-identity", key, detail: "Region has no verified authored source identity.", provenance });
        continue;
      }
      const regionId = jsonHash(["region", buildId, identity.sourceId]);
      const projection = projectRegionGeometry(regionGeometry, context, resolver);
      if (!projection) blockers.push({ kind: "unresolved-region-space", key: regionId, detail: "Region geometry does not resolve to one reviewed map space.", provenance: [...provenance, pointer(context.mapGeometryReference, `/regions/${geometryRow.index}`)] });
      const normalized: NormalizedRegion = { regionId, buildId, sceneNativeId: context.sceneNativeId, scenePath: context.scenePath, name, internalName: typeof template.internalName === "string" ? template.internalName : null, shape: regionGeometry.geometry.kind, worldGeometry: regionGeometry.geometry, mapSpaceId: projection?.mapSpaceId ?? null, mapGeometry: projection?.geometry ?? null, provenance: [...provenance, pointer(context.mapGeometryReference, `/regions/${geometryRow.index}`)] };
      const previous = regions.get(regionId);
      if (previous) {
        if (stableJson({ ...previous, provenance: [] }) !== stableJson({ ...normalized, provenance: [] })) throw new Error(`Conflicting repeated region identity ${regionId}.`);
        previous.provenance.push(...normalized.provenance);
      } else regions.set(regionId, normalized);
    }
  }
  return sorted(regions.values(), (a, b) => compareText(a.regionId, b.regionId));
}

export function attachShapes(contexts: SceneContext[], sourceForComponent: Map<string, string>, placements: NormalizedPlacement[], blockers: Blocker[]): void {
  const bySource = new Map<string, NormalizedPlacement>();
  for (const placement of placements) for (const sourceId of placement.sourceIds) bySource.set(sourceId, placement);
  for (const context of contexts) for (const [index, row] of context.npc.producers.entries()) {
    if ("unavailable" in row) continue;
    const sourceId = sourceForComponent.get(`${context.snapshotId}:${row.componentInstanceId}`);
    const placement = sourceId ? bySource.get(sourceId) : undefined;
    if (!placement) continue;
    if (placement.shape !== null && stableJson(placement.shape) !== stableJson(row.shape)) blockers.push({ kind: "conflicting-placement-shape", key: placement.placementId, detail: "One authored placement has conflicting shape observations.", provenance: [pointer(context.npcReference, `/producers/${index}/shape`)] });
    else placement.shape = row.shape;
  }
}
