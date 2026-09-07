var requestedAction = args == null ? (string)null : (string)args["action"];
if (requestedAction != "start" && requestedAction != "poll" && requestedAction != "restore")
    throw new System.ArgumentException("action must be start, poll, or restore.");

var sceneOwner = System.AppDomain.CurrentDomain.GetData("afallon-compendium.runtime-owner.v1") as System.Collections.Generic.Dictionary<string, object>;
if (sceneOwner == null || sceneOwner["state"] as string != "active")
    throw new System.OperationCanceledException("The runtime owner is no longer active.");
var sceneOwnerToken = sceneOwner["token"] as string;
if (sceneOwnerToken == null || sceneOwnerToken.Length == 0)
    throw new System.InvalidOperationException("The runtime owner token is missing.");

var activeStateKey = "afallon-compendium.scene-visit.active.v1";
var sceneVisitState = (System.Collections.Generic.Dictionary<string, object>)null;
var sceneVisitKey = (string)null;
var requestedResearchCharacter = (string)null;
var requestedResearchToken = args["researchCharacter"];
if (requestedResearchToken != null && requestedResearchToken.Type != Newtonsoft.Json.Linq.JTokenType.Null)
{
    if (requestedResearchToken.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrEmpty((string)requestedResearchToken))
        throw new System.ArgumentException("researchCharacter must be a non-empty string.");
    requestedResearchCharacter = (string)requestedResearchToken;
}
var requestedTargetToken = args["targetSceneNativeId"];
var requestedTargetId = -1;
if (requestedTargetToken != null && requestedTargetToken.Type != Newtonsoft.Json.Linq.JTokenType.Null)
{
    if (requestedTargetToken.Type != Newtonsoft.Json.Linq.JTokenType.Integer)
        throw new System.ArgumentException("targetSceneNativeId must be an integer.");
    requestedTargetId = requestedTargetToken.ToObject<int>();
    if (requestedTargetId < 0)
        throw new System.ArgumentException("targetSceneNativeId must be greater than or equal to zero.");
}

if (requestedAction == "start")
{
    if (requestedTargetToken == null || requestedTargetToken.Type == Newtonsoft.Json.Linq.JTokenType.Null)
        throw new System.ArgumentException("targetSceneNativeId is required for start.");
    if (requestedResearchCharacter == null || requestedResearchCharacter.Length == 0)
        throw new System.ArgumentException("researchCharacter is required for start.");

    if (System.AppDomain.CurrentDomain.GetData("afallon-compendium.stream-visit.active.v1") != null)
        throw new System.InvalidOperationException("Restore the active stream visit before starting a scene visit.");
    var priorKeyValue = System.AppDomain.CurrentDomain.GetData(activeStateKey);
    if (priorKeyValue != null)
    {
        var priorKey = priorKeyValue as string;
        if (priorKey == null || priorKey.Length == 0)
            throw new System.InvalidOperationException("The active scene visit state has an unexpected key type.");
        var priorState = System.AppDomain.CurrentDomain.GetData(priorKey) as System.Collections.Generic.Dictionary<string, object>;
        if (priorState == null)
            throw new System.InvalidOperationException("The active scene visit state is missing.");
        var priorOwnerToken = priorState["ownerToken"] as string;
        if (!string.Equals(priorOwnerToken, sceneOwnerToken, System.StringComparison.Ordinal))
            throw new System.InvalidOperationException("Another runtime owner already has an active scene visit.");
        throw new System.InvalidOperationException("This runtime owner already has an active scene visit.");
    }

    var character = Il2CppBLINK.RPGBuilder.Characters.Character.Instance;
    var characterData = character == null ? null : character.CharacterData;
    if (characterData == null || !characterData.IsCreated || characterData.CharacterName != requestedResearchCharacter)
        throw new System.InvalidOperationException("Load the configured research character before starting a scene visit.");

    var activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
    var sceneLoader = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.Instance;
    var sceneEssentials = Il2CppBLINK.RPGBuilder.LogicMono.RPGBuilderEssentials.Instance;
    var sourceNativeScene = Il2Cpp.GameState.CurrentGameScene;
    var player = Il2Cpp.GameState.playerEntity;
    var playerTransform = player == null ? null : player.transform;
    if (sourceNativeScene == null || sceneLoader == null || sceneEssentials == null || playerTransform == null)
        throw new System.InvalidOperationException("A loaded world scene and player are required before starting a scene visit.");
    if (!activeScene.isLoaded || !sceneEssentials.SceneInitialized || sceneLoader.isSceneLoading || Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.HasSceneReadyHolds)
        throw new System.InvalidOperationException("The source scene must be ready before starting a scene visit.");

    var database = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
    var databaseScenes = database == null ? null : database.GetGameScenes();
    if (databaseScenes == null || !databaseScenes.ContainsKey(requestedTargetId))
        throw new System.ArgumentException("targetSceneNativeId is not present in the runtime scene database.");
    var targetNativeScene = databaseScenes[requestedTargetId];
    if (targetNativeScene == null || targetNativeScene.ID != requestedTargetId)
        throw new System.ArgumentException("targetSceneNativeId does not resolve to a valid runtime scene record.");
    if (!databaseScenes.ContainsKey(sourceNativeScene.ID) || databaseScenes[sourceNativeScene.ID] == null || databaseScenes[sourceNativeScene.ID].ID != sourceNativeScene.ID)
        throw new System.InvalidOperationException("The current native scene is not present in the runtime scene database.");

    if (string.IsNullOrEmpty(targetNativeScene.entryName) || !UnityEngine.Application.CanStreamedLevelBeLoaded(targetNativeScene.entryName) ||
        string.IsNullOrEmpty(sourceNativeScene.entryName) || !UnityEngine.Application.CanStreamedLevelBeLoaded(sourceNativeScene.entryName))
        throw new System.InvalidOperationException("The target and original scene must both be available to the native scene loader.");

    sceneVisitKey = "afallon-compendium.scene-visit." + System.Guid.NewGuid().ToString("N");
    sceneVisitState = new System.Collections.Generic.Dictionary<string, object>();
    sceneVisitState["key"] = sceneVisitKey;
    sceneVisitState["ownerToken"] = sceneOwnerToken;
    sceneVisitState["researchCharacter"] = requestedResearchCharacter;
    sceneVisitState["phase"] = "loading";
    sceneVisitState["sourceSceneNativeId"] = sourceNativeScene.ID;
    sceneVisitState["sourceSceneHandle"] = activeScene.handle;
    sceneVisitState["sourceScenePath"] = activeScene.path;
    sceneVisitState["targetSceneNativeId"] = requestedTargetId;
    sceneVisitState["sourcePosition"] = playerTransform.position;
    sceneVisitState["sourceRotation"] = playerTransform.rotation;
    sceneVisitState["requestFrame"] = UnityEngine.Time.frameCount;
    sceneVisitState["restoreRequested"] = false;
    sceneVisitState["restoreRequestFrame"] = -1;

    var vector = new System.Func<UnityEngine.Vector3, object>(value => new { x = value.x, y = value.y, z = value.z });
    var quaternion = new System.Func<UnityEngine.Quaternion, object>(value => new { x = value.x, y = value.y, z = value.z, w = value.w });

    var readStatus = new System.Func<System.Collections.Generic.Dictionary<string, object>>(() =>
    {
        var currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
        var currentNativeScene = Il2Cpp.GameState.CurrentGameScene;
        var currentLoader = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.Instance;
        var currentEssentials = Il2CppBLINK.RPGBuilder.LogicMono.RPGBuilderEssentials.Instance;
        var ready = currentScene.isLoaded && currentLoader != null && currentEssentials != null && currentEssentials.SceneInitialized && !currentLoader.isSceneLoading && !Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.HasSceneReadyHolds;
        var currentPlayer = Il2Cpp.GameState.playerEntity;
        var currentTransform = currentPlayer == null ? null : currentPlayer.transform;
        var status = new System.Collections.Generic.Dictionary<string, object>();
        status["frame"] = UnityEngine.Time.frameCount;
        status["sceneHandle"] = currentScene.handle;
        status["sceneNativeId"] = currentNativeScene == null ? (object)null : currentNativeScene.ID;
        status["sceneReady"] = ready;
        var asyncLoad = currentLoader == null ? null : currentLoader.asyncLoad;
        var progressText = currentLoader == null ? null : currentLoader.loadingProgressText;
        status["readiness"] = new
        {
            sceneLoaded = currentScene.isLoaded,
            sceneInitialized = currentEssentials == null ? (bool?)null : currentEssentials.SceneInitialized,
            sceneLoading = currentLoader == null ? (bool?)null : currentLoader.isSceneLoading,
            sceneReadyHolds = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.HasSceneReadyHolds,
            restoreRequested = (bool)sceneVisitState["restoreRequested"],
            loadProgress = asyncLoad == null ? (float?)null : asyncLoad.progress,
            loadDone = asyncLoad == null ? (bool?)null : asyncLoad.isDone,
            allowSceneActivation = asyncLoad == null ? (bool?)null : asyncLoad.allowSceneActivation,
            progressText = progressText == null ? null : progressText.text,
            timeScale = UnityEngine.Time.timeScale,
            unscaledDeltaTime = UnityEngine.Time.unscaledDeltaTime
        };
        status["position"] = currentTransform == null ? (object)null : vector(currentTransform.position);
        status["rotation"] = currentTransform == null ? (object)null : quaternion(currentTransform.rotation);
        return status;
    });

    var restore = new System.Func<bool>(() =>
    {
        var currentPhase = sceneVisitState["phase"] as string;
        if (currentPhase != "restored")
            sceneVisitState["phase"] = "restoring";

        var currentLoader = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.Instance;
        var currentEssentials = Il2CppBLINK.RPGBuilder.LogicMono.RPGBuilderEssentials.Instance;
        if (currentLoader == null || currentEssentials == null || currentLoader.isSceneLoading)
            return false;

        var currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
        var currentNativeScene = Il2Cpp.GameState.CurrentGameScene;
        if (!currentScene.isLoaded || !currentEssentials.SceneInitialized || Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.HasSceneReadyHolds)
            return false;
        var restoringCharacter = Il2CppBLINK.RPGBuilder.Characters.Character.Instance;
        if (restoringCharacter == null || restoringCharacter.CharacterData == null || !restoringCharacter.CharacterData.IsCreated || restoringCharacter.CharacterData.CharacterName != (string)sceneVisitState["researchCharacter"])
            throw new System.InvalidOperationException("Scene restoration cannot change another research character.");
        var sourceId = (int)sceneVisitState["sourceSceneNativeId"];
        var currentNativeId = currentNativeScene == null ? -1 : currentNativeScene.ID;
        if (currentNativeId != sourceId)
        {
            var restoreRequested = (bool)sceneVisitState["restoreRequested"];
            if (!restoreRequested)
            {
                sceneVisitState["restoreRequested"] = true;
                sceneVisitState["restoreRequestFrame"] = UnityEngine.Time.frameCount;
                currentLoader.LoadGameScene(sourceId);
            }
            return false;
        }

        if ((bool)sceneVisitState["restoreRequested"] && UnityEngine.Time.frameCount <= (int)sceneVisitState["restoreRequestFrame"])
            return false;

        if (currentScene.path != (string)sceneVisitState["sourceScenePath"])
            throw new System.InvalidOperationException("The restored native scene has a different source scene path.");
        var currentPlayer = Il2Cpp.GameState.playerEntity;
        var currentTransform = currentPlayer == null ? null : currentPlayer.transform;
        if (currentTransform == null)
            return false;
        var sourcePosition = (UnityEngine.Vector3)sceneVisitState["sourcePosition"];
        var sourceRotation = (UnityEngine.Quaternion)sceneVisitState["sourceRotation"];
        currentTransform.position = sourcePosition;
        currentTransform.rotation = sourceRotation;
        if ((currentTransform.position - sourcePosition).sqrMagnitude > 0.000001f || UnityEngine.Quaternion.Angle(currentTransform.rotation, sourceRotation) > 0.05f)
            throw new System.InvalidOperationException("The player transform did not accept its original position and rotation.");
        sceneVisitState["phase"] = "restored";
        return true;
    });

    var dropState = new System.Action(() =>
    {
        if ((sceneVisitState["phase"] as string) != "restored")
            throw new System.InvalidOperationException("Scene visit state cannot be dropped before restoration succeeds.");
        if (string.Equals(System.AppDomain.CurrentDomain.GetData(activeStateKey) as string, sceneVisitKey, System.StringComparison.Ordinal))
            System.AppDomain.CurrentDomain.SetData(activeStateKey, null);
        if (object.ReferenceEquals(System.AppDomain.CurrentDomain.GetData(sceneVisitKey), sceneVisitState))
            System.AppDomain.CurrentDomain.SetData(sceneVisitKey, null);
    });

    var unregisterDropState = (System.Action)null;
    var unregisterRestore = (System.Action)null;
    try
    {
        unregisterDropState = registerRuntimeCleanup(dropState);
        unregisterRestore = registerRuntimeCleanupWait(restore);
    }
    catch (System.Exception)
    {
        if (unregisterRestore != null) unregisterRestore();
        if (unregisterDropState != null) unregisterDropState();
        throw;
    }
    sceneVisitState["status"] = readStatus;
    sceneVisitState["restore"] = restore;
    var finalize = new System.Action(() =>
    {
        if ((sceneVisitState["phase"] as string) != "restored")
            throw new System.InvalidOperationException("A scene visit can be finalized only after restoration succeeds.");
        if (unregisterRestore != null) unregisterRestore();
        if (unregisterDropState != null) unregisterDropState();
        dropState();
    });
    sceneVisitState["finalize"] = finalize;
    System.AppDomain.CurrentDomain.SetData(sceneVisitKey, sceneVisitState);
    System.AppDomain.CurrentDomain.SetData(activeStateKey, sceneVisitKey);

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
            sceneNativeId = observed["sceneNativeId"],
            sceneReady = (bool)observed["sceneReady"],
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
        if ((int)observed["frame"] > requestedFrame && observedNativeId == (int)sceneVisitState["targetSceneNativeId"] && (bool)observed["sceneReady"])
            sceneVisitState["phase"] = "ready";
    }
    return reportDelegate();
}

var restored = restoreDelegate();
if (!restored)
    return reportDelegate();
var restoredReport = reportDelegate();
finalizeDelegate();
return restoredReport;