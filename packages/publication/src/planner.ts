import type { Database } from "bun:sqlite";
import { Assert } from "typebox/value";
import type { CatalogEndpoint } from "@afallon/contracts/catalog";
import { StaticPlannerSchema, type PlannerCondition, type StaticPlanner } from "@afallon/contracts/public";
import type { DocumentProjectionInput } from "./documents/projection";
import { displayName, withoutMarkup } from "./text";

export interface PlannerConditionRow {
  id: string; semantics: string; sourceFieldPath: string | null; payload: unknown;
}
export function plannerConditionRows(db: Database): PlannerConditionRow[] {
  return db.query<{ id: string; semantics: string; sourceFieldPath: string | null; payload: string }, []>(
    "SELECT condition_id AS id, semantics, source_field_path AS sourceFieldPath, payload_json AS payload FROM conditions ORDER BY condition_id",
  ).all().map((row) => ({ ...row, payload: JSON.parse(row.payload) as unknown }));
}

export function projectPlanner(identity: { buildId: string; catalogId: string },
  input: { facts: Pick<DocumentProjectionInput["facts"], "progression" | "abilities">; artByEntity: DocumentProjectionInput["artByEntity"] },
  conditionRows: readonly PlannerConditionRow[]): StaticPlanner {
  const progression = input.facts.progression;
  const facts = new Map(progression.facts.map((fact) => [fact.entityKey, fact]));
  const conditions = new Map(conditionRows.map((row) => [row.id, row]));
  const ref = (endpoint: CatalogEndpoint | null) => {
    const key = endpoint?.entityKey ?? null;
    const icon = key ? input.artByEntity.get(key)?.icon : undefined;
    return { key, name: displayName(endpoint?.label ?? "Unknown"), ...(icon ? { icon } : {}) };
  };
  const named = (key: string) => ref({ entityKey: key, label: facts.get(key)?.name ?? key });
  const condition = (id: string | null, purchase: boolean): PlannerCondition => {
    const row = id === null ? undefined : conditions.get(id);
    if (!row) return { id, semantics: null, sourceFieldPath: null, groups: null,
      gaps: [id === null ? "condition-not-recorded" : "condition-record-missing"] };
    const payload = row.payload as { groups?: PlannerCondition["groups"] } | null;
    const groups = payload?.groups ?? null;
    const gaps: string[] = [];
    if (!Array.isArray(groups)) gaps.push("condition-groups-missing");
    else for (const group of groups) {
      if (!group || !Array.isArray(group.requirements)) { gaps.push("condition-group-missing"); continue; }
      const optional = group.requirements.some((predicate) => predicate?.conditionRule === "Optional");
      if (optional && typeof group.checkCount !== "boolean") gaps.push("optional-threshold-mode-missing");
      if (optional && group.checkCount && !Number.isSafeInteger(group.requiredCount)) gaps.push("optional-threshold-missing");
      for (const predicate of group.requirements) {
        if (!predicate) { gaps.push("predicate-missing"); continue; }
        if (purchase && (!['Ability', 'Bonus'].includes(String(predicate.requirementType))
          || !['Mandatory', 'Optional'].includes(String(predicate.conditionRule)))) gaps.push("purchase-predicate-not-verified");
      }
    }
    return { id, semantics: row.semantics, sourceFieldPath: row.sourceFieldPath, groups, gaps: [...new Set(gaps)] };
  };
  const races = progression.facts.flatMap((fact) => fact.kind === "races" ? [{ ...named(fact.entityKey),
    offeredClasses: fact.details.offeredClasses.map(ref), gaps: fact.details.offeredClasses.some((offer) => offer.entityKey === null) ? ["class-offer-unresolved"] : [] }] : []);
  const offered = new Set(races.flatMap((race) => race.offeredClasses.flatMap((offer) => offer.key === null ? [] : [offer.key])));
  const classes = [...offered].sort().map((key) => {
    const fact = facts.get(key);
    const levelKey = fact?.kind === "classes" ? fact.details.levelTemplate?.entityKey : null;
    const template = levelKey ? facts.get(levelKey) : undefined;
    const levels = template?.kind === "levels" && template.details.levels > 0 ? { min: 1, max: template.details.levels } : null;
    return { ...named(key), levels,
      trees: progression.links.filter((link) => link.owner === key && link.linkKind === "talentTree").sort((a, b) => a.linkIndex - b.linkIndex).map((link) => ref(link.target)),
      gaps: [...(fact?.kind === "classes" ? [] : ["class-fact-missing"]), ...(levels ? [] : ["level-bounds-missing"]),
        ...(progression.links.some((link) => link.owner === key && link.linkKind === "talentTree" && link.target.entityKey === null) ? ["tree-reference-unresolved"] : [])] };
  });
  const treeKeys = [...new Set(classes.flatMap((row) => row.trees.flatMap((tree) => tree.key ? [tree.key] : [])))].sort();
  const trees = treeKeys.map((key) => {
    const fact = facts.get(key), details = fact?.kind === "talentTrees" ? fact.details : undefined;
    return { ...named(key), pointType: details?.treePoint?.entityKey ?? null, tiers: details?.tiers ?? null, slotsPerTier: details?.slotsPerTier ?? null,
      gaps: [...(details ? [] : ["tree-fact-missing"]), ...(details?.treePoint?.entityKey ? [] : ["point-type-unresolved"])],
      nodes: progression.talentNodes.filter((node) => node.tree === key).sort((a, b) => a.nodeIndex - b.nodeIndex).map((node) => {
        const target = node.target?.entityKey ? facts.get(node.target.entityKey) : undefined;
        const ranked = target?.kind === "abilities" || target?.kind === "bonuses" ? target : undefined;
        const abilityText = input.facts.abilities.find((ability) => ability.entityKey === node.target?.entityKey);
        const ranks = (ranked?.details.ranks ?? []).map((rank) => ({ rank: rank.rank + 1, authoredCost: Number.isFinite(rank.unlockCost) ? rank.unlockCost : null,
          rawData: { ...rank }, text: ranked?.kind === "abilities"
            ? (abilityText?.ranks.find((entry) => entry.rankIndex === rank.rank)?.lines ?? []).map((line) => line.spans.map((span) => span.text).join(""))
            : 'emptyTooltip' in rank && rank.emptyTooltip ? [withoutMarkup(rank.emptyTooltip)] : [],
          useEffectCondition: condition(rank.conditionId, false) }));
        return { index: node.nodeIndex, kind: node.nodeType, target: ref(node.target), tier: node.tier, row: node.row,
          rankLimit: ranked ? ranks.length : null,
          defaultRank: typeof ranked?.details.learnedByDefault === "boolean" ? (ranked.details.learnedByDefault ? 1 : 0) : null, ranks,
          purchaseCondition: condition(node.conditionId, true),
          gaps: [...(node.target?.entityKey ? [] : ["node-target-unresolved"]), ...(ranked ? [] : ["node-ranks-missing"]),
            ...(typeof ranked?.details.learnedByDefault === "boolean" ? [] : ["default-knowledge-missing"]),
            ...(ranks.some((rank) => rank.authoredCost === null) ? ["rank-cost-missing"] : []),
            ...(['ability', 'bonus'].includes(node.nodeType) ? [] : ["node-kind-not-verified"])] };
      }) };
  });
  const pointTypes = progression.facts.flatMap((fact) => {
    if (fact.kind !== "treePoints") return [];
    const details = fact.details;
    const levelRules = details.gainRules.filter((rule) => rule.trigger.value === 0);
    const verified = identity.buildId === "25653798" && fact.entityKey === "treePoints:0" && details.startAmount === 1 && details.maxPoints === 180
      && levelRules.length === 1 && levelRules[0]?.amount === 3 && levelRules[0].class === null && levelRules[0].skill === null
      && levelRules[0].item === null && levelRules[0].npc === null && levelRules[0].weaponTemplateId === null;
    return [{ ...named(fact.entityKey), startAmount: details.startAmount, authoredMaxPoints: details.maxPoints,
      baseLevelGrant: verified ? { start: 1, perLevel: 3, positiveCap: 180, rule: "build-25653798-base-talent-points" } : null,
      rawGainRules: details.gainRules.map((rule) => ({ ...rule })), gaps: ["full-earned-total-not-verified", ...(verified ? [] : ["base-level-grant-not-verified"])] }];
  });
  const value: StaticPlanner = { schemaVersion: "compendium.static-planner.v1", ...identity, races, classes, trees, pointTypes,
    gaps: ["external-knowledge-schedule-not-recorded", "active-point-modifiers-not-recorded", "game-refunds-not-simulated"] };
  Assert(StaticPlannerSchema, value);
  return value;
}
