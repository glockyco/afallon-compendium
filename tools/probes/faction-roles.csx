var database = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
var manager = Il2CppBLINK.RPGBuilder.Managers.FactionManager.Instance;
var character = Il2CppBLINK.RPGBuilder.Characters.Character.Instance;
var player = Il2Cpp.GameState.playerEntity;
if (database == null || manager == null || character == null || character.CharacterData == null || player == null)
    throw new System.InvalidOperationException("A loaded character, faction manager, and database are required.");
var playerFaction = player.GetFaction();
if (playerFaction == null) throw new System.InvalidOperationException("The player has no native faction.");
var stanceReference = new System.Func<Il2Cpp.RPGBFactionStance, object>((stance) => stance == null ? null : new { nativeId = stance.ID, name = stance.entryName, instanceId = stance.GetInstanceID() });
var playerStanding = new System.Func<object>(() =>
{
    var result = new System.Collections.Generic.List<object>();
    var entries = character.CharacterData.Factions;
    if (entries != null) for (var index = 0; index < entries.Count; index++)
    {
        var entry = entries[index];
        if (entry == null) result.Add(new { sourceIndex = index, unavailable = "null faction standing" });
        else result.Add(new { sourceIndex = index, factionId = entry.ID, currentStance = entry.currentStance, stanceIndex = entry.stanceIndex, currentPoints = entry.currentPoint });
    }
    return new { available = entries != null, count = entries == null ? -1 : entries.Count, entries = result };
});
var standingBefore = playerStanding();
var standingBeforeJson = Newtonsoft.Json.JsonConvert.SerializeObject(standingBefore);
var factions = new System.Collections.Generic.List<object>();
foreach (var pair in database.GetFactions())
{
    var faction = pair.Value;
    if (faction == null || faction.ID != pair.Key) throw new System.InvalidOperationException("Faction database identity is unavailable or inconsistent.");
    var stances = new System.Collections.Generic.List<object>();
    var nativeStances = faction.factionStances;
    if (nativeStances != null) for (var index = 0; index < nativeStances.Count; index++)
    {
        var entry = nativeStances[index];
        if (entry == null) { stances.Add(new { sourceIndex = index, unavailable = "null faction stance" }); continue; }
        object nativeAlignment = null;
        string error = null;
        try { var value = manager.GetAlignment(faction, entry.FactionStance); nativeAlignment = new { value = (int)value, name = value.ToString() }; }
        catch (System.Exception failure) { error = failure.GetType().FullName + ": " + failure.Message; }
        stances.Add(new { sourceIndex = index, stance = stanceReference(entry.FactionStance), legacyStance = entry.stance, pointsRequired = entry.pointsRequired, legacyPlayerAlignment = new { value = (int)entry.playerAlignment, name = entry.playerAlignment.ToString() }, alignment = new { value = (int)entry.AlignementToPlayer, name = entry.AlignementToPlayer.ToString() }, nativeAlignment = nativeAlignment, error = error });
    }
    var interactions = new System.Collections.Generic.List<object>();
    var nativeInteractions = faction.factionInteractions;
    Il2Cpp.RPGBFactionStance defaultStanceToPlayer = null;
    int? selectedInteractionIndex = null;
    if (nativeInteractions != null) for (var index = 0; index < nativeInteractions.Count; index++)
    {
        var entry = nativeInteractions[index];
        if (entry == null) { interactions.Add(new { sourceIndex = index, unavailable = "null faction interaction" }); continue; }
        interactions.Add(new { sourceIndex = index, targetFactionId = entry.factionID, defaultStance = stanceReference(entry.DefaultFactionStance), legacyDefaultStance = entry.defaultStance, startingPoints = entry.startingPoints });
        if (selectedInteractionIndex == null && entry.factionID == playerFaction.ID) { selectedInteractionIndex = index; defaultStanceToPlayer = entry.DefaultFactionStance; }
    }
    object playerStance = null;
    object playerToNpcAlignment = null;
    object npcToPlayerAlignment = null;
    object nullStanceAlignment = null;
    string playerAlignmentError = null;
    string npcAlignmentError = null;
    string nullAlignmentError = null;
    try
    {
        var stance = manager.GetEntityStanceToFaction(player, faction);
        playerStance = stanceReference(stance);
        var alignment = manager.GetAlignment(faction, stance);
        playerToNpcAlignment = new { value = (int)alignment, name = alignment.ToString() };
    }
    catch (System.Exception failure) { playerAlignmentError = failure.GetType().FullName + ": " + failure.Message; }
    try
    {
        if (nativeInteractions == null) throw new System.InvalidOperationException("The native faction interaction list is null.");
        for (var index = 0; index < nativeInteractions.Count && (selectedInteractionIndex == null || index <= selectedInteractionIndex.Value); index++)
            if (nativeInteractions[index] == null) throw new System.InvalidOperationException("The native interaction scan encounters a null row.");
        var alignment = manager.GetAlignment(playerFaction, defaultStanceToPlayer);
        npcToPlayerAlignment = new { value = (int)alignment, name = alignment.ToString() };
    }
    catch (System.Exception failure) { npcAlignmentError = failure.GetType().FullName + ": " + failure.Message; }
    try { var alignment = manager.GetAlignment(faction, null); nullStanceAlignment = new { value = (int)alignment, name = alignment.ToString() }; }
    catch (System.Exception failure) { nullAlignmentError = failure.GetType().FullName + ": " + failure.Message; }
    factions.Add(new { nativeId = faction.ID, name = faction.entryName, stancesAvailable = nativeStances != null, stanceCount = nativeStances == null ? -1 : nativeStances.Count, stances = stances, interactionsAvailable = nativeInteractions != null, interactionCount = nativeInteractions == null ? -1 : nativeInteractions.Count, interactions = interactions, observed = new { playerStance = playerStance, playerToNpcAlignment = playerToNpcAlignment, playerAlignmentError = playerAlignmentError, npcToPlayerAlignment = npcToPlayerAlignment, npcAlignmentError = npcAlignmentError, selectedInteractionIndex = selectedInteractionIndex, defaultStanceToPlayer = stanceReference(defaultStanceToPlayer), nullStanceAlignment = nullStanceAlignment, nullAlignmentError = nullAlignmentError } });
}
var observations = new System.Collections.Generic.List<object>();
var observedFactions = new System.Collections.Generic.HashSet<int>();
var entities = Il2Cpp.GameState.combatEntities;
if (entities != null) foreach (var entity in entities)
{
    if (entity == null || entity.IsPlayer() || !entity.IsNPC()) continue;
    var faction = entity.GetFaction();
    if (faction == null || !observedFactions.Add(faction.ID)) continue;
    var npc = entity.GetNPCData();
    object playerToNpc = null;
    object npcToPlayer = null;
    string error = null;
    try
    {
        var forward = manager.GetCombatNodeAlignment(player, entity);
        var backward = manager.GetCombatNodeAlignment(entity, player);
        playerToNpc = new { value = (int)forward, name = forward.ToString() };
        npcToPlayer = new { value = (int)backward, name = backward.ToString() };
    }
    catch (System.Exception failure) { error = failure.GetType().FullName + ": " + failure.Message; }
    observations.Add(new { componentInstanceId = entity.GetInstanceID(), npcId = npc == null ? (int?)null : npc.ID, factionId = faction.ID, playerToNpcAlignment = playerToNpc, npcToPlayerAlignment = npcToPlayer, error = error });
}
var standingAfterJson = Newtonsoft.Json.JsonConvert.SerializeObject(playerStanding());
return new { schemaVersion = "compendium.faction-roles.v1", frame = UnityEngine.Time.frameCount, player = new { character = character.CharacterData.CharacterName, factionId = playerFaction.ID, standing = standingBefore }, playerStateUnchanged = standingBeforeJson == standingAfterJson, sourceFactionCount = database.GetFactions().Count, factions = factions, observations = observations };
