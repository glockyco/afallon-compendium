// The game computes each quest's level range and dungeon from database records, not from the character:
// the same values come back at the main menu and in the world. The quest UI shows the range through
// QuestLevelRange.FormatPrefix as "[min-max]"; only the prefix colour depends on the character's level.
var database = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
if (database == null) throw new System.InvalidOperationException("GameDatabase.Instance returned null.");
var quests = database.GetQuests();
if (quests == null) throw new System.InvalidOperationException("GameDatabase.GetQuests returned null.");
var rows = new System.Collections.Generic.List<object>();
foreach (var pair in quests)
{
    var quest = pair.Value;
    if (quest == null) continue;
    int min = 0, max = 0;
    var ranged = Il2CppBLINK.RPGBuilder.UI.QuestLevelRange.TryGetRange(quest, out min, out max);
    var dungeon = Il2CppBLINK.RPGBuilder.UI.QuestLevelRange.GetDungeonScene(quest);
    rows.Add(new { nativeId = quest.ID, levelRange = ranged ? new { min = min, max = max } : null, dungeonSceneId = dungeon == null ? (int?)null : dungeon.ID });
}
return new { schemaVersion = "compendium.quest-levels.v1", sourceCount = quests.Count, quests = rows };
