import type { Canonical, Relationships } from "./contracts";
import type { FactionRoleFacts } from "./faction-roles";
import type { RoleEvidence, RoleFact, RoleIssue } from "./role-contracts";

type RecordValue = Record<string, unknown>;
type NpcRoleResult = { facts: RoleFact[]; issues: RoleIssue[] };

type RelationshipEvidence = {
  pointer: string;
  targetId: number;
  targetKind: "merchantTable" | "quest";
  supported: boolean;
  unsupportedReason?: string;
};

const npcTypes = new Map<number, string>([
  [0, "MOB"],
  [1, "ELITE"],
  [2, "RARE"],
  [3, "BOSS"],
  [4, "MERCHANT"],
  [5, "BANK"],
  [6, "QUEST_GIVER"],
  [7, "DIALOGUE"],
  [8, "COMPANION"],
  [9, "ADVENTURER"],
  [10, "QUEST_COMPANION"],
]);

const rankRoles = new Map<number, string>([
  [1, "elite"],
  [3, "boss"],
  [8, "companion"],
  [9, "adventurer"],
  [10, "questCompanion"],
]);

function asRecord(value: unknown, path: string): RecordValue {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`Expected an object at ${path}.`);
  return value as RecordValue;
}

function asArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new Error(`Expected an array at ${path}.`);
  return value;
}

function integerField(row: RecordValue, field: string, path: string, minimum = 0): number {
  const value = row[field];
  if (typeof value !== "number" || !Number.isInteger(value) || value < minimum) throw new Error(`Expected integer ${field} at ${path}.`);
  return value;
}

function booleanField(row: RecordValue, field: string, path: string): boolean {
  const value = row[field];
  if (typeof value !== "boolean") throw new Error(`Expected boolean ${field} at ${path}.`);
  return value;
}

function textField(row: RecordValue, field: string, path: string): string {
  const value = row[field];
  if (typeof value !== "string" || value.length === 0) throw new Error(`Expected non-empty text ${field} at ${path}.`);
  return value;
}

function evidence(artifact: RoleEvidence["artifact"], pointer: string): RoleEvidence {
  if (!pointer.startsWith("/")) throw new Error(`Invalid evidence pointer: ${pointer}.`);
  return { artifact, pointer };
}

function role(roleName: string, npcId: number, refs: readonly RoleEvidence[]): RoleFact {
  return { role: roleName, npcId, scope: "authored", evidence: [...refs] };
}

function issue(reason: string, detail: string, refs: readonly RoleEvidence[]): RoleIssue {
  return { reason, detail, evidence: [...refs] };
}

function definitions(values: unknown, path: string, kind: string): Set<number> {
  const rows = asArray(values, path);
  const ids = new Set<number>();
  rows.forEach((value, index) => {
    const row = asRecord(value, `${path}[${index}]`);
    const id = integerField(row, "nativeId", `${path}[${index}]`);
    if (ids.has(id)) throw new Error(`Duplicate ${kind} identity: ${id}.`);
    ids.add(id);
  });
  return ids;
}

function relationshipRows(
  values: unknown,
  path: string,
  npcIds: ReadonlySet<number>,
  targetKind: RelationshipEvidence["targetKind"],
  targetIds: ReadonlySet<number>,
): Map<number, RelationshipEvidence[]> {
  const rows = asArray(values, path);
  const byNpc = new Map<number, RelationshipEvidence[]>();
  const seen = new Set<string>();
  rows.forEach((value, index) => {
    const rowPath = `${path}[${index}]`;
    const row = asRecord(value, rowPath);
    const ownerNativeId = integerField(row, "ownerNativeId", rowPath);
    if (!npcIds.has(ownerNativeId)) throw new Error(`Relationship ${rowPath} points to unknown canonical NPC ${ownerNativeId}.`);
    const targetField = targetKind === "merchantTable" ? "merchantTableID" : "questID";
    const targetId = integerField(row, targetField, rowPath, Number.MIN_SAFE_INTEGER);
    const indexField = targetKind === "merchantTable" ? "bindingIndex" : "associationIndex";
    const relationIndex = integerField(row, indexField, rowPath);
    const association = targetKind === "quest" ? textField(row, "association", rowPath) : null;
    const key = targetKind === "merchantTable"
      ? `${ownerNativeId}:${relationIndex}`
      : `${ownerNativeId}:${association}:${relationIndex}`;
    if (seen.has(key)) throw new Error(`Duplicate ${targetKind} relationship identity at ${rowPath}.`);
    seen.add(key);

    const pointer = `/${path.slice("relationships.".length)}/${index}`;
    const supported = targetId >= 0 && targetIds.has(targetId) && (association === null || association === "given" || association === "completed");
    const unsupportedReason = targetId < 0
      ? `${targetField} uses a negative sentinel.`
      : !targetIds.has(targetId)
        ? `${targetField} ${targetId} is not present in the available ${targetKind} definitions.`
        : association !== null && association !== "given" && association !== "completed"
          ? `Unsupported quest association ${association}.`
          : undefined;
    const item: RelationshipEvidence = { pointer, targetId, targetKind, supported, ...(unsupportedReason === undefined ? {} : { unsupportedReason }) };
    const ownerRows = byNpc.get(ownerNativeId);
    if (ownerRows) ownerRows.push(item);
    else byNpc.set(ownerNativeId, [item]);
  });
  return byNpc;
}

function appendRelationshipIssues(
  destination: RoleIssue[],
  rows: readonly RelationshipEvidence[],
  npcId: number,
): void {
  for (const row of rows) {
    if (!row.supported) {
      destination.push(issue(
        row.targetKind === "merchantTable" ? "unsupportedMerchantRelationship" : "unsupportedQuestRelationship",
        row.unsupportedReason ?? `Unsupported ${row.targetKind} relationship for NPC ${npcId}.`,
        [evidence("relationships", row.pointer)],
      ));
    }
  }
}

export function collectNpcRoleFacts(canonical: Canonical, relationships: Relationships, factionFacts: FactionRoleFacts): Map<number, NpcRoleResult> {
  const canonicalNpcs = asArray(canonical.npcs, "canonical.npcs");
  const npcIds = new Set<number>();
  const rowsById = new Map<number, { row: RecordValue; index: number }>();

  canonicalNpcs.forEach((value, index) => {
    const path = `canonical.npcs[${index}]`;
    const row = asRecord(value, path);
    const nativeId = integerField(row, "nativeId", path);
    const sourceKey = integerField(row, "sourceKey", path);
    if (sourceKey !== nativeId) throw new Error(`Canonical NPC sourceKey disagrees with nativeId at ${path}.`);
    if (npcIds.has(nativeId)) throw new Error(`Duplicate canonical NPC identity: ${nativeId}.`);
    const gameplay = asRecord(row.gameplay, `${path}.gameplay`);
    const npcType = asRecord(gameplay.npcType, `${path}.gameplay.npcType`);
    integerField(npcType, "value", `${path}.gameplay.npcType`, Number.MIN_SAFE_INTEGER);
    textField(npcType, "name", `${path}.gameplay.npcType`);
    for (const field of ["isMerchant", "isQuestGiver", "isDialogue", "isInspectable", "isTradable", "isCombatEnabled"]) booleanField(gameplay, field, `${path}.gameplay`);
    npcIds.add(nativeId);
    rowsById.set(nativeId, { row, index });
  });

  const merchantTableIds = definitions(relationships.merchantTables, "relationships.merchantTables", "merchant table");
  const relationshipQuestIds = definitions(relationships.quests, "relationships.quests", "quest");
  const merchantRows = relationshipRows(relationships.merchantBindings, "relationships.merchantBindings", npcIds, "merchantTable", merchantTableIds);
  const questRows = relationshipRows(relationships.npcQuestBindings, "relationships.npcQuestBindings", npcIds, "quest", relationshipQuestIds);
  const result = new Map<number, NpcRoleResult>();

  for (const [npcId, { row, index }] of rowsById) {
    const gameplay = asRecord(row.gameplay, `canonical.npcs[${index}].gameplay`);
    const npcType = asRecord(gameplay.npcType, `canonical.npcs[${index}].gameplay.npcType`);
    const typeValue = integerField(npcType, "value", `canonical.npcs[${index}].gameplay.npcType`, Number.MIN_SAFE_INTEGER);
    const typeName = textField(npcType, "name", `canonical.npcs[${index}].gameplay.npcType`);
    const canonicalRef = evidence("canonical", `/npcs/${index}`);
    const resultRow: NpcRoleResult = { facts: [role("npc", npcId, [canonicalRef])], issues: [] };
    const typeRef = evidence("canonical", `/npcs/${index}/gameplay/npcType`);

    const expectedTypeName = npcTypes.get(typeValue);
    if (expectedTypeName === undefined || expectedTypeName !== typeName) {
      resultRow.issues.push(issue("unsupportedNpcRank", `NPC rank enum ${typeValue}/${typeName} is not a recovered supported NPC_TYPE value.`, [typeRef]));
    } else {
      const rankRole = rankRoles.get(typeValue);
      if (rankRole !== undefined) resultRow.facts.push(role(rankRole, npcId, [typeRef]));
      else if (typeValue === 2) resultRow.issues.push(issue("unsupportedNpcRank", "NPC_TYPE.RARE has no supported player-facing rank role.", [typeRef]));
    }

    const merchantRelationshipRows = merchantRows.get(npcId) ?? [];
    const merchantRefs = merchantRelationshipRows.map(rowValue => evidence("relationships", rowValue.pointer));
    if (booleanField(gameplay, "isMerchant", `canonical.npcs[${index}].gameplay`)) {
      resultRow.facts.push(role("merchant", npcId, [evidence("canonical", `/npcs/${index}/gameplay/isMerchant`), ...merchantRefs]));
      if (merchantRelationshipRows.length === 0) resultRow.issues.push(issue("missingMerchantRelationship", "Native isMerchant is enabled, but no authored merchant binding is available.", [evidence("canonical", `/npcs/${index}/gameplay/isMerchant`)]));
      appendRelationshipIssues(resultRow.issues, merchantRelationshipRows, npcId);
    }

    const questRelationshipRows = questRows.get(npcId) ?? [];
    const questRefs = questRelationshipRows.map(rowValue => evidence("relationships", rowValue.pointer));
    if (booleanField(gameplay, "isQuestGiver", `canonical.npcs[${index}].gameplay`)) {
      resultRow.facts.push(role("questGiver", npcId, [evidence("canonical", `/npcs/${index}/gameplay/isQuestGiver`), ...questRefs]));
      if (questRelationshipRows.length === 0) resultRow.issues.push(issue("missingQuestRelationship", "Native isQuestGiver is enabled, but no authored quest binding is available.", [evidence("canonical", `/npcs/${index}/gameplay/isQuestGiver`)]));
      appendRelationshipIssues(resultRow.issues, questRelationshipRows, npcId);
    }

    const capabilities: readonly [string, string][] = [["dialogue", "isDialogue"], ["inspect", "isInspectable"], ["trade", "isTradable"]];
    for (const [roleName, field] of capabilities) {
      if (booleanField(gameplay, field, `canonical.npcs[${index}].gameplay`)) resultRow.facts.push(role(roleName, npcId, [evidence("canonical", `/npcs/${index}/gameplay/${field}`)]));
    }

    if (booleanField(gameplay, "isCombatEnabled", `canonical.npcs[${index}].gameplay`)) {
      const combatRef = evidence("canonical", `/npcs/${index}/gameplay/isCombatEnabled`);
      resultRow.facts.push(role("combatant", npcId, [combatRef]));
    }
    const factionId = integerField(gameplay, "factionId", `canonical.npcs[${index}].gameplay`, Number.MIN_SAFE_INTEGER);
    const factionRef = evidence("canonical", `/npcs/${index}/gameplay/factionId`);
    const faction = factionFacts.get(factionId);
    if (!faction) resultRow.issues.push(issue("hostilityUnclassified", `NPC faction ${factionId} has no recovered native alignment.`, [factionRef]));
    else {
      for (const fact of faction.facts) resultRow.facts.push({ ...fact, npcId, evidence: [...fact.evidence, factionRef] });
      for (const entry of faction.issues) resultRow.issues.push({ ...entry, evidence: [...entry.evidence, factionRef] });
    }

    result.set(npcId, resultRow);
  }
  return result;
}
