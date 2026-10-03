import type { CatalogCondition, CatalogEndpoint, CatalogEntityRow, CatalogFacts, CatalogProgressionApplier, CatalogProgressionFact, CatalogRelations, ProgressionEffect, ProgressionEffectRank } from "@afallon/contracts/catalog";
import type { PublicEffect, Ref } from "@afallon/contracts/public";
import type { PublishedPage } from "../references";
import { displayName, plainText } from "../text";
import { projectRule, topicRef } from "../placed-rules";
import { GUIDES } from "../guide-sections";
import { type DocumentProjectionInput, mergeRefs, pageBase, projectRequirement } from "./projection";

/** One scanned world source applying an effect. Keep source identity outside the published document. */
export interface EffectWorldSource {
  effectKey: string;
  family: string;
  place: CatalogEndpoint | null;
  placementIds: string[];
  label: string | null;
  sourceId?: string;
}
export interface EffectWorldCheck {
  conditionId: string;
  family: string;
  place: CatalogEndpoint | null;
  sourceId: string;
}

type EffectInput = DocumentProjectionInput & { effectWorldSources?: readonly EffectWorldSource[]; effectWorldChecks?: readonly EffectWorldCheck[] };
type EffectSource = PublicEffect["appliedBy"][number];
type EffectCheck = PublicEffect["checkedBy"][number];
const checksCache = new WeakMap<CatalogRelations, Map<string, CatalogCondition[]>>();
const worldChecksCache = new WeakMap<readonly EffectWorldCheck[], Map<string, EffectWorldCheck[]>>();
const emptyWorldChecks: readonly EffectWorldCheck[] = [];

function worldChecksByCondition(checks: readonly EffectWorldCheck[]): Map<string, EffectWorldCheck[]> {
  const cached = worldChecksCache.get(checks);
  if (cached) return cached;
  const byCondition = new Map<string, EffectWorldCheck[]>();
  for (const check of checks) {
    const rows = byCondition.get(check.conditionId) ?? [];
    rows.push(check);
    byCondition.set(check.conditionId, rows);
  }
  worldChecksCache.set(checks, byCondition);
  return byCondition;
}
const abilitiesCache = new WeakMap<CatalogFacts, Map<string, CatalogProgressionFact>>();
const rosterCache = new WeakMap<CatalogFacts, ReadonlySet<string>>();
function rosterMembers(facts: CatalogFacts): ReadonlySet<string> {
  let members = rosterCache.get(facts);
  if (!members) {
    members = new Set((facts.adventurerWorld?.arrivals ?? []).flatMap((arrival) => arrival.adventurer.entityKey ? [arrival.adventurer.entityKey] : []));
    rosterCache.set(facts, members);
  }
  return members;
}

function abilityFacts(facts: CatalogFacts): Map<string, CatalogProgressionFact> {
  const cached = abilitiesCache.get(facts);
  if (cached) return cached;
  const abilities = new Map(facts.progression.facts.filter((fact) => fact.kind === "abilities").map((fact) => [fact.entityKey, fact]));
  abilitiesCache.set(facts, abilities);
  return abilities;
}

function abilityApplies(abilityKey: string | null, rankIndex: number | undefined, effectKey: string, abilities: ReadonlyMap<string, CatalogProgressionFact>): boolean {
  if (!abilityKey) return false;
  const fact = abilities.get(abilityKey);
  if (fact?.kind !== "abilities") return false;
  return fact.details.ranks.some((rank) => (rankIndex === undefined || rank.rank === rankIndex)
    && (rank.effectsApplied.some((entry) => entry.effect.entityKey === effectKey)
      || rank.casterEffectsApplied.some((entry) => entry.effect.entityKey === effectKey)));
}
/** The same ability-rank application target shown on an effect page and on its source ability page. */
export function appliedAbilityTargets(applier: CatalogProgressionApplier, facts: CatalogFacts): readonly (string | undefined)[] {
  const abilityKey = applier.source.entityKey;
  const fact = abilityKey ? abilityFacts(facts).get(abilityKey) : undefined;
  if (fact?.kind !== "abilities") return [];
  const targets = applier.rank === null ? [] : fact.details.ranks.filter((rank) => rank.rank === applier.rank).flatMap((rank) =>
    (applier.via === "casterAbility" ? rank.casterEffectsApplied : rank.effectsApplied)
      .filter((entry) => entry.effect.entityKey === applier.effect).map((entry) => readable(entry.target.name)));
  return targets.length ? [...new Set(targets)] : [undefined];
}
export interface AppliedAbilityEffect { effectKey: string; rank?: number; effectRank?: number; chance?: number; target?: string }
const appliedAbilityCache = new WeakMap<CatalogFacts, Map<string, AppliedAbilityEffect[]>>();


/** Effects that a particular ability record applies, optionally restricted to the rank used by an item or creature. */
export function appliedEffectsByAbility(facts: CatalogFacts, abilityKey: string | null, rankIndex?: number): readonly AppliedAbilityEffect[] {
  if (!abilityKey) return [];
  let byAbility = appliedAbilityCache.get(facts);
  if (!byAbility) {
    byAbility = new Map();
    for (const applier of facts.progression.appliers) {
      const key = applier.source.entityKey;
      if (!key || (applier.via !== "ability" && applier.via !== "casterAbility") || abilityFacts(facts).get(key)?.kind !== "abilities") continue;
      const rows = byAbility.get(key) ?? [];
      const ability = abilityFacts(facts).get(key);
      const rank = ability?.kind === "abilities" ? ability.details.ranks.find((entry) => entry.rank === applier.rank) : undefined;
      const applied = rank ? (applier.via === "casterAbility" ? rank.casterEffectsApplied : rank.effectsApplied)
        .filter((entry) => entry.effect.entityKey === applier.effect) : [];
      for (const effect of applied) rows.push({
        effectKey: applier.effect, ...(applier.rank !== null ? { rank: applier.rank } : {}),
        effectRank: effect.rank,
        ...(applier.chance < 100 ? { chance: applier.chance } : {}),
        target: readable(effect.target.name),
      });
      if (!applied.length) for (const target of appliedAbilityTargets(applier, facts)) rows.push({
        effectKey: applier.effect, ...(applier.rank !== null ? { rank: applier.rank } : {}),
        ...(applier.chance < 100 ? { chance: applier.chance } : {}), ...(target ? { target } : {}),
      });
      byAbility.set(key, rows);
    }
    appliedAbilityCache.set(facts, byAbility);
  }
  const rows = byAbility.get(abilityKey) ?? [];
  return rankIndex === undefined ? rows : rows.filter((row) => row.rank === undefined || row.rank === rankIndex);
}

/** The game leaves some effects unnamed; their effect type is the only player-readable identity. */
export function effectFallbackName(entity: CatalogEntityRow, facts: CatalogFacts): string {
  const fact = facts.progression.facts.find((row) => row.entityKey === entity.entityKey);
  if (fact?.kind !== "effects") throw new Error(`Missing effect type for ${entity.entityKey}.`);
  return `Unnamed ${readable(fact.details.effectType.name)} Effect`;
}

function keyOf(endpoint: { entityKey: string | null } | null | undefined): string | null {
  return endpoint?.entityKey?.startsWith("effects:") ? endpoint.entityKey : null;
}

function effectInAction(type: string, target: CatalogEndpoint | null): string | null {
  return type === "Effect" ? keyOf(target) : null;
}

/** A named check is a source of information about an effect, not an application of it. */
function namedChecks(relations: CatalogRelations): Map<string, CatalogCondition[]> {
  const cached = checksCache.get(relations);
  if (cached) return cached;
  const result = new Map<string, CatalogCondition[]>();
  for (const condition of relations.conditions) {
    const seen = new Set<string>();
    for (const group of condition.requirements) for (const requirement of group.requirements) {
      if (requirement.type.name !== "Effect" || requirement.effectCondition?.name !== "Effect") continue;
      const key = keyOf(requirement.references.effect);
      if (!key || seen.has(key)) continue;
      const rows = result.get(key) ?? [];
      rows.push(condition);
      result.set(key, rows);
      seen.add(key);
    }
  }
  checksCache.set(relations, result);
  return result;
}

/** An observed application, named requirement, or verified mechanics explanation makes an effect reachable. */
export function effectPageKeys(facts: CatalogFacts, relations: CatalogRelations, worldSources: readonly EffectWorldSource[] = []): ReadonlySet<string> {
  const existing = new Set(facts.progression.facts.filter((fact) => fact.kind === "effects").map((fact) => fact.entityKey));
  const keys = new Set<string>();
  const add = (key: string | null) => { if (key && existing.has(key)) keys.add(key); };
  for (const applier of facts.progression.appliers) add(applier.effect);
  for (const item of facts.items) for (const action of item.gameActions) add(effectInAction(action.type, action.target));
  for (const invite of facts.adventurerInviteEffects) add(keyOf(invite.effect));
  for (const source of worldSources) add(source.effectKey);
  for (const key of namedChecks(relations).keys()) add(key);
  for (const rule of facts.progression.mechanicsRules) if (rule.status === "verified" && rule.topic !== undefined) {
    for (const link of rule.links) add(keyOf(link));
  }
  return keys;
}

function ref(endpoint: CatalogEndpoint, input: DocumentProjectionInput): Ref {
  const resolved = input.resolve(endpoint);
  // A recorded effect may target a place or owner excluded from the public site.
  return resolved.key !== null && input.excluded?.has(resolved.key) ? { key: null, label: resolved.name } : resolved;
}

function action(label: string, target?: Ref, amount?: number, unit?: string, detail?: string): PublicEffect["ranks"][number]["actions"][number] {
  return { label, ...(target ? { target } : {}), ...(amount !== undefined ? { amount } : {}), ...(unit ? { unit } : {}), ...(detail ? { detail } : {}) };
}

function readable(name: string): string {
  return name.replaceAll(/([a-z])([A-Z])/g, "$1 $2").replaceAll(/_/g, " ").replaceAll(/\s+/g, " ").trim().replace(/^./, (first) => first.toUpperCase());
}

/** Only damage and healing ranks enter the combat scaling calculation. */
export function rankScaling(effect: ProgressionEffect, rank: ProgressionEffectRank, input: DocumentProjectionInput): PublicEffect["ranks"][number]["scaling"] {
  if (!["InstantDamage", "DamageOverTime", "InstantHeal", "HealOverTime"].includes(effect.effectType.name)) return undefined;
  const healing = effect.effectType.name === "InstantHeal" || effect.effectType.name === "HealOverTime";
  const basis = rank.hitValueType;
  const baseKind = basis?.value === 0 ? "flat" : rank.alteredStat && basis?.value === 1 ? "percentMax"
    : rank.alteredStat && basis?.value === 2 ? "percentCurrent" : "unknown";
  return {
    stats: (rank.scaling ?? []).filter((entry) => entry.coefficientPercent !== 0)
      .map((entry) => ({ stat: input.resolve(entry.stat), coefficientPercent: entry.coefficientPercent, source: entry.source })),
    baseAmount: rank.damage, baseKind,
    ...(baseKind !== "unknown" && rank.alteredStat && (healing || baseKind !== "flat") ? { baseStat: input.resolve(rank.alteredStat) } : {}),
    ...(healing ? {} : { category: readable(rank.customDamageType?.trim() || rank.damageType.name),
      ...(rank.damageType.name !== "None" ? { mainType: readable(rank.damageType.name) } : {}) }),
    healing, weaponPercent: rank.weaponDamageModifier,
    weapons: [
      ...(rank.useWeapon1Damage ? ["main hand" as const] : []),
      ...(rank.useWeapon2Damage ? ["off hand" as const] : []),
      ...(rank.useRangedWeaponDamage ? ["ranged" as const] : []),
    ],
  };
}

export function rankActions(effect: ProgressionEffect, rank: ProgressionEffectRank, input: DocumentProjectionInput) {
  const type = effect.effectType.name;
  const actions: PublicEffect["ranks"][number]["actions"] = [];
  if (type === "Stat") for (const stat of rank.statEffects) actions.push(action("Changes", ref(stat.stat, input), stat.amount, stat.isPercent ? "%" : undefined));
  if (["InstantDamage", "DamageOverTime", "InstantHeal", "HealOverTime"].includes(type)) {
    const healing = type === "InstantHeal" || type === "HealOverTime";
    if (rank.damage !== 0) actions.push(action(healing ? "Authored Healing" : "Authored Damage", undefined, rank.damage));
    if (rank.alteredStat) actions.push(action(healing ? "Restores" : "Affects", ref(rank.alteredStat, input)));
    if (!healing && rank.damageType.name !== "None") actions.push(action("Damage Type", undefined, undefined, undefined, readable(rank.damageType.name)));
    if (!healing && rank.customDamageType?.trim()) actions.push(action("Damage Category", undefined, undefined, undefined, readable(rank.customDamageType)));
    if (healing && rank.customHealingType?.trim()) actions.push(action("Healing Category", undefined, undefined, undefined, readable(rank.customHealingType)));
    if (rank.skillModifierSkill && rank.skillModifier !== 0) actions.push(action("Skill Modifier", ref(rank.skillModifierSkill, input), rank.skillModifier));
    if (rank.maxHealthModifier !== 0) actions.push(action("Maximum Health Modifier", undefined, rank.maxHealthModifier));
    if (rank.missingHealthModifier !== 0) actions.push(action("Missing Health Modifier", undefined, rank.missingHealthModifier));
    if (rank.lifesteal !== 0) actions.push(action("Life Steal Modifier", undefined, rank.lifesteal));
    if (rank.cannotCrit) actions.push(action("Cannot Critically Hit"));
  }
  if (type === "Pet") {
    if (rank.pet) actions.push(action("Summons", ref(rank.pet, input)));
    if (rank.petSpawnCount > 0) actions.push(action("Summon Count", undefined, rank.petSpawnCount));
    if (rank.petDuration > 0) actions.push(action("Pet Duration", undefined, rank.petDuration, "Seconds"));
  }
  if (type === "Teleport") {
    if (rank.teleportScene) {
      const present = rank.teleportScene.entityKey !== null && input.entities.some((entity) => entity.entityKey === rank.teleportScene!.entityKey && entity.kind === "scenes");
      actions.push(action("Destination Scene", present ? ref(rank.teleportScene, input) : undefined));
    }
    if (rank.teleportType.name !== "None") actions.push(action("Teleport Type", undefined, undefined, undefined, readable(rank.teleportType.name)));
  }
  if (type === "Dispel") {
    if (rank.dispelEffect) actions.push(action("Removes Effect", ref(rank.dispelEffect, input)));
    if (rank.dispelEffectTag) actions.push(action("Effect Tag", undefined, undefined, undefined, readable(rank.dispelEffectTag)));
    if (rank.dispelEffectType.name !== "None") actions.push(action("Effect Type", undefined, undefined, undefined, readable(rank.dispelEffectType.name)));
    if (rank.dispelType.name !== "None") actions.push(action("Dispel Selection", undefined, undefined, undefined, readable(rank.dispelType.name)));
  }
  if (type === "Knockback" && rank.knockbackDistance !== 0) actions.push(action("Knockback Distance", undefined, rank.knockbackDistance));
  if (type === "Motion" && rank.motionDistance !== 0) actions.push(action("Movement Distance", undefined, rank.motionDistance));
  if (type === "Taunt" && rank.tauntFlatThreat !== 0) actions.push(action("Added Threat", undefined, rank.tauntFlatThreat));
  if (type === "Resurrect" && rank.resurrectHealthPercent !== 0) actions.push(action("Health On Resurrection", undefined, rank.resurrectHealthPercent, "%"));
  if (type === "RollLootTable" && rank.lootTable) actions.push(action("Loot Table", ref(rank.lootTable, input)));
  return actions;
}

function applicationSources(key: string, input: EffectInput): EffectSource[] {
  const facts = input.facts;
  const rows: EffectSource[] = [];
  const abilities = abilityFacts(facts);
  const roster = rosterMembers(facts);
  for (const applier of facts.progression.appliers) {
    if (applier.effect !== key) continue;
    const fact = applier.source.entityKey ? abilities.get(applier.source.entityKey) ?? facts.progression.facts.find((candidate) => candidate.entityKey === applier.source.entityKey) : undefined;
    const targets = fact?.kind === "abilities" ? appliedAbilityTargets(applier, facts)
      : fact?.kind === "stats" ? fact.details.onHitEffects.filter((hit) => hit.effect.entityKey === key).map((hit) => readable(hit.target.name)) : [];
    for (const target of targets.length ? new Set(targets) : [undefined]) rows.push({
      source: ref(applier.source, input), via: applier.via === "casterAbility" ? "Caster Ability" : applier.via === "statOnHit" ? "Stat On Hit" : applier.via === "effect" ? "Effect" : "Ability",
      ...(applier.rank !== null ? { rank: applier.rank } : {}), ...(applier.chance < 100 ? { chance: applier.chance } : {}), ...(target ? { target } : {}),
    });
  }
  for (const item of facts.items) for (const action of item.gameActions) if (effectInAction(action.type, action.target) === key) rows.push({
    source: ref({ entityKey: item.entityKey, label: item.entityKey }, input), via: "Item Use",
    ...(action.chance > 0 && action.chance < 100 ? { chance: action.chance } : {}),
  });
  for (const item of facts.items) {
    if (item.actionAbilities.some((row) => abilityApplies(row.ability.entityKey, row.rankIndex, key, abilities))
      || item.gameActions.some((row) => row.type === "Ability" && abilityApplies(row.target?.entityKey ?? null, undefined, key, abilities)))
      rows.push({ source: ref({ entityKey: item.entityKey, label: item.entityKey }, input), via: "Item Ability" });
  }
  for (const npc of facts.npcs) if (!roster.has(npc.entityKey) && npc.abilityPhases.some((phase) => phase.abilities.some((row) => abilityApplies(row.ability.entityKey, row.rankIndex, key, abilities))))
    rows.push({ source: ref({ entityKey: npc.entityKey, label: npc.entityKey }, input), via: "NPC Ability" });
  for (const invite of facts.adventurerInviteEffects) if (keyOf(invite.effect) === key) rows.push({ source: ref(invite.adventurer, input), via: "Invitation" });
  for (const source of input.effectWorldSources ?? []) if (source.effectKey === key && source.family === "npcInvitation" && source.place) rows.push({ source: ref(source.place, input), via: "Invitation" });
  const unique = new Map<string, EffectSource>();
  for (const row of rows) {
    const identity = row.source.key ?? row.source.label;
    const id = JSON.stringify([identity, row.via, row.rank, row.chance, row.target]);
    if (!unique.has(id)) unique.set(id, row);
  }
  return [...unique.values()];
}

function checkedSources(key: string, input: EffectInput): EffectCheck[] {
  const conditionOwners = new Map<string, Ref[]>();
  const register = (conditionId: string | null, endpoint: CatalogEndpoint) => {
    if (!conditionId) return;
    const rows = conditionOwners.get(conditionId) ?? [];
    rows.push(ref(endpoint, input));
    conditionOwners.set(conditionId, rows);
  };
  for (const fact of input.facts.progression.facts) if (fact.kind === "abilities") for (const rank of fact.details.ranks) register(rank.conditionId, { entityKey: fact.entityKey, label: fact.name ?? fact.entityKey });
  for (const item of input.facts.items) for (const id of item.conditionIds) register(id, { entityKey: item.entityKey, label: item.entityKey });
  for (const quest of input.facts.quests) for (const id of quest.conditionIds) register(id, { entityKey: quest.entityKey, label: quest.entityKey });
  for (const node of input.facts.progression.talentNodes) if (node.conditionId) register(node.conditionId, { entityKey: node.tree, label: node.tree });
  const results: EffectCheck[] = [], unique = new Set<string>();
  const worldByCondition = worldChecksByCondition(input.effectWorldChecks ?? emptyWorldChecks);
  const worldGroups = new Map<string, { row: EffectCheck; sources: Set<string> }>();
  for (const condition of namedChecks(input.relations).get(key) ?? []) for (const group of condition.requirements) for (const requirement of group.requirements) {
    if (requirement.type.name !== "Effect" || requirement.effectCondition?.name !== "Effect" || keyOf(requirement.references.effect) !== key) continue;
    const label = projectRequirement(requirement, input.resolve).label, state = readable(requirement.state?.name ?? requirement.rule.name), target = readable(requirement.entity?.name ?? "Target");
    const groupLabel = [condition.scope ? readable(condition.scope) : "", group.mode === "any" ? "One Of Several Checks" : ""].filter(Boolean).join(" · ");
    const owners = mergeRefs(conditionOwners.get(condition.conditionId) ?? [], input);
    const worldChecks = worldByCondition.get(condition.conditionId) ?? [];
    if (!owners.length && !worldChecks.length) {
      const row: EffectCheck = { label, state, target, ...(groupLabel ? { group: groupLabel } : {}) };
      const signature = JSON.stringify(row);
      if (!unique.has(signature)) { results.push(row); unique.add(signature); }
    }
    for (const owner of owners) {
      const row: EffectCheck = { owner, label, state, target, ...(groupLabel ? { group: groupLabel } : {}) };
      const signature = JSON.stringify(row);
      if (!unique.has(signature)) { results.push(row); unique.add(signature); }
    }
    for (const check of worldChecks) {
      const owner = check.place ? ref(check.place, input) : undefined;
      const row: EffectCheck = { ...(owner ? { owner } : {}), label, state, target, group: [groupLabel, `World ${readable(check.family)}`].filter(Boolean).join(" · ") };
      const signature = JSON.stringify(row);
      const current = worldGroups.get(signature) ?? { row, sources: new Set<string>() };
      current.sources.add(check.sourceId);
      worldGroups.set(signature, current);
    }
  }
  for (const { row, sources } of worldGroups.values()) results.push({ ...row, count: sources.size });
  return results;
}

function worldGroups(key: string, input: EffectInput): PublicEffect["worldSources"] {
  const groups = new Map<string, { family: string; place?: Ref; sourceCount: number; labels: string[] }>();
  const seen = new Set<string>();
  for (const source of input.effectWorldSources ?? []) {
    if (source.effectKey !== key || source.family === "npcInvitation") continue;
    const place = source.place ? ref(source.place, input) : undefined;
    const groupKey = JSON.stringify([source.family, place]);
    const sourceKey = `${groupKey}\u0000${source.sourceId ?? source.placementIds.join("|")}`;
    if (seen.has(sourceKey)) continue;
    seen.add(sourceKey);
    const row = groups.get(groupKey) ?? { family: readable(source.family), ...(place ? { place } : {}), sourceCount: 0, labels: [] };
    row.sourceCount++;
    const label = displayName(source.label ?? "");
    if (label && !row.labels.includes(label) && row.labels.length < 4) row.labels.push(label);
    groups.set(groupKey, row);
  }
  return [...groups.values()].sort((a, b) => (a.place ? "name" in a.place ? a.place.name : a.place.label : "").localeCompare(b.place ? "name" in b.place ? b.place.name : b.place.label : "") || a.family.localeCompare(b.family));
}

export function projectEffectPage(page: PublishedPage, input: EffectInput, _conditions: ReadonlyMap<string, CatalogCondition>): PublicEffect {
  const key = page.members[0]!.entity.entityKey;
  const fact = input.facts.progression.facts.find((candidate) => candidate.entityKey === key);
  if (fact?.kind !== "effects") throw new Error(`Missing effect facts for ${key}.`);
  const effect = fact.details;
  const explainedBy: PublicEffect["explainedBy"] = input.facts.progression.mechanicsRules.flatMap((rule) => {
    if (rule.status !== "verified" || !rule.topic || !rule.links.some((link) => link.entityKey === key)) return [];
    const section = GUIDES[rule.topic].sections.find((entry) => entry.id === rule.section);
    if (!section?.how) throw new Error(`Rule ${rule.ruleId} has no How link for ${rule.topic} section ${rule.section}.`);
    return [{ guide: topicRef(rule.topic), section: rule.section, label: section.how, rule: projectRule(rule, input.resolve) }];
  });
  return {
    ...pageBase(page, input), type: readable(effect.effectType.name), isState: effect.isState,
    durationSeconds: effect.duration, endless: effect.endless, pulses: effect.pulses, stackLimit: effect.stackLimit,
    persistent: effect.isPersistent, canBeManuallyRemoved: effect.canBeManuallyRemoved,
    ranks: effect.ranks.map((rank) => {
      const scaling = rankScaling(effect, rank, input);
      return { rank: rank.rank, actions: rankActions(effect, rank, input),
        ...(scaling ? { scaling } : {}),
        ...(rank.requiredEffect ? { requiredEffect: ref(rank.requiredEffect, input), requiredEffectDamageModifier: rank.requiredEffectDamageModifier } : {}) };
    }),
    appliedBy: applicationSources(key, input), checkedBy: checkedSources(key, input), worldSources: worldGroups(key, input), explainedBy,
  };
}
