import type { CatalogEntityRow } from "@afallon/contracts/catalog";
import { type EntityRef, isEntityRef, type PublicRace } from "@afallon/contracts/public";
import { baseDocument, type DocumentProjectionInput, mergeRefs, refName } from "./projection";

/** A race's page: the classes it offers in authored order, the place where its characters start, and its adventurers. */
export function projectRace(entity: CatalogEntityRow, ref: EntityRef, input: DocumentProjectionInput): PublicRace {
  const fact = input.facts.progression.facts.find((candidate) => candidate.entityKey === entity.entityKey);
  const classes = fact?.kind === "races" ? fact.details.offeredClasses.map(input.resolve) : [];
  const scene = input.facts.raceStarts.find((row) => row.race.entityKey === entity.entityKey)?.scene ?? null;
  const start = scene ? input.resolve(scene) : undefined;
  const adventurers = mergeRefs(input.facts.npcs.flatMap((npc) => npc.adventurer?.race?.entityKey === entity.entityKey && input.references.refs.has(npc.entityKey)
    ? [input.resolve({ entityKey: npc.entityKey, label: npc.entityKey })] : []), input)
    .filter((adventurer) => isEntityRef(adventurer) && adventurer.slug).sort((a, b) => refName(a).localeCompare(refName(b)));
  return { ...baseDocument(entity, ref, input), classes, ...(start && isEntityRef(start) && start.slug ? { start } : {}), adventurers };
}
