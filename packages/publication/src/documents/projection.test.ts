import { expect, test } from "bun:test";
import type { CatalogFacts, CatalogRequirement, CatalogRequirementGroup, ProgressionEffect, ProgressionEffectRank } from "@afallon/contracts/catalog";
import { grantedByActions, projectRequirementGroups, type DocumentProjectionInput } from "./projection";
import { summoningEffects } from "./npcs";
import { rankActions } from "./effects";

const level = (name: string, amount: number, rule = 0) => ({ type: { value: 13, name: "Level" }, rule: { value: rule, name: "Mandatory" }, label: `level ${amount}`,
  spans: [{ text: `level ${amount}` }], value: { value: 0, name }, amounts: { primary: amount } }) as unknown as CatalogRequirement;
const labels = (group: CatalogRequirementGroup) => projectRequirementGroups([group], () => { throw new Error("no references"); })[0]!.requirements.map((row) => row.label);

test("a lowest and a highest level of an all group read as one range", () => {
  expect(labels({ mode: "all", checkCount: false, requiredCount: null, requirements: [level("EqualOrAbove", 1), level("EqualOrBelow", 10)] })).toEqual(["levels 1–10"]);
  expect(labels({ mode: "all", checkCount: false, requiredCount: null, requirements: [level("EqualOrAbove", 7), level("EqualOrBelow", 7)] })).toEqual(["level 7"]);
  // Alternatives and limits under different rules stay separate.
  expect(labels({ mode: "any", checkCount: false, requiredCount: null, requirements: [level("EqualOrAbove", 1), level("EqualOrBelow", 10)] })).toHaveLength(2);
  expect(labels({ mode: "all", checkCount: false, requiredCount: null, requirements: [level("EqualOrAbove", 1), level("EqualOrBelow", 10, 1)] })).toHaveLength(2);
});

test("dialogue unlocks and object grants do not masquerade as casts or self-removals", () => {
  const action = (type: string, ownerKind: string, target: string, alterAction: string) => ({
    type, ownerKind, target: { entityKey: target, label: target }, alterAction, progressionType: "Unlock",
    sceneNativeId: ownerKind === "interactableObjects" ? 10 : null, ownerName: ownerKind === "interactableObjects" ? "Phase 4 trigger[0]" : null,
  });
  const input = {
    facts: { ownerGameActions: [
      action("Ability", "dialogues", "abilities:236", "Gain"),
      action("Ability", "templates", "abilities:236", "Gain"),
      action("Ability", "interactableObjects", "abilities:236", "Gain"),
      action("Ability", "dialogues", "abilities:236", "Remove"),
      action("Ability", "dialogues", "abilities:237", "Gain"),
      action("NPC", "dialogues", "npcs:345", "Gain"),
      action("NPC", "interactableObjects", "npcs:345", "Gain"),
    ] as CatalogFacts["ownerGameActions"] },
    entities: [{ entityKey: "scenes:10", kind: "scenes", name: "Crypt" }],
    resolve: ({ entityKey, label }: { entityKey: string | null; label: string }) => ({ key: entityKey, kind: "places", name: label, slug: "crypt" }),
  } as unknown as DocumentProjectionInput;
  expect(grantedByActions(input, new Set(["abilities:236"]), "Ability")).toEqual([
    { label: "Dialogue" },
    { label: "Phase 4 Trigger", owner: { key: "scenes:10", kind: "places", name: "Crypt", slug: "crypt" } },
  ]);
  expect(grantedByActions(input, new Set(["npcs:345"]), "NPC")).toEqual([{ label: "Dialogue" }]);
});

test("only a pet effect whose rank names the creature is a summoner", () => {
  const effect = (key: string, type: string, pet: string | null) => ({
    kind: "effects", entityKey: key, name: key,
    details: { effectType: { name: type }, ranks: [{ pet: pet ? { entityKey: pet, label: pet } : null }] },
  });
  const input = { facts: { progression: { facts: [
    effect("effects:100", "Pet", "npcs:15"),
    effect("effects:101", "Pet", "npcs:16"),
    effect("effects:102", "Teleport", "npcs:15"),
  ] } }, resolve: ({ entityKey, label }: { entityKey: string | null; label: string }) =>
    ({ key: entityKey, kind: "effects", name: label, slug: label }) } as DocumentProjectionInput;
  expect(summoningEffects(new Set(["npcs:15"]), input).map((ref) => ref.key)).toEqual(["effects:100"]);
  expect(summoningEffects(new Set(["npcs:17"]), input)).toEqual([]);
});

test("travel actions link existing scenes but never leak absent scene identifiers", () => {
  const effect = { effectType: { name: "Teleport" } } as ProgressionEffect;
  const rank = (entityKey: string | null) => ({ teleportScene: { entityKey, label: entityKey ?? "scenes 17" },
    teleportType: { name: "GameScene" } }) as ProgressionEffectRank;
  const input = { entities: [{ entityKey: "scenes:10", kind: "scenes" }],
    resolve: ({ entityKey, label }: { entityKey: string | null; label: string }) => ({ key: entityKey, kind: "places", name: label, slug: "crypt" }),
  } as unknown as DocumentProjectionInput;
  expect(rankActions(effect, rank(null), input).find((action) => action.label === "Destination Scene"))
    .toEqual({ label: "Destination Scene" });
  expect(rankActions(effect, rank("scenes:10"), input).find((action) => action.label === "Destination Scene"))
    .toMatchObject({ target: { key: "scenes:10" } });
});
