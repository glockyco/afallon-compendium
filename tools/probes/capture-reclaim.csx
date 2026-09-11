var requestedAction = args == null ? (string)null : (string)args["action"];
if (requestedAction != "start" && requestedAction != "poll")
    throw new System.ArgumentException("action must be start or poll.");

var owner = System.AppDomain.CurrentDomain.GetData("afallon-compendium.runtime-owner.v1") as System.Collections.Generic.Dictionary<string, object>;
if (owner == null || owner["state"] as string != "active")
    throw new System.OperationCanceledException("Runtime ownership is no longer active.");
var ownerToken = owner["token"] as string;
if (string.IsNullOrEmpty(ownerToken)) throw new System.InvalidOperationException("The runtime owner token is missing.");

var stateKeyName = "afallon-compendium.capture-reclamation.active.v1";
var requestedKeyToken = args["key"];
var requestedKey = requestedKeyToken == null || requestedKeyToken.Type == Newtonsoft.Json.Linq.JTokenType.Null ? null : (string)requestedKeyToken;
var stateKey = (string)null;
var state = (System.Collections.Generic.Dictionary<string, object>)null;

System.Func<object> metrics = () =>
{
    var objects = UnityEngine.Resources.FindObjectsOfTypeAll<UnityEngine.Object>();
    var gameObjects = UnityEngine.Resources.FindObjectsOfTypeAll<UnityEngine.GameObject>();
    var components = UnityEngine.Resources.FindObjectsOfTypeAll<UnityEngine.Component>();
    var textures = UnityEngine.Resources.FindObjectsOfTypeAll<UnityEngine.Texture>();
    var renderTextures = UnityEngine.Resources.FindObjectsOfTypeAll<UnityEngine.RenderTexture>();
    var materials = UnityEngine.Resources.FindObjectsOfTypeAll<UnityEngine.Material>();
    var meshes = UnityEngine.Resources.FindObjectsOfTypeAll<UnityEngine.Mesh>();
    return new
    {
        unityAllocatedBytes = checked((long)UnityEngine.Profiling.Profiler.GetTotalAllocatedMemoryLong()),
        unityReservedBytes = checked((long)UnityEngine.Profiling.Profiler.GetTotalReservedMemoryLong()),
        unityUnusedReservedBytes = checked((long)UnityEngine.Profiling.Profiler.GetTotalUnusedReservedMemoryLong()),
        textureMemoryBytes = checked((long)UnityEngine.Texture.currentTextureMemory),
        unityObjectCount = objects.Length,
        gameObjectCount = gameObjects.Length,
        componentCount = components.Length,
        textureCount = textures.Length,
        renderTextureCount = renderTextures.Length,
        materialCount = materials.Length,
        meshCount = meshes.Length,
        gcCollection0 = System.GC.CollectionCount(0),
        gcCollection1 = System.GC.CollectionCount(1),
        gcCollection2 = System.GC.CollectionCount(2),
    };
};

System.Func<object> report = () => new
{
    schemaVersion = "compendium.capture-reclamation.v4",
    key = state["key"] as string,
    ownerToken = ownerToken,
    sceneNativeId = (int)state["sceneNativeId"],
    sceneHandle = (int)state["sceneHandle"],
    phase = state["phase"] as string,
    startedFrame = (int)state["startedFrame"],
    completedFrame = state["completedFrame"],
    before = state["before"],
    after = state["after"],
};

if (requestedAction == "start")
{
    if (requestedKey != null) throw new System.ArgumentException("key is not accepted for start.");
    if (System.AppDomain.CurrentDomain.GetData("afallon-compendium.stream-visit.active.v1") != null)
        throw new System.InvalidOperationException("Release active stream roots before reclaiming memory.");
    var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
    var nativeScene = Il2Cpp.GameState.CurrentGameScene;
    var loader = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.Instance;
    var essentials = Il2CppBLINK.RPGBuilder.LogicMono.RPGBuilderEssentials.Instance;
    if (!scene.isLoaded || nativeScene == null || loader == null || essentials == null || !essentials.SceneInitialized || loader.isSceneLoading || Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.HasSceneReadyHolds)
        throw new System.InvalidOperationException("Memory reclamation requires a ready scene with no loading holds.");

    var generatedKey = "afallon-compendium.capture-reclamation." + System.Guid.NewGuid().ToString("N");
    stateKey = generatedKey;
    state = new System.Collections.Generic.Dictionary<string, object>();
    state["key"] = generatedKey;
    state["ownerToken"] = ownerToken;
    state["sceneNativeId"] = nativeScene.ID;
    state["sceneHandle"] = scene.handle;
    state["phase"] = "unloading";
    state["startedFrame"] = UnityEngine.Time.frameCount;
    state["completedFrame"] = null;
    state["before"] = metrics();
    state["after"] = null;
    state["operation"] = UnityEngine.Resources.UnloadUnusedAssets();
    System.Action unregister = null;
    System.Func<bool> finish = null;
    finish = () =>
    {
        if ((string)state["phase"] == "complete") return true;
        var operation = state["operation"] as UnityEngine.AsyncOperation;
        if (operation == null || !operation.isDone) return false;
        System.GC.Collect();
        System.GC.WaitForPendingFinalizers();
        System.GC.Collect();
        state["after"] = metrics();
        state["completedFrame"] = UnityEngine.Time.frameCount;
        state["phase"] = "complete";
        if (unregister != null)
        {
            unregister();
            unregister = null;
        }
        if (string.Equals(System.AppDomain.CurrentDomain.GetData(stateKeyName) as string, stateKey, System.StringComparison.Ordinal))
            System.AppDomain.CurrentDomain.SetData(stateKeyName, null);
        if (object.ReferenceEquals(System.AppDomain.CurrentDomain.GetData(stateKey), state))
            System.AppDomain.CurrentDomain.SetData(stateKey, null);
        return true;
    };
    unregister = registerRuntimeCleanupWait(finish);
    state["finish"] = finish;
    System.AppDomain.CurrentDomain.SetData(stateKey, state);
    System.AppDomain.CurrentDomain.SetData(stateKeyName, stateKey);
    return report();
}

if (requestedKey == null || requestedKey.Length == 0) throw new System.ArgumentException("key is required for poll.");
stateKey = requestedKey;
state = System.AppDomain.CurrentDomain.GetData(stateKey) as System.Collections.Generic.Dictionary<string, object>;
if (state == null) throw new System.InvalidOperationException("The reclamation key is unknown or has already completed.");
if (!string.Equals(state["ownerToken"] as string, ownerToken, System.StringComparison.Ordinal))
    throw new System.InvalidOperationException("The reclamation belongs to another runtime owner.");
var finishDelegate = state["finish"] as System.Func<bool>;
if (finishDelegate == null) throw new System.InvalidOperationException("The reclamation state is incomplete.");
finishDelegate();
return report();
