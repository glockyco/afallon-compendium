import { expect, test } from "bun:test";
import { Assert } from "typebox/value";
import { GuideDocumentSchema } from "@afallon/contracts/public";

const counts = { dungeons: 1, bosses: 1, regions: 0, properties: 0 };
const summaryBoss = { bossKey: "npcs:7", label: "A Guide Boss", placementIds: [], lootCount: 2 };
const summaryDungeon = { dungeonKey: "scenes:10", label: "Guide Dungeon", placementIds: [], bosses: [summaryBoss] };
const fullBoss = { ...summaryBoss, loot: [{ itemKey: "items:1", label: "A Drop", chance: 15 }] };
const fullDungeon = { ...summaryDungeon, bosses: [fullBoss] };

function document(guide: Record<string, unknown>) {
  return { schemaVersion: "compendium.adventure-guide.v1", buildId: "build", counts, guide, entities: [] };
}

test("publication guide documents validate summary and detail dungeon bosses", () => {
  Assert(GuideDocumentSchema, document({ dungeons: [summaryDungeon], bosses: [summaryBoss], regions: [], properties: [] }));
  Assert(GuideDocumentSchema, document({ dungeons: [fullDungeon], bosses: [fullBoss], regions: [], properties: [] }));

  const malformed = document({ dungeons: [{ ...summaryDungeon, bosses: [{ ...summaryBoss, lootCount: undefined }] }], bosses: [summaryBoss], regions: [], properties: [] });
  expect(() => Assert(GuideDocumentSchema, malformed)).toThrow();
});
