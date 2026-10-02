import { expect, test } from "bun:test";
import { talentWebLayout, type TalentWebTreeInput } from "./talent-web";

// Shieldmaster's Bastion Breaker and Heroic Ascension, captured from the game's TalentWebLayout.Build.
test("places Shieldmaster wedges, nodes and requirement paths", () => {
  const trees: TalentWebTreeInput[] = [
    { treeKey: "talentTrees:0", tiers: 9, nodes: [
      { nodeIndex: 0, nodeType: "ability", tier: 1, row: 2, requires: [] },
      { nodeIndex: 1, nodeType: "ability", tier: 1, row: 4, requires: [] },
      { nodeIndex: 2, nodeType: "bonus", tier: 2, row: 1, requires: [0] },
      { nodeIndex: 3, nodeType: "bonus", tier: 2, row: 3, requires: [0] },
      { nodeIndex: 4, nodeType: "bonus", tier: 2, row: 5, requires: [1] },
      { nodeIndex: 8, nodeType: "bonus", tier: 4, row: 1, requires: [1] },
      { nodeIndex: 11, nodeType: "bonus", tier: 4, row: 5, requires: [0] },
    ] },
    { treeKey: "talentTrees:3", tiers: 9, nodes: [{ nodeIndex: 0, nodeType: "bonus", tier: 1, row: 2, requires: [] }] },
    { treeKey: "talentTrees:6", tiers: 10, nodes: [{ nodeIndex: 0, nodeType: "bonus", tier: 1, row: 2, requires: [] }] },
    { treeKey: "talentTrees:18", tiers: 10, nodes: [{ nodeIndex: 0, nodeType: "ability", tier: 1, row: 3, requires: [] }] },
    { treeKey: "talentTrees:23", tiers: 4, nodes: [{ nodeIndex: 0, nodeType: "bonus", tier: 1, row: 3, requires: [] }] },
  ];
  const web = talentWebLayout(trees);
  expect(web.wedges).toEqual([
    { treeKey: "talentTrees:0", angle: 90, width: 52 },
    { treeKey: "talentTrees:3", angle: 18, width: 52 },
    { treeKey: "talentTrees:6", angle: -54, width: 52 },
    { treeKey: "talentTrees:18", angle: -126, width: 52 },
    { treeKey: "talentTrees:23", angle: -198, width: 52 },
  ]);
  const at = (treeKey: string, nodeIndex: number) => web.nodes.find((node) => node.treeKey === treeKey && node.nodeIndex === nodeIndex)!;
  for (const [treeKey, index, x, y] of [
    ["talentTrees:0", 0, 74.999985, 307.54556],
    ["talentTrees:0", 1, -75.000015, 307.54556],
    ["talentTrees:0", 2, 299.99997, 768.86395],
    ["talentTrees:0", 3, 149.99997, 768.86395],
    ["talentTrees:23", 0, -285.31696, 92.70509],
  ] as const) {
    expect(at(treeKey, index).x).toBeCloseTo(x, 2);
    expect(at(treeKey, index).y).toBeCloseTo(y, 2);
  }
  for (const [treeKey, source, target, expected] of [
    ["talentTrees:0", 0, 2, [[74.999985, 307.54556], [299.99997, 768.86395]]],
    ["talentTrees:0", 0, 3, [[74.999985, 307.54556], [149.99997, 768.86395]]],
    ["talentTrees:23", -1, 0, [[0, 0], [-285.31696, 92.70509]]],
  ] as const) {
    const route = web.edges.find((edge) => edge.treeKey === treeKey && edge.source === source && edge.target === target)!.points;
    expect(route).toHaveLength(expected.length);
    for (let i = 0; i < expected.length; i++) for (let axis = 0; axis < 2; axis++) {
      expect(route[i]![axis]!).toBeCloseTo(expected[i]![axis]!, 2);
    }
  }
});

test("keeps both prerequisite sources as separate lines", () => {
  const web = talentWebLayout([{ treeKey: "talentTrees:test", tiers: 2, nodes: [
    { nodeIndex: 0, nodeType: "ability", tier: 1, row: 1, requires: [] },
    { nodeIndex: 1, nodeType: "ability", tier: 1, row: 2, requires: [] },
    { nodeIndex: 2, nodeType: "bonus", tier: 2, row: 1, requires: [0, 1] },
  ] }]);
  expect(web.edges.filter((edge) => edge.target === 2).map((edge) => edge.source)).toEqual([0, 1]);
});
