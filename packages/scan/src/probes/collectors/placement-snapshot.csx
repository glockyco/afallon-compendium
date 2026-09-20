var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var character = Il2CppBLINK.RPGBuilder.Characters.Character.Instance;
var essentials = Il2CppBLINK.RPGBuilder.LogicMono.RPGBuilderEssentials.Instance;
var loading = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.Instance;
var nativeScene = Il2Cpp.GameState.CurrentGameScene;
if (character == null || character.CharacterData == null || !character.CharacterData.IsCreated || nativeScene == null || essentials == null || loading == null)
    throw new System.InvalidOperationException("A loaded research character and world scene are required.");
if (!scene.isLoaded || !essentials.SceneInitialized || loading.isSceneLoading || Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.HasSceneReadyHolds)
    throw new System.InvalidOperationException("The world scene is not ready for an identity snapshot.");
if ((string)args["researchCharacter"] != character.CharacterData.CharacterName)
    throw new System.InvalidOperationException("The loaded character differs from the configured research character.");

var vector = new System.Func<UnityEngine.Vector3, object>(value => new { x = value.x, y = value.y, z = value.z });
var quaternion = new System.Func<UnityEngine.Quaternion, object>(value => new { x = value.x, y = value.y, z = value.z, w = value.w });
var nodes = new System.Collections.Generic.List<object>();
var nodeIds = new System.Collections.Generic.HashSet<int>();
var addNode = new System.Action<UnityEngine.Transform>(transform =>
{
    var depth = 0;
    while (transform != null)
    {
        if (++depth > 512) throw new System.InvalidOperationException("The native transform ancestry exceeds the identity limit.");
        var go = transform.gameObject;
        var id = go.GetInstanceID();
        if (!nodeIds.Add(id)) return;
        var parent = transform.parent;
        nodes.Add(new
        {
            instanceId = id,
            sceneHandle = (int)go.scene.handle,
            name = go.name ?? "",
            parentInstanceId = parent == null ? (int?)null : parent.gameObject.GetInstanceID(),
            siblingIndex = transform.GetSiblingIndex(),
            localPosition = vector(transform.localPosition),
            localRotation = quaternion(transform.localRotation),
            localScale = vector(transform.localScale),
            position = vector(transform.position),
            activeSelf = go.activeSelf,
            activeInHierarchy = go.activeInHierarchy
        });
        transform = parent;
    }
});
var components = new System.Collections.Generic.List<object>();
var componentIds = new System.Collections.Generic.HashSet<int>();
var queries = new System.Collections.Generic.List<object>();
var nativeTypes = new System.Collections.Generic.Dictionary<System.IntPtr, System.Tuple<string, string>>();
var queryTypes = new[]
{
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.AI.NPCSpawner>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.AI.AdventurerPopulationManager>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.AI.AdventurerSpawnZone>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.World.InteractableObject>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.World.InteractiveNode>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.World.Chest>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.World.CraftingStation>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.World.PropertyForSaleSign>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.World.CorruptionAltar>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.World.InteractableTriggerObject>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2Cpp.ContainerObject>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.World.HeroicConsole>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.World.CharacterGraveyard>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2Cpp.EnhancedInteractableObject>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2Cpp.ActiveRequirement>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2Cpp.TimedActiveRequirement>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2Cpp.DisableRequirement>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2Cpp.RandomActivator>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2Cpp.InteractiveZone>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2Cpp.OreSpawner>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2Cpp.WorldQuestZone>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2Cpp.QuestScenePortal>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder.World.DungeonEntranceTrigger>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppMapMinimap.MapZone>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppMapMinimap.MapIcon>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2CppBLINK.RPGBuilder._THMSV.RPGBuilder.Scripts.World.Region>(),
    Il2CppInterop.Runtime.Il2CppType.Of<Il2Cpp.AddressableLoader>()
};
foreach (var queryType in queryTypes)
{
    var found = UnityEngine.Object.FindObjectsOfType(queryType, true);
    var queryIds = new System.Collections.Generic.List<int>(found.Length);
    for (var index = 0; index < found.Length; index++)
    {
        var component = found[index] == null ? null : found[index].TryCast<UnityEngine.Component>();
        if (component == null) throw new System.InvalidOperationException("A required identity query returned a missing component.");
        var id = component.GetInstanceID();
        queryIds.Add(id);
        if (!componentIds.Add(id)) continue;
        var go = component.gameObject;
        var nativeType = component.GetIl2CppType();
        System.Tuple<string, string> typeIdentity;
        if (!nativeTypes.TryGetValue(nativeType.Pointer, out typeIdentity))
        {
            typeIdentity = System.Tuple.Create(nativeType.FullName, nativeType.Assembly.GetName().Name);
            nativeTypes.Add(nativeType.Pointer, typeIdentity);
        }
        var siblings = go.GetComponents<UnityEngine.Component>();
        var slot = -1;
        for (var candidate = 0; candidate < siblings.Length; candidate++)
        {
            if (siblings[candidate] != null && siblings[candidate].GetInstanceID() == id) { slot = candidate; break; }
        }
        if (slot < 0) throw new System.InvalidOperationException("A native identity component is absent from its GameObject slots.");
        var behaviour = component.TryCast<UnityEngine.Behaviour>();
        addNode(component.transform);
        components.Add(new
        {
            instanceId = id,
            gameObjectInstanceId = go.GetInstanceID(),
            typeName = typeIdentity.Item1,
            assembly = typeIdentity.Item2,
            componentIndex = slot,
            enabled = behaviour == null ? (bool?)null : behaviour.enabled
        });
    }
    queries.Add(new { typeName = queryType.FullName, nativeCount = found.Length, componentInstanceIds = queryIds.ToArray() });
}

var flags = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic;
var loaderType = typeof(Il2Cpp.AddressableLoader);
var assetProperty = loaderType.GetProperty("loadedAsset", flags);
var handleProperty = loaderType.GetProperty("hasInstanceHandle", flags);
var holdProperty = loaderType.GetProperty("holdUntil", flags);
var loadedMethod = loaderType.GetMethod("IsAssetLoaded", flags);
var loadingMethod = loaderType.GetMethod("IsLoading", flags);
if (assetProperty == null || handleProperty == null || holdProperty == null || loadedMethod == null || loadingMethod == null)
    throw new System.InvalidOperationException("The installed loader does not expose the reviewed identity state.");
var streams = new System.Collections.Generic.List<object>();
foreach (var loader in UnityEngine.Object.FindObjectsOfType<Il2Cpp.AddressableLoader>(true))
{
    var root = (UnityEngine.GameObject)assetProperty.GetValue(loader);
    var rendererIds = new System.Collections.Generic.List<int>();
    if (root != null)
    {
        addNode(root.transform);
        foreach (var renderer in root.GetComponentsInChildren<UnityEngine.Renderer>(true)) rendererIds.Add(renderer.GetInstanceID());
    }
    streams.Add(new
    {
        componentInstanceId = loader.GetInstanceID(),
        assetGuid = loader.addressableAsset == null ? null : loader.addressableAsset.AssetGUID,
        loadedRootInstanceId = root == null ? (int?)null : root.GetInstanceID(),
        isLoaded = (bool)loadedMethod.Invoke(loader, null),
        isLoading = (bool)loadingMethod.Invoke(loader, null),
        hasInstanceHandle = (bool)handleProperty.GetValue(loader),
        enabled = loader.enabled,
        loadDistance = loader.loadDistance,
        unloadDistance = loader.UnloadDistance,
        holdUntil = (float)holdProperty.GetValue(loader),
        rendererInstanceIds = rendererIds.ToArray()
    });
}
return new
{
    schemaVersion = "compendium.placement-snapshot.v1",
    frame = UnityEngine.Time.frameCount,
    context = new
    {
        character = character.CharacterData.CharacterName,
        gameSceneNativeId = nativeScene.ID,
        scene = new { path = scene.path, name = scene.name, handle = (int)scene.handle, buildIndex = scene.buildIndex, isLoaded = scene.isLoaded },
        sceneInitialized = essentials.SceneInitialized,
        sceneLoading = loading.isSceneLoading,
        sceneReadyHolds = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.HasSceneReadyHolds
    },
    queries = queries.ToArray(),
    nodes = nodes.ToArray(),
    components = components.ToArray(),
    streams = streams.ToArray()
};
