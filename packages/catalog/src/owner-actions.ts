import type { Canonical, WorldGameAction } from "@afallon/contracts";
import { Assert } from "typebox/value";
import { entityKey, stableJson, type ArtifactReference, type NormalizedEntity, type NormalizedOwnerGameAction, type NormalizedReference, type ProvenanceReference } from "@afallon/contracts/catalog";
import { pointer, type SceneContext, type Blocker } from "./context";
import { ItemGameActionsSchema } from "./decoders";
import { GAME_ACTION_TARGETS, itemGameActions } from "./item-actions";
import { hashRelation } from "./database";
import type { ItemSourceAccumulator } from "./relations";

const ownerEntities: Readonly<Record<string, string>> = {
  effects: "effects", abilities: "abilities", stats: "stats", npcs: "npcs", npcPhases: "npcs", species: "species",
};
export function capturedWorldAction(value: object): value is WorldGameAction {
  return "targets" in value && "nodeAction" in value && "alterAction" in value;
}
function grantsItemOrKnowledge(row: Pick<NormalizedOwnerGameAction, "type" | "alterAction" | "nodeAction">): boolean {
  if (row.nodeAction === "RankDown") return false;
  if (row.type === "LootTable") return true;
  if (row.type === "Recipe") return row.alterAction !== "Remove" && (row.nodeAction === "RankUp" || row.nodeAction === "Unlock");
  return (row.type === "Item" || row.type === "Currency") && row.alterAction === "Gain";
}

/** Retain actions of every non-item database owner and loaded template, including inactive templates. */
export function ownerGameActions(owners: Canonical["ownerActions"], entities: NormalizedEntity[], reference: ArtifactReference, blockers: Blocker[]): NormalizedOwnerGameAction[] {
  const byKey = new Map(entities.map((entity) => [entity.entityKey, entity]));
  const rows: NormalizedOwnerGameAction[] = [];
  for (const [ownerIndex, owner] of owners.entries()) {
    const path = `/ownerActions/${ownerIndex}`;
    const ownerKind = ownerEntities[owner.ownerKind];
    const ownerEntityKey = ownerKind === undefined ? null : entityKey(ownerKind, Number(owner.ownerId));
    const evidence = [{ path: reference.path, sha256: reference.sha256, pointer: path }];
    if (ownerEntityKey !== null && !byKey.has(ownerEntityKey)) blockers.push({ kind: "unresolved-game-action-owner", key: `${owner.ownerKind}:${owner.ownerPath}`, detail: `Game action owner ${ownerEntityKey} was not captured as a catalog entity.`, provenance: evidence });
    const payload: unknown = { useTemplateFlag: owner.template !== null, template: owner.template, available: true, actions: owner.actions };
    Assert(ItemGameActionsSchema, payload);
    const resolve = (kind: string, nativeId: number, label: string, targetPath: string): NormalizedReference => {
      const targetKey = entityKey(kind, nativeId);
      const target = byKey.get(targetKey);
      if (target === undefined) blockers.push({ kind: "unresolved-game-action-target", key: `${owner.ownerKind}:${owner.ownerPath}:${targetPath}`, detail: `Game action target ${targetKey} was not captured as a catalog entity.`, provenance: [{ path: reference.path, sha256: reference.sha256, pointer: targetPath }] });
      return { entityKey: target === undefined ? null : targetKey, label: target?.name ?? label };
    };
    const actions = itemGameActions(`${owner.ownerKind}:${owner.ownerPath}`, payload, path, evidence, resolve, blockers);
    for (const action of actions) {
      const raw = payload.actions.find((candidate) => candidate.sourceIndex === action.actionIndex);
      if (raw === undefined || "unavailable" in raw) continue;
      if (grantsItemOrKnowledge(action) && owner.ownerKind !== "templates") blockers.push({ kind: "non-item-game-action-grant", key: `${owner.ownerKind}:${owner.ownerPath}:${action.actionIndex}`, detail: `${owner.ownerKind} ${owner.ownerPath} grants ${action.type} ${action.target?.entityKey ?? action.target?.label ?? "without a resolved target"}.`, provenance: evidence });
      const { entityKey: _itemKey, ...normalized } = action;
      rows.push({ ...normalized, ownerKind: owner.ownerKind, ownerId: owner.ownerId, ownerName: byKey.get(ownerEntityKey ?? "")?.name?.trim() || (owner.ownerKind === "templates" ? owner.ownerId : null), ownerPath: owner.ownerPath, ownerEntityKey: byKey.has(ownerEntityKey ?? "") ? ownerEntityKey : null, sceneNativeId: null, targets: raw.targets });
    }
  }
  return mergeOwnerGameActions(rows);
}

/** One authored source may be observed in multiple target scenes or loaded through two template instances. */
export function mergeOwnerGameActions(rows: readonly NormalizedOwnerGameAction[]): NormalizedOwnerGameAction[] {
  const distinct = new Map<string, NormalizedOwnerGameAction>();
  for (const row of rows) {
    const key = `${row.ownerKind}:${row.ownerPath}:${row.actionIndex}`;
    const prior = distinct.get(key);
    if (!prior) { distinct.set(key, row); continue; }
    if (stableJson({ ...prior, provenance: [] }) !== stableJson({ ...row, provenance: [] })) throw new Error(`Game-action owner ${key} has conflicting actions.`);
    prior.provenance = [...new Map([...prior.provenance, ...row.provenance].map((ref) => [`${ref.sha256}:${ref.pointer ?? ""}`, ref])).values()];
  }
  return [...distinct.values()];
}

/** World actions are read from their actual call sites; template and inline lists retain game execution order. */
export function worldOwnerGameActions(contexts: readonly SceneContext[], templates: readonly NormalizedOwnerGameAction[], entities: readonly NormalizedEntity[], itemIndex: ReadonlyMap<number, ReadonlyMap<string, ItemSourceAccumulator>>, blockers: Blocker[]): NormalizedOwnerGameAction[] {
  const known = new Map(entities.map((entity) => [entity.entityKey, entity]));
  const publishedGrants = new Set<string>();
  for (const [itemId, sources] of itemIndex) {
    if (!known.has(entityKey("items", itemId))) continue;
    for (const source of sources.values()) {
      if (source.sourceKind !== "interaction" || typeof source.context.gameActionChance !== "number" || !Array.isArray(source.context.provenance)) continue;
      for (const reference of source.context.provenance as ProvenanceReference[])
        if (reference.pointer) publishedGrants.add(`${reference.sha256}:${reference.pointer}`);
    }
  }
  const usedTemplates = new Set<string>();
  const rows: NormalizedOwnerGameAction[] = [];
  for (const context of contexts) for (const [interactionIndex, interaction] of context.world.interactions.entries()) {
    if (interaction.family !== "interactableObject" || !("actions" in interaction)) continue;
    const identity = interaction.source.componentInstanceId === null ? null : context.sourceByComponent.get(interaction.source.componentInstanceId) ?? null;
    const sourcePath = interaction.source.source.hierarchyPath;
    const ownerId = identity?.sourceId ?? `unverified:${hashRelation("world-game-action-owner", [interaction.source.sourceScene?.path, sourcePath, interaction.source.source.componentIndex])}`;
    const ownerName = interaction.interactableName?.trim() ? interaction.interactableName : sourcePath?.split("/").at(-1) ?? null;
    for (const [actionIndex, action] of interaction.actions.entries()) {
      if ("unavailable" in action || action.type.name !== "GameActions") continue;
      const ownerPath = `${ownerId}/actions/${actionIndex}`;
      const worldPointer = `/interactions/${interactionIndex}/actions/${actionIndex}/gameActions`;
      const sourceEvidence = pointer(context.worldReference, worldPointer);
      if (identity === null) blockers.push({ kind: "unresolved-game-action-owner", key: ownerPath,
        detail: `InteractableObject ${ownerName ?? ownerId} has actions but no verified serialized source identity.`,
        provenance: [sourceEvidence] });
      const project = (nested: (typeof action.gameActions.inline.actions)[number], list: "template" | "inline", index: number, templateName: string | null): void => {
        const actionPath = `${worldPointer}/${list}/actions/${index}`;
        const provenance = [pointer(context.worldReference, actionPath)];
        if ("unavailable" in nested) { blockers.push({ kind: "unavailable-game-action", key: `${ownerPath}/${list}/${index}`, detail: nested.unavailable, provenance }); return; }
        if (!capturedWorldAction(nested)) {
          if (nested.type.name === "Item" || nested.type.name === "LootTable" || nested.type.name === "Currency" || nested.type.name === "Recipe") blockers.push({
            kind: "uncaptured-world-game-action", key: `${ownerPath}/${list}/${index}`, detail: `The older world scan did not record the target and action mode of ${nested.type.name}.`, provenance,
          });
          return;
        }
        const type = nested.type.name;
        const spec = type === "Teleport" ? (nested.teleport?.type.name === "GameScene" ? { field: "gameSceneId" as const, kind: "scenes", label: "Scene" } : null) : GAME_ACTION_TARGETS[type] ?? null;
        let target: NormalizedReference | null = null;
        if (spec !== null) {
          const id = nested.targets[spec.field];
          if (id < 0) blockers.push({ kind: "unset-game-action-target", key: `${ownerPath}/${list}/${index}`, detail: `${type} action has no ${spec.label.toLowerCase()} identifier.`, provenance });
          else if (spec.kind === null) {
            target = { entityKey: null, label: `${spec.label} ${id}` };
            blockers.push({ kind: "uncaptured-game-action-target", key: `${ownerPath}/${list}/${index}`, detail: `${spec.label} ${id} is not a catalog entity.`, provenance });
          } else {
            const key = entityKey(spec.kind, id), entity = known.get(key);
            target = { entityKey: entity === undefined ? null : key, label: entity?.name ?? `${spec.label} ${id}` };
            if (entity === undefined) blockers.push({ kind: "unresolved-game-action-target", key: `${ownerPath}/${list}/${index}:${key}`, detail: `InteractableObject ${ownerName ?? ownerId} references missing ${key}.`, provenance });
          }
        }
        const row: NormalizedOwnerGameAction = {
          ownerKind: "interactableObjects", ownerId, ownerName, ownerPath: `${ownerPath}/${list === "template" ? "0-template" : "1-inline"}${list === "template" ? `/${templateName ?? "<unnamed>"}` : ""}`,
          ownerEntityKey: null, sceneNativeId: identity === null ? null : context.sceneNativeId,
          actionIndex: nested.sourceIndex, template: list === "template" ? { nativeId: action.gameActions.template!.nativeId, name: templateName } : null,
          type, chance: nested.chance, nodeAction: nested.nodeAction.name, progressionType: nested.progressionType.name,
          teleportType: nested.teleport?.type.name ?? "Position", amount: nested.amount, alterAction: nested.alterAction,
          requirements: nested.requirements, visualEffect: null, targets: nested.targets, target, provenance,
        };
        rows.push(row);
        if (grantsItemOrKnowledge(row) && !publishedGrants.has(`${provenance[0]!.sha256}:${provenance[0]!.pointer}`)) blockers.push({ kind: "non-item-game-action-grant", key: `${row.ownerPath}:${row.actionIndex}`,
          detail: `InteractableObject ${ownerName ?? ownerId} grants ${type} ${target?.entityKey ?? target?.label ?? "without a resolved target"}${templateName === null ? "" : ` through template ${templateName}`}.`, provenance });
      };
      const template = action.gameActions.template;
      if (template !== null) {
        const name = template.internalName ?? template.name;
        if (name !== null) usedTemplates.add(name);
        template.actions.forEach((nested, index) => project(nested, "template", index, name));
      }
      action.gameActions.inline.actions.forEach((nested, index) => project(nested, "inline", index, null));
    }
  }
  for (const row of templates) if (row.ownerKind === "templates" && !usedTemplates.has(row.ownerId) && grantsItemOrKnowledge(row)) blockers.push({
    kind: "unowned-game-action-template-grant", key: `${row.ownerId}:${row.actionIndex}`,
    detail: `Template ${row.ownerId} grants ${row.type} ${row.target?.entityKey ?? row.target?.label ?? "without a resolved target"}, but no scanned object uses it.`,
    provenance: row.provenance,
  });
  return mergeOwnerGameActions(rows);
}
