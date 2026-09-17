import type { FactionRoles } from "@afallon/contracts";
import type { RoleEvidence, RoleFact, RoleIssue } from "@afallon/contracts/catalog"
export type FactionRoleFacts = ReadonlyMap<number, { facts: RoleFact[]; issues: RoleIssue[] }>;
type Alignment = FactionRoles["factions"][number]["observed"]["npcToPlayerAlignment"];

const alignmentNames = ["Ally", "Neutral", "Enemy"] as const;
function evidence(pointer: string): RoleEvidence { return { artifact: "faction-roles", pointer }; }
function sameAlignment(left: Alignment, right: Alignment): boolean {
  return left !== null && right !== null && left.value === right.value && left.name === right.name;
}

export function collectFactionRoleFacts(value: FactionRoles): FactionRoleFacts {
  if (value.sourceFactionCount !== value.factions.length || !value.playerStateUnchanged) throw new Error("Faction source counts or player-state preservation do not reconcile.");
  const byId = new Map(value.factions.map(faction => [faction.nativeId, faction]));
  if (byId.size !== value.factions.length || !byId.has(value.player.factionId)) throw new Error("Faction identities are duplicate or the player faction is missing.");
  const result = new Map<number, { facts: RoleFact[]; issues: RoleIssue[] }>();
  value.factions.forEach((faction, index) => {
    const path = `/factions/${index}`;
    const issues: RoleIssue[] = [];
    const addIssue = (reason: string, detail: string, pointer: string): void => { issues.push({ reason, detail, evidence: [evidence(pointer)] }); };
    if (faction.stanceCount !== (faction.stancesAvailable ? faction.stances.length : -1) || faction.interactionCount !== (faction.interactionsAvailable ? faction.interactions.length : -1)) throw new Error("Faction definition counts do not reconcile.");
    for (let stanceIndex = 0; stanceIndex < faction.stances.length; stanceIndex++) {
      const entry = faction.stances[stanceIndex]!;
      if ("unavailable" in entry) { addIssue("unavailableFactionStance", entry.unavailable, `${path}/stances/${stanceIndex}`); continue; }
      if (entry.error !== null || entry.nativeAlignment === null) { addIssue("unresolvedFactionStance", entry.error ?? "Native alignment is unavailable.", `${path}/stances/${stanceIndex}`); continue; }
      const first = faction.stances.find(candidate => "stance" in candidate && (candidate.stance?.instanceId ?? null) === (entry.stance?.instanceId ?? null));
      if (!first || !("alignment" in first) || !sameAlignment(first.alignment, entry.nativeAlignment)) throw new Error("Native faction alignment disagrees with its first matching authored stance.");
    }
    const native = faction.observed.npcToPlayerAlignment;
    const facts: RoleFact[] = [];
    if (faction.observed.npcAlignmentError !== null || native === null) {
      addIssue("hostilityUnclassified", faction.observed.npcAlignmentError ?? "Native NPC-to-player faction alignment is unavailable.", `${path}/observed`);
    } else if (alignmentNames[native.value] !== native.name) {
      addIssue("unsupportedFactionAlignment", `Native faction alignment ${native.value}/${native.name} is not supported.`, `${path}/observed/npcToPlayerAlignment`);
    } else {
      const role = native.value === 2 ? "enemy" : native.value === 0 ? "friendly" : "neutral";
      facts.push({ role, npcId: null, scope: "player-state", evidence: [evidence(`${path}/observed/npcToPlayerAlignment`), evidence(`${path}/observed/selectedInteractionIndex`), evidence(`${path}/interactions`), evidence("/player/factionId")] });
    }
    result.set(faction.nativeId, { facts, issues });
  });
  value.observations.forEach((observation, index) => {
    const faction = byId.get(observation.factionId);
    if (!faction) throw new Error("A native NPC observation refers to a missing faction.");
    if (observation.error !== null) {
      result.get(observation.factionId)!.issues.push({ reason: "unresolvedObservedAlignment", detail: observation.error, evidence: [evidence(`/observations/${index}`)] });
    } else if (!sameAlignment(observation.npcToPlayerAlignment, faction.observed.npcToPlayerAlignment) || !sameAlignment(observation.playerToNpcAlignment, faction.observed.playerToNpcAlignment)) {
      throw new Error("Observed NPC alignment disagrees with the recovered faction rules.");
    }
  });
  return result;
}
