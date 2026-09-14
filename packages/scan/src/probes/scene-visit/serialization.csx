
    sceneVisitState["report"] = new System.Func<object>(() =>
    {
        var observed = readStatus();
        return new
        {
            key = sceneVisitKey,
            phase = sceneVisitState["phase"] as string,
            frame = (int)observed["frame"],
            sceneHandle = (int)observed["sceneHandle"],
            sourceSceneNativeId = (int)sceneVisitState["sourceSceneNativeId"],
            sourceSceneHandle = (int)sceneVisitState["sourceSceneHandle"],
            targetSceneNativeId = (int)sceneVisitState["targetSceneNativeId"],
            finalSceneNativeId = (int)sceneVisitState["finalSceneNativeId"],
            sceneNativeId = observed["sceneNativeId"],
            sceneReady = (bool)observed["sceneReady"],
            sceneName = observed["sceneName"],
            loadedScenes = observed["loadedScenes"],
            readiness = observed["readiness"],
            sourcePosition = vector((UnityEngine.Vector3)sceneVisitState["sourcePosition"]),
            position = observed["position"],
            sourceRotation = quaternion((UnityEngine.Quaternion)sceneVisitState["sourceRotation"]),
            rotation = observed["rotation"]
        };
    });

    if (requestedTargetId != sourceNativeScene.ID)
        sceneLoader.LoadGameScene(requestedTargetId);
    return ((System.Func<object>)sceneVisitState["report"])();
}

if (requestedAction == "retarget")
{
    if (requestedTargetToken == null || requestedTargetToken.Type == Newtonsoft.Json.Linq.JTokenType.Null)
        throw new System.ArgumentException("targetSceneNativeId is required for retarget.");
    var retargetKeyToken = args["key"];
    if (retargetKeyToken == null || retargetKeyToken.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrEmpty((string)retargetKeyToken))
        throw new System.ArgumentException("key is required for retarget.");
    sceneVisitKey = (string)retargetKeyToken;
    sceneVisitState = System.AppDomain.CurrentDomain.GetData(sceneVisitKey) as System.Collections.Generic.Dictionary<string, object>;
    if (sceneVisitState == null) throw new System.InvalidOperationException("The scene visit key is unknown or has already been restored.");
    if (!string.Equals(sceneVisitState["ownerToken"] as string, sceneOwnerToken, System.StringComparison.Ordinal))
        throw new System.InvalidOperationException("The scene visit belongs to another runtime owner.");
    if ((sceneVisitState["phase"] as string) != "ready") throw new System.InvalidOperationException("Retarget requires a ready scene visit.");
    if (System.AppDomain.CurrentDomain.GetData("afallon-compendium.stream-visit.active.v1") != null)
        throw new System.InvalidOperationException("Restore the active stream visit before retargeting a scene visit.");
    var retargetDatabase = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
    var retargetScenes = retargetDatabase == null ? null : retargetDatabase.GetGameScenes();
    if (retargetScenes == null || !retargetScenes.ContainsKey(requestedTargetId) || retargetScenes[requestedTargetId] == null || retargetScenes[requestedTargetId].ID != requestedTargetId)
        throw new System.ArgumentException("targetSceneNativeId is not present in the runtime scene database.");
    var retargetNativeScene = retargetScenes[requestedTargetId];
    if (string.IsNullOrEmpty(retargetNativeScene.entryName) || !UnityEngine.Application.CanStreamedLevelBeLoaded(retargetNativeScene.entryName))
        throw new System.InvalidOperationException("The retarget scene must be available to the native scene loader.");
    var retargetLoader = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.Instance;
    var retargetCurrentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
    var retargetEssentials = Il2CppBLINK.RPGBuilder.LogicMono.RPGBuilderEssentials.Instance;
    if (retargetLoader == null || retargetEssentials == null || !retargetCurrentScene.isLoaded || !retargetEssentials.SceneInitialized || retargetLoader.isSceneLoading || Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.HasSceneReadyHolds)
        throw new System.InvalidOperationException("The current scene must be ready before retargeting.");
    sceneVisitState["targetSceneNativeId"] = requestedTargetId;
    sceneVisitState["targetSceneName"] = retargetNativeScene.entryName;
    sceneVisitState["phase"] = "loading";
    sceneVisitState["requestFrame"] = UnityEngine.Time.frameCount;
    sceneVisitState["restoreRequested"] = false;
    sceneVisitState["restoreRequestFrame"] = -1;
    if (retargetCurrentScene.name != retargetNativeScene.entryName)
        retargetLoader.LoadGameScene(requestedTargetId);
    return ((System.Func<object>)sceneVisitState["report"])();
}

var keyToken = args["key"];
if (keyToken == null || keyToken.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrEmpty((string)keyToken))
    throw new System.ArgumentException("key is required for poll and restore.");
sceneVisitKey = (string)keyToken;
sceneVisitState = System.AppDomain.CurrentDomain.GetData(sceneVisitKey) as System.Collections.Generic.Dictionary<string, object>;
if (sceneVisitState == null)
    throw new System.InvalidOperationException("The scene visit key is unknown or has already been restored.");
var stateOwnerToken = sceneVisitState["ownerToken"] as string;
if (!string.Equals(stateOwnerToken, sceneOwnerToken, System.StringComparison.Ordinal))
    throw new System.InvalidOperationException("The scene visit belongs to another runtime owner.");
if (requestedResearchCharacter != null && !string.Equals(requestedResearchCharacter, sceneVisitState["researchCharacter"] as string, System.StringComparison.Ordinal))
    throw new System.ArgumentException("researchCharacter does not match the scene visit key.");
if (requestedTargetToken != null && requestedTargetToken.Type != Newtonsoft.Json.Linq.JTokenType.Null && requestedTargetId != (int)sceneVisitState["targetSceneNativeId"])
    throw new System.ArgumentException("targetSceneNativeId does not match the scene visit key.");

var statusDelegate = sceneVisitState["status"] as System.Func<System.Collections.Generic.Dictionary<string, object>>;
var reportDelegate = sceneVisitState["report"] as System.Func<object>;
var restoreDelegate = sceneVisitState["restore"] as System.Func<bool>;
var finalizeDelegate = sceneVisitState["finalize"] as System.Action;
if (statusDelegate == null || reportDelegate == null || restoreDelegate == null || finalizeDelegate == null)
    throw new System.InvalidOperationException("The scene visit state is incomplete.");

if (requestedAction == "poll")
{
    var statePhase = sceneVisitState["phase"] as string;
    if (statePhase == "restoring")
    {
        var pollRestoreDone = restoreDelegate();
        if (pollRestoreDone)
        {
            var pollRestoredReport = reportDelegate();
            finalizeDelegate();
            return pollRestoredReport;
        }
        return reportDelegate();
    }
    if (statePhase == "loading")
    {
        var observed = statusDelegate();
        var requestedFrame = (int)sceneVisitState["requestFrame"];
        var observedNativeId = observed["sceneNativeId"] == null ? -1 : (int)observed["sceneNativeId"];
        var observedName = observed["sceneName"] as string;
        var targetReached = observedNativeId == (int)sceneVisitState["targetSceneNativeId"] || observedName == (sceneVisitState["targetSceneName"] as string);
        if (targetReached) sceneVisitState["sawTargetScene"] = true;
        if ((int)observed["frame"] > requestedFrame && targetReached && (bool)observed["sceneReady"])
        {
            placeAtCapturePosition();
            sceneVisitState["phase"] = hasCapturePosition ? "settling" : "ready";
        }
        // A challenge-stone scene loads and then the game reloads its parent at once: the target
        // was seen, and the source scene is ready again. Such a scene is not reachable by loading
        // it, which the visit reports instead of polling to its deadline.
        else if ((bool)sceneVisitState["sawTargetScene"] && (int)observed["frame"] > requestedFrame && (bool)observed["sceneReady"] && observedName == (sceneVisitState["sourceSceneName"] as string))
        {
            sceneVisitState["phase"] = "returned";
        }
    }
    if ((sceneVisitState["phase"] as string) == "settling")
    {
        // Placing the player starts every loader that finds the player within its load distance.
        // The ground under the capture position is one of them, so the player is re-placed on
        // every poll until each such loader holds its loaded asset; then the scene is static.
        var flags = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic;
        var loaderType = typeof(Il2Cpp.AddressableLoader);
        var loadingMethod = loaderType.GetMethod("IsLoading", flags, null, System.Type.EmptyTypes, null);
        var withinMethod = loaderType.GetMethod("PlayerIsWithin", flags, null, new System.Type[] { typeof(float) }, null);
        var assetProperty = loaderType.GetProperty("loadedAsset", flags);
        var handleProperty = loaderType.GetProperty("hasInstanceHandle", flags);
        if (loadingMethod == null || withinMethod == null || assetProperty == null || handleProperty == null) throw new System.InvalidOperationException("AddressableLoader state members are unavailable.");
        var pendingLoaders = 0;
        foreach (var loader in UnityEngine.Object.FindObjectsOfType<Il2Cpp.AddressableLoader>(false))
        {
            if (loader == null || !loader.enabled || !loader.gameObject.activeInHierarchy) continue;
            if (!(bool)withinMethod.Invoke(loader, new object[] { System.Math.Max(0f, loader.loadDistance) })) continue;
            var loaded = assetProperty.GetValue(loader) != null && (bool)handleProperty.GetValue(loader) && !(bool)loadingMethod.Invoke(loader, null);
            if (!loaded) pendingLoaders++;
        }
        sceneVisitState["settlingLoaders"] = pendingLoaders;
        placeAtCapturePosition();
        var placedFrame = sceneVisitState.ContainsKey("placedFrame") ? (int)sceneVisitState["placedFrame"] : UnityEngine.Time.frameCount;
        if (!sceneVisitState.ContainsKey("placedFrame")) sceneVisitState["placedFrame"] = placedFrame;
        if (pendingLoaders == 0 && UnityEngine.Time.frameCount > placedFrame + 30) sceneVisitState["phase"] = "ready";
    }
    return reportDelegate();
}

var restored = restoreDelegate();
if (!restored)
    return reportDelegate();
var restoredReport = reportDelegate();
finalizeDelegate();
return restoredReport;