import type { WorldSources } from "@afallon/contracts";
import { entityKey, type NormalizedCondition, type NormalizedGatheringNode, type NormalizedGatheringNodeSource, type NormalizedReference, type ProvenanceReference } from "@afallon/contracts/catalog";
import { canonicalJson } from "@afallon/contracts";
import { conditionFrom, conditionSemanticPayload } from "./conditions";
import { pointer, type Blocker, type SceneContext } from "./context";

type Action = Extract<WorldSources["interactions"][number], { actions: unknown }>["actions"][number];
type NodeObject = { interactableName: string | null; actions: Action[]; requirementsTemplate: unknown; cooldown: number };

/**
 * The name of a gathering node: the authored name without its colored hints, such as the tool and the skill level, and
 * without other rich-text tags. `levelHint` is the bracketed skill level of a hint, such as "Mining 25".
 */
export function gatheringNodeName(authored: string): { name: string; levelHint: string | null } {
  const hint = /\[([^\]]+)\]/.exec(authored);
  const name = authored.replace(/<color=[^>]*>[\s\S]*?<\/color>/g, "").replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  return { name, levelHint: hint ? hint[1]!.trim() : null };
}

function slug(value: string): string {
  return value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/['’]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "node";
}

interface NodeContent {
  name: string; levelHint: string | null; skillId: number | null; skillExperience: number | null; characterExperience: number | null;
  lootTableId: number | null; template: unknown;
}

// What the object gives: its loot table, its skill and character experience, and its requirements template. An object
// that gives neither loot nor skill experience is not a gathering node.
function nodeContent(object: NodeObject): NodeContent | null {
  if (!object.interactableName) return null;
  let skillId: number | null = null, skillExperience: number | null = null, characterExperience: number | null = null, lootTableId: number | null = null;
  for (const action of object.actions) {
    if ("unavailable" in action) continue;
    if (action.type.name === "Chest" && action.lootTable && action.lootTable.nativeId >= 0) lootTableId ??= action.lootTable.nativeId;
    if (action.type.name === "GiveSkillExperience" && action.skill && action.skill.nativeId >= 0) { skillId ??= action.skill.nativeId; skillExperience ??= action.amount; }
    if (action.type.name === "GiveCharacterExperience") characterExperience ??= action.amount;
  }
  if (lootTableId === null && skillExperience === null) return null;
  return { ...gatheringNodeName(object.interactableName), skillId, skillExperience, characterExperience, lootTableId, template: object.requirementsTemplate };
}

export interface GatheringNodeRows {
  gatheringNodes: NormalizedGatheringNode[];
  gatheringNodeSources: NormalizedGatheringNodeSource[];
  conditions: NormalizedCondition[];
  /** The node of each spawner output, keyed by `sourceId|optionIndex|lootTableId`. */
  nodeBySpawnerOutput: Map<string, string>;
}

/**
 * Derives the gathering nodes from the spawner options and the scene objects of the world evidence. A scene object is a
 * gathering node when it gives loot through a Chest action and experience in a skill that some spawner gathers. Sources
 * that share a name must agree on skill, experience, loot table, and requirements template; otherwise each content
 * becomes its own variant and the catalog records a coverage issue.
 */
export function gatheringNodes(contexts: readonly SceneContext[], labels: ReadonlyMap<string, string | null>, blockers: Blocker[]): GatheringNodeRows {
  type Candidate = { content: NodeContent; source: Omit<NormalizedGatheringNodeSource, "nodeKey">; lootTableId: number | null };
  const candidates: Candidate[] = [];
  const gatheringSkills = new Set<number>();
  for (const context of contexts) for (const producer of context.world.resourceProducers) if ("options" in producer && producer.gatheringSkillID !== null) gatheringSkills.add(producer.gatheringSkillID);
  const seen = new Set<string>();
  for (const context of contexts) {
    const identityFor = (componentInstanceId: number | null) => componentInstanceId === null ? undefined : context.sourceByComponent.get(componentInstanceId);
    for (const [index, producer] of context.world.resourceProducers.entries()) {
      if (!("options" in producer)) continue;
      const identity = identityFor(producer.source.componentInstanceId);
      if (!identity) continue;
      for (const option of producer.options) {
        if ("unavailable" in option) continue;
        const key = `${identity.sourceId}|${option.optionIndex}`;
        if (seen.has(key)) continue;
        seen.add(key);
        const reference = pointer(context.worldReference, `/resourceProducers/${index}/options/${option.optionIndex}`);
        const contents = option.authoredInteractables.flatMap((object) => "unavailable" in object ? [] : [nodeContent(object)]).filter((row): row is NodeContent => row !== null);
        if (contents.length !== 1) { blockers.push({ kind: "unresolved-gathering-node", key, detail: `Spawner option has ${contents.length} objects that give loot or skill experience.`, provenance: [reference] }); continue; }
        candidates.push({ content: contents[0]!, lootTableId: contents[0]!.lootTableId, source: { sourceId: identity.sourceId, sourceKind: "spawner-option", optionIndex: option.optionIndex, cooldown: null,
          spawner: { respawnTime: producer.respawnTime, respawnJitter: producer.respawnJitter, despawnDelay: producer.despawnDelay, playerRange: producer.playerRange, skillCap: producer.skillCap, weightAtLowSkill: option.weightAtLowSkill, weightAtHighSkill: option.weightAtHighSkill, teaserWeight: option.teaserWeight },
          provenance: [reference] } });
      }
    }
    for (const [index, interaction] of context.world.interactions.entries()) {
      if (!("interactableName" in interaction) || !("actions" in interaction) || !("requirementsTemplate" in interaction)) continue;
      const content = nodeContent(interaction);
      if (!content || content.lootTableId === null || content.skillId === null || !gatheringSkills.has(content.skillId)) continue;
      const identity = identityFor(interaction.source.componentInstanceId);
      if (!identity || seen.has(identity.sourceId)) continue;
      seen.add(identity.sourceId);
      candidates.push({ content, lootTableId: content.lootTableId, source: { sourceId: identity.sourceId, sourceKind: "placed-object", optionIndex: null, cooldown: interaction.cooldown, spawner: null, provenance: [pointer(context.worldReference, `/interactions/${index}`)] } });
    }
  }
  const signature = (content: NodeContent) => canonicalJson({ skillId: content.skillId, skillExperience: content.skillExperience, characterExperience: content.characterExperience, lootTableId: content.lootTableId, template: conditionSemanticPayload(content.template) });
  const byName = new Map<string, Candidate[]>();
  for (const candidate of candidates) byName.set(candidate.content.name, [...byName.get(candidate.content.name) ?? [], candidate]);
  const out: GatheringNodeRows = { gatheringNodes: [], gatheringNodeSources: [], conditions: [], nodeBySpawnerOutput: new Map() };
  const reference = (kind: string, nativeId: number | null): NormalizedReference | null => {
    if (nativeId === null || nativeId < 0) return null;
    const key = entityKey(kind, nativeId);
    return labels.has(key) ? { entityKey: key, label: labels.get(key) ?? key } : { entityKey: null, label: `${kind} ${nativeId}` };
  };
  for (const [name, group] of [...byName].sort(([a], [b]) => a.localeCompare(b))) {
    const variants = new Map<string, Candidate[]>();
    for (const candidate of group) variants.set(signature(candidate.content), [...variants.get(signature(candidate.content)) ?? [], candidate]);
    if (variants.size > 1) blockers.push({ kind: "gathering-node-variants", key: `gathering-node:${slug(name)}`, detail: `${variants.size} sources named ${name} disagree on skill, experience, loot table, or requirements.`, provenance: group.flatMap((row) => row.source.provenance) });
    const usedKeys = new Set<string>();
    for (const members of variants.values()) {
      const content = members[0]!.content;
      const table = reference("lootTables", content.lootTableId);
      // A variant key names its loot table; variants that share the table take the next free ordinal.
      const base = `gatheringNodes:${slug(name)}${variants.size > 1 ? `--${slug(table?.label ?? "variant")}` : ""}`;
      let nodeKey = base;
      for (let ordinal = 2; usedKeys.has(nodeKey); ordinal += 1) nodeKey = `${base}-${ordinal}`;
      usedKeys.add(nodeKey);
      const provenance = members.flatMap((row) => row.source.provenance);
      const skill = reference("skills", content.skillId);
      if (skill?.entityKey === null || table?.entityKey === null) blockers.push({ kind: "missing-reference", key: nodeKey, detail: `Gathering node ${name} names a missing skill or loot table.`, provenance });
      const condition = content.template === null ? null : conditionFrom("gathering-node", nodeKey, content.template, "requirements-template", null, provenance);
      if (condition) out.conditions.push(condition);
      const levelHint = members.map((row) => row.content.levelHint).find((hint) => hint !== null) ?? null;
      out.gatheringNodes.push({ entityKey: nodeKey, name, levelHint, variant: variants.size > 1, skill, skillExperience: content.skillExperience, characterExperience: content.characterExperience, lootTable: table, conditionId: condition?.conditionId ?? null, provenance });
      for (const member of members) {
        out.gatheringNodeSources.push({ nodeKey, ...member.source });
        if (member.source.sourceKind === "spawner-option" && member.lootTableId !== null) out.nodeBySpawnerOutput.set(`${member.source.sourceId}|${member.source.optionIndex}|${member.lootTableId}`, nodeKey);
      }
    }
  }
  return out;
}


/**
 * Links each spawner yield to the gathering node of its own spawner option and loot table. A yield without such a node
 * keeps its source, and the catalog records a coverage issue for it.
 */
export function linkGatheringYields<Row extends { yieldId: string; sourceId: string; optionIndex?: unknown; lootTableID?: unknown; provenance: ProvenanceReference[] }>(rows: readonly Row[], nodeBySpawnerOutput: ReadonlyMap<string, string>, blockers: Blocker[]): Array<Row & { gatheringNodeKey: string | null }> {
  return rows.map((row) => {
    const nodeKey = typeof row.optionIndex === "number" && typeof row.lootTableID === "number" ? nodeBySpawnerOutput.get(`${row.sourceId}|${row.optionIndex}|${row.lootTableID}`) ?? null : null;
    if (nodeKey === null) blockers.push({ kind: "unlinked-gathering-yield", key: row.yieldId, detail: "The yield has no gathering node of its own spawner option.", provenance: row.provenance });
    return { ...row, gatheringNodeKey: nodeKey };
  });
}
