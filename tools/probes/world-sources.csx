var worldResourceProducers = new System.Collections.Generic.List<object>();
var worldInteractions = new System.Collections.Generic.List<object>();
var worldContainers = new System.Collections.Generic.List<object>();
var worldQuestZones = new System.Collections.Generic.List<object>();
var worldTransitions = new System.Collections.Generic.List<object>();
var worldMapZones = new System.Collections.Generic.List<object>();
var worldRegions = new System.Collections.Generic.List<object>();
var worldMapIcons = new System.Collections.Generic.List<object>();
var worldServices = new System.Collections.Generic.List<object>();
var worldConditionSources = new System.Collections.Generic.List<object>();
var worldUnsupportedSources = new System.Collections.Generic.List<object>();

var worldCurrentGameScene = (Il2Cpp.RPGGameScene)null;
try
{
    worldCurrentGameScene = Il2Cpp.GameState.CurrentGameScene;
}
catch (System.Exception error)
{
    unresolved.Add(new { kind = "currentGameScene", detail = error.GetType().FullName + ": " + error.Message });
}

var worldDatabase = (Il2CppBLINK.RPGBuilder.Managers.GameDatabase)null;
try
{
    worldDatabase = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
}
catch (System.Exception error)
{
    unresolved.Add(new { kind = "gameDatabase", detail = error.GetType().FullName + ": " + error.Message });
}
var worldDatabaseScenes = (Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGGameScene>)null;
var worldDatabaseSkills = (Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGSkill>)null;
var worldDatabaseLootTables = (Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGLootTable>)null;
var worldDatabaseItems = (Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGItem>)null;
var worldDatabaseCurrencies = (Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGCurrency>)null;
var worldDatabaseCraftingStations = (Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGCraftingStation>)null;
var worldDatabaseProperties = (Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGProperty>)null;
var worldDatabaseClasses = (Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGClass>)null;
var worldDatabaseRaces = (Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGRace>)null;
if (worldDatabase != null)
{
    try
    {
        worldDatabaseScenes = worldDatabase.GetGameScenes();
    }
    catch (System.Exception error)
    {
        unresolved.Add(new { kind = "gameDatabaseScenes", sourceFieldPath = "GameDatabase.GetGameScenes()", detail = error.GetType().FullName + ": " + error.Message });
    }
    try
    {
        worldDatabaseSkills = worldDatabase.GetSkills();
    }
    catch (System.Exception error)
    {
        unresolved.Add(new { kind = "gameDatabaseSkills", sourceFieldPath = "GameDatabase.GetSkills()", detail = error.GetType().FullName + ": " + error.Message });
    }
    try
    {
        worldDatabaseLootTables = worldDatabase.GetLootTables();
    }
    catch (System.Exception error)
    {
        unresolved.Add(new { kind = "gameDatabaseLootTables", sourceFieldPath = "GameDatabase.GetLootTables()", detail = error.GetType().FullName + ": " + error.Message });
    }
    try
    {
        worldDatabaseItems = worldDatabase.GetItems();
    }
    catch (System.Exception error)
    {
        unresolved.Add(new { kind = "gameDatabaseItems", sourceFieldPath = "GameDatabase.GetItems()", detail = error.GetType().FullName + ": " + error.Message });
    }
    try
    {
        worldDatabaseCurrencies = worldDatabase.GetCurrencies();
    }
    catch (System.Exception error)
    {
        unresolved.Add(new { kind = "gameDatabaseCurrencies", sourceFieldPath = "GameDatabase.GetCurrencies()", detail = error.GetType().FullName + ": " + error.Message });
    }
    try
    {
        worldDatabaseCraftingStations = worldDatabase.GetCraftingStations();
    }
    catch (System.Exception error)
    {
        unresolved.Add(new { kind = "gameDatabaseCraftingStations", sourceFieldPath = "GameDatabase.GetCraftingStations()", detail = error.GetType().FullName + ": " + error.Message });
    }
    try
    {
        worldDatabaseProperties = worldDatabase.GetProperties();
    }
    catch (System.Exception error)
    {
        unresolved.Add(new { kind = "gameDatabaseProperties", sourceFieldPath = "GameDatabase.GetProperties()", detail = error.GetType().FullName + ": " + error.Message });
    }
    try
    {
        worldDatabaseClasses = worldDatabase.GetClasses();
    }
    catch (System.Exception error)
    {
        unresolved.Add(new { kind = "gameDatabaseClasses", sourceFieldPath = "GameDatabase.GetClasses()", detail = error.GetType().FullName + ": " + error.Message });
    }
    try
    {
        worldDatabaseRaces = worldDatabase.GetRaces();
    }
    catch (System.Exception error)
    {
        unresolved.Add(new { kind = "gameDatabaseRaces", sourceFieldPath = "GameDatabase.GetRaces()", detail = error.GetType().FullName + ": " + error.Message });
    }
}
if (worldDatabase == null)
{
    unresolved.Add(new { kind = "gameDatabaseUnavailable", sourceFieldPath = "GameDatabase.Instance", detail = "GameDatabase.Instance returned null; typed database references cannot be verified." });
}

var worldSceneNativeId = new System.Func<UnityEngine.SceneManagement.Scene, object>((scene) =>
{
    if (worldCurrentGameScene == null)
    {
        return null;
    }
    var observedName = scene.name;
    var entryName = worldCurrentGameScene.entryName;
    var nameMatches = entryName != null && entryName.Length > 0 && observedName != null && observedName.Length > 0 && entryName == observedName;
    return nameMatches ? (object)worldCurrentGameScene.ID : null;
});

var worldSceneEvidence = new System.Func<UnityEngine.SceneManagement.Scene, object>((scene) =>
{
    var nativeId = worldSceneNativeId(scene);
    return new
    {
        nativeId = nativeId,
        nativeIdMatched = nativeId != null,
        nativeIdMatchBasis = nativeId != null ? "GameState.CurrentGameScene.entryName == observed Unity Scene.name" : null,
        name = scene.name,
        path = scene.path,
        buildIndex = scene.buildIndex,
        handle = scene.handle
    };
});

var worldFindSceneById = new System.Func<int, Il2Cpp.RPGGameScene>((sceneId) =>
{
    if (worldDatabaseScenes == null || !worldDatabaseScenes.ContainsKey(sceneId)) return null;
    return worldDatabaseScenes[sceneId];
});

var worldFindScene = new System.Func<string, object>((destination) =>
{
    if (destination == null || destination.Length == 0)
    {
        return null;
    }
    if (worldDatabaseScenes == null)
    {
        return null;
    }
    var matches = new System.Collections.Generic.List<object>();
    foreach (var scenePair in worldDatabaseScenes)
    {
        var scene = scenePair.Value;
        if (scene == null)
        {
            continue;
        }
        if (scene.entryName == destination)
        {
            matches.Add(new
            {
                nativeId = scene.ID,
                name = getEntryName(scene),
                internalName = scene.entryName,
                fileName = scene.entryFileName,
                sourceDictionaryKey = scenePair.Key
            });
        }
    }
    if (matches.Count != 1)
    {
        if (matches.Count > 1)
        {
            unresolved.Add(new { kind = "ambiguousTransitionDestination", destinationScene = destination, matchCount = matches.Count, detail = "DestinationScene matches more than one RPGGameScene.entryName; no destination identity was selected." });
        }
        return null;
    }
    return matches[0];
});

var worldSkillReference = new System.Func<Il2Cpp.RPGSkill, object>((skill) =>
{
    if (skill == null)
    {
        return null;
    }
    return new
    {
        nativeId = skill.ID,
        name = getEntryName(skill),
        internalName = skill.entryName,
        fileName = skill.entryFileName
    };
});

var worldResourceReference = new System.Func<Il2Cpp.RPGResourceNode, object>((resource) =>
{
    if (resource == null)
    {
        return null;
    }
    var rankRows = new System.Collections.Generic.List<object>();
    var nativeRanks = resource.ranks;
    var rankCount = nativeRanks == null ? 0 : nativeRanks.Count;
    for (var rankIndex = 0; rankIndex < rankCount; rankIndex++)
    {
        var rank = nativeRanks[rankIndex];
        var rankPath = "RPGResourceNode.ranks[" + rankIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (rank == null)
        {
            unresolved.Add(new { kind = "resourceRank", sourceFieldPath = rankPath, resourceID = resource.ID, detail = "The authored resource rank row is null." });
            rankRows.Add(new { sourceFieldPath = rankPath, unavailable = "null authored resource rank" });
            continue;
        }
        var rankLootTable = (Il2Cpp.RPGLootTable)null;
        var rankLootTableResolved = rank.lootTableID < 0;
        if (rank.lootTableID >= 0 && worldDatabaseLootTables != null && worldDatabaseLootTables.ContainsKey(rank.lootTableID))
        {
            rankLootTable = worldDatabaseLootTables[rank.lootTableID];
            rankLootTableResolved = rankLootTable != null;
        }
        if (rank.lootTableID >= 0 && !rankLootTableResolved)
        {
            unresolved.Add(new
            {
                kind = "resourceRankLootTableReference",
                sourceFieldPath = rankPath + ".lootTableID",
                resourceID = resource.ID,
                lootTableID = rank.lootTableID,
                detail = worldDatabaseLootTables == null ? "GameDatabase.GetLootTables() was unavailable; the resource rank loot table could not be resolved." : "lootTableID does not resolve to a non-null GameDatabase.LootTables record."
            });
        }
        rankRows.Add(new
        {
            sourceFieldPath = rankPath,
            showedInEditor = rank.ShowedInEditor,
            unlockCost = rank.unlockCost,
            lootTableID = rank.lootTableID,
            lootTable = rankLootTable == null ? null : (object)new
            {
                nativeId = rankLootTable.ID,
                name = getEntryName(rankLootTable),
                internalName = rankLootTable.entryName,
                fileName = rankLootTable.entryFileName
            },
            lootTableReferenceStatus = rank.lootTableID < 0 ? "not-authored" : (rankLootTableResolved ? "resolved" : "unresolved"),
            skillLevelRequired = rank.skillLevelRequired,
            experience = rank.Experience,
            distanceMax = rank.distanceMax,
            gatherTime = rank.gatherTime,
            respawnTime = rank.respawnTime
        });
    }
    var resourceSkill = (Il2Cpp.RPGSkill)null;
    if (worldDatabaseSkills != null && worldDatabaseSkills.ContainsKey(resource.skillRequiredID))
    {
        resourceSkill = worldDatabaseSkills[resource.skillRequiredID];
    }
    if (resource.skillRequiredID >= 0 && resourceSkill == null)
    {
        unresolved.Add(new
        {
            kind = "resourceSkillReference",
            sourceFieldPath = "RPGResourceNode.skillRequiredID",
            resourceID = resource.ID,
            skillID = resource.skillRequiredID,
            detail = worldDatabaseSkills == null ? "GameDatabase.GetSkills() was unavailable; the resource skill could not be resolved." : "skillRequiredID does not resolve to a non-null GameDatabase.Skills record."
        });
    }
    if (nativeRanks == null)
    {
        unresolved.Add(new { kind = "resourceRanks", sourceFieldPath = "RPGResourceNode.ranks", resourceID = resource.ID, detail = "The authored resource rank list is null; resource yields are unavailable." });
    }
    return new
    {
        nativeId = resource.ID,
        name = getEntryName(resource),
        internalName = resource.entryName,
        fileName = resource.entryFileName,
        skillRequiredID = resource.skillRequiredID,
        skill = resourceSkill == null ? null : (object)worldSkillReference(resourceSkill),
        skillReferenceStatus = resource.skillRequiredID < 0 ? "not-authored" : (resourceSkill == null ? "unresolved" : "resolved"),
        ranksAvailable = nativeRanks != null,
        rankCount = nativeRanks == null ? -1 : rankCount,
        ranks = rankRows
    };
});

var worldLootReference = new System.Func<Il2Cpp.RPGLootTable, object>((loot) =>
{
    if (loot == null)
    {
        return null;
    }
    return new
    {
        nativeId = loot.ID,
        name = getEntryName(loot),
        internalName = loot.entryName,
        fileName = loot.entryFileName
    };
});

var worldItemReference = new System.Func<Il2Cpp.RPGItem, object>((item) =>
{
    if (item == null)
    {
        return null;
    }
    return new
    {
        nativeId = item.ID,
        name = getEntryName(item),
        internalName = item.entryName,
        fileName = item.entryFileName
    };
});

var worldQuestReference = new System.Func<Il2Cpp.RPGQuest, object>((quest) =>
{
    if (quest == null)
    {
        return null;
    }
    return new
    {
        nativeId = quest.ID,
        name = getEntryName(quest),
        internalName = quest.entryName,
        fileName = quest.entryFileName
    };
});

var worldWorldQuestReference = new System.Func<Il2Cpp.RPGWorldQuest, object>((worldQuest) =>
{
    if (worldQuest == null)
    {
        return null;
    }
    return new
    {
        nativeId = worldQuest.ID,
        name = getEntryName(worldQuest),
        internalName = worldQuest.entryName,
        fileName = worldQuest.entryFileName,
        quest = worldQuest.quest == null ? null : worldQuestReference(worldQuest.quest),
        availableDuration = worldQuest.availableDuration,
        cooldownAfterExpiry = worldQuest.cooldownAfterExpiry,
        cooldownAfterCompletion = worldQuest.cooldownAfterCompletion,
        cooldownRandomJitter = worldQuest.cooldownRandomJitter,
        initialRollWindow = worldQuest.initialRollWindow
    };
});

var worldTemplateProjection = new System.Func<Il2CppBLINK.RPGBuilder.Templates.RequirementsTemplate, string, object>((template, sourcePath) =>
{
    if (template == null)
    {
        return null;
    }
    return projectTemplate(template, sourcePath);
});

var worldSource = new System.Func<UnityEngine.Component, string, int, object>((component, componentType, observationIndex) =>
{
    var go = component == null ? null : component.gameObject;
    var transform = component == null ? null : component.transform;
    var componentIndex = -1;
    if (go != null)
    {
        var siblings = go.GetComponents<UnityEngine.Component>();
        for (var index = 0; index < siblings.Length; index++)
        {
            if (siblings[index] != null && siblings[index].Pointer == component.Pointer)
            {
                componentIndex = index;
                break;
            }
        }
        if (componentIndex < 0) throw new System.InvalidOperationException("The component is absent from its GameObject.");
    }
    if (go == null || transform == null)
    {
        return new
        {
            componentInstanceId = component == null ? (int?)null : component.GetInstanceID(),
            gameObjectInstanceId = go == null ? (int?)null : go.GetInstanceID(),
            sourceScene = (object)null,
            source = new
            {
                hierarchyPath = (string)null,
                hierarchyNodes = new System.Collections.Generic.List<object>(),
                componentType = componentType,
                componentIndex = componentIndex,
                observationIndex = observationIndex,
                saverIdentifier = (string)null,
                addressableAssetGuid = (string)null
            },
            sourceIdentity = new
            {
                status = "unavailable; component GameObject or Transform is null",
                provenStable = false,
                hierarchyPathCandidate = (string)null,
                saverIdentifierCandidate = (string)null,
                addressableAssetGuidCandidate = (string)null
            },
            position = new { x = 0f, y = 0f, z = 0f },
            activeSelf = false,
            activeInHierarchy = false,
            enabled = false
        };
    }

    var hierarchyNodes = new System.Collections.Generic.List<object>();
    var hierarchyParts = new System.Collections.Generic.List<string>();
    var hierarchyCursor = transform;
    var hierarchyTruncated = false;
    var hierarchyGuard = 0;
    while (hierarchyCursor != null && hierarchyGuard < 512)
    {
        var hierarchyName = hierarchyCursor.name == null ? "" : hierarchyCursor.name;
        var hierarchySiblingIndex = hierarchyCursor.GetSiblingIndex();
        hierarchyNodes.Add(new { name = hierarchyName, siblingIndex = hierarchySiblingIndex });
        hierarchyParts.Add(hierarchyName + "[" + hierarchySiblingIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]");
        hierarchyCursor = hierarchyCursor.parent;
        hierarchyGuard++;
    }
    if (hierarchyCursor != null)
    {
        hierarchyTruncated = true;
    }
    for (var hierarchyIndex = 0; hierarchyIndex < hierarchyNodes.Count / 2; hierarchyIndex++)
    {
        var oppositeIndex = hierarchyNodes.Count - hierarchyIndex - 1;
        var node = hierarchyNodes[hierarchyIndex];
        hierarchyNodes[hierarchyIndex] = hierarchyNodes[oppositeIndex];
        hierarchyNodes[oppositeIndex] = node;
        var part = hierarchyParts[hierarchyIndex];
        hierarchyParts[hierarchyIndex] = hierarchyParts[oppositeIndex];
        hierarchyParts[oppositeIndex] = part;
    }

    var saverIdentifier = (string)null;
    var saverIdentifierError = (string)null;
    try
    {
        var saver = go.GetComponent<Il2CppBLINK.RPGBuilder.WorldPersistence.SaverIdentifier>();
        if (saver != null)
        {
            saverIdentifier = saver.GetIdentifier();
        }
    }
    catch (System.Exception error)
    {
        saverIdentifierError = error.GetType().FullName + ": " + error.Message;
    }

    var addressableAssetGuid = (string)null;
    var addressableAssetGuidError = (string)null;
    try
    {
        var loader = go.GetComponentInParent<Il2Cpp.AddressableLoader>(true);
        if (loader != null && loader.addressableAsset != null)
        {
            addressableAssetGuid = loader.addressableAsset.AssetGUID;
        }
    }
    catch (System.Exception error)
    {
        addressableAssetGuidError = error.GetType().FullName + ": " + error.Message;
    }

    var scene = go.scene;
    var behavior = component as UnityEngine.Behaviour;
    var position = transform.position;
    return new
    {
        componentInstanceId = component.GetInstanceID(),
        gameObjectInstanceId = go.GetInstanceID(),
        sourceScene = worldSceneEvidence(scene),
        source = new
        {
            hierarchyPath = string.Join("/", hierarchyParts.ToArray()),
            hierarchyNodes = hierarchyNodes,
            hierarchyDepth = hierarchyNodes.Count,
            hierarchyPathTruncated = hierarchyTruncated,
            componentType = componentType,
            componentIndex = componentIndex,
            observationIndex = observationIndex,
            saverIdentifier = saverIdentifier,
            saverIdentifierError = saverIdentifierError,
            addressableAssetGuid = addressableAssetGuid,
            addressableAssetGuidError = addressableAssetGuidError
        },
        sourceIdentity = new
        {
            status = "candidate only; repeat scene loads and equivalent extraction are required",
            provenStable = false,
            hierarchyPathCandidate = string.Join("/", hierarchyParts.ToArray()),
            saverIdentifierCandidate = saverIdentifier,
            addressableAssetGuidCandidate = addressableAssetGuid
        },
        position = new { x = position.x, y = position.y, z = position.z },
        activeSelf = go.activeSelf,
        activeInHierarchy = go.activeInHierarchy,
        enabled = behavior == null ? true : behavior.enabled
    };
});

var worldGameActionUnsupported = new System.Func<Il2Cpp.GameActionsData.GameAction, bool>((gameAction) =>
{
    if (gameAction == null || gameAction.type != Il2Cpp.GameActionsData.GameActionType.Teleport)
    {
        return true;
    }
    if (gameAction.TeleportType == Il2Cpp.GameActionsData.TeleportType.Position)
    {
        return false;
    }
    if (gameAction.TeleportType == Il2Cpp.GameActionsData.TeleportType.GameScene)
    {
        return gameAction.GameSceneID < 0;
    }
    return true;
});

var worldGameActionProjection = new System.Func<Il2Cpp.GameActionsData.GameAction, string, int, bool, object>((gameAction, sourcePath, sourceIndex, diagnoseUnsupported) =>
{
    if (gameAction == null)
    {
        if (diagnoseUnsupported) unresolved.Add(new { kind = "gameAction", sourceFieldPath = sourcePath, detail = "The authored nested GameAction row is null." });
        return new { sourceFieldPath = sourcePath, unavailable = "null authored nested GameAction row" };
    }
    var nativeRequirementGroups = gameAction.Requirements;
    var requirementGroupCount = nativeRequirementGroups == null ? 0 : nativeRequirementGroups.Count;
    var requirementGroups = new System.Collections.Generic.List<object>();
    for (var groupIndex = 0; groupIndex < requirementGroupCount; groupIndex++)
    {
        var groupPath = sourcePath + ".Requirements[" + groupIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        requirementGroups.Add(projectGroup(nativeRequirementGroups[groupIndex], groupPath, groupIndex));
    }
    var isTeleport = gameAction.type == Il2Cpp.GameActionsData.GameActionType.Teleport;
    var teleportType = gameAction.TeleportType;
    if (diagnoseUnsupported && isTeleport && worldGameActionUnsupported(gameAction))
    {
        unresolved.Add(new
        {
            kind = teleportType == Il2Cpp.GameActionsData.TeleportType.Target ? "unresolvedGameActionTargetTeleport" : "unsupportedGameAction",
            sourceFieldPath = sourcePath,
            actionType = gameAction.type.ToString(),
            teleportType = teleportType.ToString(),
            detail = teleportType == Il2Cpp.GameActionsData.TeleportType.GameScene && gameAction.GameSceneID < 0 ? "GameScene teleport has no authored destination scene ID." : "The nested teleport payload is not a supported resolved destination."
        });
    }
    else if (diagnoseUnsupported && !isTeleport)
    {
        unresolved.Add(new { kind = "unsupportedGameAction", sourceFieldPath = sourcePath, actionType = gameAction.type.ToString(), detail = "The nested GameAction kind is retained but its effect is not projected." });
    }
    return new
    {
        sourceFieldPath = sourcePath,
        sourceIndex = sourceIndex,
        type = new { value = (int)gameAction.type, name = gameAction.type.ToString() },
        chance = gameAction.chance,
        nativeRequirementGroupCount = nativeRequirementGroups == null ? -1 : requirementGroupCount,
        requirements = requirementGroups,
        teleport = isTeleport ? (object)new
        {
            type = new { value = (int)teleportType, name = teleportType.ToString() },
            sceneNativeId = gameAction.GameSceneID,
            position = new { x = gameAction.Position.x, y = gameAction.Position.y, z = gameAction.Position.z },
            rotation = new { x = gameAction.Rotation.x, y = gameAction.Rotation.y, z = gameAction.Rotation.z }
        } : null,
        unsupported = worldGameActionUnsupported(gameAction)
    };
});

var worldGameActionListProjection = new System.Func<Il2CppSystem.Collections.Generic.List<Il2Cpp.GameActionsData.GameAction>, string, bool, object>((actions, sourcePath, diagnoseUnsupported) =>
{
    var rows = new System.Collections.Generic.List<object>();
    var actionCount = actions == null ? 0 : actions.Count;
    for (var index = 0; index < actionCount; index++)
    {
        rows.Add(worldGameActionProjection(actions[index], sourcePath + "[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", index, diagnoseUnsupported));
    }
    return rows;
});

var worldGameActionListUnsupported = new System.Func<Il2CppSystem.Collections.Generic.List<Il2Cpp.GameActionsData.GameAction>, bool>((actions) =>
{
    if (actions == null) return false;
    for (var index = 0; index < actions.Count; index++)
    {
        if (worldGameActionUnsupported(actions[index])) return true;
    }
    return false;
});

var worldActionProjection = new System.Func<Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectAction, string, object>((action, sourcePath) =>
{
    if (action == null)
    {
        unresolved.Add(new { kind = "interactableAction", sourceFieldPath = sourcePath, detail = "The authored action row is null." });
        return new { sourceFieldPath = sourcePath, unavailable = "null authored action row" };
    }
    var actionTypeName = action.type.ToString();
    var payloadUnsupported = false;
    var templateActions = action.GameActionsTemplate == null ? null : action.GameActionsTemplate.GameActions;
    var inlineActions = action.GameActions;
    var diagnoseGameActions = action.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.GameActions;
    var gameActionsTemplate = action.GameActionsTemplate == null ? null : (object)new
    {
        instanceId = action.GameActionsTemplate.GetInstanceID(),
        nativeId = action.GameActionsTemplate.ID,
        name = getEntryName(action.GameActionsTemplate),
        internalName = action.GameActionsTemplate.entryName,
        fileName = action.GameActionsTemplate.entryFileName,
        available = templateActions != null,
        nativeActionCount = templateActions == null ? -1 : templateActions.Count,
        actions = worldGameActionListProjection(templateActions, sourcePath + ".GameActionsTemplate.GameActions", diagnoseGameActions)
    };
    var gameActionsInline = (object)new
    {
        available = inlineActions != null,
        nativeActionCount = inlineActions == null ? -1 : inlineActions.Count,
        actions = worldGameActionListProjection(inlineActions, sourcePath + ".GameActions", diagnoseGameActions)
    };
    var supportedReference = (object)null;
    var referenceKind = (string)null;
    var referenceId = (int?)null;
    // An Effect action whose RPGEffect is of type Teleport is a door: CombatManager.EFFECTS_LOGIC
    // (build 25153357) calls RPGBuilderEssentials.TeleportToGameScene(gameSceneID, teleportPOS)
    // for gameScene teleports, and the character controller's teleport for position teleports.
    var effectTeleport = (object)null;
    if (action.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.Effect)
    {
        referenceKind = "effect";
        referenceId = action.Effect == null ? (int?)null : (int?)action.Effect.ID;
        supportedReference = action.Effect == null ? null : (object)projectEntry(action.Effect);
        if (action.Effect != null && action.Effect.effectType == Il2Cpp.RPGEffect.EFFECT_TYPE.Teleport)
        {
            var effectRanks = action.Effect.ranks;
            var effectRank = effectRanks == null || effectRanks.Count == 0 ? null : effectRanks[0];
            if (effectRank == null)
            {
                unresolved.Add(new { kind = "teleportEffectRank", sourceFieldPath = sourcePath + ".Effect.ranks", effectID = action.Effect.ID, detail = "The teleport effect has no rank data, so its destination is unavailable." });
            }
            else
            {
                var teleportScene = effectRank.teleportType == Il2Cpp.RPGEffect.TELEPORT_TYPE.gameScene ? worldFindSceneById(effectRank.gameSceneID) : null;
                if (effectRank.teleportType == Il2Cpp.RPGEffect.TELEPORT_TYPE.gameScene && teleportScene == null)
                    unresolved.Add(new { kind = "transitionDestinationReference", transitionKind = "teleportEffect", sourceFieldPath = sourcePath + ".Effect.ranks[0].gameSceneID", destinationSceneID = effectRank.gameSceneID, detail = "gameSceneID does not resolve to a non-null GameDatabase.GameScenes record." });
                effectTeleport = new
                {
                    sourceFieldPath = sourcePath + ".Effect.ranks[0]",
                    rankCount = effectRanks.Count,
                    type = new { value = (int)effectRank.teleportType, name = effectRank.teleportType.ToString() },
                    sceneNativeId = effectRank.teleportType == Il2Cpp.RPGEffect.TELEPORT_TYPE.gameScene ? effectRank.gameSceneID : -1,
                    destinationScene = teleportScene == null ? null : (object)new { nativeId = teleportScene.ID, name = getEntryName(teleportScene), internalName = teleportScene.entryName, fileName = teleportScene.entryFileName },
                    position = new { x = effectRank.teleportPOS.x, y = effectRank.teleportPOS.y, z = effectRank.teleportPOS.z }
                };
            }
        }
    }
    else if (action.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.Quest)
    {
        referenceKind = "quest";
        referenceId = action.Quest == null ? (int?)null : (int?)action.Quest.ID;
        supportedReference = action.Quest == null ? null : (object)worldQuestReference(action.Quest);
    }
    else if (action.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.Point)
    {
        referenceKind = "treePoint";
        referenceId = action.Point == null ? (int?)null : (int?)action.Point.ID;
        supportedReference = action.Point == null ? null : (object)projectEntry(action.Point);
    }
    else if (action.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.GiveSkillExperience)
    {
        referenceKind = "skill";
        referenceId = action.Skill == null ? (int?)null : (int?)action.Skill.ID;
        supportedReference = action.Skill == null ? null : (object)worldSkillReference(action.Skill);
    }
    else if (action.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.GiveWeaponTemplateExperience)
    {
        referenceKind = "weaponTemplate";
        referenceId = action.WeaponTemplate == null ? (int?)null : (int?)action.WeaponTemplate.ID;
        supportedReference = action.WeaponTemplate == null ? null : (object)projectEntry(action.WeaponTemplate);
    }
    else if (action.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.CompleteTask)
    {
        referenceKind = "task";
        referenceId = action.Task == null ? (int?)null : (int?)action.Task.ID;
        supportedReference = action.Task == null ? null : (object)projectEntry(action.Task);
    }
    else if (action.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.Resource)
    {
        referenceKind = "resource";
        referenceId = action.Resource == null ? (int?)null : (int?)action.Resource.ID;
        supportedReference = action.Resource == null ? null : (object)worldResourceReference(action.Resource);
    }
    else if (action.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.Chest)
    {
        referenceKind = "lootTable";
        referenceId = action.LootTable == null ? (int?)null : (int?)action.LootTable.ID;
        supportedReference = action.LootTable == null ? null : (object)worldLootReference(action.LootTable);
    }
    else if (action.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.GameActions)
    {
        var hasTemplateActions = templateActions != null && templateActions.Count > 0;
        var hasInlineActions = inlineActions != null && inlineActions.Count > 0;
        payloadUnsupported = (!hasTemplateActions && !hasInlineActions) || worldGameActionListUnsupported(templateActions) || worldGameActionListUnsupported(inlineActions);
        if (payloadUnsupported)
        {
            unresolved.Add(new { kind = "unsupportedInteractableAction", sourceFieldPath = sourcePath, actionType = actionTypeName, detail = "The authored GameActions payload contains no supported nested action or contains unresolved nested action semantics." });
        }
    }
    else if (action.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.UnityEvent)
    {
        payloadUnsupported = true;
        unresolved.Add(new { kind = "unsupportedInteractableAction", sourceFieldPath = sourcePath, actionType = actionTypeName, detail = "The action is authored, but its UnityEvent payload is not projected by this probe." });
    }
    else if (action.type != Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.GiveCharacterExperience &&
        action.type != Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.SaveCharacter)
    {
        payloadUnsupported = true;
        unresolved.Add(new { kind = "unknownInteractableAction", sourceFieldPath = sourcePath, actionType = actionTypeName, detail = "The native action enum value is not recognized by this probe." });
    }

    if (referenceKind != null && supportedReference == null)
    {
        unresolved.Add(new { kind = "interactableActionReference", sourceFieldPath = sourcePath, actionType = actionTypeName, referenceKind = referenceKind, referenceId = referenceId, detail = "The typed action reference is null." });
    }
    return new
    {
        sourceFieldPath = sourcePath,
        type = new { value = (int)action.type, name = actionTypeName },
        activationType = new { value = (int)action.ActivationType, name = action.ActivationType.ToString() },
        chance = action.chance,
        chanceSemantics = "Authored action chance; effective probability is unresolved.",
        entryID = action.entryID,
        amount = action.amount,
        referenceKind = referenceKind,
        referenceId = referenceId,
        reference = supportedReference,
        effect = action.Effect == null ? null : (object)projectEntry(action.Effect),
        effectTeleport = effectTeleport,
        quest = action.Quest == null ? null : (object)worldQuestReference(action.Quest),
        point = action.Point == null ? null : (object)projectEntry(action.Point),
        skill = action.Skill == null ? null : (object)worldSkillReference(action.Skill),
        weaponTemplate = action.WeaponTemplate == null ? null : (object)projectEntry(action.WeaponTemplate),
        task = action.Task == null ? null : (object)projectEntry(action.Task),
        resource = action.Resource == null ? null : (object)worldResourceReference(action.Resource),
        lootTable = action.LootTable == null ? null : (object)worldLootReference(action.LootTable),
        gameActions = new
        {
            executionOrder = "template-then-inline",
            template = gameActionsTemplate,
            inline = gameActionsInline
        },
        unityEventAvailable = action.unityEvents != null,
        unsupported = payloadUnsupported
    };
});

var worldChestLootProjection = new System.Func<Il2CppBLINK.RPGBuilder.World.Chest, string, object>((chest, sourcePath) =>
{
    var lootRows = new System.Collections.Generic.List<object>();
    var nativeLoot = chest == null ? null : chest.lootInstances;
    var lootCount = nativeLoot == null ? 0 : nativeLoot.Count;
    if (chest != null && nativeLoot == null)
    {
        unresolved.Add(new { kind = "chestLootInstances", sourceFieldPath = sourcePath + ".lootInstances", detail = "The authored chest loot list is null; container outputs are unavailable." });
    }
    for (var lootIndex = 0; lootIndex < lootCount; lootIndex++)
    {
        var loot = nativeLoot[lootIndex];
        var lootPath = sourcePath + ".lootInstances[" + lootIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (loot == null)
        {
            unresolved.Add(new { kind = "chestLoot", sourceFieldPath = lootPath, detail = "The authored chest loot row is null." });
            lootRows.Add(new { sourceFieldPath = lootPath, unavailable = "null authored loot row" });
            continue;
        }
        var itemId = loot.item == null ? (int?)null : (int?)loot.item.ID;
        var itemResolved = loot.item != null && worldDatabaseItems != null && worldDatabaseItems.ContainsKey(loot.item.ID) && worldDatabaseItems[loot.item.ID] != null;
        if (loot.item == null)
        {
            unresolved.Add(new { kind = "chestLootItemReference", sourceFieldPath = lootPath + ".item", itemID = itemId, detail = "The chest loot item reference is null." });
        }
        else if (!itemResolved)
        {
            unresolved.Add(new { kind = "chestLootItemDatabaseReference", sourceFieldPath = lootPath + ".item.ID", itemID = itemId, detail = worldDatabaseItems == null ? "GameDatabase.GetItems() was unavailable; the chest loot item could not be verified." : "The chest loot item ID does not resolve to a non-null GameDatabase.Items record." });
        }
        lootRows.Add(new
        {
            sourceFieldPath = lootPath,
            itemID = itemId,
            item = loot.item == null ? null : (object)worldItemReference(loot.item),
            itemReferenceStatus = loot.item == null ? "unresolved" : (itemResolved ? "resolved" : "unresolved"),
            minCount = loot.minCount,
            maxCount = loot.maxCount,
            quantitySemantics = "Authored min/max quantity bounds are retained; inclusivity and runtime roll behavior are not verified.",
            dropChance = loot.dropChance,
            dropChanceSemantics = "Authored raw chance; effective probability is unresolved.",
            lootedObservation = loot.looted
        });
    }
    return new
    {
        sourceFieldPath = sourcePath + ".lootInstances",
        lootInstancesAvailable = nativeLoot != null,
        lootInstanceCount = nativeLoot == null ? -1 : lootCount,
        lootInstances = lootRows,
        maxDrops = chest == null ? 0 : chest.maxDrops,
        maxDropsSemantics = "Authored chest selection control; effective selection behavior is not verified.",
        interactionDistance = chest == null ? 0f : chest.interactionDistance,
        chestName = chest == null ? null : chest.chestName
    };
});

var worldNodeProjection = new System.Func<Il2CppBLINK.RPGBuilder.World.InteractiveNode, UnityEngine.Component, int, object>((node, component, componentIndex) =>
{
    var sourceEvidence = worldSource(component, "Il2CppBLINK.RPGBuilder.World.InteractiveNode", componentIndex);
    var sourcePath = "Il2CppBLINK.RPGBuilder.World.InteractiveNode[" + componentIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
    var containerRows = new System.Collections.Generic.List<object>();
    var nativeContainers = node.containerTablesData;
    var containerCount = nativeContainers == null ? 0 : nativeContainers.Count;
    for (var index = 0; index < containerCount; index++)
    {
        var row = nativeContainers[index];
        var rowPath = sourcePath + ".containerTablesData[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (row == null)
        {
            unresolved.Add(new { kind = "interactiveNodeContainer", sourceFieldPath = rowPath, detail = "The authored container loot row is null." });
            containerRows.Add(new { sourceFieldPath = rowPath, unavailable = "null authored container row" });
            continue;
        }
        var lootID = row.lootTable == null ? (int?)null : (int?)row.lootTable.ID;
        if (row.lootTable == null)
        {
            unresolved.Add(new { kind = "interactiveNodeContainerLootReference", sourceFieldPath = rowPath + ".lootTable", detail = "The container loot table reference is null." });
        }
        containerRows.Add(new { sourceFieldPath = rowPath, lootTableID = lootID, lootTable = row.lootTable == null ? null : (object)worldLootReference(row.lootTable), chance = row.chance, chanceSemantics = "Authored raw chance; effective probability is unresolved." });
    }
    var effectRows = new System.Collections.Generic.List<object>();
    var nativeEffects = node.effectsData;
    var effectCount = nativeEffects == null ? 0 : nativeEffects.Count;
    for (var index = 0; index < effectCount; index++)
    {
        var row = nativeEffects[index];
        var rowPath = sourcePath + ".effectsData[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (row == null)
        {
            unresolved.Add(new { kind = "interactiveNodeEffect", sourceFieldPath = rowPath, detail = "The authored effect row is null." });
            effectRows.Add(new { sourceFieldPath = rowPath, unavailable = "null authored effect row" });
            continue;
        }
        effectRows.Add(new { sourceFieldPath = rowPath, effectID = row.effect == null ? (int?)null : (int?)row.effect.ID, effect = row.effect == null ? null : (object)projectEntry(row.effect), chance = row.chance, chanceSemantics = "Authored raw chance; effective probability is unresolved." });
        if (row.effect == null)
        {
            unresolved.Add(new { kind = "interactiveNodeEffectReference", sourceFieldPath = rowPath + ".effect", detail = "The authored effect reference is null." });
        }
    }
    var questRows = new System.Collections.Generic.List<object>();
    if (node.questsData != null)
    {
        questRows.Add(new { sourceFieldPath = sourcePath + ".questsData", questID = node.questsData.quest == null ? (int?)null : (int?)node.questsData.quest.ID, quest = node.questsData.quest == null ? null : (object)worldQuestReference(node.questsData.quest), chance = node.questsData.chance, chanceSemantics = "Authored raw chance; effective probability is unresolved." });
        if (node.questsData.quest == null)
        {
            unresolved.Add(new { kind = "interactiveNodeQuestReference", sourceFieldPath = sourcePath + ".questsData.quest", detail = "The authored quest reference is null." });
        }
    }
    var skillRows = new System.Collections.Generic.List<object>();
    var nativeSkills = node.skillsData;
    var skillCount = nativeSkills == null ? 0 : nativeSkills.Count;
    for (var index = 0; index < skillCount; index++)
    {
        var row = nativeSkills[index];
        var rowPath = sourcePath + ".skillsData[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (row == null)
        {
            unresolved.Add(new { kind = "interactiveNodeSkill", sourceFieldPath = rowPath, detail = "The authored skill row is null." });
            skillRows.Add(new { sourceFieldPath = rowPath, unavailable = "null authored skill row" });
            continue;
        }
        skillRows.Add(new { sourceFieldPath = rowPath, skillID = row.skill == null ? (int?)null : (int?)row.skill.ID, skill = row.skill == null ? null : (object)worldSkillReference(row.skill), chance = row.chance, chanceSemantics = "Authored raw chance; effective probability is unresolved." });
        if (row.skill == null)
        {
            unresolved.Add(new { kind = "interactiveNodeSkillReference", sourceFieldPath = rowPath + ".skill", detail = "The authored skill reference is null." });
        }
    }
    var abilityRows = new System.Collections.Generic.List<object>();
    var nativeAbilities = node.abilitiesData;
    var abilityCount = nativeAbilities == null ? 0 : nativeAbilities.Count;
    for (var index = 0; index < abilityCount; index++)
    {
        var row = nativeAbilities[index];
        var rowPath = sourcePath + ".abilitiesData[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (row == null)
        {
            unresolved.Add(new { kind = "interactiveNodeAbility", sourceFieldPath = rowPath, detail = "The authored ability row is null." });
            abilityRows.Add(new { sourceFieldPath = rowPath, unavailable = "null authored ability row" });
            continue;
        }
        abilityRows.Add(new { sourceFieldPath = rowPath, abilityID = row.ability == null ? (int?)null : (int?)row.ability.ID, ability = row.ability == null ? null : (object)projectEntry(row.ability), chance = row.chance, chanceSemantics = "Authored raw chance; effective probability is unresolved." });
        if (row.ability == null)
        {
            unresolved.Add(new { kind = "interactiveNodeAbilityReference", sourceFieldPath = rowPath + ".ability", detail = "The authored ability reference is null." });
        }
    }
    var treePointRows = new System.Collections.Generic.List<object>();
    var nativeTreePoints = node.treePointsData;
    var treePointCount = nativeTreePoints == null ? 0 : nativeTreePoints.Count;
    for (var index = 0; index < treePointCount; index++)
    {
        var row = nativeTreePoints[index];
        var rowPath = sourcePath + ".treePointsData[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (row == null)
        {
            unresolved.Add(new { kind = "interactiveNodeTreePoint", sourceFieldPath = rowPath, detail = "The authored tree point row is null." });
            treePointRows.Add(new { sourceFieldPath = rowPath, unavailable = "null authored tree point row" });
            continue;
        }
        treePointRows.Add(new { sourceFieldPath = rowPath, treePointID = row.treePoint == null ? (int?)null : (int?)row.treePoint.ID, treePoint = row.treePoint == null ? null : (object)projectEntry(row.treePoint), amount = row.amount, chance = row.chance, chanceSemantics = "Authored raw chance; effective probability is unresolved." });
        if (row.treePoint == null)
        {
            unresolved.Add(new { kind = "interactiveNodeTreePointReference", sourceFieldPath = rowPath + ".treePoint", detail = "The authored tree point reference is null." });
        }
    }
    var skillExperienceRows = new System.Collections.Generic.List<object>();
    var nativeSkillExperience = node.skillExpData;
    var skillExperienceCount = nativeSkillExperience == null ? 0 : nativeSkillExperience.Count;
    for (var index = 0; index < skillExperienceCount; index++)
    {
        var row = nativeSkillExperience[index];
        var rowPath = sourcePath + ".skillExpData[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (row == null)
        {
            unresolved.Add(new { kind = "interactiveNodeSkillExperience", sourceFieldPath = rowPath, detail = "The authored skill experience row is null." });
            skillExperienceRows.Add(new { sourceFieldPath = rowPath, unavailable = "null authored skill experience row" });
            continue;
        }
        skillExperienceRows.Add(new { sourceFieldPath = rowPath, skillID = row.skill == null ? (int?)null : (int?)row.skill.ID, skill = row.skill == null ? null : (object)worldSkillReference(row.skill), expAmount = row.expAmount, chance = row.chance, chanceSemantics = "Authored raw chance; effective probability is unresolved." });
        if (row.skill == null)
        {
            unresolved.Add(new { kind = "interactiveNodeSkillExperienceReference", sourceFieldPath = rowPath + ".skill", detail = "The authored skill reference is null." });
        }
    }
    var taskRows = new System.Collections.Generic.List<object>();
    var nativeTasks = node.taskData;
    var taskCount = nativeTasks == null ? 0 : nativeTasks.Count;
    for (var index = 0; index < taskCount; index++)
    {
        var row = nativeTasks[index];
        var rowPath = sourcePath + ".taskData[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (row == null)
        {
            unresolved.Add(new { kind = "interactiveNodeTask", sourceFieldPath = rowPath, detail = "The authored task row is null." });
            taskRows.Add(new { sourceFieldPath = rowPath, unavailable = "null authored task row" });
            continue;
        }
        taskRows.Add(new { sourceFieldPath = rowPath, taskID = row.task == null ? (int?)null : (int?)row.task.ID, task = row.task == null ? null : (object)projectEntry(row.task), chance = row.chance, chanceSemantics = "Authored raw chance; effective probability is unresolved." });
        if (row.task == null)
        {
            unresolved.Add(new { kind = "interactiveNodeTaskReference", sourceFieldPath = rowPath + ".task", detail = "The authored task reference is null." });
        }
    }

    var nodeResource = node.resourceNodeData;
    var nodeIsResource = node.nodeType == Il2CppBLINK.RPGBuilder.World.InteractiveNode.InteractiveNodeType.resourceNode || nodeResource != null;
    var nodeIsContainer = node.nodeType == Il2CppBLINK.RPGBuilder.World.InteractiveNode.InteractiveNodeType.container || containerCount > 0;
    if (node.nodeType == Il2CppBLINK.RPGBuilder.World.InteractiveNode.InteractiveNodeType.resourceNode && nodeResource == null)
    {
        unresolved.Add(new { kind = "interactiveNodeResourceReference", sourceFieldPath = sourcePath + ".resourceNodeData", detail = "A resourceNode InteractiveNode has no RPGResourceNode reference." });
    }
    if (node.nodeType == Il2CppBLINK.RPGBuilder.World.InteractiveNode.InteractiveNodeType.container && nativeContainers == null)
    {
        unresolved.Add(new { kind = "interactiveNodeContainerTables", sourceFieldPath = sourcePath + ".containerTablesData", detail = "A container InteractiveNode has no authored container loot table list." });
    }
    var nodeResourceSkill = (Il2Cpp.RPGSkill)null;
    var nodeResourceSkillID = nodeResource == null ? -1 : nodeResource.skillRequiredID;
    if (nodeIsResource && nodeResource != null && worldDatabaseSkills != null && worldDatabaseSkills.ContainsKey(nodeResourceSkillID))
    {
        nodeResourceSkill = worldDatabaseSkills[nodeResourceSkillID];
    }
    var nodeEffectiveGatherSkill = nodeIsResource ? nodeResourceSkill : node.gatherSkill;
    var nodeEffectiveGatherSkillID = nodeIsResource ? (nodeResource == null ? (int?)null : (int?)nodeResourceSkillID) : (node.gatherSkill == null ? (int?)null : (int?)node.gatherSkill.ID);
    var nodeResourceProjection = nodeResource == null ? null : (object)worldResourceReference(nodeResource);
    var nodeRecord = new
    {
        source = sourceEvidence,
        disposition = "extracted",
        producerFamily = "interactiveNode",
        nodeType = new { value = (int)node.nodeType, name = node.nodeType.ToString() },
        nodeStateObservation = new { value = (int)node.nodeState, name = node.nodeState.ToString(), useCount = node.useCount, nextUse = node.nextUse },
        interactableName = node.interactableName,
        isTrigger = node.isTrigger,
        isClick = node.isClick,
        gatherSkill = node.gatherSkill == null ? null : (object)worldSkillReference(node.gatherSkill),
        gatherSkillID = node.gatherSkill == null ? (int?)null : (int?)node.gatherSkill.ID,
        gatherExperience = node.gatherExperience,
        gatheringRole = new
        {
            kind = nodeIsResource ? "resource" : (nodeIsContainer ? "container" : "none"),
            skillID = nodeEffectiveGatherSkillID,
            skill = nodeEffectiveGatherSkill == null ? null : (object)worldSkillReference(nodeEffectiveGatherSkill),
            sourceFieldPath = nodeIsResource ? sourcePath + ".resourceNodeData.skillRequiredID" : sourcePath + ".gatherSkill",
            semantics = nodeIsResource ? "resourceNode uses RPGResourceNode.skillRequiredID; InteractiveNode.gatherSkill is not the resource-node skill" : (nodeIsContainer ? "container-style node uses InteractiveNode.gatherSkill when authored" : "no gathering role is inferred from this node")
        },
        resourceNode = nodeResource == null ? null : (object)worldResourceReference(nodeResource),
        resourceNodeProjected = nodeResourceProjection,
        possibleOutputs = new
        {
            resourceRanks = nodeResource == null ? null : (object)new { available = nodeResource.ranks != null, count = nodeResource.ranks == null ? -1 : nodeResource.ranks.Count, resource = nodeResourceProjection },
            containerLootTables = nativeContainers == null ? null : (object)containerRows
        },
        containerTablesDataAvailable = nativeContainers != null,
        containerTableCount = nativeContainers == null ? -1 : containerCount,
        containerTablesData = containerRows,
        effectsDataAvailable = nativeEffects != null,
        effectCount = nativeEffects == null ? -1 : effectCount,
        effectsData = effectRows,
        questsDataAvailable = node.questsData != null,
        questsData = questRows,
        skillsDataAvailable = nativeSkills != null,
        skillCount = nativeSkills == null ? -1 : skillCount,
        skillsData = skillRows,
        abilitiesData = abilityRows,
        treePointsData = treePointRows,
        skillExpData = skillExperienceRows,
        taskData = taskRows,
        abilityCount = node.abilitiesData == null ? -1 : abilityCount,
        treePointCount = node.treePointsData == null ? -1 : treePointCount,
        skillExperienceCount = node.skillExpData == null ? -1 : skillExperienceCount,
        taskCount = node.taskData == null ? -1 : taskCount,
        classExperience = node.classExpData == null ? null : (object)new { expAmount = node.classExpData.expAmount, chance = node.classExpData.chance, chanceSemantics = "Authored raw chance; effective probability is unresolved." },
        unsupportedUnityEvent = node.unityEvent != null,
        nodeRoles = new { resource = nodeIsResource, container = nodeIsContainer }
    };
    if (node.unityEvent != null)
    {
        unresolved.Add(new { kind = "unsupportedInteractiveNodeUnityEvent", source = sourceEvidence, detail = "InteractiveNode.unityEvent is authored but its persistent calls are not projected." });
    }
    return nodeRecord;
});

var worldOreSpawners = UnityEngine.Object.FindObjectsOfType<Il2Cpp.OreSpawner>(true);
var worldOreSpawnerCount = worldOreSpawners == null ? 0 : worldOreSpawners.Length;
for (var spawnerIndex = 0; spawnerIndex < worldOreSpawnerCount; spawnerIndex++)
{
    var spawner = worldOreSpawners[spawnerIndex];
    if (spawner == null)
    {
        unresolved.Add(new { kind = "oreSpawner", sourceIndex = spawnerIndex, detail = "FindObjectsOfType returned a null OreSpawner." });
        worldResourceProducers.Add(new { sourceIndex = spawnerIndex, producerFamily = "oreSpawner", unavailable = "null OreSpawner" });
        continue;
    }
    var sourceEvidence = worldSource(spawner, "Il2Cpp.OreSpawner", spawnerIndex);
    var sourcePath = "Il2Cpp.OreSpawner[" + spawnerIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
    var options = new System.Collections.Generic.List<object>();
    var possibleOutputs = new System.Collections.Generic.List<object>();
    var weights = new System.Collections.Generic.List<object>();
    var nativeOptions = spawner.Options;
    var optionCount = nativeOptions == null ? 0 : nativeOptions.Count;
    if (nativeOptions == null)
    {
        unresolved.Add(new { kind = "oreOptions", sourceFieldPath = sourcePath + ".Options", detail = "The authored OreSpawner option list is null; possible resource outputs are unavailable." });
    }
    for (var optionIndex = 0; optionIndex < optionCount; optionIndex++)
    {
        var option = nativeOptions[optionIndex];
        var optionPath = sourcePath + ".Options[" + optionIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (option == null)
        {
            unresolved.Add(new { kind = "oreOption", sourceFieldPath = optionPath, detail = "The authored OreOption row is null." });
            options.Add(new { sourceFieldPath = optionPath, unavailable = "null authored OreOption" });
            continue;
        }
        var prefab = option.veinPrefab;
        if (prefab == null)
        {
            unresolved.Add(new { kind = "oreOptionPrefab", sourceFieldPath = optionPath + ".veinPrefab", detail = "The authored vein prefab reference is null." });
        }
        var authoredInteractables = new System.Collections.Generic.List<object>();
        var authoredChests = new System.Collections.Generic.List<object>();
        var authoredOutputs = new System.Collections.Generic.List<object>();
        if (prefab != null)
        {
            var prefabInteractables = prefab.GetComponentsInChildren<Il2CppBLINK.RPGBuilder.World.InteractableObject>(true);
            for (var prefabIndex = 0; prefabIndex < prefabInteractables.Length; prefabIndex++)
            {
                var authored = prefabInteractables[prefabIndex];
                if (authored == null)
                {
                    unresolved.Add(new { kind = "oreOptionPrefabInteractable", sourceFieldPath = optionPath + ".veinPrefab.InteractableObject[" + prefabIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", detail = "The candidate prefab returned a null InteractableObject component." });
                    continue;
                }
                var authoredSource = worldSource(authored, "Il2CppBLINK.RPGBuilder.World.InteractableObject", prefabIndex);
                var authoredActions = new System.Collections.Generic.List<object>();
                var nativeActions = authored.Actions;
                var authoredActionPath = optionPath + ".veinPrefab.InteractableObject[" + prefabIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "].Actions";
                var actionCount = nativeActions == null ? 0 : nativeActions.Count;
                if (nativeActions == null)
                {
                    unresolved.Add(new { kind = "oreCandidateActions", sourceFieldPath = authoredActionPath, detail = "The candidate InteractableObject action list is null; its output behavior is unavailable." });
                }
                for (var actionIndex = 0; actionIndex < actionCount; actionIndex++)
                {
                    var actionPath = authoredActionPath + "[" + actionIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
                    var authoredAction = nativeActions[actionIndex];
                    authoredActions.Add(worldActionProjection(authoredAction, actionPath));
                    if (authoredAction != null && authoredAction.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.Resource)
                    {
                        authoredOutputs.Add(new
                        {
                            outputKind = "resource",
                            sourceFieldPath = actionPath + ".Resource",
                            resourceID = authoredAction.Resource == null ? (int?)null : (int?)authoredAction.Resource.ID,
                            resource = authoredAction.Resource == null ? null : (object)worldResourceReference(authoredAction.Resource),
                            authoredActionChance = authoredAction.chance,
                            effectiveProbabilityResolved = false
                        });
                    }
                    if (authoredAction != null && authoredAction.type == Il2CppBLINK.RPGBuilder.World.InteractableObjectData.InteractableObjectActionType.Chest)
                    {
                        authoredOutputs.Add(new
                        {
                            outputKind = "lootTable",
                            sourceFieldPath = actionPath + ".LootTable",
                            lootTableID = authoredAction.LootTable == null ? (int?)null : (int?)authoredAction.LootTable.ID,
                            lootTable = authoredAction.LootTable == null ? null : (object)worldLootReference(authoredAction.LootTable),
                            authoredActionChance = authoredAction.chance,
                            effectiveProbabilityResolved = false,
                            outputSemantics = "typed Chest action links to an RPGLootTable; loot entries and rates remain in the linked table"
                        });
                    }
                }
                authoredInteractables.Add(new
                {
                    source = authoredSource,
                    authoredOnly = true,
                    state = new { value = (int)authored.State, name = authored.State.ToString() },
                    interactableName = authored.InteractableName,
                    actions = authoredActions,
                    requirementsTemplate = authored.RequirementsTemplate == null ? null : (object)worldTemplateProjection(authored.RequirementsTemplate, optionPath + ".veinPrefab.InteractableObject[" + prefabIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "].RequirementsTemplate"),
                    requirementsOwner = authored.RequirementsTemplate == null ? null : (object)new { ownerKind = "oreCandidateInteractable", sourceFieldPath = optionPath + ".veinPrefab.InteractableObject[" + prefabIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "].RequirementsTemplate.Requirements", source = authoredSource },
                    resource = authored.Resource == null ? null : (object)worldResourceReference(authored.Resource),
                    resourceUseValues = authored.UseResourceValues,
                    lootWindowGathering = authored.LootWindowGathering,
                    limitedUseAmount = authored.LimitedUseAmount,
                    maxUseAmount = authored.MaxUseAmount,
                    maxActions = authored.MaxActions,
                    cooldown = authored.Cooldown,
                    interactionTime = authored.InteractionTime,
                    maxDistance = authored.MaxDistance,
                    isTrigger = authored.IsTrigger,
                    isClick = authored.IsClick
                });
            }
            var prefabChests = prefab.GetComponentsInChildren<Il2CppBLINK.RPGBuilder.World.Chest>(true);
            for (var prefabIndex = 0; prefabIndex < prefabChests.Length; prefabIndex++)
            {
                var authoredChest = prefabChests[prefabIndex];
                if (authoredChest == null)
                {
                    unresolved.Add(new { kind = "oreOptionPrefabChest", sourceFieldPath = optionPath + ".veinPrefab.Chest[" + prefabIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]", detail = "The candidate prefab returned a null Chest component." });
                    continue;
                }
                var authoredChestPath = optionPath + ".veinPrefab.Chest[" + prefabIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
                var authoredChestSource = worldSource(authoredChest, "Il2CppBLINK.RPGBuilder.World.Chest", prefabIndex);
                var authoredChestLoot = worldChestLootProjection(authoredChest, authoredChestPath);
                authoredChests.Add(new
                {
                    source = authoredChestSource,
                    authoredOnly = true,
                    loot = authoredChestLoot
                });
                authoredOutputs.Add(new
                {
                    outputKind = "chestLootInstances",
                    sourceFieldPath = authoredChestPath + ".lootInstances",
                    source = authoredChestSource,
                    loot = authoredChestLoot,
                    effectiveProbabilityResolved = false,
                    outputSemantics = "Authored Chest lootInstances are candidate prefab output; runtime opening and drop rolls are not evaluated."
                });
            }
        }
        for (var outputIndex = 0; outputIndex < authoredOutputs.Count; outputIndex++)
        {
            possibleOutputs.Add(new
            {
                optionIndex = optionIndex,
                output = authoredOutputs[outputIndex]
            });
        }
        try
        {
            var computed = spawner.ComputeWeights(option.requiredSkill);
            var computedWeights = new System.Collections.Generic.List<float>();
            if (computed != null)
            {
                for (var computedIndex = 0; computedIndex < computed.Length; computedIndex++)
                {
                    computedWeights.Add(computed[computedIndex]);
                }
            }
            weights.Add(new { sourceFieldPath = optionPath, skill = option.requiredSkill, weights = computedWeights, semantics = "Native ComputeWeights observation; not an authored or effective probability." });
        }
        catch (System.Exception error)
        {
            unresolved.Add(new { kind = "oreComputeWeights", sourceFieldPath = optionPath, skill = option.requiredSkill, detail = error.GetType().FullName + ": " + error.Message });
            weights.Add(new { sourceFieldPath = optionPath, skill = option.requiredSkill, unavailable = "ComputeWeights threw before producing an authored weight observation" });
        }
        options.Add(new
        {
            sourceFieldPath = optionPath,
            optionIndex = optionIndex,
            veinPrefab = prefab == null ? null : (object)new { name = prefab.name },
            requiredSkill = option.requiredSkill,
            weightAtLowSkill = option.weightAtLowSkill,
            weightAtHighSkill = option.weightAtHighSkill,
            teaserWeight = option.teaserWeight,
            authoredInteractables = authoredInteractables,
            authoredChests = authoredChests,
            possibleOutputs = authoredOutputs,
            candidateInspection = new { instantiated = false, rolled = false, mutated = false }
        });
    }

    object currentNodeObservation = null;
    try
    {
        var currentNode = spawner.CurrentNode;
        if (currentNode != null)
        {
            currentNodeObservation = new
            {
                present = true,
                observationKind = "runtimeGeneratedInstance",
                instanceIdObservation = currentNode.GetInstanceID(),
                source = worldSource(currentNode, "Il2CppBLINK.RPGBuilder.World.InteractableObject", -1),
                interactableName = currentNode.InteractableName,
                state = new { value = (int)currentNode.State, name = currentNode.State.ToString() }
            };
        }
        else
        {
            currentNodeObservation = new { present = false, observationKind = "runtimeGeneratedInstance", reason = "OreSpawner.CurrentNode returned null; authored options remain exported." };
        }
    }
    catch (System.Exception error)
    {
        unresolved.Add(new { kind = "oreCurrentNodeObservation", source = sourceEvidence, detail = error.GetType().FullName + ": " + error.Message });
        currentNodeObservation = new { present = false, observationKind = "runtimeGeneratedInstance", unavailable = "CurrentNode observation threw; authored options remain exported." };
    }
    worldResourceProducers.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        producerFamily = "oreSpawner",
        role = "resourceProducer",
        roles = new[] { "resourceProducer" },
        sourceIndex = spawnerIndex,
        miningSkillID = spawner.MiningSkillID,
        gatheringSkillID = spawner.MiningSkillID,
        gatheringSkill = worldDatabaseSkills == null ? null : (object)worldSkillReference(worldDatabaseSkills.ContainsKey(spawner.MiningSkillID) ? worldDatabaseSkills[spawner.MiningSkillID] : null),
        gatheringRole = new
        {
            kind = "resource",
            skillID = spawner.MiningSkillID,
            skill = worldDatabaseSkills == null ? null : (object)worldSkillReference(worldDatabaseSkills.ContainsKey(spawner.MiningSkillID) ? worldDatabaseSkills[spawner.MiningSkillID] : null),
            sourceFieldPath = "OreSpawner.MiningSkillID",
            semantics = "The native OreSpawner field is retained; the referenced skill, not the component name, determines the gathering role."
        },
        skillCap = spawner.SkillCap,
        respawnTime = spawner.RespawnTime,
        respawnJitter = spawner.RespawnJitter,
        despawnDelay = spawner.DespawnDelay,
        playerRange = spawner.PlayerRange,
        optionsAvailable = nativeOptions != null,
        optionCount = nativeOptions == null ? -1 : optionCount,
        options = options,
        possibleOutputsAvailable = nativeOptions != null,
        possibleOutputCount = nativeOptions == null ? -1 : possibleOutputs.Count,
        possibleOutputs = possibleOutputs,
        outputSemantics = "Possible outputs come from authored candidate prefab actions. CurrentNode is an observation and never replaces this list.",
        computeWeightsSamples = weights,
        currentNodeObservation = currentNodeObservation,
        authoredProducerIndependentOfObservation = true
    });
    if (worldDatabaseSkills == null || !worldDatabaseSkills.ContainsKey(spawner.MiningSkillID))
    {
        unresolved.Add(new { kind = "oreSpawnerSkillReference", source = sourceEvidence, skillID = spawner.MiningSkillID, detail = "MiningSkillID does not resolve in GameDatabase.Skills." });
    }
}

var worldInteractables = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractableObject>(true);
var worldInteractableCount = worldInteractables == null ? 0 : worldInteractables.Length;
for (var index = 0; index < worldInteractableCount; index++)
{
    var interactable = worldInteractables[index];
    if (interactable == null)
    {
        unresolved.Add(new { kind = "interactableObject", sourceIndex = index, detail = "FindObjectsOfType returned a null InteractableObject." });
        continue;
    }
    var sourceEvidence = worldSource(interactable, "Il2CppBLINK.RPGBuilder.World.InteractableObject", index);
    var sourcePath = "Il2CppBLINK.RPGBuilder.World.InteractableObject[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
    var actions = new System.Collections.Generic.List<object>();
    var nativeActions = interactable.Actions;
    var actionCount = nativeActions == null ? 0 : nativeActions.Count;
    if (nativeActions == null)
    {
        unresolved.Add(new { kind = "interactableActions", sourceFieldPath = sourcePath + ".Actions", detail = "The authored action list is null; this interaction has no projected action rules." });
    }
    for (var actionIndex = 0; actionIndex < actionCount; actionIndex++)
    {
        actions.Add(worldActionProjection(nativeActions[actionIndex], sourcePath + ".Actions[" + actionIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]"));
    }
    var requirements = interactable.RequirementsTemplate == null ? null : (object)worldTemplateProjection(interactable.RequirementsTemplate, sourcePath + ".RequirementsTemplate");
    var nativeRanks = interactable.RequiredNPCRanks;
    var rankCount = nativeRanks == null ? 0 : nativeRanks.Count;
    var ranks = new System.Collections.Generic.List<string>(rankCount);
    for (var rankIndex = 0; rankIndex < rankCount; rankIndex++) ranks.Add(nativeRanks[rankIndex]);
    worldInteractions.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        family = "interactableObject",
        role = "usefulInteraction",
        roles = new[] { "usefulInteraction" },
        roleSource = "InteractableObject implements IPlayerInteractable and exposes authored Actions; no category is inferred from the GameObject name.",
        interactableName = interactable.InteractableName,
        state = new { value = (int)interactable.State, name = interactable.State.ToString() },
        actionsAvailable = nativeActions != null,
        actionCount = nativeActions == null ? -1 : actionCount,
        actions = actions,
        requirementsTemplate = requirements,
        requirementsOwner = interactable.RequirementsTemplate == null ? null : (object)new { ownerKind = "interactableObject", sourceFieldPath = sourcePath + ".RequirementsTemplate.Requirements", source = sourceEvidence },
        resource = interactable.Resource == null ? null : (object)worldResourceReference(interactable.Resource),
        resourceID = interactable.Resource == null ? (int?)null : (int?)interactable.Resource.ID,
        isPersistent = interactable.IsPersistent,
        isTrigger = interactable.IsTrigger,
        isClick = interactable.IsClick,
        limitedUseAmount = interactable.LimitedUseAmount,
        maxUseAmount = interactable.MaxUseAmount,
        maxActions = interactable.MaxActions,
        cooldown = interactable.Cooldown,
        interactionTime = interactable.InteractionTime,
        maxDistance = interactable.MaxDistance,
        lootWindowGathering = interactable.LootWindowGathering,
        allowNPCInteraction = interactable.AllowNPCInteraction,
        requiredNPCRanksAvailable = nativeRanks != null,
        requiredNPCRankCount = nativeRanks == null ? -1 : rankCount,
        requiredNPCRanks = ranks
    });
}

var worldNodes = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractiveNode>(true);
var worldNodeCount = worldNodes == null ? 0 : worldNodes.Length;
for (var index = 0; index < worldNodeCount; index++)
{
    var node = worldNodes[index];
    if (node == null)
    {
        unresolved.Add(new { kind = "interactiveNode", sourceIndex = index, detail = "FindObjectsOfType returned a null InteractiveNode." });
        continue;
    }
    var nodeProjection = worldNodeProjection(node, node, index);
    worldInteractions.Add(new
    {
        source = worldSource(node, "Il2CppBLINK.RPGBuilder.World.InteractiveNode", index),
        disposition = "extracted",
        family = "interactiveNode",
        role = node.nodeType.ToString(),
        roleEvidence = new
        {
            resource = node.nodeType == Il2CppBLINK.RPGBuilder.World.InteractiveNode.InteractiveNodeType.resourceNode || node.resourceNodeData != null,
            container = node.nodeType == Il2CppBLINK.RPGBuilder.World.InteractiveNode.InteractiveNodeType.container || (node.containerTablesData != null && node.containerTablesData.Count > 0),
            sourceRule = "Resource and container roles follow nodeType and typed data fields; both roles remain when both are authored."
        },
        projection = nodeProjection
    });
    if (node.nodeType == Il2CppBLINK.RPGBuilder.World.InteractiveNode.InteractiveNodeType.container || (node.containerTablesData != null && node.containerTablesData.Count > 0))
    {
        worldContainers.Add(new
        {
            source = worldSource(node, "Il2CppBLINK.RPGBuilder.World.InteractiveNode", index),
            disposition = "extracted",
            family = "interactiveNode",
            role = "container",
            roles = new[] { "container", "usefulInteraction" },
            roleSource = "InteractiveNode.containerTablesData provides container output evidence; the same source remains in interactions.",
            projection = nodeProjection
        });
    }
    if (node.nodeType == Il2CppBLINK.RPGBuilder.World.InteractiveNode.InteractiveNodeType.resourceNode || node.resourceNodeData != null)
    {
        var interactiveNodeResourceSkillID = node.resourceNodeData == null ? (int?)null : (int?)node.resourceNodeData.skillRequiredID;
        var interactiveNodeGatherSkill = (Il2Cpp.RPGSkill)null;
        if (interactiveNodeResourceSkillID.HasValue && worldDatabaseSkills != null && worldDatabaseSkills.ContainsKey(interactiveNodeResourceSkillID.Value))
        {
            interactiveNodeGatherSkill = worldDatabaseSkills[interactiveNodeResourceSkillID.Value];
        }
        worldResourceProducers.Add(new
        {
            source = worldSource(node, "Il2CppBLINK.RPGBuilder.World.InteractiveNode", index),
            disposition = "extracted",
            producerFamily = "interactiveNode",
            role = "resourceProducer",
            roles = new[] { "resourceProducer" },
            sourceIndex = index,
            gatheringSkillID = interactiveNodeResourceSkillID,
            gatheringSkill = interactiveNodeGatherSkill == null ? null : (object)worldSkillReference(interactiveNodeGatherSkill),
            gatheringRole = new
            {
                kind = "resource",
                skillID = interactiveNodeResourceSkillID,
                skill = interactiveNodeGatherSkill == null ? null : (object)worldSkillReference(interactiveNodeGatherSkill),
                sourceFieldPath = "InteractiveNode.resourceNodeData.skillRequiredID",
                semantics = "resourceNode uses RPGResourceNode.skillRequiredID; InteractiveNode.gatherSkill is not used for this resource role"
            },
            resourceNode = node.resourceNodeData == null ? null : (object)worldResourceReference(node.resourceNodeData),
            projection = nodeProjection,
            authoredProducerIndependentOfObservation = true
        });
    }
}

var worldChests = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.Chest>(true);
var worldChestCount = worldChests == null ? 0 : worldChests.Length;
for (var index = 0; index < worldChestCount; index++)
{
    var chest = worldChests[index];
    if (chest == null)
    {
        unresolved.Add(new { kind = "chest", sourceIndex = index, detail = "FindObjectsOfType returned a null Chest." });
        continue;
    }
    var sourceEvidence = worldSource(chest, "Il2CppBLINK.RPGBuilder.World.Chest", index);
    var sourcePath = "Il2CppBLINK.RPGBuilder.World.Chest[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
    var chestProjection = worldChestLootProjection(chest, sourcePath);
    worldContainers.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        family = "chest",
        role = "container",
        roles = new[] { "container" },
        roleSource = "Chest implements IPlayerInteractable and owns authored lootInstances.",
        chestName = chest.chestName,
        projection = chestProjection,
        interaction = new { interactionDistance = chest.interactionDistance, maxDrops = chest.maxDrops }
    });
    worldInteractions.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        family = "chest",
        role = "containerInteraction",
        roles = new[] { "container", "usefulInteraction" },
        roleSource = "The same Chest source owns both the container output and the player interaction; downstream placement identity must deduplicate them.",
        interactableName = chest.chestName,
        projection = chestProjection
    });
}

var worldCraftingStations = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.CraftingStation>(true);
var worldCraftingStationCount = worldCraftingStations == null ? 0 : worldCraftingStations.Length;
for (var index = 0; index < worldCraftingStationCount; index++)
{
    var stationNode = worldCraftingStations[index];
    if (stationNode == null)
    {
        unresolved.Add(new { kind = "craftingStation", sourceIndex = index, detail = "FindObjectsOfType returned a null CraftingStation." });
        continue;
    }
    var sourceEvidence = worldSource(stationNode, "Il2CppBLINK.RPGBuilder.World.CraftingStation", index);
    var sourcePath = "Il2CppBLINK.RPGBuilder.World.CraftingStation[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
    var station = stationNode.station;
    var stationResolved = station != null && worldDatabaseCraftingStations != null && worldDatabaseCraftingStations.ContainsKey(station.ID) && worldDatabaseCraftingStations[station.ID] != null;
    if (station == null)
    {
        unresolved.Add(new { kind = "craftingStationReference", source = sourceEvidence, sourceFieldPath = "CraftingStation.station", detail = "The authored crafting station reference is null." });
    }
    else if (!stationResolved)
    {
        unresolved.Add(new { kind = "craftingStationDatabaseReference", source = sourceEvidence, sourceFieldPath = "CraftingStation.station.ID", stationID = station.ID, detail = worldDatabaseCraftingStations == null ? "GameDatabase.GetCraftingStations() was unavailable; the station could not be verified." : "The station ID does not resolve to a non-null GameDatabase.CraftingStations record." });
    }
    var craftSkills = new System.Collections.Generic.List<object>();
    var nativeCraftSkills = station == null ? null : station.craftSkills;
    var craftSkillCount = nativeCraftSkills == null ? 0 : nativeCraftSkills.Count;
    if (station != null && nativeCraftSkills == null)
    {
        unresolved.Add(new { kind = "craftingStationSkills", source = sourceEvidence, sourceFieldPath = "CraftingStation.station.craftSkills", detail = "The authored craft skill list is null; skill coverage for this service is unavailable." });
    }
    for (var skillIndex = 0; skillIndex < craftSkillCount; skillIndex++)
    {
        var skillRow = nativeCraftSkills[skillIndex];
        var skillPath = sourcePath + ".station.craftSkills[" + skillIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (skillRow == null)
        {
            unresolved.Add(new { kind = "craftingStationSkill", source = sourceEvidence, sourceFieldPath = skillPath, detail = "The authored craft skill row is null." });
            craftSkills.Add(new { sourceFieldPath = skillPath, unavailable = "null authored craft skill row" });
            continue;
        }
        var skillResolved = worldDatabaseSkills != null && worldDatabaseSkills.ContainsKey(skillRow.craftSkillID) && worldDatabaseSkills[skillRow.craftSkillID] != null;
        if (!skillResolved)
        {
            unresolved.Add(new { kind = "craftingStationSkillReference", source = sourceEvidence, sourceFieldPath = skillPath + ".craftSkillID", skillID = skillRow.craftSkillID, detail = worldDatabaseSkills == null ? "GameDatabase.GetSkills() was unavailable; the craft skill could not be verified." : "craftSkillID does not resolve to a non-null GameDatabase.Skills record." });
        }
        craftSkills.Add(new
        {
            sourceFieldPath = skillPath,
            craftSkillID = skillRow.craftSkillID,
            craftSkill = skillResolved ? (object)worldSkillReference(worldDatabaseSkills[skillRow.craftSkillID]) : null,
            referenceStatus = skillResolved ? "resolved" : "unresolved"
        });
    }
    worldServices.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        family = "craftingStation",
        role = "craftingService",
        roles = new[] { "craftingService" },
        roleSource = "CraftingStation.station is a typed RPGCraftingStation reference; the service role does not come from the GameObject name.",
        stationID = station == null ? (int?)null : (int?)station.ID,
        station = station == null ? null : (object)projectEntry(station),
        stationReferenceStatus = station == null ? "unresolved" : (stationResolved ? "resolved" : "unresolved"),
        useDistanceMax = stationNode.useDistanceMax,
        interactableUIoffsetY = stationNode.interactableUIoffsetY,
        craftSkillsAvailable = nativeCraftSkills != null,
        craftSkillCount = nativeCraftSkills == null ? -1 : craftSkillCount,
        craftSkills = craftSkills
    });
}

var worldPropertySigns = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.PropertyForSaleSign>(true);
var worldPropertySignCount = worldPropertySigns == null ? 0 : worldPropertySigns.Length;
for (var index = 0; index < worldPropertySignCount; index++)
{
    var propertySign = worldPropertySigns[index];
    if (propertySign == null)
    {
        unresolved.Add(new { kind = "propertyForSaleSign", sourceIndex = index, detail = "FindObjectsOfType returned a null PropertyForSaleSign." });
        continue;
    }
    var sourceEvidence = worldSource(propertySign, "Il2CppBLINK.RPGBuilder.World.PropertyForSaleSign", index);
    var property = propertySign.property;
    var propertyResolved = property != null && worldDatabaseProperties != null && worldDatabaseProperties.ContainsKey(property.ID) && worldDatabaseProperties[property.ID] != null;
    if (property == null)
    {
        unresolved.Add(new { kind = "propertyReference", source = sourceEvidence, sourceFieldPath = "PropertyForSaleSign.property", detail = "The authored property reference is null." });
    }
    else if (!propertyResolved)
    {
        unresolved.Add(new { kind = "propertyDatabaseReference", source = sourceEvidence, sourceFieldPath = "PropertyForSaleSign.property.ID", propertyID = property.ID, detail = worldDatabaseProperties == null ? "GameDatabase.GetProperties() was unavailable; the property could not be verified." : "The property ID does not resolve to a non-null GameDatabase.Properties record." });
    }
    var propertyCurrency = property != null && worldDatabaseCurrencies != null && worldDatabaseCurrencies.ContainsKey(property.currencyID) ? worldDatabaseCurrencies[property.currencyID] : null;
    if (property != null && property.currencyID >= 0 && propertyCurrency == null)
    {
        unresolved.Add(new { kind = "propertyCurrencyReference", source = sourceEvidence, sourceFieldPath = "PropertyForSaleSign.property.currencyID", currencyID = property.currencyID, detail = "The property currency does not resolve in GameDatabase.GetCurrencies()." });
    }
    worldServices.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        family = "propertyForSaleSign",
        role = "propertyPurchaseService",
        roles = new[] { "propertyPurchaseService" },
        roleSource = "PropertyForSaleSign.property is a typed RPGProperty reference; the service role does not come from the GameObject name.",
        propertyID = property == null ? (int?)null : (int?)property.ID,
        property = property == null ? null : (object)projectEntry(property),
        propertyReferenceStatus = property == null ? "unresolved" : (propertyResolved ? "resolved" : "unresolved"),
        propertyType = property == null ? null : (object)new { value = (int)property.propertyType, name = property.propertyType.ToString() },
        currencyID = property == null ? (int?)null : (int?)property.currencyID,
        currency = propertyCurrency == null ? null : (object)projectEntry(propertyCurrency),
        currencyReferenceStatus = property == null ? "unresolved" : (property.currencyID < 0 ? "not-authored" : (propertyCurrency == null ? "unresolved" : "resolved")),
        purchasePrice = property == null ? (int?)null : (int?)property.purchasePrice,
        sellPrice = property == null ? (int?)null : (int?)property.sellPrice,
        incomeAmount = property == null ? (int?)null : (int?)property.incomeAmount,
        maxInteractionDistance = propertySign.MaxInteractionDistance,
        uiOffsetY = propertySign.UIOffsetY,
        signVisualObject = propertySign.SignVisualObject == null ? null : (object)new { name = propertySign.SignVisualObject.name, activeSelf = propertySign.SignVisualObject.activeSelf, activeInHierarchy = propertySign.SignVisualObject.activeInHierarchy }
    });
}

var worldHeroicConsoles = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.HeroicConsole>(true);
var worldHeroicConsoleCount = worldHeroicConsoles == null ? 0 : worldHeroicConsoles.Length;
for (var index = 0; index < worldHeroicConsoleCount; index++)
{
    var console = worldHeroicConsoles[index];
    if (console == null)
    {
        unresolved.Add(new { kind = "heroicConsole", sourceIndex = index, detail = "FindObjectsOfType returned a null HeroicConsole." });
        continue;
    }
    var sourceEvidence = worldSource(console, "Il2CppBLINK.RPGBuilder.World.HeroicConsole", index);
    unresolved.Add(new { kind = "unsupportedWorldService", source = sourceEvidence, family = "heroicConsole", detail = "HeroicConsole has a typed interactable surface, but its runtime tier activation action is not represented by a canonical relationship in this probe." });
    worldUnsupportedSources.Add(new
    {
        source = sourceEvidence,
        family = "heroicConsole",
        disposition = "unsupported",
        role = "service",
        roles = new[] { "service" },
        reason = "Runtime HeroicConsole interaction and tier activation are not projected; only authored visual and distance fields are retained.",
        maxInteractionDistance = console.MaxInteractionDistance,
        uiOffsetY = console.UIOffsetY,
        activeVisualObject = console.ActiveVisualObject == null ? null : (object)new { name = console.ActiveVisualObject.name, activeSelf = console.ActiveVisualObject.activeSelf, activeInHierarchy = console.ActiveVisualObject.activeInHierarchy }
    });
}

var worldGraveyards = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.CharacterGraveyard>(true);
var worldGraveyardCount = worldGraveyards == null ? 0 : worldGraveyards.Length;
for (var index = 0; index < worldGraveyardCount; index++)
{
    var graveyard = worldGraveyards[index];
    if (graveyard == null)
    {
        unresolved.Add(new { kind = "characterGraveyard", sourceIndex = index, detail = "FindObjectsOfType returned a null CharacterGraveyard." });
        continue;
    }
    var sourceEvidence = worldSource(graveyard, "Il2CppBLINK.RPGBuilder.World.CharacterGraveyard", index);
    var sourcePath = "Il2CppBLINK.RPGBuilder.World.CharacterGraveyard[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
    var classes = new System.Collections.Generic.List<object>();
    var nativeClasses = graveyard.requiredClasses;
    var classCount = nativeClasses == null ? 0 : nativeClasses.Count;
    if (nativeClasses == null)
    {
        unresolved.Add(new { kind = "characterGraveyardClasses", source = sourceEvidence, sourceFieldPath = "CharacterGraveyard.requiredClasses", detail = "The authored class eligibility list is null." });
    }
    for (var classIndex = 0; classIndex < classCount; classIndex++)
    {
        var requiredClass = nativeClasses[classIndex];
        var classPath = sourcePath + ".requiredClasses[" + classIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        var classResolved = requiredClass != null && worldDatabaseClasses != null && worldDatabaseClasses.ContainsKey(requiredClass.ID) && worldDatabaseClasses[requiredClass.ID] != null;
        if (requiredClass == null)
        {
            unresolved.Add(new { kind = "characterGraveyardClassReference", source = sourceEvidence, sourceFieldPath = classPath, detail = "The authored required class reference is null." });
            classes.Add(new { sourceFieldPath = classPath, unavailable = "null authored class reference" });
            continue;
        }
        if (!classResolved)
        {
            unresolved.Add(new { kind = "characterGraveyardClassDatabaseReference", source = sourceEvidence, sourceFieldPath = classPath, classID = requiredClass.ID, detail = worldDatabaseClasses == null ? "GameDatabase.GetClasses() was unavailable; the class could not be verified." : "The required class ID does not resolve to a non-null GameDatabase.Classes record." });
        }
        classes.Add(new { sourceFieldPath = classPath, classID = requiredClass.ID, classReference = (object)projectEntry(requiredClass), referenceStatus = classResolved ? "resolved" : "unresolved" });
    }
    var races = new System.Collections.Generic.List<object>();
    var nativeRaces = graveyard.requiredRaces;
    var raceCount = nativeRaces == null ? 0 : nativeRaces.Count;
    if (nativeRaces == null)
    {
        unresolved.Add(new { kind = "characterGraveyardRaces", source = sourceEvidence, sourceFieldPath = "CharacterGraveyard.requiredRaces", detail = "The authored race eligibility list is null." });
    }
    for (var raceIndex = 0; raceIndex < raceCount; raceIndex++)
    {
        var requiredRace = nativeRaces[raceIndex];
        var racePath = sourcePath + ".requiredRaces[" + raceIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        var raceResolved = requiredRace != null && worldDatabaseRaces != null && worldDatabaseRaces.ContainsKey(requiredRace.ID) && worldDatabaseRaces[requiredRace.ID] != null;
        if (requiredRace == null)
        {
            unresolved.Add(new { kind = "characterGraveyardRaceReference", source = sourceEvidence, sourceFieldPath = racePath, detail = "The authored required race reference is null." });
            races.Add(new { sourceFieldPath = racePath, unavailable = "null authored race reference" });
            continue;
        }
        if (!raceResolved)
        {
            unresolved.Add(new { kind = "characterGraveyardRaceDatabaseReference", source = sourceEvidence, sourceFieldPath = racePath, raceID = requiredRace.ID, detail = worldDatabaseRaces == null ? "GameDatabase.GetRaces() was unavailable; the race could not be verified." : "The required race ID does not resolve to a non-null GameDatabase.Races record." });
        }
        races.Add(new { sourceFieldPath = racePath, raceID = requiredRace.ID, race = (object)projectEntry(requiredRace), referenceStatus = raceResolved ? "resolved" : "unresolved" });
    }
    worldConditionSources.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        family = "characterGraveyard",
        conditionKind = "respawnDestinationEligibility",
        requiredClassesAvailable = nativeClasses != null,
        requiredClassCount = nativeClasses == null ? -1 : classCount,
        requiredClasses = classes,
        requiredRacesAvailable = nativeRaces != null,
        requiredRaceCount = nativeRaces == null ? -1 : raceCount,
        requiredRaces = races,
        semantics = "Eligibility fields are authored references. This probe does not evaluate the current character against them."
    });
}

var worldEnhancedInteractables = UnityEngine.Object.FindObjectsOfType<Il2Cpp.EnhancedInteractableObject>(true);
var worldEnhancedInteractableCount = worldEnhancedInteractables == null ? 0 : worldEnhancedInteractables.Length;
for (var index = 0; index < worldEnhancedInteractableCount; index++)
{
    var enhanced = worldEnhancedInteractables[index];
    if (enhanced == null)
    {
        unresolved.Add(new { kind = "enhancedInteractableObject", sourceIndex = index, detail = "FindObjectsOfType returned a null EnhancedInteractableObject." });
        continue;
    }
    var sourceEvidence = worldSource(enhanced, "Il2Cpp.EnhancedInteractableObject", index);
    var sourcePath = "Il2Cpp.EnhancedInteractableObject[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
    if (enhanced.TargetObject == null)
    {
        unresolved.Add(new { kind = "enhancedInteractableTarget", source = sourceEvidence, sourceFieldPath = "EnhancedInteractableObject.TargetObject", detail = "The activation controller has no target GameObject." });
    }
    worldConditionSources.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        family = "enhancedInteractableObject",
        conditionKind = "activationToggle",
        targetObject = enhanced.TargetObject == null ? null : (object)new { name = enhanced.TargetObject.name, activeSelf = enhanced.TargetObject.activeSelf, activeInHierarchy = enhanced.TargetObject.activeInHierarchy },
        targetSource = enhanced.TargetObject == null ? null : (object)worldSource(enhanced.TargetObject.transform, "UnityEngine.Transform", -1),
        activationRequirements = enhanced.ActivationRequirements == null ? null : (object)worldTemplateProjection(enhanced.ActivationRequirements, sourcePath + ".ActivationRequirements"),
        deactivationRequirements = enhanced.DeactivationRequirements == null ? null : (object)worldTemplateProjection(enhanced.DeactivationRequirements, sourcePath + ".DeactivationRequirements"),
        semantics = "Activation and deactivation are runtime state changes. Requirement predicates are retained but not evaluated."
    });
}

var worldActiveRequirements = UnityEngine.Object.FindObjectsOfType<Il2Cpp.ActiveRequirement>(true);
var worldActiveRequirementCount = worldActiveRequirements == null ? 0 : worldActiveRequirements.Length;
for (var index = 0; index < worldActiveRequirementCount; index++)
{
    var activeRequirement = worldActiveRequirements[index];
    if (activeRequirement == null)
    {
        unresolved.Add(new { kind = "activeRequirement", sourceIndex = index, detail = "FindObjectsOfType returned a null ActiveRequirement." });
        continue;
    }
    var sourceEvidence = worldSource(activeRequirement, "Il2Cpp.ActiveRequirement", index);
    var sourcePath = "Il2Cpp.ActiveRequirement[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
    var requirementGroups = new System.Collections.Generic.List<object>();
    var nativeRequirementGroups = activeRequirement.RequirementGroups;
    var requirementGroupCount = nativeRequirementGroups == null ? 0 : nativeRequirementGroups.Count;
    if (activeRequirement.TargetObject == null)
    {
        unresolved.Add(new { kind = "activeRequirementTarget", source = sourceEvidence, sourceFieldPath = "ActiveRequirement.TargetObject", detail = "The activation controller has no target GameObject." });
    }
    if (activeRequirement.Source == Il2Cpp.ActiveRequirement.RequirementSource.Template && activeRequirement.ActivationRequirement == null)
    {
        unresolved.Add(new { kind = "activeRequirementTemplate", source = sourceEvidence, sourceFieldPath = "ActiveRequirement.ActivationRequirement", detail = "Source is Template but ActivationRequirement is null." });
    }
    if (activeRequirement.Source == Il2Cpp.ActiveRequirement.RequirementSource.RequirementGroup && nativeRequirementGroups == null)
    {
        unresolved.Add(new { kind = "activeRequirementGroups", source = sourceEvidence, sourceFieldPath = "ActiveRequirement.RequirementGroups", detail = "Source is RequirementGroup but RequirementGroups is null." });
    }
    for (var groupIndex = 0; groupIndex < requirementGroupCount; groupIndex++)
    {
        var groupPath = sourcePath + ".RequirementGroups[" + groupIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        requirementGroups.Add(projectGroup(nativeRequirementGroups[groupIndex], groupPath, groupIndex));
    }
    worldConditionSources.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        family = "activeRequirement",
        conditionKind = "activationToggle",
        targetObject = activeRequirement.TargetObject == null ? null : (object)new { name = activeRequirement.TargetObject.name, activeSelf = activeRequirement.TargetObject.activeSelf, activeInHierarchy = activeRequirement.TargetObject.activeInHierarchy },
        targetSource = activeRequirement.TargetObject == null ? null : (object)worldSource(activeRequirement.TargetObject.transform, "UnityEngine.Transform", -1),
        requirementSource = new { value = (int)activeRequirement.Source, name = activeRequirement.Source.ToString() },
        activationRequirement = activeRequirement.ActivationRequirement == null ? null : (object)worldTemplateProjection(activeRequirement.ActivationRequirement, sourcePath + ".ActivationRequirement"),
        requirementGroupsAvailable = nativeRequirementGroups != null,
        requirementGroupCount = nativeRequirementGroups == null ? -1 : requirementGroupCount,
        requirementGroups = requirementGroups,
        checkEveryNFrames = activeRequirement.CheckEveryNFrames,
        semantics = "Requirement predicates are retained with Value and Comparison separately; runtime activation is not evaluated."
    });
}

var worldTimedActiveRequirements = UnityEngine.Object.FindObjectsOfType<Il2Cpp.TimedActiveRequirement>(true);
var worldTimedActiveRequirementCount = worldTimedActiveRequirements == null ? 0 : worldTimedActiveRequirements.Length;
for (var index = 0; index < worldTimedActiveRequirementCount; index++)
{
    var timedRequirement = worldTimedActiveRequirements[index];
    if (timedRequirement == null)
    {
        unresolved.Add(new { kind = "timedActiveRequirement", sourceIndex = index, detail = "FindObjectsOfType returned a null TimedActiveRequirement." });
        continue;
    }
    var sourceEvidence = worldSource(timedRequirement, "Il2Cpp.TimedActiveRequirement", index);
    var sourcePath = "Il2Cpp.TimedActiveRequirement[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
    if (timedRequirement.TargetObject == null)
    {
        unresolved.Add(new { kind = "timedActiveRequirementTarget", source = sourceEvidence, sourceFieldPath = "TimedActiveRequirement.TargetObject", detail = "The timed activation controller has no target GameObject." });
    }
    if (timedRequirement.ActivationRequirement == null)
    {
        unresolved.Add(new { kind = "timedActiveRequirementTemplate", source = sourceEvidence, sourceFieldPath = "TimedActiveRequirement.ActivationRequirement", detail = "The timed activation controller has no requirement template." });
    }
    worldConditionSources.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        family = "timedActiveRequirement",
        conditionKind = "timedActivationToggle",
        targetObject = timedRequirement.TargetObject == null ? null : (object)new { name = timedRequirement.TargetObject.name, activeSelf = timedRequirement.TargetObject.activeSelf, activeInHierarchy = timedRequirement.TargetObject.activeInHierarchy },
        targetSource = timedRequirement.TargetObject == null ? null : (object)worldSource(timedRequirement.TargetObject.transform, "UnityEngine.Transform", -1),
        activationRequirement = timedRequirement.ActivationRequirement == null ? null : (object)worldTemplateProjection(timedRequirement.ActivationRequirement, sourcePath + ".ActivationRequirement"),
        activationDurationSeconds = timedRequirement.ActivationDurationSeconds,
        semantics = "The authored duration and requirement are retained. Runtime timer state is not a placement identity."
    });
}

var worldDisableRequirements = UnityEngine.Object.FindObjectsOfType<Il2Cpp.DisableRequirement>(true);
var worldDisableRequirementCount = worldDisableRequirements == null ? 0 : worldDisableRequirements.Length;
for (var index = 0; index < worldDisableRequirementCount; index++)
{
    var disableRequirement = worldDisableRequirements[index];
    if (disableRequirement == null)
    {
        unresolved.Add(new { kind = "disableRequirement", sourceIndex = index, detail = "FindObjectsOfType returned a null DisableRequirement." });
        continue;
    }
    var sourceEvidence = worldSource(disableRequirement, "Il2Cpp.DisableRequirement", index);
    var sourcePath = "Il2Cpp.DisableRequirement[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
    if (disableRequirement.TargetObject == null)
    {
        unresolved.Add(new { kind = "disableRequirementTarget", source = sourceEvidence, sourceFieldPath = "DisableRequirement.TargetObject", detail = "The disable controller has no target GameObject." });
    }
    if (disableRequirement.ActivationRequirement == null)
    {
        unresolved.Add(new { kind = "disableRequirementTemplate", source = sourceEvidence, sourceFieldPath = "DisableRequirement.ActivationRequirement", detail = "The disable controller has no requirement template." });
    }
    worldConditionSources.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        family = "disableRequirement",
        conditionKind = "disableToggle",
        targetObject = disableRequirement.TargetObject == null ? null : (object)new { name = disableRequirement.TargetObject.name, activeSelf = disableRequirement.TargetObject.activeSelf, activeInHierarchy = disableRequirement.TargetObject.activeInHierarchy },
        targetSource = disableRequirement.TargetObject == null ? null : (object)worldSource(disableRequirement.TargetObject.transform, "UnityEngine.Transform", -1),
        activationRequirement = disableRequirement.ActivationRequirement == null ? null : (object)worldTemplateProjection(disableRequirement.ActivationRequirement, sourcePath + ".ActivationRequirement"),
        semantics = "The authored requirement is retained. Runtime target disabling is not evaluated."
    });
}

var worldRandomActivators = UnityEngine.Object.FindObjectsOfType<Il2Cpp.RandomActivator>(true);
var worldRandomActivatorCount = worldRandomActivators == null ? 0 : worldRandomActivators.Length;
for (var index = 0; index < worldRandomActivatorCount; index++)
{
    var randomActivator = worldRandomActivators[index];
    if (randomActivator == null)
    {
        unresolved.Add(new { kind = "randomActivator", sourceIndex = index, detail = "FindObjectsOfType returned a null RandomActivator." });
        continue;
    }
    var sourceEvidence = worldSource(randomActivator, "Il2Cpp.RandomActivator", index);
    var sourcePath = "Il2Cpp.RandomActivator[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
    var targetObjects = new System.Collections.Generic.List<object>();
    var nativeTargetObjects = randomActivator.gameObjects;
    var targetObjectCount = nativeTargetObjects == null ? 0 : nativeTargetObjects.Count;
    if (nativeTargetObjects == null)
    {
        unresolved.Add(new { kind = "randomActivatorTargets", source = sourceEvidence, sourceFieldPath = "RandomActivator.gameObjects", detail = "The random activator target list is null." });
    }
    for (var targetIndex = 0; targetIndex < targetObjectCount; targetIndex++)
    {
        var targetObject = nativeTargetObjects[targetIndex];
        var targetPath = sourcePath + ".gameObjects[" + targetIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (targetObject == null)
        {
            unresolved.Add(new { kind = "randomActivatorTarget", source = sourceEvidence, sourceFieldPath = targetPath, detail = "The random activator target GameObject is null." });
            targetObjects.Add(new { sourceFieldPath = targetPath, unavailable = "null target GameObject" });
            continue;
        }
        targetObjects.Add(new
        {
            sourceFieldPath = targetPath,
            name = targetObject.name,
            source = worldSource(targetObject.transform, "UnityEngine.Transform", -1),
            activeSelf = targetObject.activeSelf,
            activeInHierarchy = targetObject.activeInHierarchy
        });
    }
    unresolved.Add(new { kind = "unsupportedWorldSourceFamily", source = sourceEvidence, family = "randomActivator", detail = "The declaration exposes target GameObjects and numberToEnable, but runtime selection behavior is not verified; no stable placement roles are inferred." });
    worldUnsupportedSources.Add(new
    {
        source = sourceEvidence,
        family = "randomActivator",
        disposition = "unsupported",
        targetCount = nativeTargetObjects == null ? -1 : targetObjectCount,
        numberToEnable = randomActivator.numberToEnable,
        targets = targetObjects,
        reason = "The declaration exposes target GameObjects and numberToEnable, but runtime selection behavior is not verified; no stable authored placement rule is emitted."
    });
}

var worldInteractiveZones = UnityEngine.Object.FindObjectsOfType<Il2Cpp.InteractiveZone>(true);
var worldInteractiveZoneCount = worldInteractiveZones == null ? 0 : worldInteractiveZones.Length;
for (var index = 0; index < worldInteractiveZoneCount; index++)
{
    var interactiveZone = worldInteractiveZones[index];
    if (interactiveZone == null)
    {
        unresolved.Add(new { kind = "interactiveZone", sourceIndex = index, detail = "FindObjectsOfType returned a null InteractiveZone." });
        continue;
    }
    var sourceEvidence = worldSource(interactiveZone, "Il2Cpp.InteractiveZone", index);
    unresolved.Add(new { kind = "unsupportedWorldSourceFamily", source = sourceEvidence, family = "interactiveZone", detail = "InteractiveZone exposes a uiElement field, but this probe has no verified runtime semantics for how it affects world content." });
    worldUnsupportedSources.Add(new
    {
        source = sourceEvidence,
        family = "interactiveZone",
        disposition = "unsupported",
        uiElement = interactiveZone.uiElement == null ? null : (object)new { name = interactiveZone.uiElement.name, activeSelf = interactiveZone.uiElement.activeSelf, activeInHierarchy = interactiveZone.uiElement.activeInHierarchy },
        reason = "InteractiveZone exposes uiElement, but runtime behavior is not verified as a world producer, interaction, or service relationship."
    });
}

var worldQuestZonesNative = UnityEngine.Object.FindObjectsOfType<Il2Cpp.WorldQuestZone>(true);
var worldQuestZoneCount = worldQuestZonesNative == null ? 0 : worldQuestZonesNative.Length;
for (var index = 0; index < worldQuestZoneCount; index++)
{
    var zone = worldQuestZonesNative[index];
    if (zone == null)
    {
        unresolved.Add(new { kind = "worldQuestZone", sourceIndex = index, detail = "FindObjectsOfType returned a null WorldQuestZone." });
        continue;
    }
    var sourceEvidence = worldSource(zone, "Il2Cpp.WorldQuestZone", index);
    var sourcePath = "Il2Cpp.WorldQuestZone[" + index.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
    var quests = new System.Collections.Generic.List<object>();
    if (zone.worldQuest != null)
    {
        if (zone.worldQuest.quest == null)
        {
            unresolved.Add(new { kind = "worldQuestCanonicalReference", source = sourceEvidence, sourceFieldPath = sourcePath + ".worldQuest.quest", worldQuestID = zone.worldQuest.ID, detail = "The authored RPGWorldQuest has no RPGQuest reference." });
        }
    }
    else if (zone.possibleQuests == null || zone.possibleQuests.Count == 0)
    {
        unresolved.Add(new { kind = "worldQuestZoneQuestReference", source = sourceEvidence, detail = "The zone has no authored worldQuest and no possibleQuests rows." });
    }
    var possible = zone.possibleQuests;
    var possibleCount = possible == null ? 0 : possible.Count;
    for (var questIndex = 0; questIndex < possibleCount; questIndex++)
    {
        var possibleQuest = possible[questIndex];
        var questPath = sourcePath + ".possibleQuests[" + questIndex.ToString(System.Globalization.CultureInfo.InvariantCulture) + "]";
        if (possibleQuest == null)
        {
            unresolved.Add(new { kind = "worldQuestZoneQuestReference", source = sourceEvidence, sourceFieldPath = questPath, detail = "The possible world quest row is null." });
            quests.Add(new { sourceFieldPath = questPath, unavailable = "null authored world quest row" });
            continue;
        }
        quests.Add(new { sourceFieldPath = questPath, worldQuest = worldWorldQuestReference(possibleQuest) });
        if (possibleQuest.quest == null)
        {
            unresolved.Add(new { kind = "worldQuestCanonicalReference", source = sourceEvidence, sourceFieldPath = questPath + ".quest", worldQuestID = possibleQuest.ID, detail = "The authored pooled RPGWorldQuest has no RPGQuest reference." });
        }
    }
    object currentQuestObservation = null;
    try
    {
        var current = zone.CurrentQuest;
        currentQuestObservation = current == null ? (object)new { present = false } : new { present = true, worldQuest = worldWorldQuestReference(current) };
    }
    catch (System.Exception error)
    {
        unresolved.Add(new { kind = "worldQuestZoneCurrentObservation", source = sourceEvidence, detail = error.GetType().FullName + ": " + error.Message });
        currentQuestObservation = new { present = false, unavailable = "CurrentQuest observation threw" };
    }
    worldQuestZones.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        family = "worldQuestZone",
        role = "questLocation",
        roles = new[] { "questLocation" },
        roleSource = "WorldQuestZone owns a typed RPGWorldQuest or possibleQuests pool; GameObject names do not determine the role.",
        selectionRule = "Authored tooltip states that a non-empty possibleQuests pool supersedes worldQuest; runtime selection behavior is not verified by this probe.",
        worldQuest = zone.worldQuest == null ? null : (object)worldWorldQuestReference(zone.worldQuest),
        possibleQuestsAvailable = possible != null,
        possibleQuestCount = possible == null ? -1 : possibleCount,
        possibleQuests = quests,
        zoneRespawnCooldown = zone.zoneRespawnCooldown,
        currentQuestObservation = currentQuestObservation
    });
}

var worldPortals = UnityEngine.Object.FindObjectsOfType<Il2Cpp.QuestScenePortal>(true);
var worldPortalCount = worldPortals == null ? 0 : worldPortals.Length;
for (var index = 0; index < worldPortalCount; index++)
{
    var portal = worldPortals[index];
    if (portal == null)
    {
        unresolved.Add(new { kind = "questScenePortal", sourceIndex = index, detail = "FindObjectsOfType returned a null QuestScenePortal." });
        continue;
    }
    var sourceEvidence = worldSource(portal, "Il2Cpp.QuestScenePortal", index);
    var destination = portal.DestinationScene;
    var destinationScene = worldFindScene(destination);
    if (destinationScene == null)
    {
        unresolved.Add(new { kind = "transitionDestination", transitionKind = "questScenePortal", source = sourceEvidence, destinationScene = destination, detail = "DestinationScene does not resolve to an initialized RPGGameScene record." });
    }
    worldTransitions.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        transitionKind = "questScenePortal",
        role = "transition",
        roles = new[] { "transition" },
        roleSource = "QuestScenePortal.DestinationScene is the authored destination field; resolution uses exact RPGGameScene.entryName equality.",
        destinationSceneName = destination,
        destinationScene = destinationScene,
        destinationReferenceStatus = destinationScene == null ? "unresolved" : "resolved",
        destinationResolved = destinationScene != null
    });
}

var worldDungeonEntrances = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.DungeonEntranceTrigger>(true);
var worldDungeonEntranceCount = worldDungeonEntrances == null ? 0 : worldDungeonEntrances.Length;
for (var index = 0; index < worldDungeonEntranceCount; index++)
{
    var entrance = worldDungeonEntrances[index];
    if (entrance == null)
    {
        unresolved.Add(new { kind = "dungeonEntranceTrigger", sourceIndex = index, detail = "FindObjectsOfType returned a null DungeonEntranceTrigger." });
        continue;
    }
    var sourceEvidence = worldSource(entrance, "Il2CppBLINK.RPGBuilder.World.DungeonEntranceTrigger", index);
    var destinationScene = entrance.GameScene;
    if (destinationScene == null)
    {
        unresolved.Add(new { kind = "transitionDestination", transitionKind = "dungeonEntranceTrigger", source = sourceEvidence, detail = "GameScene reference is null." });
    }
    else if (worldDatabaseScenes == null || !worldDatabaseScenes.ContainsKey(destinationScene.ID) || worldDatabaseScenes[destinationScene.ID] == null)
    {
        unresolved.Add(new { kind = "transitionDestinationReference", transitionKind = "dungeonEntranceTrigger", source = sourceEvidence, destinationSceneID = destinationScene.ID, detail = worldDatabaseScenes == null ? "GameDatabase.GetGameScenes() was unavailable; the typed destination could not be verified." : "GameScene.ID does not resolve to a non-null GameDatabase.GameScenes record." });
    }
    worldTransitions.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        transitionKind = "dungeonEntranceTrigger",
        role = "transition",
        roles = new[] { "transition" },
        roleSource = "DungeonEntranceTrigger.GameScene is a typed RPGGameScene reference; the probe verifies its ID against GameDatabase.GameScenes.",
        destinationSceneName = destinationScene == null ? null : getEntryName(destinationScene),
        destinationScene = destinationScene == null ? null : (object)new { nativeId = destinationScene.ID, name = getEntryName(destinationScene), internalName = destinationScene.entryName, fileName = destinationScene.entryFileName },
        destinationReferenceStatus = destinationScene == null ? "unresolved" : (worldDatabaseScenes != null && worldDatabaseScenes.ContainsKey(destinationScene.ID) && worldDatabaseScenes[destinationScene.ID] != null ? "resolved" : "unresolved"),
        destinationResolved = destinationScene != null && worldDatabaseScenes != null && worldDatabaseScenes.ContainsKey(destinationScene.ID) && worldDatabaseScenes[destinationScene.ID] != null
    });
}

var worldMapZonesNative = UnityEngine.Object.FindObjectsOfType<Il2CppMapMinimap.MapZone>(true);
var worldMapZoneCount = worldMapZonesNative == null ? 0 : worldMapZonesNative.Length;
for (var index = 0; index < worldMapZoneCount; index++)
{
    var mapZone = worldMapZonesNative[index];
    if (mapZone == null)
    {
        unresolved.Add(new { kind = "mapZone", sourceIndex = index, detail = "FindObjectsOfType returned a null MapZone." });
        continue;
    }
    var sourceEvidence = worldSource(mapZone, "Il2CppMapMinimap.MapZone", index);
    var collider = mapZone.GetComponent<UnityEngine.BoxCollider>();
    var map = mapZone.map;
    if (collider == null)
    {
        unresolved.Add(new { kind = "mapZoneCollider", source = sourceEvidence, detail = "MapZone requires a BoxCollider, but no authored collider was found." });
    }
    object methodCalibration = null;
    var methodCalibrationError = (string)null;
    try
    {
        var center = mapZone.GetCenter();
        var extents = mapZone.GetExtents();
        var size = mapZone.GetSize();
        methodCalibration = new
        {
            center = new { x = center.x, y = center.y, z = center.z },
            extents = new { x = extents.x, y = extents.y },
            size = new { x = size.x, y = size.y },
            rotation = mapZone.GetRotation()
        };
    }
    catch (System.Exception error)
    {
        methodCalibrationError = error.GetType().FullName + ": " + error.Message;
        unresolved.Add(new { kind = "mapZoneCalibration", source = sourceEvidence, detail = methodCalibrationError });
    }
    if (map == null)
    {
        unresolved.Add(new { kind = "mapZoneTexture", source = sourceEvidence, detail = "MapZone.map is null." });
    }
    worldMapZones.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        zoneID = mapZone.zone_id,
        map = map == null ? null : (object)new { name = map.name, width = map.width, height = map.height, dimension = map.dimension, textureType = map.GetType().FullName },
        boxCollider = collider == null ? null : (object)new
        {
            center = new { x = collider.center.x, y = collider.center.y, z = collider.center.z },
            size = new { x = collider.size.x, y = collider.size.y, z = collider.size.z },
            boundsCenter = new { x = collider.bounds.center.x, y = collider.bounds.center.y, z = collider.bounds.center.z },
            boundsExtents = new { x = collider.bounds.extents.x, y = collider.bounds.extents.y, z = collider.bounds.extents.z }
        },
        calibration = methodCalibration,
        calibrationError = methodCalibrationError,
        captureBoundsValidated = false,
        captureBoundsNote = "MapZone bounds are calibration evidence only; they are not validated screenshot capture bounds."
    });
}

var worldRegionsNative = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder._THMSV.RPGBuilder.Scripts.World.Region>(true);
var worldRegionCount = worldRegionsNative == null ? 0 : worldRegionsNative.Length;
for (var index = 0; index < worldRegionCount; index++)
{
    var region = worldRegionsNative[index];
    if (region == null)
    {
        unresolved.Add(new { kind = "region", sourceIndex = index, detail = "FindObjectsOfType returned a null Region." });
        continue;
    }
    var sourceEvidence = worldSource(region, "Il2CppBLINK.RPGBuilder._THMSV.RPGBuilder.Scripts.World.Region", index);
    var template = region.RegionTemplate;
    if (template == null)
    {
        unresolved.Add(new { kind = "regionTemplateReference", source = sourceEvidence, detail = "The authored Region has no RegionTemplate reference." });
    }
    worldRegions.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        regionShape = new { value = (int)region.shapeType, name = region.shapeType.ToString() },
        regionTemplate = template == null ? null : (object)new { nativeId = template.ID, name = getEntryName(template), internalName = template.entryName, fileName = template.entryFileName },
        regionTemplateProjection = template == null ? null : (object)projectEntry(template),
        captureBoundsValidated = false
    });
}

// The game's own world map icons: MapMinimap.MapIcon components the scene authors under its
// "World map icons" object, one per town, fort, camp, dungeon entrance, or challenge stone. The
// icon's sprite names its kind; quest and world-quest icons are runtime state and are recorded
// with their kind so the pipeline can leave them out.
var mapIconKind = new System.Func<string, string>(sprite =>
{
    switch (sprite)
    {
        case "Icon_Town": return "town";
        case "Icon_Castle": return "fort";
        case "Icon_Camp": return "camp";
        case "Icon_Crown": return "dungeon";
        case "Icon_Runes": return "challengeStone";
        case "Icon_Quest": case "Icon_Question": case "Icon_fight": return "quest";
        case "Icon_Symbol": return "player";
        default: return sprite != null && System.Text.RegularExpressions.Regex.IsMatch(sprite, "^[0-9a-f]{8}-") ? "worldQuest" : "other";
    }
});
var worldMapIconsNative = UnityEngine.Object.FindObjectsOfType<Il2CppMapMinimap.MapIcon>(true);
var worldMapIconCount = worldMapIconsNative == null ? 0 : worldMapIconsNative.Length;
for (var index = 0; index < worldMapIconCount; index++)
{
    var icon = worldMapIconsNative[index];
    if (icon == null)
    {
        unresolved.Add(new { kind = "mapIcon", sourceIndex = index, detail = "FindObjectsOfType returned a null MapIcon." });
        continue;
    }
    var sourceEvidence = worldSource(icon, "Il2CppMapMinimap.MapIcon", index);
    UnityEngine.Vector3 iconWorld;
    try { iconWorld = icon.GetWorldPos(); } catch (System.Exception) { iconWorld = icon.transform.position; }
    var sprite = icon.icon == null ? null : icon.icon.name;
    worldMapIcons.Add(new
    {
        source = sourceEvidence,
        disposition = "extracted",
        iconKind = mapIconKind(sprite),
        sprite = sprite,
        title = string.IsNullOrWhiteSpace(icon.title) ? null : icon.title.Trim(),
        description = string.IsNullOrWhiteSpace(icon.desc) ? null : icon.desc.Trim(),
        mapIconType = new { value = (int)icon.type, name = icon.type.ToString() },
        position = new { x = iconWorld.x, y = iconWorld.y, z = iconWorld.z }
    });
}

var worldSourceTotal = new
{
    oreSpawners = worldOreSpawnerCount,
    interactableObjects = worldInteractableCount,
    interactiveNodes = worldNodeCount,
    chests = worldChestCount,
    worldQuestZones = worldQuestZoneCount,
    questScenePortals = worldPortalCount,
    dungeonEntranceTriggers = worldDungeonEntranceCount,
    craftingStations = worldCraftingStationCount,
    propertyForSaleSigns = worldPropertySignCount,
    heroicConsoles = worldHeroicConsoleCount,
    characterGraveyards = worldGraveyardCount,
    enhancedInteractableObjects = worldEnhancedInteractableCount,
    activeRequirements = worldActiveRequirementCount,
    timedActiveRequirements = worldTimedActiveRequirementCount,
    disableRequirements = worldDisableRequirementCount,
    randomActivators = worldRandomActivatorCount,
    interactiveZones = worldInteractiveZoneCount,
    mapZones = worldMapZoneCount,
    regions = worldRegionCount,
    mapIcons = worldMapIconCount
};
var worldExportedTotal = new
{
    resourceProducers = worldResourceProducers.Count,
    interactions = worldInteractions.Count,
    containers = worldContainers.Count,
    questZones = worldQuestZones.Count,
    transitions = worldTransitions.Count,
    services = worldServices.Count,
    conditionSources = worldConditionSources.Count,
    unsupportedSources = worldUnsupportedSources.Count,
    mapZones = worldMapZones.Count,
    regions = worldRegions.Count,
    mapIcons = worldMapIcons.Count
};

return new
{
    schemaVersion = "compendium.world-sources.v7",
    coverage = new
    {
        scope = "currently loaded Unity scenes and candidate prefab assets visible to the current process",
        fullGameCoverage = false,
        includesInactiveComponents = true,
        authoredCandidatesWithoutInstantiation = true,
        authoredCandidatesWithoutRolling = true,
        runtimeInstanceIdsOnlyObservation = true,
        componentIndexSemantics = "all-gameobject-components",
        traversalPerformed = false,
        mapZoneCaptureBoundsValidated = false,
        sourceSceneNativeIdRule = "GameState.CurrentGameScene.ID is emitted only when its authored scene name matches the observed Unity scene name.",
        unsupportedFamiliesRemainVisible = true,
        sourceDispositionVocabulary = new[] { "extracted", "unreachable", "unused", "unsupported", "failed" },
        note = "A successful probe is not a complete-build claim. Sources outside loaded scenes or unavailable streamed content remain unresolved until traversal extracts them."
    },
    nativeNamingUncertainties = new[]
    {
        "OreSpawner.MiningSkillID is the recovered field name; its tooltip mentions Mining and Herbalism while live content also uses Fishing, so the export labels it gatheringSkillID without renaming the native field.",
        "InteractableObjectActionType.Chest stores an RPGLootTable reference in InteractableObjectAction.LootTable; it does not name a Chest component.",
        "The recovered Region component is namespaced BLINK.RPGBuilder._THMSV.RPGBuilder.Scripts.World.Region; this probe retains that concrete runtime type name.",
        "MapZone.map is a Texture and MapZone methods provide calibration values, but the declarations do not establish that its collider bounds are screenshot capture bounds.",
        "CraftingStation.station and PropertyForSaleSign.property are typed service references. This probe exports their authored records and does not infer service roles from object names.",
        "ActiveRequirement, TimedActiveRequirement, DisableRequirement, and EnhancedInteractableObject retain requirement predicates as condition evidence. Their runtime target state changes are not evaluated.",
        "RandomActivator, InteractiveZone, and HeroicConsole remain explicit unsupported source families because their runtime behavior is not a stable typed placement or relationship in this probe."
    },
    resourceProducers = worldResourceProducers,
    interactions = worldInteractions,
    containers = worldContainers,
    questZones = worldQuestZones,
    transitions = worldTransitions,
    mapZones = worldMapZones,
    regions = worldRegions,
    mapIcons = worldMapIcons,
    services = worldServices,
    conditionSources = worldConditionSources,
    unsupportedSources = worldUnsupportedSources,
    totals = new
    {
        source = worldSourceTotal,
        exported = worldExportedTotal,
        unresolved = unresolved.Count
    },
    unresolved = unresolved
};
