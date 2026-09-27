import { expect, test } from 'bun:test';
import type { EntityRef, QuestObjective } from '@afallon/contracts/public';
import { itemQuestSourceRows, npcQuestRows } from './quest-rows';

const quest = (key: string, name: string): EntityRef => ({ key, kind: 'quests', name, slug: key.replace(':', '-') });
const coldClutch = quest('quests:113', 'Cold Clutch'), brood = quest('quests:114', 'Thinning the Brood');
const defeat: QuestObjective = { index: 0, text: 'Defeat 10 Broodlings', completions: [], type: 'killNpc', target: { key: 'npcs:1', kind: 'npcs', name: 'Broodling', slug: 'broodling' }, count: 10 };

test('an NPC that gives and completes a quest has one row for it, and a quest it is the target of has its own row', () => {
  const rows = npcQuestRows(
    [{ counterpart: coldClutch, role: 'gives' }, { counterpart: coldClutch, role: 'completes' }],
    [{ counterpart: brood, objective: defeat }],
  );
  expect(rows.map((row) => [row.quest, row.roles, row.objectives.map((objective) => objective.text)])).toEqual([
    [coldClutch, ['Gives and completes the quest'], []],
    [brood, [], ['Defeat 10 Broodlings']],
  ]);
});

test('an item that a quest gives in two roles with one count has one row, and a different count keeps its own row', () => {
  const rows = itemQuestSourceRows(
    [{ counterpart: coldClutch, count: 1, choice: false }, { counterpart: brood, count: 3, choice: true }],
    [{ counterpart: coldClutch, count: 1 }, { counterpart: brood, count: 1 }],
  );
  expect(rows.map((row) => [row.quest.key, row.roles, row.count])).toEqual([
    ['quests:113', ['Given at the start', 'Reward'], 1],
    ['quests:114', ['Given at the start'], 1],
    ['quests:114', ['Reward to choose'], 3],
  ]);
});
