var database = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
var character = Il2CppBLINK.RPGBuilder.Characters.Character.Instance;
if (database == null || character == null || character.CharacterData == null || Il2Cpp.GameState.playerEntity == null)
    throw new System.InvalidOperationException("Load the configured research character before extracting loot rules.");
var profile = character.CharacterData;
if (profile.CharacterName != (string)args["researchCharacter"] || !profile.IsCreated)
    throw new System.InvalidOperationException("The loaded character does not match the configured research character.");
var originalFirstGearDone = profile.FirstGearDropDone;
var playerLevel = Il2Cpp.GameState.playerEntity.GetLevel();
var frame = UnityEngine.Time.frameCount;
var flags = System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic;
var methods = typeof(Il2Cpp.EconomyUtilities).GetMethods(flags);
var itemLevelMethod = System.Linq.Enumerable.Single(methods, method => method.Name == "GetItemLevelRequirement" && method.GetParameters().Length == 1);
var allowedMethod = System.Linq.Enumerable.Single(methods, method => method.Name == "LootItemLevelAllowed" && method.GetParameters().Length == 3);
var items = database.GetItems();
var levels = new System.Collections.Generic.Dictionary<int, int>();
var itemLevels = new System.Collections.Generic.List<object>();
var maxReferenceLevel = 1;
var itemArguments = new object[1];
foreach (var pair in items)
{
    itemArguments[0] = pair.Value;
    var requiredLevel = (int)itemLevelMethod.Invoke(null, itemArguments);
    levels.Add(pair.Key, requiredLevel);
    itemLevels.Add(new { itemId = pair.Key, requiredLevel = requiredLevel });
    maxReferenceLevel = System.Math.Max(maxReferenceLevel, requiredLevel + Il2Cpp.EconomyUtilities.LevelBandRange + 1);
}
foreach (var pair in database.GetLevels()) maxReferenceLevel = System.Math.Max(maxReferenceLevel, pair.Value.levels);
var linkedNpcs = new System.Collections.Generic.List<object>();
var npcs = database.GetNPCs();
foreach (var pair in npcs)
{
    var npc = pair.Value;
    maxReferenceLevel = System.Math.Max(maxReferenceLevel, npc.MaxLevel);
    var linked = npc.GetLinkedNpc();
    var specialization = npc.GetLootSpecSource();
    var expectedLinked = npc.HasLinkedNpc && npc.LinkedNpcID != -1 && npcs.ContainsKey(npc.LinkedNpcID) ? npcs[npc.LinkedNpcID] : null;
    var expectedSpecialization = expectedLinked != null && expectedLinked.HasLootSpecialization ? expectedLinked : (npc.HasLootSpecialization ? npc : null);
    if ((linked == null ? (int?)null : linked.ID) != (expectedLinked == null ? (int?)null : expectedLinked.ID) ||
        (specialization == null ? (int?)null : specialization.ID) != (expectedSpecialization == null ? (int?)null : expectedSpecialization.ID))
        throw new System.InvalidOperationException("Native linked-NPC loot specialization disagrees with the extracted rule for NPC " + pair.Key + ".");
    linkedNpcs.Add(new
    {
        npcId = pair.Key, hasLinkedNpc = npc.HasLinkedNpc, authoredLinkedNpcId = npc.LinkedNpcID,
        resolvedLinkedNpcId = linked == null ? (int?)null : linked.ID,
        resolvedLootSpecNpcId = specialization == null ? (int?)null : specialization.ID,
        hasLootSpecialization = npc.HasLootSpecialization,
        specializationSource = expectedLinked != null && expectedLinked.HasLootSpecialization ? "linked-npc" : (npc.HasLootSpecialization ? "self" : "none"),
        nativeRuleVerified = true,
        sourceMethods = new[] { "RPGNpc.GetLinkedNpc", "RPGNpc.GetLootSpecSource" }
    });
}
if (maxReferenceLevel > 10000) throw new System.InvalidOperationException("The discovered level domain exceeds the bounded probe limit.");
var tables = new System.Collections.Generic.List<object>();
var unresolved = new System.Collections.Generic.List<object>();
var allowedArguments = new object[3];
var comparisons = 0;
var scanEligibility = new System.Func<bool, int, object>((firstGearDone, requiredLevel) =>
{
    profile.FirstGearDropDone = firstGearDone;
    var intervals = new System.Collections.Generic.List<object>();
    var start = -1;
    for (var referenceLevel = 0; referenceLevel <= maxReferenceLevel; referenceLevel++)
    {
        allowedArguments[2] = referenceLevel;
        var allowed = (bool)allowedMethod.Invoke(null, allowedArguments);
        var resolvedLevel = referenceLevel > 0 ? referenceLevel : playerLevel;
        var expected = requiredLevel <= 0 || ((firstGearDone || requiredLevel <= playerLevel) &&
            requiredLevel >= resolvedLevel - Il2Cpp.EconomyUtilities.LevelBandRange &&
            requiredLevel <= resolvedLevel + Il2Cpp.EconomyUtilities.LevelBandRange);
        comparisons++;
        if (allowed != expected) throw new System.InvalidOperationException("Native level eligibility disagrees with the extracted rule for item " + allowedArguments[1] + " at level " + referenceLevel + ".");
        if (allowed && start < 0) start = referenceLevel;
        if (start >= 0 && (!allowed || referenceLevel == maxReferenceLevel))
        {
            intervals.Add(new { minimum = start, maximum = allowed ? referenceLevel : referenceLevel - 1, reachesDomainBoundary = allowed && referenceLevel == maxReferenceLevel });
            start = -1;
        }
    }
    return intervals;
});
try
{
    foreach (var pair in database.GetLootTables())
    {
        var table = pair.Value;
        if (!table.LevelBandGear) continue;
        var entries = new System.Collections.Generic.List<object>();
        if (table.lootItems != null)
        {
            for (var index = 0; index < table.lootItems.Count; index++)
            {
                var entry = table.lootItems[index];
                if (!levels.ContainsKey(entry.itemID))
                {
                    unresolved.Add(new { tableId = pair.Key, entryIndex = index, itemId = entry.itemID, reason = "Item is absent from GameDatabase.GetItems" });
                    continue;
                }
                allowedArguments[0] = table;
                allowedArguments[1] = entry.itemID;
                var before = scanEligibility(false, levels[entry.itemID]);
                var after = scanEligibility(true, levels[entry.itemID]);
                entries.Add(new { entryIndex = index, itemId = entry.itemID, requiredLevel = levels[entry.itemID], beforeFirstGear = before, afterFirstGear = after });
            }
        }
        tables.Add(new { tableId = pair.Key, sourceEntryCount = table.lootItems == null ? 0 : table.lootItems.Count, entries = entries });
    }
}
finally
{
    profile.FirstGearDropDone = originalFirstGearDone;
}
if (profile.FirstGearDropDone != originalFirstGearDone || UnityEngine.Time.frameCount != frame)
    throw new System.InvalidOperationException("The loot-rule probe did not restore character state within one gameplay frame.");
return new
{
    schemaVersion = "compendium.loot-rules.v1",
    source = "Native EconomyUtilities.LootItemLevelAllowed(RPGLootTable,int,int)",
    semantics = "Level eligibility only. Table rates, selection limits, requirements, linked-NPC behavior, and quest restrictions remain separate. No effective drop probability is claimed.",
    levelBand = new { range = Il2Cpp.EconomyUtilities.LevelBandRange, minimumRequiredLevel = "referenceLevel - range", maximumRequiredLevel = "referenceLevel + range", nonpositiveRequirementIsUnrestricted = true, nonpositiveReferenceUsesPlayerLevel = true },
    firstGearRule = new { condition = "A created character has not received its first gear drop", extraConstraint = "Positive item level requirement must not exceed player level", sourceField = "CharacterData.FirstGearDropDone" },
    observation = new { researchCharacter = profile.CharacterName, playerLevel = playerLevel, originalFirstGearDropDone = originalFirstGearDone, restored = profile.FirstGearDropDone == originalFirstGearDone, sameGameplayFrame = UnityEngine.Time.frameCount == frame, nativeComparisons = comparisons },
    referenceLevelDomain = new { minimum = 0, maximum = maxReferenceLevel },
    itemLevels = itemLevels, linkedNpcs = linkedNpcs, dynamicTables = tables, unresolved = unresolved
};
