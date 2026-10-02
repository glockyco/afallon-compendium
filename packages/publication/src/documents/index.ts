import { isEntityRef, type PublicDocument, type PublicNpc } from "@afallon/contracts/public";
import { adventurerRoster } from "../adventurers";
import { projectAbilityPage } from "./abilities";
import { projectClass, startingGearByItem } from "./classes";
import { projectCraftingStation } from "./crafting-stations";
import { projectCurrency } from "./currencies";
import { newCharacterStandings, projectFaction } from "./factions";
import { projectGearSet } from "./gear-sets";
import { fromItemsByItem, projectItem } from "./items";
import { projectNpcPage } from "./npcs";
import { projectPlace } from "./places";
import { conditionsById, type DocumentProjectionInput, relationIndexes } from "./projection";
import { projectProperty } from "./properties";
import { projectQuest } from "./quests";
import { projectRace } from "./races";
import { projectSkill } from "./skills";

/** One document for each published page, keyed by the page key. */
export function projectPublicDocuments(input: DocumentProjectionInput): ReadonlyMap<string, PublicDocument> {
  const indexes = relationIndexes(input.entities, input.facts, input.relations), conditions = conditionsById(input.relations.conditions);
  const startingGear = startingGearByItem(input.entities, input.facts, input.references.refs), fromItems = fromItemsByItem(input);
  const adventurers = adventurerRoster(input.facts, input.resolve, input.artByEntity);
  const result = new Map<string, PublicDocument>();
  // A faction page counts the NPC pages that name it, so factions follow the NPC pages.
  const factions: Array<[string, Parameters<typeof projectFaction>[0], Parameters<typeof projectFaction>[1]]> = [];
  for (const [key, page] of input.references.pages) {
    if (!page.ref.slug) continue;
    const entity = page.members[0]!.entity, ref = page.ref;
    let document: PublicDocument;
    switch (page.kind) {
      case "items": document = projectItem(entity, ref, input, indexes, conditions, startingGear, fromItems); break;
      case "npcs": document = projectNpcPage(page, input, indexes, conditions, adventurers); break;
      case "quests": document = projectQuest(entity, ref, input, indexes, conditions); break;
      case "places": document = projectPlace(entity, ref, input, indexes, conditions); break;
      case "properties": document = projectProperty(entity, ref, input); break;
      case "abilities": document = projectAbilityPage(page, input, conditions); break;
      case "classes": document = projectClass(entity, ref, input, conditions); break;
      case "skills": document = projectSkill(entity, ref, input, indexes); break;
      case "gearSets": document = projectGearSet(entity, ref, input); break;
      case "currencies": document = projectCurrency(entity, ref, input, indexes); break;
      case "craftingStations": document = projectCraftingStation(entity, ref, input, indexes); break;
      case "races": document = projectRace(entity, ref, input); break;
      case "factions": factions.push([key, entity, ref]); continue;
      default: continue;
    }
    result.set(key, document);
  }
  const members = new Map<string, number>();
  for (const document of result.values()) {
    const faction = document.ref.kind === "npcs" ? (document as PublicNpc).facts.faction : undefined;
    if (faction && isEntityRef(faction)) members.set(faction.key, (members.get(faction.key) ?? 0) + 1);
  }
  const standings = newCharacterStandings(input.facts);
  for (const [key, entity, ref] of factions) result.set(key, projectFaction(entity, ref, input, members.get(ref.key) ?? 0, standings));
  return result;
}

export function countUnresolvedReferences(value: unknown): number {
  if (Array.isArray(value)) return value.reduce<number>((sum, entry) => sum + countUnresolvedReferences(entry), 0);
  if (value === null || typeof value !== "object") return 0;
  const record = value as Record<string, unknown>;
  const own = record.key === null && typeof record.label === "string" ? 1 : 0;
  return own + Object.values(record).reduce<number>((sum, entry) => sum + countUnresolvedReferences(entry), 0);
}
