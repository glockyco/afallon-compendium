// All settings are read from the loaded build. An absent asset/list stays null, not an empty rule.
var database = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
var settings = database == null ? null : database.GetCombatSettings();
var combatPath = "GameDatabase.GetCombatSettings().RPGBuilderCombatSettings";
var projectBonuses = new System.Func<Il2CppSystem.Collections.Generic.List<Il2Cpp.RPGBuilderCombatSettings.CorruptionStatBonus>, string, object>((bonuses, field) =>
{
    if (bonuses == null) return null;
    var result = new System.Collections.Generic.List<object>();
    for (var index = 0; index < bonuses.Count; index++)
    {
        var bonus = bonuses[index];
        if (bonus == null) throw new System.InvalidOperationException(field + "[" + index + "] is null; an authored bonus cannot be inferred.");
        result.Add(new { statId = bonus.statID, amountPerLevel = bonus.amountPerLevel, isPercent = bonus.isPercent, sourceFieldPath = field + "[" + index + "]" });
    }
    return result;
});
var combat = new
{
    maxLevel = settings == null ? (int?)null : settings.MaxCorruptionLevel,
    gearAllStatsPercentPerLevel = settings == null ? (float?)null : settings.CorruptionGearAllStatsPercentPerLevel,
    gearStatBonuses = settings == null ? null : projectBonuses(settings.CorruptionGearStatBonuses, combatPath + ".CorruptionGearStatBonuses"),
    mobStatBonuses = settings == null ? null : projectBonuses(settings.CorruptionStatBonuses, combatPath + ".CorruptionStatBonuses"),
    sourceFieldPath = combatPath
};
var affixAssets = UnityEngine.Resources.LoadAll<Il2CppBLINK.RPGBuilder.World.CorruptionAffixSettings>("");
if (affixAssets != null && affixAssets.Length > 1) throw new System.InvalidOperationException("Multiple CorruptionAffixSettings assets loaded; cannot select an arbitrary one.");
var affix = affixAssets == null || affixAssets.Length == 0 ? null : affixAssets[0];
var affixPath = "Resources.LoadAll<CorruptionAffixSettings>(\"\")[0]";
var disabled = new System.Collections.Generic.List<int>();
if (affix != null && affix.DisabledAffixes != null) foreach (var value in affix.DisabledAffixes) disabled.Add((int)value);
var npcRequirements = new System.Collections.Generic.List<object>();
if (affix != null)
{
    npcRequirements.Add(new { id = 6, npcId = affix.SpitefulGhostNpcID, sourceFieldPath = affixPath + ".SpitefulGhostNpcID" });
    npcRequirements.Add(new { id = 7, npcId = affix.ExplosiveOrbNpcID, sourceFieldPath = affixPath + ".ExplosiveOrbNpcID" });
    npcRequirements.Add(new { id = 11, npcId = affix.AfflictedSpiritNpcID, sourceFieldPath = affixPath + ".AfflictedSpiritNpcID" });
    npcRequirements.Add(new { id = 12, npcId = affix.IncorporealSpiritNpcID, sourceFieldPath = affixPath + ".IncorporealSpiritNpcID" });
}
var affixSettings = new
{
    affixesPerToken = affix == null ? (int?)null : affix.AffixesPerToken,
    disabledAffixes = affix == null || affix.DisabledAffixes == null ? null : (object)disabled,
    npcRequirements = affix == null ? null : (object)npcRequirements,
    sourceFieldPath = affixPath
};
var names = new System.Collections.Generic.List<object>();
for (var id = 0; id < 17; id++)
{
    var value = (Il2CppBLINK.RPGBuilder.World.CorruptionAffix)id;
    names.Add(new { id = id, name = Il2CppBLINK.RPGBuilder.World.CorruptionAffixes.DisplayName(value), description = Il2CppBLINK.RPGBuilder.World.CorruptionAffixes.Description(value), sourceFieldPath = "CorruptionAffixes[" + id + "].DisplayName/Description" });
}
var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var timers = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.DungeonTimerManager>(true);
var matches = new System.Collections.Generic.List<Il2CppBLINK.RPGBuilder.World.DungeonTimerManager>();
if (timers != null) foreach (var candidate in timers) if (candidate != null && candidate.gameObject != null && candidate.gameObject.scene.path == scene.path) matches.Add(candidate);
if (matches.Count > 1) throw new System.InvalidOperationException("Multiple dungeon timers in active scene " + scene.path);
object timer = null;
if (matches.Count == 1)
{
    var value = matches[0];
    var path = scene.path + "/DungeonTimerManager";
    var bosses = new System.Collections.Generic.List<object>();
    if (value.BossNPCs != null) for (var index = 0; index < value.BossNPCs.Count; index++)
    {
        var boss = value.BossNPCs[index];
        if (boss == null) throw new System.InvalidOperationException(path + ".BossNPCs[" + index + "] is null.");
        bosses.Add(new { id = boss.ID, sourceFieldPath = path + ".BossNPCs[" + index + "]" });
    }
    var tables = new System.Collections.Generic.List<object>();
    if (value.LootTables != null) for (var index = 0; index < value.LootTables.Count; index++)
    {
        var table = value.LootTables[index];
        if (table == null) throw new System.InvalidOperationException(path + ".LootTables[" + index + "] is null.");
        tables.Add(new { id = table.ID, sourceFieldPath = path + ".LootTables[" + index + "]" });
    }
    timer = new { scenePath = scene.path, sourceFieldPath = path, totalSeconds = (float?)value.MainCountdownDuration,
        firstRemainingSeconds = (float?)value.Target1TimeRemaining, secondRemainingSeconds = (float?)value.Target2TimeRemaining,
        maxLootItems = (int?)value.MaxLootItems, bosses = value.BossNPCs == null ? null : (object)bosses,
        lootTables = value.LootTables == null ? null : (object)tables,
        token = value.CorruptionTokenItem == null ? null : (object)new { id = value.CorruptionTokenItem.ID, sourceFieldPath = path + ".CorruptionTokenItem" } };
}
var finderAssets = UnityEngine.Resources.FindObjectsOfTypeAll<Il2CppBLINK.RPGBuilder.Dungeons.DungeonFinderSettings>();
if (finderAssets != null && finderAssets.Length > 1) throw new System.InvalidOperationException("Multiple DungeonFinderSettings assets loaded; cannot select an arbitrary one.");
var finderService = Il2CppBLINK.RPGBuilder.Dungeons.DungeonFinderService.Instance;
var finderSettings = finderService == null ? (finderAssets == null || finderAssets.Length == 0 ? null : finderAssets[0]) : finderService.Settings;
if (finderSettings == null) throw new System.InvalidOperationException("DungeonFinderSettings is unavailable from the service and Resources.FindObjectsOfTypeAll.");
var finderScenes = new System.Collections.Generic.List<int>();
var gameScenes = database == null ? null : database.GetGameScenes();
if (gameScenes != null) foreach (var scenePair in gameScenes)
{
    if (scenePair.Value != null && scenePair.Value.DungeonFinderEnabled) finderScenes.Add(scenePair.Value.ID);
}
finderScenes.Sort();
var dungeonFinder = new { supplyPackId = finderSettings == null || finderSettings.SupplyPack == null ? (int?)null : finderSettings.SupplyPack.ID,
    enabledSceneIds = finderScenes, sourceFieldPath = finderService == null ? "Resources.FindObjectsOfTypeAll<DungeonFinderSettings>()[0].SupplyPack; GameDatabase.GetGameScenes().DungeonFinderEnabled" : "DungeonFinderService.Instance.Settings.SupplyPack; GameDatabase.GetGameScenes().DungeonFinderEnabled" };
return new { schemaVersion = "compendium.corruption-capture.v2", combat = combat, affixSettings = affixSettings, affixes = names, timer = timer, dungeonFinder = dungeonFinder };
