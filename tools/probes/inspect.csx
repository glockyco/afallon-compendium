var buildScenePaths = new System.Collections.Generic.List<object>();
var buildSceneCount = UnityEngine.SceneManagement.SceneManager.sceneCountInBuildSettings;
if (buildSceneCount < 0)
{
    buildSceneCount = 0;
}
for (var buildIndex = 0; buildIndex < buildSceneCount; buildIndex++)
{
    var buildPath = (string)null;
    var buildPathError = (string)null;
    try
    {
        buildPath = UnityEngine.SceneManagement.SceneUtility.GetScenePathByBuildIndex(buildIndex);
    }
    catch (System.Exception error)
    {
        buildPathError = error.GetType().FullName + ": " + error.Message;
    }

    buildScenePaths.Add(new
    {
        buildIndex = buildIndex,
        path = buildPath,
        pathError = buildPathError
    });
}

var loadedScenes = new System.Collections.Generic.List<object>();
var loadedSceneCount = UnityEngine.SceneManagement.SceneManager.sceneCount;
for (var loadedIndex = 0; loadedIndex < loadedSceneCount; loadedIndex++)
{
    var loadedScene = UnityEngine.SceneManagement.SceneManager.GetSceneAt(loadedIndex);
    loadedScenes.Add(new
    {
        index = loadedIndex,
        handle = loadedScene.handle,
        name = loadedScene.name,
        path = loadedScene.path,
        buildIndex = loadedScene.buildIndex,
        isLoaded = loadedScene.isLoaded,
        rootCount = loadedScene.rootCount
    });
}

var databaseTables = new System.Collections.Generic.List<object>();
var databaseAvailable = false;
var databaseTotalRecords = 0;
var itemsCount = -1;
var npcsCount = -1;
var questsCount = -1;
var lootTablesCount = -1;
var scenesCount = -1;
var merchantTablesCount = -1;
var resourcesCount = -1;
var skillsCount = -1;
var abilitiesCount = -1;
var effectsCount = -1;
var statsCount = -1;
var factionsCount = -1;
var speciesCount = -1;
var tasksCount = -1;
var worldQuestsCount = -1;
var worldPositionsCount = -1;
var propertiesCount = -1;
var gameModifiersCount = -1;

var database = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
if (database != null)
{
    databaseAvailable = true;

    var items = database.GetItems();
    itemsCount = items == null ? -1 : items.Count;
    databaseTables.Add(new { table = "items", count = itemsCount });

    var npcs = database.GetNPCs();
    npcsCount = npcs == null ? -1 : npcs.Count;
    databaseTables.Add(new { table = "npcs", count = npcsCount });

    var quests = database.GetQuests();
    questsCount = quests == null ? -1 : quests.Count;
    databaseTables.Add(new { table = "quests", count = questsCount });

    var lootTables = database.GetLootTables();
    lootTablesCount = lootTables == null ? -1 : lootTables.Count;
    databaseTables.Add(new { table = "lootTables", count = lootTablesCount });

    var scenes = database.GetGameScenes();
    scenesCount = scenes == null ? -1 : scenes.Count;
    databaseTables.Add(new { table = "scenes", count = scenesCount });

    var merchantTables = database.GetMerchantTables();
    merchantTablesCount = merchantTables == null ? -1 : merchantTables.Count;
    databaseTables.Add(new { table = "merchantTables", count = merchantTablesCount });

    var resources = database.GetResources();
    resourcesCount = resources == null ? -1 : resources.Count;
    databaseTables.Add(new { table = "resources", count = resourcesCount });

    var skills = database.GetSkills();
    skillsCount = skills == null ? -1 : skills.Count;
    databaseTables.Add(new { table = "skills", count = skillsCount });

    var abilities = database.GetAbilities();
    abilitiesCount = abilities == null ? -1 : abilities.Count;
    databaseTables.Add(new { table = "abilities", count = abilitiesCount });

    var effects = database.GetEffects();
    effectsCount = effects == null ? -1 : effects.Count;
    databaseTables.Add(new { table = "effects", count = effectsCount });

    var stats = database.GetStats();
    statsCount = stats == null ? -1 : stats.Count;
    databaseTables.Add(new { table = "stats", count = statsCount });

    var factions = database.GetFactions();
    factionsCount = factions == null ? -1 : factions.Count;
    databaseTables.Add(new { table = "factions", count = factionsCount });

    var species = database.GetSpecies();
    speciesCount = species == null ? -1 : species.Count;
    databaseTables.Add(new { table = "species", count = speciesCount });

    var tasks = database.GetTasks();
    tasksCount = tasks == null ? -1 : tasks.Count;
    databaseTables.Add(new { table = "tasks", count = tasksCount });

    var worldQuests = database.GetWorldQuests();
    worldQuestsCount = worldQuests == null ? -1 : worldQuests.Count;
    databaseTables.Add(new { table = "worldQuests", count = worldQuestsCount });

    var worldPositions = database.GetWorldPositions();
    worldPositionsCount = worldPositions == null ? -1 : worldPositions.Count;
    databaseTables.Add(new { table = "worldPositions", count = worldPositionsCount });

    var properties = database.GetProperties();
    propertiesCount = properties == null ? -1 : properties.Count;
    databaseTables.Add(new { table = "properties", count = propertiesCount });

    var gameModifiers = database.GetGameModifiers();
    gameModifiersCount = gameModifiers == null ? -1 : gameModifiers.Count;
    databaseTables.Add(new { table = "gameModifiers", count = gameModifiersCount });

    for (var tableIndex = 0; tableIndex < databaseTables.Count; tableIndex++)
    {
        var count = -1;
        if (tableIndex == 0) count = itemsCount;
        else if (tableIndex == 1) count = npcsCount;
        else if (tableIndex == 2) count = questsCount;
        else if (tableIndex == 3) count = lootTablesCount;
        else if (tableIndex == 4) count = scenesCount;
        else if (tableIndex == 5) count = merchantTablesCount;
        else if (tableIndex == 6) count = resourcesCount;
        else if (tableIndex == 7) count = skillsCount;
        else if (tableIndex == 8) count = abilitiesCount;
        else if (tableIndex == 9) count = effectsCount;
        else if (tableIndex == 10) count = statsCount;
        else if (tableIndex == 11) count = factionsCount;
        else if (tableIndex == 12) count = speciesCount;
        else if (tableIndex == 13) count = tasksCount;
        else if (tableIndex == 14) count = worldQuestsCount;
        else if (tableIndex == 15) count = worldPositionsCount;
        else if (tableIndex == 16) count = propertiesCount;
        else if (tableIndex == 17) count = gameModifiersCount;
        if (count > 0)
        {
            databaseTotalRecords += count;
        }
    }
}

var componentFamilies = new System.Collections.Generic.List<object>();
var componentActiveTotal = 0;
var componentIncludeInactiveTotal = 0;

var npcSpawnerActiveCount = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.NPCSpawner>().Length;
var npcSpawnerIncludeInactiveCount = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.NPCSpawner>(true).Length;
componentActiveTotal += npcSpawnerActiveCount;
componentIncludeInactiveTotal += npcSpawnerIncludeInactiveCount;
componentFamilies.Add(new { family = "npcSpawner", runtimeType = "Il2CppBLINK.RPGBuilder.AI.NPCSpawner", activeCount = npcSpawnerActiveCount, includeInactiveCount = npcSpawnerIncludeInactiveCount });

var interactableActiveCount = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractableObject>().Length;
var interactableIncludeInactiveCount = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractableObject>(true).Length;
componentActiveTotal += interactableActiveCount;
componentIncludeInactiveTotal += interactableIncludeInactiveCount;
componentFamilies.Add(new { family = "interactableObject", runtimeType = "Il2CppBLINK.RPGBuilder.World.InteractableObject", activeCount = interactableActiveCount, includeInactiveCount = interactableIncludeInactiveCount });

var interactiveNodeActiveCount = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractiveNode>().Length;
var interactiveNodeIncludeInactiveCount = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractiveNode>(true).Length;
componentActiveTotal += interactiveNodeActiveCount;
componentIncludeInactiveTotal += interactiveNodeIncludeInactiveCount;
componentFamilies.Add(new { family = "interactiveNode", runtimeType = "Il2CppBLINK.RPGBuilder.World.InteractiveNode", activeCount = interactiveNodeActiveCount, includeInactiveCount = interactiveNodeIncludeInactiveCount });

var chestActiveCount = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.Chest>().Length;
var chestIncludeInactiveCount = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.Chest>(true).Length;
componentActiveTotal += chestActiveCount;
componentIncludeInactiveTotal += chestIncludeInactiveCount;
componentFamilies.Add(new { family = "chest", runtimeType = "Il2CppBLINK.RPGBuilder.World.Chest", activeCount = chestActiveCount, includeInactiveCount = chestIncludeInactiveCount });

var oreSpawnerActiveCount = UnityEngine.Object.FindObjectsOfType<Il2Cpp.OreSpawner>().Length;
var oreSpawnerIncludeInactiveCount = UnityEngine.Object.FindObjectsOfType<Il2Cpp.OreSpawner>(true).Length;
componentActiveTotal += oreSpawnerActiveCount;
componentIncludeInactiveTotal += oreSpawnerIncludeInactiveCount;
componentFamilies.Add(new { family = "oreSpawner", runtimeType = "Il2Cpp.OreSpawner", activeCount = oreSpawnerActiveCount, includeInactiveCount = oreSpawnerIncludeInactiveCount });

var worldQuestActiveCount = UnityEngine.Object.FindObjectsOfType<Il2Cpp.WorldQuestZone>().Length;
var worldQuestIncludeInactiveCount = UnityEngine.Object.FindObjectsOfType<Il2Cpp.WorldQuestZone>(true).Length;
componentActiveTotal += worldQuestActiveCount;
componentIncludeInactiveTotal += worldQuestIncludeInactiveCount;
componentFamilies.Add(new { family = "worldQuestZone", runtimeType = "Il2Cpp.WorldQuestZone", activeCount = worldQuestActiveCount, includeInactiveCount = worldQuestIncludeInactiveCount });

var questPortalActiveCount = UnityEngine.Object.FindObjectsOfType<Il2Cpp.QuestScenePortal>().Length;
var questPortalIncludeInactiveCount = UnityEngine.Object.FindObjectsOfType<Il2Cpp.QuestScenePortal>(true).Length;
componentActiveTotal += questPortalActiveCount;
componentIncludeInactiveTotal += questPortalIncludeInactiveCount;
componentFamilies.Add(new { family = "questScenePortal", runtimeType = "Il2Cpp.QuestScenePortal", activeCount = questPortalActiveCount, includeInactiveCount = questPortalIncludeInactiveCount });

var dungeonEntranceActiveCount = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.DungeonEntranceTrigger>().Length;
var dungeonEntranceIncludeInactiveCount = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.DungeonEntranceTrigger>(true).Length;
componentActiveTotal += dungeonEntranceActiveCount;
componentIncludeInactiveTotal += dungeonEntranceIncludeInactiveCount;
componentFamilies.Add(new { family = "dungeonEntranceTrigger", runtimeType = "Il2CppBLINK.RPGBuilder.World.DungeonEntranceTrigger", activeCount = dungeonEntranceActiveCount, includeInactiveCount = dungeonEntranceIncludeInactiveCount });

var mapZoneActiveCount = UnityEngine.Object.FindObjectsOfType<Il2CppMapMinimap.MapZone>().Length;
var mapZoneIncludeInactiveCount = UnityEngine.Object.FindObjectsOfType<Il2CppMapMinimap.MapZone>(true).Length;
componentActiveTotal += mapZoneActiveCount;
componentIncludeInactiveTotal += mapZoneIncludeInactiveCount;
componentFamilies.Add(new { family = "mapZone", runtimeType = "Il2CppMapMinimap.MapZone", activeCount = mapZoneActiveCount, includeInactiveCount = mapZoneIncludeInactiveCount });

var loaders = UnityEngine.Object.FindObjectsOfType<Il2Cpp.AddressableLoader>(true);
var loaderActiveComponentCount = UnityEngine.Object.FindObjectsOfType<Il2Cpp.AddressableLoader>().Length;
var loaderIncludeInactiveComponentCount = loaders.Length;
componentActiveTotal += loaderActiveComponentCount;
componentIncludeInactiveTotal += loaderIncludeInactiveComponentCount;
componentFamilies.Add(new { family = "addressableLoader", runtimeType = "Il2Cpp.AddressableLoader", activeCount = loaderActiveComponentCount, includeInactiveCount = loaderIncludeInactiveComponentCount });

var streamedSources = new System.Collections.Generic.List<object>();
var loaderCategoryNames = new System.Collections.Generic.List<string>();
var loaderCategoryTotals = new System.Collections.Generic.List<int>();
var loaderCategoryActiveTotals = new System.Collections.Generic.List<int>();
var loaderCategoryLoadedTotals = new System.Collections.Generic.List<int>();
var loadedOrLoadingLoaderCount = 0;
var activeLoaderCount = 0;

for (var loaderIndex = 0; loaderIndex < loaders.Length; loaderIndex++)
{
    var loader = loaders[loaderIndex];
    var loaderCategory = "unknown";
    var loaderCategoryError = (string)null;
    try
    {
        loaderCategory = loader.DisplayCategory;
        if (loaderCategory == null || loaderCategory.Length == 0)
        {
            loaderCategory = "unknown";
        }
    }
    catch (System.Exception error)
    {
        loaderCategoryError = error.GetType().FullName + ": " + error.Message;
    }

    var loadedOrLoading = false;
    var loadedStateError = (string)null;
    try
    {
        loadedOrLoading = loader.IsLoadedOrLoading;
    }
    catch (System.Exception error)
    {
        loadedStateError = error.GetType().FullName + ": " + error.Message;
    }

    var loaderGameObject = loader.gameObject;
    var loaderTransform = loader.transform;
    var loaderScene = loaderGameObject.scene;
    var loaderPosition = loaderTransform.position;
    var hierarchyNodes = new System.Collections.Generic.List<object>();
    var hierarchyParts = new System.Collections.Generic.List<string>();
    var hierarchyCursor = loaderTransform;
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

    var assetKey = (string)null;
    var assetKeySource = (string)null;
    var assetGuid = (string)null;
    var assetKeyValid = false;
    var assetKeyType = (string)null;
    var assetKeyError = (string)null;
    try
    {
        var assetReference = loader.addressableAsset;
        if (assetReference != null)
        {
            assetGuid = assetReference.AssetGUID;
            assetKeyValid = assetReference.RuntimeKeyIsValid();
            var runtimeKey = assetReference.RuntimeKey;
            if (runtimeKey != null)
            {
                assetKey = runtimeKey.ToString();
                assetKeySource = "RuntimeKey.ToString";
                assetKeyType = runtimeKey.GetType().FullName;
            }
            else if (assetGuid != null && assetGuid.Length > 0)
            {
                assetKey = assetGuid;
                assetKeySource = "AssetGUID";
            }
        }
    }
    catch (System.Exception error)
    {
        assetKeyError = error.GetType().FullName + ": " + error.Message;
    }

    var categoryIndex = -1;
    for (var categorySearchIndex = 0; categorySearchIndex < loaderCategoryNames.Count; categorySearchIndex++)
    {
        if (loaderCategoryNames[categorySearchIndex] == loaderCategory)
        {
            categoryIndex = categorySearchIndex;
            break;
        }
    }
    if (categoryIndex < 0)
    {
        categoryIndex = loaderCategoryNames.Count;
        loaderCategoryNames.Add(loaderCategory);
        loaderCategoryTotals.Add(0);
        loaderCategoryActiveTotals.Add(0);
        loaderCategoryLoadedTotals.Add(0);
    }
    loaderCategoryTotals[categoryIndex] = loaderCategoryTotals[categoryIndex] + 1;
    if (loaderGameObject.activeInHierarchy)
    {
        activeLoaderCount++;
        loaderCategoryActiveTotals[categoryIndex] = loaderCategoryActiveTotals[categoryIndex] + 1;
    }
    if (loadedOrLoading)
    {
        loadedOrLoadingLoaderCount++;
        loaderCategoryLoadedTotals[categoryIndex] = loaderCategoryLoadedTotals[categoryIndex] + 1;
    }

    streamedSources.Add(new
    {
        index = loaderIndex,
        category = loaderCategory,
        categoryError = loaderCategoryError,
        sourceScene = loaderScene.name,
        sourceScenePath = loaderScene.path,
        sourceSceneBuildIndex = loaderScene.buildIndex,
        sourceSceneHandle = loaderScene.handle,
        hierarchyPath = string.Join("/", hierarchyParts.ToArray()),
        hierarchyNodes = hierarchyNodes,
        hierarchyDepth = hierarchyNodes.Count,
        hierarchyPathTruncated = hierarchyCursor != null,
        name = loaderGameObject.name,
        x = loaderPosition.x,
        y = loaderPosition.y,
        z = loaderPosition.z,
        activeSelf = loaderGameObject.activeSelf,
        activeInHierarchy = loaderGameObject.activeInHierarchy,
        componentEnabled = loader.enabled,
        loadedOrLoading = loadedOrLoading,
        loadedStateError = loadedStateError,
        assetKey = assetKey,
        assetKeySource = assetKeySource,
        assetGuid = assetGuid,
        assetKeyValid = assetKeyValid,
        assetKeyType = assetKeyType,
        assetKeyError = assetKeyError
    });
}

var loaderCategoryTotalsRows = new System.Collections.Generic.List<object>();
for (var categoryIndex = 0; categoryIndex < loaderCategoryNames.Count; categoryIndex++)
{
    loaderCategoryTotalsRows.Add(new
    {
        category = loaderCategoryNames[categoryIndex],
        total = loaderCategoryTotals[categoryIndex],
        activeInHierarchy = loaderCategoryActiveTotals[categoryIndex],
        loadedOrLoading = loaderCategoryLoadedTotals[categoryIndex]
    });
}

var assumptions = new System.Collections.Generic.List<object>();
assumptions.Add(new
{
    id = "runtime-scope",
    statement = "Scene and component inventories describe the current runtime only. They do not establish full-game coverage.",
    validation = "Repeat inspection after each reachable scene and streaming state is loaded."
});
assumptions.Add(new
{
    id = "inactive-scope",
    statement = "includeInactive scans inactive objects in loaded scenes, but it cannot see unloaded addressable instances or unopened scene assets.",
    validation = "Compare loader records and source inventories while traversing near, far, and inactive content."
});
assumptions.Add(new
{
    id = "database-scope",
    statement = "GameDatabase accessors expose initialized canonical records, but counts do not prove reachability or publication completeness.",
    validation = "Reconcile database scene records and references with the coverage ledger."
});
assumptions.Add(new
{
    id = "loader-category",
    statement = "AddressableLoader.DisplayCategory is treated as the runtime source category.",
    validation = "Verify category labels against serialized loader families and streamed assets."
});
assumptions.Add(new
{
    id = "loader-key",
    statement = "AssetReference.AssetGUID is retained separately. RuntimeKey text is its observed representation, not a proven canonical identity.",
    validation = "Verify key semantics and addressable catalog identity on the supported build."
});
assumptions.Add(new
{
    id = "hierarchy-identity",
    statement = "Hierarchy names and sibling indices describe the observed source path and are not proven stable placement identities.",
    validation = "Compare repeated scene loads and extraction runs before using this path as an identity fallback."
});

return new
{
    schemaVersion = "compendium.inspect.v1",
    coverage = new
    {
        label = "currently loaded, not full-game coverage",
        scope = "Current Unity process scenes, loaded components, canonical database accessors, and loaded addressable loader records.",
        fullGameCoverage = false,
        includesInactiveComponents = true,
        includesAllLoadedStreamedSources = true
    },
    runtime = new
    {
        game = UnityEngine.Application.productName,
        version = UnityEngine.Application.version,
        activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name,
        activeScenePath = UnityEngine.SceneManagement.SceneManager.GetActiveScene().path,
        unityVersion = UnityEngine.Application.unityVersion,
        buildSceneCount = buildScenePaths.Count,
        loadedSceneCount = loadedScenes.Count
    },
    buildScenes = buildScenePaths,
    loadedScenes = loadedScenes,
    database = new
    {
        available = databaseAvailable,
        counts = new
        {
            items = itemsCount,
            npcs = npcsCount,
            quests = questsCount,
            lootTables = lootTablesCount,
            scenes = scenesCount,
            merchantTables = merchantTablesCount,
            resources = resourcesCount,
            skills = skillsCount,
            abilities = abilitiesCount,
            effects = effectsCount,
            stats = statsCount,
            factions = factionsCount,
            species = speciesCount,
            tasks = tasksCount,
            worldQuests = worldQuestsCount,
            worldPositions = worldPositionsCount,
            properties = propertiesCount,
            gameModifiers = gameModifiersCount
        },
        tables = databaseTables,
        totalRecords = databaseTotalRecords
    },
    componentFamilies = componentFamilies,
    streamedSources = streamedSources,
    streamedSourceTotals = new
    {
        records = streamedSources.Count,
        activeCount = loaderActiveComponentCount,
        includeInactiveCount = loaderIncludeInactiveComponentCount,
        activeInHierarchy = activeLoaderCount,
        loadedOrLoading = loadedOrLoadingLoaderCount,
        categories = loaderCategoryTotalsRows
    },
    totals = new
    {
        buildScenes = buildScenePaths.Count,
        loadedScenes = loadedScenes.Count,
        databaseRecords = databaseTotalRecords,
        componentFamilies = componentFamilies.Count,
        componentsActive = componentActiveTotal,
        componentsIncludeInactive = componentIncludeInactiveTotal,
        streamedSources = streamedSources.Count,
        streamedSourcesActive = loaderActiveComponentCount,
        streamedSourcesIncludeInactive = loaderIncludeInactiveComponentCount,
        streamedSourcesActiveInHierarchy = activeLoaderCount,
        streamedSourcesLoadedOrLoading = loadedOrLoadingLoaderCount
    },
    assumptions = assumptions
};
