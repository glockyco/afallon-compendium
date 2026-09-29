import type { NormalizedReference, ProvenanceReference } from "./query";

// A gathering node: the world object that a player gathers from. Build 25434619 has no resource node records, so the
// catalog derives each node from the spawner options and scene objects that give it. The key is the authored name
// without rich-text tags and hints. Sources that share a name but disagree on content become separate variants, and
// the catalog records a coverage issue for them.
export interface GatheringNodeFacts {
  entityKey: string;
  // The authored name without rich-text tags and without the tool and level hints, as the game spells it.
  name: string;
  // The skill level hint of the authored name, such as "Mining 25", when the name has one.
  levelHint: string | null;
  // More than one variant shares this name.
  variant: boolean;
  skill: NormalizedReference | null;
  skillExperience: number | null;
  characterExperience: number | null;
  lootTable: NormalizedReference | null;
  // The condition of the node's requirements template, which carries its skill gate and tool.
  conditionId: string | null;
}

// One source that gives a node: a spawner option, or an object that a scene places.
export interface GatheringNodeSource {
  nodeKey: string;
  sourceId: string;
  sourceKind: "spawner-option" | "placed-object";
  optionIndex: number | null;
  // The object's own cooldown in seconds. A spawner removes a gathered vein, so the spawner timing applies there.
  cooldown: number | null;
  // The spawner's gathering skill, whose level moves the option weights, and its timing and option weights.
  spawner: {
    skill: NormalizedReference | null; respawnTime: number; respawnJitter: number; despawnDelay: number; playerRange: number; skillCap: number;
    weightAtLowSkill: number; weightAtHighSkill: number; teaserWeight: number;
  } | null;
}

export type NormalizedGatheringNode = GatheringNodeFacts & { provenance: ProvenanceReference[] };
export type NormalizedGatheringNodeSource = GatheringNodeSource & { provenance: ProvenanceReference[] };

export interface CatalogGatheringNode extends GatheringNodeFacts {
  sources: Array<GatheringNodeSource & { placementId: string | null }>;
}
