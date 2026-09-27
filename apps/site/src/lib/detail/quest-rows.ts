import type { QuestGivenRow, QuestLinkRow, QuestObjective, QuestObjectiveRow, QuestRewardRow, Ref } from '@afallon/contracts/public';
import { mergeRows } from './relation-table';

/** One quest of a quests section, with each role that the page's entity has in it. */
export interface QuestRow {
  quest: Ref;
  /** Roles in reading order, such as "Gives the quest" or "Reward". */
  roles: string[];
  /** The objectives of the quest that name the page's entity. */
  objectives: QuestObjective[];
  /** How many of the item a reward or an objective involves. */
  count?: number;
}

const questKey = (quest: Ref) => quest.key ?? `label:${quest.label}`;

function objectiveCount(objective: QuestObjective): number | undefined {
  return 'count' in objective ? objective.count : undefined;
}

/** The role of a character in a quest in plain words: "Gives the quest", "Completes the quest", or both. */
export function questRoleText(gives: boolean, completes: boolean): string | undefined {
  if (gives && completes) return 'Gives and completes the quest';
  if (gives) return 'Gives the quest';
  return completes ? 'Completes the quest' : undefined;
}

function questRoles(roles: readonly QuestLinkRow['role'][]): string[] {
  const text = questRoleText(roles.includes('gives'), roles.includes('completes'));
  return text === undefined ? [] : [text];
}

/** The quests of an NPC: one row for each quest with every role of the NPC in it. */
export function npcQuestRows(links: readonly QuestLinkRow[], objectives: readonly QuestObjectiveRow[]): QuestRow[] {
  const entries = [
    ...links.map((row) => ({ quest: row.counterpart, role: row.role, objective: undefined })),
    ...objectives.map((row) => ({ quest: row.counterpart, role: undefined, objective: row.objective })),
  ];
  return mergeRows(entries, (entry) => questKey(entry.quest), (group) => ({
    quest: group[0]!.quest,
    roles: questRoles(group.flatMap((entry) => entry.role ? [entry.role] : [])),
    objectives: group.flatMap((entry) => entry.objective ? [entry.objective] : []),
  }));
}

/** The quests that give an item. A quest that gives it in two roles with one count has one row. */
export function itemQuestSourceRows(rewards: readonly QuestRewardRow[], given: readonly QuestGivenRow[]): QuestRow[] {
  const entries = [
    ...given.map((row) => ({ quest: row.counterpart, count: row.count, role: 'Given at the start' })),
    ...rewards.map((row) => ({ quest: row.counterpart, count: row.count, role: row.choice ? 'Reward to choose' : 'Reward' })),
  ];
  return mergeRows(entries, (entry) => `${questKey(entry.quest)}\u0000${entry.count}`, (group) => ({
    quest: group[0]!.quest, roles: [...new Set(group.map((entry) => entry.role))], objectives: [], count: group[0]!.count,
  }));
}

/** The quests whose objectives need an item. Each objective keeps its own row, because its text and count differ. */
export function itemQuestUseRows(objectives: readonly QuestObjectiveRow[]): QuestRow[] {
  return objectives.map((row) => ({ quest: row.counterpart, roles: [], objectives: [row.objective], count: objectiveCount(row.objective) }));
}

/** The quests of a place: one row for each quest that starts in it or has an objective in it. */
export function placeQuestRows(starts: readonly Ref[], objectives: readonly Ref[]): QuestRow[] {
  const entries = [...starts.map((quest) => ({ quest, role: 'Starts here' })), ...objectives.map((quest) => ({ quest, role: 'Has an objective here' }))];
  return mergeRows(entries, (entry) => questKey(entry.quest), (group) => ({
    quest: group[0]!.quest, roles: [...new Set(group.map((entry) => entry.role))], objectives: [],
  }));
}
