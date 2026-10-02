import type { CatalogAvailabilityRule, CatalogCondition, CatalogNpcFacts, CatalogPlacementRow } from "@afallon/contracts/catalog";
import { type AvailabilityRule, collectRefs, type NpcFacts, type NpcLocation, type NpcVariantFacts, type NpcVariantField, type PlacementRef, type PublicLevel, type PublicMarkerCategory, type PublicNpc, type QuestLinkRow, type NpcAdventurer, type PlacedRule } from "@afallon/contracts/public";
import { markerCategories, shownCategories } from "../categories";
import { phaseAbilities, recordStats } from "../adventurers";
import { characterLevelCap, killExperience } from "../experience";
import { chancePercent, choicesChance, enabledChance, levelUnion } from "../levels";
import { placeSpots } from "../place-spots";
import { itemKind, itemTypeLabel } from "../item-type";
import { placedRules, topicRef } from "../placed-rules";
import { flightNetworks, npcFlights } from "../flight-network";
import type { PublishedPage } from "../references";
import { plainText } from "../text";
import { shownNpcStats } from "../variants";
import { assertDistinctLootRules, lootFields } from "./loot";
import { type DocumentProjectionInput, endpointOrUnknown, mergeRefs, optionalFactRef, pageBase, projectAvailability, type RelationIndexes, requirementsFor } from "./projection";
import { objectiveForRow } from "./quests";

const EMPTY_NPC_FACTS: Omit<CatalogNpcFacts, "entityKey"> = { minLevel: null, maxLevel: null, scalesWithPlayer: false, npcType: null, creatureType: null, family: null, faction: null, species: null, isMerchant: false, isQuestGiver: false, isCombatEnabled: false, isAuctioneer: false, isBanker: false, isFlightMaster: false, hunterTamable: false, hunterBeastRole: null, equipmentAppearanceSelections: null, adventurer: null, flightNetwork: null, minRespawn: null, maxRespawn: null, minExperience: null, maxExperience: null, lowerLevelExperienceModifier: null, higherLevelExperienceModifier: null, experienceBonusPerLevel: null, immuneToStun: false, immuneToSlow: false, aggroRange: null, stats: [], abilityPhases: [], factionRewards: [], linkedNpc: null, lootSpecialization: null };

export function npcFact(key: string, indexes: RelationIndexes): CatalogNpcFacts {
  return indexes.npcFacts.get(key) ?? { entityKey: key, ...EMPTY_NPC_FACTS };
}

// The character level cap is one fact of the whole projection, so it is read once per projection input.
const levelCaps = new WeakMap<DocumentProjectionInput, number | undefined>();
function levelCapOf(input: DocumentProjectionInput): number | undefined {
  if (!levelCaps.has(input)) levelCaps.set(input, characterLevelCap(input.facts));
  return levelCaps.get(input);
}

// Every record fact that the page can show, for one record.
function npcRecordFacts(fact: CatalogNpcFacts, input: DocumentProjectionInput): Required<Pick<NpcVariantFacts, "stats" | "immunities" | "abilityPhases" | "factionRewards">> & NpcVariantFacts {
  const faction = optionalFactRef(input.resolve, fact.faction), species = optionalFactRef(input.resolve, fact.species);
  const linkedNpc = optionalFactRef(input.resolve, fact.linkedNpc), lootStat = optionalFactRef(input.resolve, fact.lootSpecialization?.stat);
  const roll = killExperience(fact), cap = levelCapOf(input);
  const experience = roll && {
    ...roll,
    ...(fact.lowerLevelExperienceModifier !== null && fact.higherLevelExperienceModifier !== null ? { levelDifference: { higher: fact.higherLevelExperienceModifier, lower: fact.lowerLevelExperienceModifier } } : {}),
    ...(cap === undefined ? {} : { levelCap: cap }),
  };
  return {
    ...(fact.npcType ? { npcType: plainText(fact.npcType) } : {}), ...(fact.creatureType ? { creatureType: plainText(fact.creatureType) } : {}),
    tameable: fact.npcType === "MOB" && fact.creatureType === "BEAST" && fact.hunterTamable,
    ...(fact.family ? { family: plainText(fact.family) } : {}), ...(faction === undefined ? {} : { faction }), ...(species === undefined ? {} : { species }),
    ...(fact.minRespawn === null || fact.maxRespawn === null ? {} : { respawn: { min: fact.minRespawn, max: fact.maxRespawn } }),
    ...(experience === null ? {} : { experience }),
    stats: shownNpcStats(recordStats(fact)).map((row) => ({ stat: input.resolve(row.stat), amount: row.amount, isPercent: row.isPercent })),
    immunities: [fact.immuneToStun ? "stun" : null, fact.immuneToSlow ? "slow" : null].filter((value): value is string => value !== null),
    ...(fact.aggroRange === null ? {} : { aggroRange: fact.aggroRange }),
    ...(fact.lootSpecialization === null ? {} : { lootSpecialization: {
      ...(fact.lootSpecialization.armorType ? { armorType: plainText(fact.lootSpecialization.armorType) } : {}),
      weaponTypes: fact.lootSpecialization.weaponTypes.map(plainText),
      ...(lootStat === undefined ? {} : { stat: lootStat }),
    } }),
    abilityPhases: phaseAbilities(fact).map((phase) => ({ phaseIndex: Math.max(0, phase.phaseIndex), ...(phase.name ? { name: plainText(phase.name) } : {}), ...(phase.requirement ? { requirement: plainText(phase.requirement) } : {}), abilities: phase.abilities.map((ability) => ({ ability: input.resolve(ability.ability), rankIndex: Math.max(0, ability.rankIndex) })) })),
    factionRewards: fact.factionRewards.map((reward) => ({ counterpart: input.resolve(reward.faction), amount: reward.amount })),
    ...(linkedNpc === undefined ? {} : { linkedNpc }),
  };
}

function pick(facts: NpcVariantFacts, fields: readonly NpcVariantField[]): NpcVariantFacts {
  return Object.fromEntries(fields.flatMap((field) => facts[field] === undefined ? [] : [[field, facts[field]]])) as NpcVariantFacts;
}

function questLinks(key: string, input: DocumentProjectionInput, indexes: RelationIndexes): QuestLinkRow[] {
  const rows = (indexes.questsByCounterpart.get(key) ?? []).filter((row) => row.kind === "giver" || row.kind === "turnIn")
    .map((row) => ({ counterpart: input.resolve(row.quest), role: row.kind === "giver" ? "gives" as const : "completes" as const }));
  return [...new Map(rows.map((row) => [JSON.stringify(row), row])).values()];
}

type NpcSpot = {
  anchor: string; placement: CatalogPlacementRow; published: PlacementRef; level: PublicLevel | undefined;
  roles: PublicMarkerCategory[]; availability: AvailabilityRule[]; quests: QuestLinkRow[];
};

// Where the creature appears. Spots that share a place, availability, level, roles, quests, and random choice form
// one entry. When the game enables one entry of a choice, the page's spots that different entries enable are options
// of that choice, and one location entry can hold several of them.
function npcLocations(page: PublishedPage, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>): NpcLocation[] {
  const spots: NpcSpot[] = [];
  for (const member of page.members) {
    const key = member.entity.entityKey, fact = npcFact(key, indexes);
    const gates = new Map<string, CatalogAvailabilityRule[]>();
    for (const row of indexes.gatedSourcesBySubject.get(key) ?? []) if (row.family === "npcProducer") for (const placementId of row.placementIds) gates.set(placementId, [...gates.get(placementId) ?? [], ...row.availability]);
    const quests = questLinks(key, input, indexes);
    for (const placement of indexes.placementsByNpc.get(key) ?? []) {
      const published = input.placements.get(placement.placementId);
      if (!published) continue;
      const rules = [...new Map((gates.get(placement.placementId) ?? []).map((rule) => [JSON.stringify(rule), rule])).values()];
      spots.push({
        anchor: member.anchor, placement, published: { placementId: published.placementId, mapSpaceId: published.mapSpaceId, label: published.label },
        level: input.npcLevels.get(placement.placementId)?.get(key),
        roles: markerCategories(placement.roles.filter((role) => role.npcEntityKey === key), [fact]),
        availability: projectAvailability(rules, conditions, input.resolve), quests,
      });
    }
  }
  const optionSets = (spot: NpcSpot) => spot.placement.randomChoices.at(-1)!.entryIndexes.join(",");
  const optionsByChoice = new Map<string, Set<string>>();
  for (const spot of spots) {
    const inner = spot.placement.randomChoices.at(-1);
    if (inner?.enabled === 1) optionsByChoice.set(inner.choiceId, (optionsByChoice.get(inner.choiceId) ?? new Set<string>()).add(optionSets(spot)));
  }
  const entries = new Map<string, { spots: NpcSpot[]; exclusive: boolean }>();
  for (const spot of spots) {
    const choices = spot.placement.randomChoices, inner = choices.at(-1);
    const exclusive = inner !== undefined && (optionsByChoice.get(inner.choiceId)?.size ?? 0) > 1;
    const alternative = inner === undefined ? null : exclusive ? ["options", choices.map((choice) => choice.choiceId)] : ["chance", chancePercent(choicesChance(choices))];
    const key = JSON.stringify([spot.published.mapSpaceId, spot.published.label, spot.availability, spot.level ?? null, spot.roles, spot.quests, alternative]);
    const entry = entries.get(key);
    if (entry) entry.spots.push(spot);
    else entries.set(key, { spots: [spot], exclusive });
  }
  const locations = [...entries.values()].map(({ spots: entrySpots, exclusive }): NpcLocation => {
    const first = entrySpots[0]!, choices = first.placement.randomChoices, inner = choices.at(-1);
    let alternative: NpcLocation["alternative"];
    if (inner && exclusive) {
      const indexes = new Set(entrySpots.flatMap((spot) => spot.placement.randomChoices.at(-1)!.entryIndexes));
      alternative = { chance: chancePercent(enabledChance(inner, indexes.size) * choicesChance(choices.slice(0, -1))), options: new Set(entrySpots.map(optionSets)).size };
    } else if (inner) alternative = { chance: chancePercent(choicesChance(choices)), options: 1 };
    return {
      label: first.published.label, placements: [...new Map(entrySpots.map((spot) => [spot.published.placementId, spot.published])).values()],
      spotCount: new Set(entrySpots.map((spot) => spot.published.placementId)).size,
      availability: first.availability, ...(first.level ? { level: first.level } : {}), ...(alternative ? { alternative } : {}),
      variants: [...new Set(entrySpots.map((spot) => spot.anchor))], roles: first.roles, quests: first.quests,
    };
  });
  // Story order: an entry whose gate quests or own quests come earlier in their chains comes first.
  const questOrder = (location: NpcLocation) => Math.min(Infinity, ...[...collectRefs(location.availability), ...location.quests.map((row) => row.counterpart)]
    .map((ref) => ref.key !== null && ref.kind === "quests" ? indexes.chainOrder.get(ref.key) ?? Infinity : Infinity));
  return locations.sort((left, right) => questOrder(left) - questOrder(right) || left.label.localeCompare(right.label) || left.placements[0]!.placementId.localeCompare(right.placements[0]!.placementId));
}

/** Rows that every variant with rows shares appear once. Other rows name the variants that have them. */
function attributedRows<T>(rowsByVariant: ReadonlyArray<{ anchor: string; rows: readonly T[] }>): Array<T & { variants?: string[] }> {
  const holders = rowsByVariant.filter((variant) => variant.rows.length > 0).length;
  const merged = new Map<string, { row: T; anchors: string[] }>();
  for (const { anchor, rows } of rowsByVariant) for (const row of rows) {
    const key = JSON.stringify(row), entry = merged.get(key);
    if (entry) { if (!entry.anchors.includes(anchor)) entry.anchors.push(anchor); }
    else merged.set(key, { row, anchors: [anchor] });
  }
  return [...merged.values()].map(({ row, anchors }) => anchors.length === holders ? row as T & { variants?: string[] } : { ...row, variants: anchors });
}

export function projectNpcPage(page: PublishedPage, input: DocumentProjectionInput, indexes: RelationIndexes, conditions: ReadonlyMap<string, CatalogCondition>, adventurers: ReadonlyMap<string, NpcAdventurer>): PublicNpc {
  const variantFields = [...page.variantFields];
  const records = page.members.map((member) => ({ member, fact: npcFact(member.entity.entityKey, indexes) }));
  const recordFacts = records.map(({ fact }) => npcRecordFacts(fact, input));
  const shared = recordFacts[0]!;
  const locations = npcLocations(page, input, indexes, conditions);
  const services = new Set<PublicMarkerCategory>();
  for (const { fact } of records) {
    if (fact.isMerchant) services.add("merchant");
    if (fact.isQuestGiver) services.add("questGiver");
    if (fact.isAuctioneer) services.add("auctioneer");
    if (fact.isBanker) services.add("banker");
    if (fact.isFlightMaster) services.add("flightPoint");
  }
  const roles = shownCategories(new Set([...services, ...locations.flatMap((location) => location.roles)]));
  const level = levelUnion(locations.flatMap((location) => location.level ? [location.level] : []));
  const has = (field: NpcVariantField) => !variantFields.includes(field);
  const facts: NpcFacts = {
    ...(level ? { level } : {}),
    ...(has("npcType") && shared.npcType ? { npcType: shared.npcType } : {}), ...(has("creatureType") && shared.creatureType ? { creatureType: shared.creatureType } : {}),
    ...(has("tameable") ? { tameable: shared.tameable } : {}),
    ...(has("family") && shared.family ? { family: shared.family } : {}), ...(has("faction") && shared.faction ? { faction: shared.faction } : {}),
    ...(has("species") && shared.species ? { species: shared.species } : {}), roles,
    ...(has("respawn") && shared.respawn ? { respawn: shared.respawn } : {}), ...(has("experience") && shared.experience ? { experience: shared.experience } : {}),
    stats: has("stats") ? shared.stats : [], immunities: has("immunities") ? shared.immunities : [],
    ...(has("aggroRange") && shared.aggroRange !== undefined ? { aggroRange: shared.aggroRange } : {}),
    ...(has("lootSpecialization") && shared.lootSpecialization ? { lootSpecialization: shared.lootSpecialization } : {}),
  };
  const drops = attributedRows(records.map(({ member }) => {
    const rows = indexes.dropsByOwner.get(member.entity.entityKey) ?? [];
    assertDistinctLootRules(member.entity.entityKey, rows);
    return { anchor: member.anchor, rows: rows.map((row) => ({ counterpart: input.resolve(row.item), ...lootFields(row, conditions, input) })) };
  }));
  const sells = attributedRows(records.map(({ member }) => ({ anchor: member.anchor, rows: (indexes.vendorsByNpc.get(member.entity.entityKey) ?? []).map((row) => ({
    counterpart: input.resolve(row.item), price: { amount: Math.max(0, row.cost), currency: endpointOrUnknown(input.resolve, row.currency, "Unknown currency") },
    requirements: requirementsFor(row.conditionIds, conditions, input.resolve),
  })) })));
  const quests = [...new Map(records.flatMap(({ member }) => questLinks(member.entity.entityKey, input, indexes)).map((row) => [JSON.stringify(row), row])).values()];
  const usedInQuests = [...new Map(records.flatMap(({ member }) => (indexes.questsByCounterpart.get(member.entity.entityKey) ?? []).filter((row) => row.kind === "objective" && row.task !== null)
    .map((row) => ({ counterpart: input.resolve(row.quest), objective: objectiveForRow(row, input, indexes, conditions) }))).map((row) => [JSON.stringify(row), row])).values()];
  const memberKeys = new Set(page.members.map((member) => member.entity.entityKey));
  const bossOf = mergeRefs(input.facts.places.filter((place) => place.bosses.some((boss) => boss.entityKey !== null && memberKeys.has(boss.entityKey))).map((place) => input.resolve({ entityKey: place.entityKey, label: place.entityKey })), input);
  const hunterEntity = records.some(({ fact }) => fact.npcType === "MOB" && fact.creatureType === "BEAST" && fact.hunterTamable)
    ? input.entities.find((entity) => entity.kind === "classes" && entity.name === "Hunter") : undefined;
  const hunter = hunterEntity && input.references.refs.get(hunterEntity.entityKey);
  const base = pageBase(page, input);
  const placedRuleKeys = new Set<string>();
  const roster = new Set((input.facts.adventurerInviteEffects ?? []).map((effect) => effect.adventurer.entityKey));
  const npcPlacedRules = page.members.flatMap((member) => placedRules(input.facts, "npcs", { entityKey: member.entity.entityKey }, input.resolve)
    .filter((rule) => rule.target !== "adventurers" || roster.has(member.entity.entityKey)))
    .filter((rule) => {
      const key = `${rule.target}\u0000${rule.guide.key}\u0000${rule.section}`;
      if (placedRuleKeys.has(key)) return false;
      placedRuleKeys.add(key);
      return true;
    });
  // An adventurer can take reward gear after a job, and some adventurers also have a gear kit of their own.
  const world = input.facts.adventurerWorld;
  const adventurer = world !== null && page.members.some((member) => roster.has(member.entity.entityKey));
  const kit = [...new Set((input.facts.adventurerItems ?? []).flatMap((row) => row.kind === "kitUpgradeItem" && row.adventurer?.entityKey && memberKeys.has(row.adventurer.entityKey) ? [row.itemKey] : []))]
    .map((key) => {
      const type = itemTypeLabel(itemKind(input.facts.items.find((item) => item.entityKey === key)));
      return { item: input.resolve({ entityKey: key, label: key }), ...(type ? { type } : {}) };
    });
  // An adventurer on the world roster shows its class, role, preferred tree, and arrival, with the guide's roster.
  const adventurerFacts = page.members.map((member) => adventurers.get(member.entity.entityKey)).find((facts) => facts !== undefined);
  const flights = records.some(({ fact }) => fact.flightNetwork?.stopId) ? npcFlights(input.facts, memberKeys, flightNetworks(input.facts, input.resolve)) : [];
  const adventurerRules: PlacedRule[] = [
    ...(adventurerFacts ? [{ target: "adventurer", guide: topicRef("adventurers"), section: "roster" }] : []),
    ...(adventurer ? [{ target: "adventurer-gear", guide: topicRef("adventurers"), section: "gear-upgrades" }] : []),
  ];
  return {
    ...base, facts, variantFields,
    variants: records.map(({ member }, index) => {
      const portrait = input.artByEntity.get(member.entity.entityKey)?.portrait;
      const level = levelUnion(locations.flatMap((location) => location.level && location.variants.includes(member.anchor) ? [location.level] : []));
      return {
        key: member.entity.entityKey, anchor: member.anchor, label: member.label, ...(level ? { level } : {}),
        ...(portrait && portrait.sha256 !== base.art.portrait?.sha256 ? { portrait } : {}), facts: pick(recordFacts[index]!, variantFields),
      };
    }),
    locations, places: placeSpots(locations.flatMap((location) => location.placements)),
    spotCount: new Set(locations.flatMap((location) => location.placements.map((spot) => spot.placementId))).size,
    drops, sells, quests,
    abilityPhases: has("abilityPhases") ? shared.abilityPhases : [], factionRewards: has("factionRewards") ? shared.factionRewards : [],
    usedInQuests, bossOf, ...(hunter && "slug" in hunter && hunter.slug ? { hunter } : {}),
    ...(has("linkedNpc") && shared.linkedNpc ? { linkedNpc: shared.linkedNpc } : {}),
    placedRules: [...npcPlacedRules, ...adventurerRules],
    ...(adventurer ? { adventurerGear: { rewardChance: chancePercent(world.equipmentRewardChance), kit } } : {}),
    ...(adventurerFacts ? { adventurer: adventurerFacts } : {}),
    ...(flights.length ? { flights } : {}),
  };
}
