var unresolved = new System.Collections.Generic.List<object>();
var invariant = System.Globalization.CultureInfo.InvariantCulture;

var currentGameScene = (Il2Cpp.RPGGameScene)null;
var currentGameSceneError = (string)null;
try
{
    currentGameScene = Il2Cpp.GameState.CurrentGameScene;
}
catch (System.Exception error)
{
    currentGameSceneError = error.GetType().FullName + ": " + error.Message;
    unresolved.Add(new { kind = "currentGameScene", sourceFieldPath = "GameState.CurrentGameScene", detail = currentGameSceneError });
}

var activeUnityScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var activeUnityScenePath = activeUnityScene.path;
var currentGameSceneNativeId = currentGameScene == null ? (int?)null : (int?)currentGameScene.ID;
var currentGameSceneIsActive = currentGameScene != null && activeUnityScene.isLoaded && activeUnityScene.name == currentGameScene.entryName;

var getEntryName = new System.Func<Il2Cpp.RPGBuilderDatabaseEntry, string>((entry) =>
{
    if (entry == null)
    {
        return null;
    }
    if (entry.entryDisplayName != null && entry.entryDisplayName.Length > 0)
    {
        return entry.entryDisplayName;
    }
    if (entry.entryName != null && entry.entryName.Length > 0)
    {
        return entry.entryName;
    }
    if (entry.entryFileName != null && entry.entryFileName.Length > 0)
    {
        return entry.entryFileName;
    }
    return null;
});

var projectSceneFields = new System.Func<Il2Cpp.RPGGameScene, object>((scene) =>
{
    if (scene == null)
    {
        return null;
    }
    var sceneMapBounds = scene.mapBounds;
    var sceneMapSize = scene.mapSize;
    return new
    {
        ID = scene.ID,
        entryName = scene.entryName,
        entryFileName = scene.entryFileName,
        entryDisplayName = scene.entryDisplayName,
        entryDescription = scene.entryDescription,
        legacyName = scene._name,
        legacyFileName = scene._fileName,
        legacyDisplayName = scene.displayName,
        legacyDescription = scene.description,
        loadingBGKey = scene.loadingBGKey,
        minimapImageKey = scene.minimapImageKey,
        mapBounds = new
        {
            center = new { x = sceneMapBounds.center.x, y = sceneMapBounds.center.y, z = sceneMapBounds.center.z },
            size = new { x = sceneMapBounds.size.x, y = sceneMapBounds.size.y, z = sceneMapBounds.size.z },
            extents = new { x = sceneMapBounds.extents.x, y = sceneMapBounds.extents.y, z = sceneMapBounds.extents.z }
        },
        mapSize = new { x = sceneMapSize.x, y = sceneMapSize.y },
        startPositionID = scene.startPositionID,
        isProceduralScene = scene.isProceduralScene,
        SpawnPointName = scene.SpawnPointName,
        AlwaysSpawnAtPoint = scene.AlwaysSpawnAtPoint,
        includedInAdventureGuide = scene.includedInAdventureGuide,
        DungeonLevelMin = scene.DungeonLevelMin,
        DungeonLevelMax = scene.DungeonLevelMax,
        ZoneScalingMinLevel = scene.ZoneScalingMinLevel,
        ZoneScalingMaxLevel = scene.ZoneScalingMaxLevel,
        adventureGuideImageKey = scene.adventureGuideImageKey,
        adventureGuideDescription = scene.adventureGuideDescription,
        regionCount = scene.regions == null ? -1 : scene.regions.Count,
        adventureGuideBossCount = scene.adventureGuideBosses == null ? -1 : scene.adventureGuideBosses.Count
    };
});

var projectTypedScene = new System.Func<Il2Cpp.RPGGameScene, object>((scene) =>
{
    if (scene == null)
    {
        return null;
    }
    return new
    {
        nativeId = scene.ID,
        name = getEntryName(scene),
        internalName = scene.entryName,
        fileName = scene.entryFileName,
        entryDisplayName = scene.entryDisplayName,
        entryDescription = scene.entryDescription
    };
});

var sceneEvidence = new System.Func<UnityEngine.SceneManagement.Scene, object>((scene) =>
{
    var currentMatch = currentGameSceneIsActive && scene.name == currentGameScene.entryName && scene.path == activeUnityScenePath;
    return new
    {
        name = scene.name,
        path = scene.path,
        buildIndex = scene.buildIndex,
        handle = scene.handle,
        isLoaded = scene.isLoaded,
        rootCount = scene.rootCount,
        currentGameSceneNativeId = currentMatch ? currentGameSceneNativeId : (int?)null,
        nativeIdMatchBasis = currentMatch ? "GameState.CurrentGameScene.ID with exact RPGGameScene.entryName and Unity Scene.path" : null
    };
});

var loadedScenes = new System.Collections.Generic.List<object>();
var loadedScenePaths = new System.Collections.Generic.List<string>();
var loadedSceneCount = -1;
var loadedSceneQueryError = (string)null;
try
{
    loadedSceneCount = UnityEngine.SceneManagement.SceneManager.sceneCount;
    for (var loadedIndex = 0; loadedIndex < loadedSceneCount; loadedIndex++)
    {
        var loadedScene = UnityEngine.SceneManagement.SceneManager.GetSceneAt(loadedIndex);
        loadedScenePaths.Add(loadedScene.path);
        loadedScenes.Add(new
        {
            sourceFieldPath = "SceneManager.loadedScenes[" + loadedIndex.ToString(invariant) + "]",
            owner = new { nativeType = "UnityEngine.SceneManagement.SceneManager", collection = "loadedScenes", index = loadedIndex },
            disposition = loadedScene.isLoaded ? "currently-loaded" : "not-traversed",
            scene = sceneEvidence(loadedScene)
        });
    }
}
catch (System.Exception error)
{
    loadedSceneQueryError = error.GetType().FullName + ": " + error.Message;
    unresolved.Add(new { kind = "loadedScenes", sourceFieldPath = "SceneManager.loadedScenes", detail = loadedSceneQueryError });
}

var buildScenes = new System.Collections.Generic.List<object>();
var buildSceneCount = -1;
var buildSceneCountError = (string)null;
try
{
    buildSceneCount = UnityEngine.SceneManagement.SceneManager.sceneCountInBuildSettings;
}
catch (System.Exception error)
{
    buildSceneCountError = error.GetType().FullName + ": " + error.Message;
    unresolved.Add(new { kind = "buildScenes", sourceFieldPath = "SceneManager.sceneCountInBuildSettings", detail = buildSceneCountError });
}
if (buildSceneCount >= 0)
{
    for (var buildIndex = 0; buildIndex < buildSceneCount; buildIndex++)
    {
        var scenePath = (string)null;
        var scenePathError = (string)null;
        try
        {
            scenePath = UnityEngine.SceneManagement.SceneUtility.GetScenePathByBuildIndex(buildIndex);
        }
        catch (System.Exception error)
        {
            scenePathError = error.GetType().FullName + ": " + error.Message;
            unresolved.Add(new { kind = "buildScenePath", sourceFieldPath = "SceneUtility.GetScenePathByBuildIndex(" + buildIndex.ToString(invariant) + ")", buildIndex = buildIndex, detail = scenePathError });
        }

        object sceneManagerRecord = null;
        var sceneManagerError = (string)null;
        var sceneManagerLoaded = false;
        try
        {
            var managerScene = UnityEngine.SceneManagement.SceneManager.GetSceneByBuildIndex(buildIndex);
            sceneManagerLoaded = managerScene.isLoaded;
            sceneManagerRecord = new
            {
                name = managerScene.name,
                path = managerScene.path,
                buildIndex = managerScene.buildIndex,
                handle = managerScene.handle,
                isLoaded = managerScene.isLoaded,
                rootCount = managerScene.rootCount
            };
        }
        catch (System.Exception error)
        {
            sceneManagerError = error.GetType().FullName + ": " + error.Message;
            unresolved.Add(new { kind = "buildSceneManagerRecord", sourceFieldPath = "SceneManager.GetSceneByBuildIndex(" + buildIndex.ToString(invariant) + ")", buildIndex = buildIndex, detail = sceneManagerError });
        }

        var isCurrentlyLoaded = sceneManagerLoaded && scenePath != null && sceneManagerRecord != null && loadedScenePaths.Contains(scenePath);
        buildScenes.Add(new
        {
            sourceFieldPath = "SceneManager.buildSettings[" + buildIndex.ToString(invariant) + "]",
            owner = new { nativeType = "UnityEngine.SceneManagement.SceneManager", collection = "buildSettings", index = buildIndex },
            disposition = isCurrentlyLoaded ? "currently-loaded" : "not-traversed",
            buildIndex = buildIndex,
            path = scenePath,
            pathError = scenePathError,
            sceneManager = sceneManagerRecord,
            sceneManagerError = sceneManagerError,
            exactPathLoadedEvidence = isCurrentlyLoaded ? "SceneManager.GetSceneByBuildIndex path is present in SceneManager.loadedScenes." : null
        });
    }
}

var database = (Il2CppBLINK.RPGBuilder.Managers.GameDatabase)null;
var databaseError = (string)null;
try
{
    database = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
}
catch (System.Exception error)
{
    databaseError = error.GetType().FullName + ": " + error.Message;
    unresolved.Add(new { kind = "gameDatabase", sourceFieldPath = "GameDatabase.Instance", detail = databaseError });
}

var databaseScenes = (Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGGameScene>)null;
var databaseScenesError = (string)null;
var databaseWorldPositions = (Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGWorldPosition>)null;
var databaseWorldPositionsError = (string)null;
var databaseTasks = (Il2CppSystem.Collections.Generic.Dictionary<int, Il2Cpp.RPGTask>)null;
var databaseTasksError = (string)null;
if (database != null)
{
    try
    {
        databaseScenes = database.GetGameScenes();
    }
    catch (System.Exception error)
    {
        databaseScenesError = error.GetType().FullName + ": " + error.Message;
        unresolved.Add(new { kind = "databaseScenes", sourceFieldPath = "GameDatabase.GetGameScenes()", detail = databaseScenesError });
    }
    try
    {
        databaseWorldPositions = database.GetWorldPositions();
    }
    catch (System.Exception error)
    {
        databaseWorldPositionsError = error.GetType().FullName + ": " + error.Message;
        unresolved.Add(new { kind = "worldPositions", sourceFieldPath = "GameDatabase.GetWorldPositions()", detail = databaseWorldPositionsError });
    }
    try
    {
        databaseTasks = database.GetTasks();
    }
    catch (System.Exception error)
    {
        databaseTasksError = error.GetType().FullName + ": " + error.Message;
        unresolved.Add(new { kind = "tasks", sourceFieldPath = "GameDatabase.GetTasks()", detail = databaseTasksError });
    }
}

var databaseSceneRows = new System.Collections.Generic.List<object>();
if (databaseScenes != null)
{
    foreach (var scenePair in databaseScenes)
    {
        var scene = scenePair.Value;
        var sourceFieldPath = "GameDatabase.GameScenes[" + scenePair.Key.ToString(invariant) + "]";
        if (scene == null)
        {
            unresolved.Add(new { kind = "databaseScene", sourceFieldPath = sourceFieldPath, sourceKey = scenePair.Key, detail = "The native GameDatabase scene record is null." });
            databaseSceneRows.Add(new
            {
                sourceFieldPath = sourceFieldPath,
                owner = new { nativeType = "Il2Cpp.RPGGameScene", dictionary = "GameDatabase.GameScenes", sourceKey = scenePair.Key },
                sourceKey = scenePair.Key,
                nativeId = (int?)null,
                disposition = "not-traversed",
                unavailable = "null RPGGameScene record"
            });
            continue;
        }
        var currentMatch = currentGameSceneIsActive && scene.ID == currentGameSceneNativeId;
        databaseSceneRows.Add(new
        {
            sourceFieldPath = sourceFieldPath,
            owner = new { nativeType = "Il2Cpp.RPGGameScene", dictionary = "GameDatabase.GameScenes", sourceKey = scenePair.Key },
            sourceKey = scenePair.Key,
            nativeId = scene.ID,
            disposition = currentMatch ? "currently-loaded" : "not-traversed",
            reachabilityEvidence = currentMatch ? "GameState.CurrentGameScene.ID equals this RPGGameScene.ID." : "No traversal or scene-load operation was performed for this RPGGameScene.",
            fields = projectSceneFields(scene)
        });
    }
}

var findDatabaseSceneByEntryName = new System.Func<string, object>((destinationName) =>
{
    if (destinationName == null || destinationName.Length == 0 || databaseScenes == null)
    {
        return null;
    }
    foreach (var scenePair in databaseScenes)
    {
        var scene = scenePair.Value;
        if (scene != null && scene.entryName != null && scene.entryName == destinationName)
        {
            return new
            {
                sourceKey = scenePair.Key,
                nativeId = scene.ID,
                name = getEntryName(scene),
                internalName = scene.entryName,
                fileName = scene.entryFileName,
                matchBasis = "exact RPGGameScene.entryName comparison"
            };
        }
    }
    return null;
});

var findDatabaseSceneByNativeId = new System.Func<int, object>((destinationId) =>
{
    if (databaseScenes == null)
    {
        return null;
    }
    foreach (var scenePair in databaseScenes)
    {
        var scene = scenePair.Value;
        if (scene != null && scene.ID == destinationId)
        {
            return new
            {
                sourceKey = scenePair.Key,
                nativeId = scene.ID,
                name = getEntryName(scene),
                internalName = scene.entryName,
                fileName = scene.entryFileName,
                matchBasis = "exact RPGGameScene.ID comparison"
            };
        }
    }
    return null;
});

var findDatabaseWorldPositionByNativeId = new System.Func<int, object>((destinationId) =>
{
    if (databaseWorldPositions == null)
    {
        return null;
    }
    foreach (var positionPair in databaseWorldPositions)
    {
        var position = positionPair.Value;
        if (position != null && position.ID == destinationId)
        {
            return new
            {
                sourceKey = positionPair.Key,
                nativeId = position.ID,
                entryName = position.entryName,
                entryFileName = position.entryFileName,
                entryDisplayName = position.entryDisplayName,
                position = new { x = position.position.x, y = position.position.y, z = position.position.z },
                matchBasis = "exact RPGWorldPosition.ID comparison"
            };
        }
    }
    return null;
});

var referencedDestinations = new System.Collections.Generic.List<object>();
var gameSceneStartPositionReferenceCount = 0;
if (databaseScenes != null)
{
    foreach (var scenePair in databaseScenes)
    {
        var scene = scenePair.Value;
        if (scene == null)
        {
            continue;
        }
        var sourceFieldPath = "GameDatabase.GameScenes[" + scenePair.Key.ToString(invariant) + "].startPositionID";
        var startPositionID = scene.startPositionID;
        var hasPositionReference = startPositionID >= 0;
        var resolvedPosition = hasPositionReference ? findDatabaseWorldPositionByNativeId(startPositionID) : null;
        gameSceneStartPositionReferenceCount++;
        if (hasPositionReference && resolvedPosition == null)
        {
            unresolved.Add(new
            {
                kind = "gameSceneStartPosition",
                sourceFieldPath = sourceFieldPath,
                ownerNativeId = scene.ID,
                targetNativeId = startPositionID,
                detail = "RPGGameScene.startPositionID has no matching RPGWorldPosition.ID."
            });
        }
        referencedDestinations.Add(new
        {
            sourceFieldPath = sourceFieldPath,
            owner = new { nativeType = "Il2Cpp.RPGGameScene", dictionary = "GameDatabase.GameScenes", sourceKey = scenePair.Key, nativeId = scene.ID },
            sourceKey = scenePair.Key,
            ownerNativeId = scene.ID,
            destinationType = "gameScene.startPositionID",
            targetNativeId = startPositionID,
            disposition = hasPositionReference ? "not-traversed" : "unused",
            referenceStatus = hasPositionReference ? (resolvedPosition == null ? "unresolved" : "resolved-by-exact-worldPosition-ID") : "negative-sentinel",
            destination = resolvedPosition,
            destinationScene = (object)null,
            resolutionEvidence = hasPositionReference ? "Exact RPGWorldPosition.ID comparison; this coordinate reference does not establish scene reachability." : "RPGGameScene.startPositionID is a negative sentinel."
        });
    }
}

var worldPositionReferenceCount = 0;
if (databaseWorldPositions != null)
{
    foreach (var positionPair in databaseWorldPositions)
    {
        var position = positionPair.Value;
        var sourceFieldPath = "GameDatabase.WorldPositions[" + positionPair.Key.ToString(invariant) + "]";
        worldPositionReferenceCount++;
        if (position == null)
        {
            unresolved.Add(new { kind = "worldPosition", sourceFieldPath = sourceFieldPath, sourceKey = positionPair.Key, detail = "The native RPGWorldPosition record is null." });
            referencedDestinations.Add(new
            {
                sourceFieldPath = sourceFieldPath,
                owner = new { nativeType = "Il2Cpp.RPGWorldPosition", dictionary = "GameDatabase.WorldPositions", sourceKey = positionPair.Key },
                sourceKey = positionPair.Key,
                nativeId = (int?)null,
                destinationType = "worldPosition",
                disposition = "not-traversed",
                referenceStatus = "null-record",
                destination = (object)null,
                destinationScene = (object)null,
                unavailable = "null RPGWorldPosition record"
            });
            continue;
        }
        unresolved.Add(new
        {
            kind = "worldPositionSceneDestination",
            sourceFieldPath = sourceFieldPath,
            ownerNativeId = position.ID,
            detail = "RPGWorldPosition declares position, useRotation, and rotation, but no scene ID or scene-name field. A scene destination cannot be inferred."
        });
        referencedDestinations.Add(new
        {
            sourceFieldPath = sourceFieldPath,
            owner = new { nativeType = "Il2Cpp.RPGWorldPosition", dictionary = "GameDatabase.WorldPositions", sourceKey = positionPair.Key, nativeId = position.ID },
            sourceKey = positionPair.Key,
            nativeId = position.ID,
            destinationType = "worldPosition",
            disposition = "not-traversed",
            referenceStatus = "typed-position-without-scene-field",
            target = new
            {
                nativeId = position.ID,
                entryName = position.entryName,
                entryFileName = position.entryFileName,
                entryDisplayName = position.entryDisplayName,
                legacyName = position._name,
                legacyFileName = position._fileName,
                displayName = position.displayName,
                position = new { x = position.position.x, y = position.position.y, z = position.position.z },
                useRotation = position.useRotation,
                rotation = new { x = position.rotation.x, y = position.rotation.y, z = position.rotation.z }
            },
            destination = (object)null,
            destinationScene = (object)null,
            sceneResolution = new { status = "unsupported", reason = "No scene field exists in the recovered RPGWorldPosition declaration." }
        });
    }
}

var taskSceneReferenceCount = 0;
if (databaseTasks != null)
{
    foreach (var taskPair in databaseTasks)
    {
        var task = taskPair.Value;
        var sourceFieldPath = "GameDatabase.Tasks[" + taskPair.Key.ToString(invariant) + "].sceneName";
        var ownerNativeId = task == null ? (int?)null : (int?)task.ID;
        taskSceneReferenceCount++;
        if (task == null)
        {
            unresolved.Add(new { kind = "task", sourceFieldPath = "GameDatabase.Tasks[" + taskPair.Key.ToString(invariant) + "]", sourceKey = taskPair.Key, detail = "The native RPGTask record is null." });
            referencedDestinations.Add(new
            {
                sourceFieldPath = sourceFieldPath,
                owner = new { nativeType = "Il2Cpp.RPGTask", dictionary = "GameDatabase.Tasks", sourceKey = taskPair.Key, nativeId = ownerNativeId },
                sourceKey = taskPair.Key,
                ownerNativeId = ownerNativeId,
                destinationType = "task.sceneName",
                disposition = "not-traversed",
                referenceStatus = "null-task-record",
                rawSceneName = (string)null,
                destination = (object)null,
                destinationScene = (object)null
            });
            continue;
        }

        var rawSceneName = task.sceneName;
        var hasSceneReference = rawSceneName != null && rawSceneName.Length > 0;
        var resolvedScene = hasSceneReference ? findDatabaseSceneByEntryName(rawSceneName) : null;
        if (hasSceneReference && resolvedScene == null)
        {
            unresolved.Add(new
            {
                kind = "taskSceneDestination",
                sourceFieldPath = sourceFieldPath,
                ownerNativeId = task.ID,
                rawSceneName = rawSceneName,
                detail = "RPGTask.sceneName does not resolve by exact RPGGameScene.entryName comparison. No display-name or path guess was used."
            });
        }
        referencedDestinations.Add(new
        {
            sourceFieldPath = sourceFieldPath,
            owner = new { nativeType = "Il2Cpp.RPGTask", dictionary = "GameDatabase.Tasks", sourceKey = taskPair.Key, nativeId = task.ID },
            sourceKey = taskPair.Key,
            ownerNativeId = task.ID,
            destinationType = "task.sceneName",
            taskType = new { value = (int)task.taskType, name = task.taskType.ToString() },
            disposition = hasSceneReference ? "not-traversed" : "unused",
            referenceStatus = hasSceneReference ? (resolvedScene == null ? "unresolved" : "resolved-by-exact-entryName") : "null-or-empty",
            rawSceneName = rawSceneName,
            destination = resolvedScene,
            destinationScene = resolvedScene,
            resolutionEvidence = hasSceneReference ? "Exact RPGGameScene.entryName comparison; task values are not treated as reachability evidence." : "RPGTask.sceneName is null or empty."
        });
    }
}

var componentFamilies = new System.Collections.Generic.List<object>();
var nativeComponentFamilyQueryCount = 0;
var addComponentFamily = new System.Action<string, string, int, int, string, string>((family, runtimeType, activeCount, includeInactiveCount, activeError, includeInactiveError) =>
{
    nativeComponentFamilyQueryCount++;
    var activeSourceFieldPath = "FindObjectsOfType<" + runtimeType + ">(includeInactive: false)";
    var includeInactiveSourceFieldPath = "FindObjectsOfType<" + runtimeType + ">(includeInactive: true)";
    if (activeError != null)
    {
        unresolved.Add(new { kind = "componentFamily", sourceFieldPath = activeSourceFieldPath, runtimeType = runtimeType, detail = activeError });
    }
    if (includeInactiveError != null)
    {
        unresolved.Add(new { kind = "componentFamily", sourceFieldPath = includeInactiveSourceFieldPath, runtimeType = runtimeType, detail = includeInactiveError });
    }
    componentFamilies.Add(new
    {
        sourceFieldPath = includeInactiveError == null ? includeInactiveSourceFieldPath : activeSourceFieldPath,
        owner = new { nativeType = "UnityEngine.Object", query = "FindObjectsOfType" },
        family = family,
        runtimeType = runtimeType,
        disposition = includeInactiveError == null && includeInactiveCount >= 0 ? "currently-loaded" : "unsupported",
        activeCount = activeCount,
        includeInactiveCount = includeInactiveCount,
        activeQueryError = activeError,
        includeInactiveQueryError = includeInactiveError,
        includesInactive = true
    });
});

var npcSpawnerActive = -1;
var npcSpawnerAll = -1;
var npcSpawnerActiveError = (string)null;
var npcSpawnerAllError = (string)null;
try { npcSpawnerActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.NPCSpawner>().Length; } catch (System.Exception error) { npcSpawnerActiveError = error.GetType().FullName + ": " + error.Message; }
try { npcSpawnerAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.NPCSpawner>(true).Length; } catch (System.Exception error) { npcSpawnerAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("npcSpawner", "Il2CppBLINK.RPGBuilder.AI.NPCSpawner", npcSpawnerActive, npcSpawnerAll, npcSpawnerActiveError, npcSpawnerAllError);

var adventurerPopulationManagerActive = -1;
var adventurerPopulationManagerAll = -1;
var adventurerPopulationManagerActiveError = (string)null;
var adventurerPopulationManagerAllError = (string)null;
try { adventurerPopulationManagerActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.AdventurerPopulationManager>().Length; } catch (System.Exception error) { adventurerPopulationManagerActiveError = error.GetType().FullName + ": " + error.Message; }
try { adventurerPopulationManagerAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.AdventurerPopulationManager>(true).Length; } catch (System.Exception error) { adventurerPopulationManagerAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("adventurerPopulationManager", "Il2CppBLINK.RPGBuilder.AI.AdventurerPopulationManager", adventurerPopulationManagerActive, adventurerPopulationManagerAll, adventurerPopulationManagerActiveError, adventurerPopulationManagerAllError);

var adventurerSpawnZoneActive = -1;
var adventurerSpawnZoneAll = -1;
var adventurerSpawnZoneActiveError = (string)null;
var adventurerSpawnZoneAllError = (string)null;
try { adventurerSpawnZoneActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.AdventurerSpawnZone>().Length; } catch (System.Exception error) { adventurerSpawnZoneActiveError = error.GetType().FullName + ": " + error.Message; }
try { adventurerSpawnZoneAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.AdventurerSpawnZone>(true).Length; } catch (System.Exception error) { adventurerSpawnZoneAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("adventurerSpawnZone", "Il2CppBLINK.RPGBuilder.AI.AdventurerSpawnZone", adventurerSpawnZoneActive, adventurerSpawnZoneAll, adventurerSpawnZoneActiveError, adventurerSpawnZoneAllError);

var interactableActive = -1;
var interactableAll = -1;
var interactableActiveError = (string)null;
var interactableAllError = (string)null;
try { interactableActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractableObject>().Length; } catch (System.Exception error) { interactableActiveError = error.GetType().FullName + ": " + error.Message; }
try { interactableAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractableObject>(true).Length; } catch (System.Exception error) { interactableAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("interactableObject", "Il2CppBLINK.RPGBuilder.World.InteractableObject", interactableActive, interactableAll, interactableActiveError, interactableAllError);

var interactiveNodeActive = -1;
var interactiveNodeAll = -1;
var interactiveNodeActiveError = (string)null;
var interactiveNodeAllError = (string)null;
try { interactiveNodeActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractiveNode>().Length; } catch (System.Exception error) { interactiveNodeActiveError = error.GetType().FullName + ": " + error.Message; }
try { interactiveNodeAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractiveNode>(true).Length; } catch (System.Exception error) { interactiveNodeAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("interactiveNode", "Il2CppBLINK.RPGBuilder.World.InteractiveNode", interactiveNodeActive, interactiveNodeAll, interactiveNodeActiveError, interactiveNodeAllError);

var chestActive = -1;
var chestAll = -1;
var chestActiveError = (string)null;
var chestAllError = (string)null;
try { chestActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.Chest>().Length; } catch (System.Exception error) { chestActiveError = error.GetType().FullName + ": " + error.Message; }
try { chestAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.Chest>(true).Length; } catch (System.Exception error) { chestAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("chest", "Il2CppBLINK.RPGBuilder.World.Chest", chestActive, chestAll, chestActiveError, chestAllError);

var craftingStationActive = -1;
var craftingStationAll = -1;
var craftingStationActiveError = (string)null;
var craftingStationAllError = (string)null;
try { craftingStationActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.CraftingStation>().Length; } catch (System.Exception error) { craftingStationActiveError = error.GetType().FullName + ": " + error.Message; }
try { craftingStationAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.CraftingStation>(true).Length; } catch (System.Exception error) { craftingStationAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("craftingStation", "Il2CppBLINK.RPGBuilder.World.CraftingStation", craftingStationActive, craftingStationAll, craftingStationActiveError, craftingStationAllError);

var propertyForSaleSignActive = -1;
var propertyForSaleSignAll = -1;
var propertyForSaleSignActiveError = (string)null;
var propertyForSaleSignAllError = (string)null;
try { propertyForSaleSignActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.PropertyForSaleSign>().Length; } catch (System.Exception error) { propertyForSaleSignActiveError = error.GetType().FullName + ": " + error.Message; }
try { propertyForSaleSignAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.PropertyForSaleSign>(true).Length; } catch (System.Exception error) { propertyForSaleSignAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("propertyForSaleSign", "Il2CppBLINK.RPGBuilder.World.PropertyForSaleSign", propertyForSaleSignActive, propertyForSaleSignAll, propertyForSaleSignActiveError, propertyForSaleSignAllError);
var corruptionAltarActive = -1;
var corruptionAltarAll = -1;
var corruptionAltarActiveError = (string)null;
var corruptionAltarAllError = (string)null;
try { corruptionAltarActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.CorruptionAltar>().Length; } catch (System.Exception error) { corruptionAltarActiveError = error.GetType().FullName + ": " + error.Message; }
try { corruptionAltarAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.CorruptionAltar>(true).Length; } catch (System.Exception error) { corruptionAltarAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("corruptionAltar", "Il2CppBLINK.RPGBuilder.World.CorruptionAltar", corruptionAltarActive, corruptionAltarAll, corruptionAltarActiveError, corruptionAltarAllError);
var interactableTriggerActive = -1;
var interactableTriggerAll = -1;
var interactableTriggerActiveError = (string)null;
var interactableTriggerAllError = (string)null;
try { interactableTriggerActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractableTriggerObject>().Length; } catch (System.Exception error) { interactableTriggerActiveError = error.GetType().FullName + ": " + error.Message; }
try { interactableTriggerAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractableTriggerObject>(true).Length; } catch (System.Exception error) { interactableTriggerAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("interactableTrigger", "Il2CppBLINK.RPGBuilder.World.InteractableTriggerObject", interactableTriggerActive, interactableTriggerAll, interactableTriggerActiveError, interactableTriggerAllError);
var storageContainerActive = -1;
var storageContainerAll = -1;
var storageContainerActiveError = (string)null;
var storageContainerAllError = (string)null;
try { storageContainerActive = UnityEngine.Object.FindObjectsOfType<Il2Cpp.ContainerObject>().Length; } catch (System.Exception error) { storageContainerActiveError = error.GetType().FullName + ": " + error.Message; }
try { storageContainerAll = UnityEngine.Object.FindObjectsOfType<Il2Cpp.ContainerObject>(true).Length; } catch (System.Exception error) { storageContainerAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("storageContainer", "Il2Cpp.ContainerObject", storageContainerActive, storageContainerAll, storageContainerActiveError, storageContainerAllError);

var heroicConsoleActive = -1;
var heroicConsoleAll = -1;
var heroicConsoleActiveError = (string)null;
var heroicConsoleAllError = (string)null;
try { heroicConsoleActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.HeroicConsole>().Length; } catch (System.Exception error) { heroicConsoleActiveError = error.GetType().FullName + ": " + error.Message; }
try { heroicConsoleAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.HeroicConsole>(true).Length; } catch (System.Exception error) { heroicConsoleAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("heroicConsole", "Il2CppBLINK.RPGBuilder.World.HeroicConsole", heroicConsoleActive, heroicConsoleAll, heroicConsoleActiveError, heroicConsoleAllError);

var characterGraveyardActive = -1;
var characterGraveyardAll = -1;
var characterGraveyardActiveError = (string)null;
var characterGraveyardAllError = (string)null;
try { characterGraveyardActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.CharacterGraveyard>().Length; } catch (System.Exception error) { characterGraveyardActiveError = error.GetType().FullName + ": " + error.Message; }
try { characterGraveyardAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.CharacterGraveyard>(true).Length; } catch (System.Exception error) { characterGraveyardAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("characterGraveyard", "Il2CppBLINK.RPGBuilder.World.CharacterGraveyard", characterGraveyardActive, characterGraveyardAll, characterGraveyardActiveError, characterGraveyardAllError);

var enhancedInteractableObjectActive = -1;
var enhancedInteractableObjectAll = -1;
var enhancedInteractableObjectActiveError = (string)null;
var enhancedInteractableObjectAllError = (string)null;
try { enhancedInteractableObjectActive = UnityEngine.Object.FindObjectsOfType<Il2Cpp.EnhancedInteractableObject>().Length; } catch (System.Exception error) { enhancedInteractableObjectActiveError = error.GetType().FullName + ": " + error.Message; }
try { enhancedInteractableObjectAll = UnityEngine.Object.FindObjectsOfType<Il2Cpp.EnhancedInteractableObject>(true).Length; } catch (System.Exception error) { enhancedInteractableObjectAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("enhancedInteractableObject", "Il2Cpp.EnhancedInteractableObject", enhancedInteractableObjectActive, enhancedInteractableObjectAll, enhancedInteractableObjectActiveError, enhancedInteractableObjectAllError);

var activeRequirementActive = -1;
var activeRequirementAll = -1;
var activeRequirementActiveError = (string)null;
var activeRequirementAllError = (string)null;
try { activeRequirementActive = UnityEngine.Object.FindObjectsOfType<Il2Cpp.ActiveRequirement>().Length; } catch (System.Exception error) { activeRequirementActiveError = error.GetType().FullName + ": " + error.Message; }
try { activeRequirementAll = UnityEngine.Object.FindObjectsOfType<Il2Cpp.ActiveRequirement>(true).Length; } catch (System.Exception error) { activeRequirementAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("activeRequirement", "Il2Cpp.ActiveRequirement", activeRequirementActive, activeRequirementAll, activeRequirementActiveError, activeRequirementAllError);

var timedActiveRequirementActive = -1;
var timedActiveRequirementAll = -1;
var timedActiveRequirementActiveError = (string)null;
var timedActiveRequirementAllError = (string)null;
try { timedActiveRequirementActive = UnityEngine.Object.FindObjectsOfType<Il2Cpp.TimedActiveRequirement>().Length; } catch (System.Exception error) { timedActiveRequirementActiveError = error.GetType().FullName + ": " + error.Message; }
try { timedActiveRequirementAll = UnityEngine.Object.FindObjectsOfType<Il2Cpp.TimedActiveRequirement>(true).Length; } catch (System.Exception error) { timedActiveRequirementAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("timedActiveRequirement", "Il2Cpp.TimedActiveRequirement", timedActiveRequirementActive, timedActiveRequirementAll, timedActiveRequirementActiveError, timedActiveRequirementAllError);

var disableRequirementActive = -1;
var disableRequirementAll = -1;
var disableRequirementActiveError = (string)null;
var disableRequirementAllError = (string)null;
try { disableRequirementActive = UnityEngine.Object.FindObjectsOfType<Il2Cpp.DisableRequirement>().Length; } catch (System.Exception error) { disableRequirementActiveError = error.GetType().FullName + ": " + error.Message; }
try { disableRequirementAll = UnityEngine.Object.FindObjectsOfType<Il2Cpp.DisableRequirement>(true).Length; } catch (System.Exception error) { disableRequirementAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("disableRequirement", "Il2Cpp.DisableRequirement", disableRequirementActive, disableRequirementAll, disableRequirementActiveError, disableRequirementAllError);

var randomActivatorActive = -1;
var randomActivatorAll = -1;
var randomActivatorActiveError = (string)null;
var randomActivatorAllError = (string)null;
try { randomActivatorActive = UnityEngine.Object.FindObjectsOfType<Il2Cpp.RandomActivator>().Length; } catch (System.Exception error) { randomActivatorActiveError = error.GetType().FullName + ": " + error.Message; }
try { randomActivatorAll = UnityEngine.Object.FindObjectsOfType<Il2Cpp.RandomActivator>(true).Length; } catch (System.Exception error) { randomActivatorAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("randomActivator", "Il2Cpp.RandomActivator", randomActivatorActive, randomActivatorAll, randomActivatorActiveError, randomActivatorAllError);

var interactiveZoneActive = -1;
var interactiveZoneAll = -1;
var interactiveZoneActiveError = (string)null;
var interactiveZoneAllError = (string)null;
try { interactiveZoneActive = UnityEngine.Object.FindObjectsOfType<Il2Cpp.InteractiveZone>().Length; } catch (System.Exception error) { interactiveZoneActiveError = error.GetType().FullName + ": " + error.Message; }
try { interactiveZoneAll = UnityEngine.Object.FindObjectsOfType<Il2Cpp.InteractiveZone>(true).Length; } catch (System.Exception error) { interactiveZoneAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("interactiveZone", "Il2Cpp.InteractiveZone", interactiveZoneActive, interactiveZoneAll, interactiveZoneActiveError, interactiveZoneAllError);

var oreSpawnerActive = -1;
var oreSpawnerAll = -1;
var oreSpawnerActiveError = (string)null;
var oreSpawnerAllError = (string)null;
try { oreSpawnerActive = UnityEngine.Object.FindObjectsOfType<Il2Cpp.OreSpawner>().Length; } catch (System.Exception error) { oreSpawnerActiveError = error.GetType().FullName + ": " + error.Message; }
try { oreSpawnerAll = UnityEngine.Object.FindObjectsOfType<Il2Cpp.OreSpawner>(true).Length; } catch (System.Exception error) { oreSpawnerAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("oreSpawner", "Il2Cpp.OreSpawner", oreSpawnerActive, oreSpawnerAll, oreSpawnerActiveError, oreSpawnerAllError);

var worldQuestZoneActive = -1;
var worldQuestZoneAll = -1;
var worldQuestZoneActiveError = (string)null;
var worldQuestZoneAllError = (string)null;
try { worldQuestZoneActive = UnityEngine.Object.FindObjectsOfType<Il2Cpp.WorldQuestZone>().Length; } catch (System.Exception error) { worldQuestZoneActiveError = error.GetType().FullName + ": " + error.Message; }
try { worldQuestZoneAll = UnityEngine.Object.FindObjectsOfType<Il2Cpp.WorldQuestZone>(true).Length; } catch (System.Exception error) { worldQuestZoneAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("worldQuestZone", "Il2Cpp.WorldQuestZone", worldQuestZoneActive, worldQuestZoneAll, worldQuestZoneActiveError, worldQuestZoneAllError);

var questPortalActive = -1;
var questPortalAll = -1;
var questPortalActiveError = (string)null;
var questPortalAllError = (string)null;
Il2Cpp.QuestScenePortal[] questPortals = null;
try { questPortalActive = UnityEngine.Object.FindObjectsOfType<Il2Cpp.QuestScenePortal>().Length; } catch (System.Exception error) { questPortalActiveError = error.GetType().FullName + ": " + error.Message; }
try { questPortals = UnityEngine.Object.FindObjectsOfType<Il2Cpp.QuestScenePortal>(true); questPortalAll = questPortals.Length; } catch (System.Exception error) { questPortalAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("questScenePortal", "Il2Cpp.QuestScenePortal", questPortalActive, questPortalAll, questPortalActiveError, questPortalAllError);

var dungeonEntranceActive = -1;
var dungeonEntranceAll = -1;
var dungeonEntranceActiveError = (string)null;
var dungeonEntranceAllError = (string)null;
Il2CppBLINK.RPGBuilder.World.DungeonEntranceTrigger[] dungeonEntrances = null;
try { dungeonEntranceActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.DungeonEntranceTrigger>().Length; } catch (System.Exception error) { dungeonEntranceActiveError = error.GetType().FullName + ": " + error.Message; }
try { dungeonEntrances = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.DungeonEntranceTrigger>(true); dungeonEntranceAll = dungeonEntrances.Length; } catch (System.Exception error) { dungeonEntranceAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("dungeonEntranceTrigger", "Il2CppBLINK.RPGBuilder.World.DungeonEntranceTrigger", dungeonEntranceActive, dungeonEntranceAll, dungeonEntranceActiveError, dungeonEntranceAllError);

var mapZoneActive = -1;
var mapZoneAll = -1;
var mapZoneActiveError = (string)null;
var mapZoneAllError = (string)null;
try { mapZoneActive = UnityEngine.Object.FindObjectsOfType<Il2CppMapMinimap.MapZone>().Length; } catch (System.Exception error) { mapZoneActiveError = error.GetType().FullName + ": " + error.Message; }
try { mapZoneAll = UnityEngine.Object.FindObjectsOfType<Il2CppMapMinimap.MapZone>(true).Length; } catch (System.Exception error) { mapZoneAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("mapZone", "Il2CppMapMinimap.MapZone", mapZoneActive, mapZoneAll, mapZoneActiveError, mapZoneAllError);

var regionActive = -1;
var regionAll = -1;
var regionActiveError = (string)null;
var regionAllError = (string)null;
try { regionActive = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder._THMSV.RPGBuilder.Scripts.World.Region>().Length; } catch (System.Exception error) { regionActiveError = error.GetType().FullName + ": " + error.Message; }
try { regionAll = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder._THMSV.RPGBuilder.Scripts.World.Region>(true).Length; } catch (System.Exception error) { regionAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("region", "Il2CppBLINK.RPGBuilder._THMSV.RPGBuilder.Scripts.World.Region", regionActive, regionAll, regionActiveError, regionAllError);

var addressableActive = -1;
var addressableAll = -1;
var addressableActiveError = (string)null;
var addressableAllError = (string)null;
Il2Cpp.AddressableLoader[] addressableLoaders = null;
try { addressableActive = UnityEngine.Object.FindObjectsOfType<Il2Cpp.AddressableLoader>().Length; } catch (System.Exception error) { addressableActiveError = error.GetType().FullName + ": " + error.Message; }
try { addressableLoaders = UnityEngine.Object.FindObjectsOfType<Il2Cpp.AddressableLoader>(true); addressableAll = addressableLoaders.Length; } catch (System.Exception error) { addressableAllError = error.GetType().FullName + ": " + error.Message; }
addComponentFamily("addressableLoader", "Il2Cpp.AddressableLoader", addressableActive, addressableAll, addressableActiveError, addressableAllError);

var componentOwner = new System.Func<UnityEngine.Component, string, int, object>((component, runtimeType, observationIndex) =>
{
    if (component == null)
    {
        return new
        {
            runtimeType = runtimeType,
            observationIndex = observationIndex,
            unavailable = "null component"
        };
    }
    var gameObject = component.gameObject;
    var transform = component.transform;
    if (gameObject == null || transform == null)
    {
        return new
        {
            runtimeType = runtimeType,
            observationIndex = observationIndex,
            unavailable = "component has no GameObject or Transform"
        };
    }

    var hierarchyNodes = new System.Collections.Generic.List<object>();
    var hierarchyParts = new System.Collections.Generic.List<string>();
    var cursor = transform;
    var hierarchyTruncated = false;
    var hierarchyGuard = 0;
    while (cursor != null && hierarchyGuard < 512)
    {
        var nodeName = cursor.name == null ? "" : cursor.name;
        var siblingIndex = cursor.GetSiblingIndex();
        hierarchyNodes.Add(new { name = nodeName, siblingIndex = siblingIndex });
        hierarchyParts.Add(nodeName + "[" + siblingIndex.ToString(invariant) + "]");
        cursor = cursor.parent;
        hierarchyGuard++;
    }
    if (cursor != null)
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
    var position = transform.position;
    var unityScene = gameObject.scene;
    return new
    {
        runtimeType = runtimeType,
        observationIndex = observationIndex,
        gameObjectName = gameObject.name,
        hierarchyPath = string.Join("/", hierarchyParts.ToArray()),
        hierarchyNodes = hierarchyNodes,
        hierarchyDepth = hierarchyNodes.Count,
        hierarchyPathTruncated = hierarchyTruncated,
        scene = sceneEvidence(unityScene),
        position = new { x = position.x, y = position.y, z = position.z },
        activeSelf = gameObject.activeSelf,
        activeInHierarchy = gameObject.activeInHierarchy,
        enabled = component is UnityEngine.Behaviour ? ((UnityEngine.Behaviour)component).enabled : true
    };
});

var addressableSources = new System.Collections.Generic.List<object>();
if (addressableLoaders != null)
{
    for (var loaderIndex = 0; loaderIndex < addressableLoaders.Length; loaderIndex++)
    {
        var loader = addressableLoaders[loaderIndex];
        var owner = componentOwner(loader, "Il2Cpp.AddressableLoader", loaderIndex);
        var sourceFieldPath = "AddressableLoader[" + loaderIndex.ToString(invariant) + "].addressableAsset";
        if (loader == null)
        {
            unresolved.Add(new { kind = "addressableSource", sourceFieldPath = sourceFieldPath, detail = "FindObjectsOfType returned a null AddressableLoader." });
            addressableSources.Add(new
            {
                sourceFieldPath = sourceFieldPath,
                owner = owner,
                sourceKey = (string)null,
                disposition = "unsupported",
                unavailable = "null AddressableLoader"
            });
            continue;
        }

        var assetGuid = (string)null;
        var runtimeKey = (string)null;
        var runtimeKeyType = (string)null;
        var assetReferenceAvailable = false;
        var runtimeKeyValid = false;
        var runtimeKeyValidKnown = false;
        var assetReferenceError = (string)null;
        try
        {
            var assetReference = loader.addressableAsset;
            assetReferenceAvailable = assetReference != null;
            if (assetReference == null)
            {
                assetReferenceError = "AddressableLoader.addressableAsset is null.";
            }
            else
            {
                assetGuid = assetReference.AssetGUID;
                runtimeKeyValid = assetReference.RuntimeKeyIsValid();
                runtimeKeyValidKnown = true;
                var keyObject = assetReference.RuntimeKey;
                if (keyObject != null)
                {
                    runtimeKey = keyObject.ToString();
                    runtimeKeyType = keyObject.GetType().FullName;
                }
            }
        }
        catch (System.Exception error)
        {
            assetReferenceError = error.GetType().FullName + ": " + error.Message;
        }
        if (assetReferenceError != null)
        {
            unresolved.Add(new { kind = "addressableSourceKey", sourceFieldPath = sourceFieldPath, detail = assetReferenceError });
        }
        if (assetReferenceAvailable && (runtimeKey == null || runtimeKey.Length == 0) && (assetGuid == null || assetGuid.Length == 0))
        {
            unresolved.Add(new { kind = "addressableSourceKey", sourceFieldPath = sourceFieldPath, detail = "The AssetReference has no non-empty RuntimeKey or AssetGUID." });
        }

        var category = (string)null;
        var categoryError = (string)null;
        try { category = loader.DisplayCategory; } catch (System.Exception error) { categoryError = error.GetType().FullName + ": " + error.Message; }
        var isLoadedOrLoading = false;
        var loadedStateKnown = false;
        var loadedStateError = (string)null;
        try { isLoadedOrLoading = loader.IsLoadedOrLoading; loadedStateKnown = true; } catch (System.Exception error) { loadedStateError = error.GetType().FullName + ": " + error.Message; }
        var parentsUnderLoader = false;
        var parentsUnderLoaderKnown = false;
        var parentsUnderLoaderError = (string)null;
        try { parentsUnderLoader = loader.ParentsUnderLoader; parentsUnderLoaderKnown = true; } catch (System.Exception error) { parentsUnderLoaderError = error.GetType().FullName + ": " + error.Message; }
        var unloadDistance = 0f;
        var unloadDistanceKnown = false;
        var unloadDistanceError = (string)null;
        try { unloadDistance = loader.UnloadDistance; unloadDistanceKnown = true; } catch (System.Exception error) { unloadDistanceError = error.GetType().FullName + ": " + error.Message; }

        if (categoryError != null) unresolved.Add(new { kind = "addressableSourceCategory", sourceFieldPath = sourceFieldPath, detail = categoryError });
        if (loadedStateError != null) unresolved.Add(new { kind = "addressableSourceLoadedState", sourceFieldPath = sourceFieldPath, detail = loadedStateError });
        if (parentsUnderLoaderError != null) unresolved.Add(new { kind = "addressableSourceParentsUnderLoader", sourceFieldPath = sourceFieldPath, detail = parentsUnderLoaderError });
        if (unloadDistanceError != null) unresolved.Add(new { kind = "addressableSourceUnloadDistance", sourceFieldPath = sourceFieldPath, detail = unloadDistanceError });

        var key = runtimeKey != null && runtimeKey.Length > 0 ? runtimeKey : assetGuid;
        var keyObserved = key != null && key.Length > 0;
        var disposition = !keyObserved || assetReferenceError != null ? "unsupported" : (loadedStateKnown ? (isLoadedOrLoading ? "currently-loaded" : "not-traversed") : "failed");
        if (disposition == "failed")
        {
            unresolved.Add(new { kind = "addressableSource", sourceFieldPath = sourceFieldPath, detail = "IsLoadedOrLoading could not be read." });
        }
        addressableSources.Add(new
        {
            sourceFieldPath = sourceFieldPath,
            owner = owner,
            sourceKey = key,
            assetGuid = assetGuid,
            runtimeKey = runtimeKey,
            runtimeKeyType = runtimeKeyType,
            runtimeKeyIsValid = runtimeKeyValidKnown ? (bool?)runtimeKeyValid : (bool?)null,
            assetReferenceAvailable = assetReferenceAvailable,
            keyDisposition = keyObserved ? "observed" : "unsupported",
            disposition = disposition,
            evidence = new
            {
                loaderComponent = "currently-loaded",
                addressableAsset = new
                {
                    AssetGUID = assetGuid,
                    RuntimeKey = runtimeKey,
                    RuntimeKeyType = runtimeKeyType,
                    RuntimeKeyIsValid = runtimeKeyValidKnown ? (bool?)runtimeKeyValid : (bool?)null
                },
                loadedOrLoading = loadedStateKnown ? (bool?)isLoadedOrLoading : (bool?)null,
                loadedStateError = loadedStateError
            },
            settings = new
            {
                sourceFieldPath = "AddressableLoader[" + loaderIndex.ToString(invariant) + "]",
                loadDistance = loader.loadDistance,
                unloadHysteresis = loader.unloadHysteresis,
                showEditorPreview = loader.showEditorPreview,
                ParentsUnderLoader = parentsUnderLoaderKnown ? (bool?)parentsUnderLoader : (bool?)null,
                UnloadDistance = unloadDistanceKnown ? (float?)unloadDistance : (float?)null,
                parentsUnderLoaderError = parentsUnderLoaderError,
                unloadDistanceError = unloadDistanceError
            },
            category = category,
            categoryError = categoryError,
            activeSelf = loader.gameObject == null ? (bool?)null : (bool?)loader.gameObject.activeSelf,
            activeInHierarchy = loader.gameObject == null ? (bool?)null : (bool?)loader.gameObject.activeInHierarchy,
            componentEnabled = loader.enabled
        });
    }
}

var transitions = new System.Collections.Generic.List<object>();
if (questPortals != null)
{
    for (var portalIndex = 0; portalIndex < questPortals.Length; portalIndex++)
    {
        var portal = questPortals[portalIndex];
        var sourceFieldPath = "QuestScenePortal[" + portalIndex.ToString(invariant) + "].DestinationScene";
        if (portal == null)
        {
            unresolved.Add(new { kind = "questScenePortal", sourceFieldPath = sourceFieldPath, detail = "FindObjectsOfType returned a null QuestScenePortal." });
            transitions.Add(new
            {
                sourceFieldPath = sourceFieldPath,
                owner = componentOwner(portal, "Il2Cpp.QuestScenePortal", portalIndex),
                transitionType = "questScenePortal",
                disposition = "currently-loaded",
                destinationDisposition = "unsupported",
                destinationType = "sceneName",
                rawDestination = (string)null,
                destination = (object)null,
                destinationScene = (object)null,
                unavailable = "null QuestScenePortal"
            });
            continue;
        }
        var rawDestination = portal.DestinationScene;
        var destination = findDatabaseSceneByEntryName(rawDestination);
        if (rawDestination == null || rawDestination.Length == 0)
        {
            unresolved.Add(new { kind = "transitionDestination", sourceFieldPath = sourceFieldPath, transitionType = "questScenePortal", detail = "DestinationScene is null or empty." });
        }
        else if (destination == null)
        {
            unresolved.Add(new { kind = "transitionDestination", sourceFieldPath = sourceFieldPath, transitionType = "questScenePortal", rawDestination = rawDestination, detail = "DestinationScene does not resolve by exact RPGGameScene.entryName comparison." });
        }
        transitions.Add(new
        {
            sourceFieldPath = sourceFieldPath,
            owner = componentOwner(portal, "Il2Cpp.QuestScenePortal", portalIndex),
            transitionType = "questScenePortal",
            disposition = "currently-loaded",
            destinationDisposition = rawDestination == null || rawDestination.Length == 0 ? "unsupported" : "not-traversed",
            destinationType = "sceneName",
            rawDestination = rawDestination,
            destination = destination,
            destinationScene = destination,
            resolutionEvidence = rawDestination == null || rawDestination.Length == 0 ? "DestinationScene is null or empty." : "Exact RPGGameScene.entryName comparison; no display-name or path guess was used."
        });
    }
}
if (dungeonEntrances != null)
{
    for (var entranceIndex = 0; entranceIndex < dungeonEntrances.Length; entranceIndex++)
    {
        var entrance = dungeonEntrances[entranceIndex];
        var sourceFieldPath = "DungeonEntranceTrigger[" + entranceIndex.ToString(invariant) + "].GameScene";
        if (entrance == null)
        {
            unresolved.Add(new { kind = "dungeonEntranceTrigger", sourceFieldPath = sourceFieldPath, detail = "FindObjectsOfType returned a null DungeonEntranceTrigger." });
            transitions.Add(new
            {
                sourceFieldPath = sourceFieldPath,
                owner = componentOwner(entrance, "Il2CppBLINK.RPGBuilder.World.DungeonEntranceTrigger", entranceIndex),
                transitionType = "dungeonEntranceTrigger",
                disposition = "currently-loaded",
                destinationDisposition = "unsupported",
                destinationType = "typedRPGGameScene",
                destination = (object)null,
                destinationScene = (object)null,
                unavailable = "null DungeonEntranceTrigger"
            });
            continue;
        }
        var typedDestination = entrance.GameScene;
        var typedDestinationDatabaseRecord = typedDestination == null ? null : findDatabaseSceneByNativeId(typedDestination.ID);
        if (typedDestination == null)
        {
            unresolved.Add(new { kind = "transitionDestination", sourceFieldPath = sourceFieldPath, transitionType = "dungeonEntranceTrigger", detail = "GameScene is null." });
        }
        transitions.Add(new
        {
            sourceFieldPath = sourceFieldPath,
            owner = componentOwner(entrance, "Il2CppBLINK.RPGBuilder.World.DungeonEntranceTrigger", entranceIndex),
            transitionType = "dungeonEntranceTrigger",
            disposition = "currently-loaded",
            destinationDisposition = typedDestination == null ? "unsupported" : "not-traversed",
            destinationType = "typedRPGGameScene",
            destination = typedDestination == null ? null : (object)new
            {
                typed = projectTypedScene(typedDestination),
                databaseRecord = typedDestinationDatabaseRecord,
                databaseRecordMatchBasis = typedDestinationDatabaseRecord == null ? null : "exact RPGGameScene.ID comparison"
            },
            destinationScene = typedDestination == null ? null : (object)new
            {
                typed = projectTypedScene(typedDestination),
                databaseRecord = typedDestinationDatabaseRecord,
                databaseRecordMatchBasis = typedDestinationDatabaseRecord == null ? null : "exact RPGGameScene.ID comparison"
            },
            resolutionEvidence = typedDestination == null ? "DungeonEntranceTrigger.GameScene is null." : "Typed DungeonEntranceTrigger.GameScene reference retained; database reconciliation uses exact RPGGameScene.ID comparison."
        });
    }
}
foreach (var transition in transitions)
{
    referencedDestinations.Add(transition);
}

var behaviours = UnityEngine.Object.FindObjectsOfType<UnityEngine.MonoBehaviour>(true);
var behaviourCounts = new System.Collections.Generic.SortedDictionary<string, int[]>();
foreach (var behaviour in behaviours)
{
    var nativeType = behaviour.GetIl2CppType().FullName;
    if (!behaviourCounts.ContainsKey(nativeType)) behaviourCounts.Add(nativeType, new int[2]);
    behaviourCounts[nativeType][0]++;
    if (behaviour.gameObject.activeInHierarchy) behaviourCounts[nativeType][1]++;
}
var behaviourTypes = new System.Collections.Generic.List<object>();
var nativeBehaviourTypeCount = behaviourCounts.Count;
var exportedBehaviourComponentCount = 0;
foreach (var pair in behaviourCounts)
{
    exportedBehaviourComponentCount += pair.Value[0];
    behaviourTypes.Add(new { nativeType = pair.Key, includeInactiveCount = pair.Value[0], activeCount = pair.Value[1] });
}

var sourceTotals = new
{
    buildScenes = buildSceneCount,
    databaseScenes = databaseScenes == null ? -1 : databaseScenes.Count,
    worldPositions = databaseWorldPositions == null ? -1 : databaseWorldPositions.Count,
    gameSceneStartPositionReferences = databaseScenes == null ? -1 : databaseScenes.Count,
    taskSceneReferences = databaseTasks == null ? -1 : databaseTasks.Count,
    loadedScenes = loadedSceneCount,
    addressableSources = addressableAll,
    loadedTransitions = questPortalAll < 0 || dungeonEntranceAll < 0 ? -1 : questPortalAll + dungeonEntranceAll,
    referencedDestinations = databaseScenes == null || databaseWorldPositions == null || databaseTasks == null || questPortalAll < 0 || dungeonEntranceAll < 0 ? -1 : databaseScenes.Count + databaseWorldPositions.Count + databaseTasks.Count + questPortalAll + dungeonEntranceAll,
    componentFamilies = nativeComponentFamilyQueryCount,
    behaviourTypes = nativeBehaviourTypeCount,
    behaviourComponents = behaviours.Length
};
var exportedTotals = new
{
    buildScenes = buildScenes.Count,
    databaseScenes = databaseSceneRows.Count,
    worldPositions = databaseWorldPositions == null ? 0 : worldPositionReferenceCount,
    gameSceneStartPositionReferences = databaseScenes == null ? 0 : gameSceneStartPositionReferenceCount,
    taskSceneReferences = databaseTasks == null ? 0 : taskSceneReferenceCount,
    loadedScenes = loadedScenes.Count,
    addressableSources = addressableSources.Count,
    loadedTransitions = transitions.Count,
    referencedDestinations = referencedDestinations.Count,
    componentFamilies = componentFamilies.Count,
    behaviourTypes = behaviourTypes.Count,
    behaviourComponents = exportedBehaviourComponentCount
};

return new
{
    schemaVersion = "compendium.world-inventory.v2",
    coverage = new
    {
        dispositionValues = new[] { "extracted", "unreachable", "unused", "unsupported", "failed", "currently-loaded", "not-traversed" },
        fullGameCoverage = false,
        label = "currently-loaded and authored database inventory only; traversal, capture, and publication are not performed",
        scope = "Build settings, initialized GameDatabase game scenes, typed world-position and task references, loaded transition components, loaded scenes, inactive-inclusive AddressableLoader components, and relevant component-family counts.",
        includesInactiveComponents = true,
        includesLoadedAddressableLoaderComponents = true,
        traversalPerformed = false,
        capturePerformed = false,
        publicationPerformed = false,
        activeScene = sceneEvidence(activeUnityScene),
        currentGameScene = currentGameScene == null ? null : (object)projectTypedScene(currentGameScene),
        currentGameSceneError = currentGameSceneError,
        noDisplayNameSceneMapping = true,
        noNameBasedUnreachableClaims = true
    },
    runtime = new
    {
        game = UnityEngine.Application.productName,
        version = UnityEngine.Application.version,
        unityVersion = UnityEngine.Application.unityVersion,
        activeScene = activeUnityScene.name,
        activeScenePath = activeUnityScene.path,
        buildSceneCount = buildSceneCount,
        loadedSceneCount = loadedSceneCount,
        databaseAvailable = database != null,
        databaseError = databaseError
    },
    buildScenes = buildScenes,
    databaseScenes = databaseSceneRows,
    referencedDestinations = referencedDestinations,
    transitions = transitions,
    loadedScenes = loadedScenes,
    addressableSources = addressableSources,
    componentFamilies = componentFamilies,
    behaviourTypes = behaviourTypes,
    sourceTotals = sourceTotals,
    exportedTotals = exportedTotals,
    unresolved = unresolved
};
