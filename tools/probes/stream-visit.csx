var actionToken = args["action"];
if (actionToken == null || actionToken.Type != Newtonsoft.Json.Linq.JTokenType.String)
    throw new System.ArgumentException("action must be start, poll, or restore.");
var action = (string)actionToken;
if (action != "start" && action != "poll" && action != "restore")
    throw new System.ArgumentException("action must be start, poll, or restore.");

var sceneHandleToken = args["sceneHandle"];
if (sceneHandleToken == null || sceneHandleToken.Type != Newtonsoft.Json.Linq.JTokenType.Integer)
    throw new System.ArgumentException("sceneHandle must be an integer.");
var sceneHandleLong = sceneHandleToken.ToObject<long>();
if (sceneHandleLong < int.MinValue || sceneHandleLong > int.MaxValue)
    throw new System.ArgumentException("sceneHandle must fit in Int32.");
var requestedSceneHandle = (int)sceneHandleLong;

var researchCharacterToken = args["researchCharacter"];
if (researchCharacterToken == null || researchCharacterToken.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrEmpty((string)researchCharacterToken))
    throw new System.ArgumentException("researchCharacter must be a non-empty string.");
var requestedResearchCharacter = (string)researchCharacterToken;

var streamOwner = System.AppDomain.CurrentDomain.GetData("afallon-compendium.runtime-owner.v1") as System.Collections.Generic.Dictionary<string, object>;
if (streamOwner == null || streamOwner["token"] as string == null || streamOwner["state"] as string != "active")
    throw new System.OperationCanceledException("Runtime ownership is no longer active.");
var ownerToken = streamOwner["token"] as string;

var activeStateDataKey = "afallon-compendium.stream-visit.active.v1";
var loaderType = typeof(Il2Cpp.AddressableLoader);
var reflectionFlags = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic;
var publicInstanceFlags = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public;
var assetProperty = loaderType.GetProperty("loadedAsset", reflectionFlags);
var holdProperty = loaderType.GetProperty("holdUntil", reflectionFlags);
var handleProperty = loaderType.GetProperty("hasInstanceHandle", reflectionFlags);
var loadingMethod = loaderType.GetMethod("IsLoading", reflectionFlags, null, System.Type.EmptyTypes, null);
var preloadMethod = loaderType.GetMethod("Preload", publicInstanceFlags, null, System.Type.EmptyTypes, null);
var releaseMethod = loaderType.GetMethod("ReleaseForDisableOrDestroy", reflectionFlags, null, System.Type.EmptyTypes, null);
var playerWithinMethod = loaderType.GetMethod("PlayerIsWithin", reflectionFlags, null, new System.Type[] { typeof(float) }, null);
if (playerWithinMethod == null || playerWithinMethod.IsStatic || playerWithinMethod.ReturnType != typeof(bool))
    throw new System.InvalidOperationException("The native automatic-load range check is unavailable.");
if (assetProperty == null || !assetProperty.CanRead || holdProperty == null || !holdProperty.CanRead || !holdProperty.CanWrite || handleProperty == null || !handleProperty.CanRead || loadingMethod == null || loadingMethod.IsStatic || loadingMethod.ReturnType != typeof(bool) || preloadMethod == null || preloadMethod.IsStatic || releaseMethod == null || releaseMethod.IsStatic)
    throw new System.InvalidOperationException("The reviewed AddressableLoader state and instance operations are unavailable.");
if (loadingMethod.ReturnType != typeof(bool) || releaseMethod.ReturnType != typeof(void) || preloadMethod.ReturnType != typeof(void))
    throw new System.InvalidOperationException("The reviewed AddressableLoader operation signatures changed.");

var getAsset = new System.Func<Il2Cpp.AddressableLoader, UnityEngine.GameObject>(loader => (UnityEngine.GameObject)assetProperty.GetValue(loader));
var getLoading = new System.Func<Il2Cpp.AddressableLoader, bool>(loader => (bool)loadingMethod.Invoke(loader, null));
var getHandle = new System.Func<Il2Cpp.AddressableLoader, bool>(loader => (bool)handleProperty.GetValue(loader));
var getHold = new System.Func<Il2Cpp.AddressableLoader, float>(loader => (float)holdProperty.GetValue(loader));
var setHold = new System.Action<Il2Cpp.AddressableLoader, float>((loader, value) => holdProperty.SetValue(loader, value));

var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var essentials = Il2CppBLINK.RPGBuilder.LogicMono.RPGBuilderEssentials.Instance;
var loadingScreen = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.Instance;
var nativeScene = Il2Cpp.GameState.CurrentGameScene;
var playerEntity = Il2Cpp.GameState.playerEntity;
var requireCharacter = new System.Action(() =>
{
    var currentCharacter = Il2CppBLINK.RPGBuilder.Characters.Character.Instance;
    if (currentCharacter == null || currentCharacter.CharacterData == null || !currentCharacter.CharacterData.IsCreated || currentCharacter.CharacterData.CharacterName != requestedResearchCharacter)
        throw new System.InvalidOperationException("The loaded research character does not match researchCharacter.");
});
var sceneIsReady = new System.Func<bool>(() =>
{
    var currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
    var currentEssentials = Il2CppBLINK.RPGBuilder.LogicMono.RPGBuilderEssentials.Instance;
    var currentLoading = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.Instance;
    return currentScene.isLoaded && currentEssentials != null && currentEssentials.SceneInitialized && currentLoading != null && !currentLoading.isSceneLoading && !Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.HasSceneReadyHolds;
});
var ensureSameScene = new System.Action<System.Collections.Generic.Dictionary<string, object>>((state) =>
{
    var currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
    if (!currentScene.isLoaded || currentScene.handle != (int)state["sceneHandle"] || currentScene.path != (string)state["scenePath"])
        throw new System.InvalidOperationException("The active scene changed during the stream visit.");
    var expectedNativeIdValue = state["nativeSceneId"];
    var currentNativeScene = Il2Cpp.GameState.CurrentGameScene;
    if (expectedNativeIdValue != null)
    {
        if (currentNativeScene == null || (int)currentNativeScene.ID != (int)expectedNativeIdValue)
            throw new System.InvalidOperationException("The native game scene changed during the stream visit.");
    }
});
var makePosition = new System.Func<UnityEngine.Vector3, object>(value => new { x = value.x, y = value.y, z = value.z });

if (action == "start")
{
    var cleanupPathToken = args["cleanupPath"];
    if (cleanupPathToken == null || cleanupPathToken.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrEmpty((string)cleanupPathToken))
        throw new System.ArgumentException("cleanupPath must be a non-empty path.");
    var cleanupPath = System.IO.Path.GetFullPath((string)cleanupPathToken);
    var cleanupDirectory = System.IO.Path.GetDirectoryName(cleanupPath);
    if (string.IsNullOrEmpty(cleanupDirectory)) throw new System.ArgumentException("cleanupPath must have a directory.");
    if (System.IO.File.Exists(cleanupPath)) throw new System.IO.IOException("The stream cleanup receipt already exists.");
    System.IO.Directory.CreateDirectory(cleanupDirectory);

    var holdSecondsToken = args["holdSeconds"];
    if (holdSecondsToken == null || (holdSecondsToken.Type != Newtonsoft.Json.Linq.JTokenType.Integer && holdSecondsToken.Type != Newtonsoft.Json.Linq.JTokenType.Float))
        throw new System.ArgumentException("holdSeconds must be a number.");
    var holdSeconds = holdSecondsToken.ToObject<double>();
    if (double.IsNaN(holdSeconds) || double.IsInfinity(holdSeconds) || holdSeconds < 1.0 || holdSeconds > 360.0)
        throw new System.ArgumentException("holdSeconds must be between 1 and 360 seconds.");
    var holdSecondsFloat = (float)holdSeconds;

    var idsToken = args["loaderInstanceIds"] as Newtonsoft.Json.Linq.JArray;
    if (idsToken == null || idsToken.Count < 1 || idsToken.Count > 256)
        throw new System.ArgumentException("loaderInstanceIds must contain 1 to 256 unique integers.");
    var requestedLoaderIds = new System.Collections.Generic.List<int>();
    var requestedLoaderIdSet = new System.Collections.Generic.HashSet<int>();
    foreach (var idToken in idsToken)
    {
        if (idToken == null || idToken.Type != Newtonsoft.Json.Linq.JTokenType.Integer)
            throw new System.ArgumentException("loaderInstanceIds must contain only integers.");
        var idLong = idToken.ToObject<long>();
        if (idLong < int.MinValue || idLong > int.MaxValue)
            throw new System.ArgumentException("loaderInstanceIds must contain Int32 values.");
        var loaderId = (int)idLong;
        if (!requestedLoaderIdSet.Add(loaderId))
            throw new System.ArgumentException("loaderInstanceIds must be unique.");
        requestedLoaderIds.Add(loaderId);
    }

    var priorActiveKeyValue = System.AppDomain.CurrentDomain.GetData(activeStateDataKey);
    if (priorActiveKeyValue != null)
    {
        var priorActiveKey = priorActiveKeyValue as string;
        if (priorActiveKey == null)
            throw new System.InvalidOperationException("The active stream visit state has an unexpected type.");
        var priorActiveState = System.AppDomain.CurrentDomain.GetData(priorActiveKey) as System.Collections.Generic.Dictionary<string, object>;
        if (priorActiveState == null)
            throw new System.InvalidOperationException("The active stream visit state is missing.");
        var priorOwnerToken = priorActiveState["ownerToken"] as string;
        if (priorOwnerToken != ownerToken)
            throw new System.InvalidOperationException("Another runtime owner already controls a stream visit.");
        throw new System.InvalidOperationException("This runtime owner already controls a stream visit.");
    }

    if (scene.handle != requestedSceneHandle || !scene.isLoaded)
        throw new System.InvalidOperationException("sceneHandle must identify the loaded active scene.");
    requireCharacter();
    if (essentials == null || !essentials.SceneInitialized || loadingScreen == null || loadingScreen.isSceneLoading || Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.HasSceneReadyHolds || nativeScene == null)
        throw new System.InvalidOperationException("The active scene must be initialized and ready before streaming.");
    if (playerEntity == null || playerEntity.transform == null)
        throw new System.InvalidOperationException("GameState.playerEntity.transform is required for stream traversal.");

    var allLoaders = UnityEngine.Object.FindObjectsOfType<Il2Cpp.AddressableLoader>(true);
    var loadersById = new System.Collections.Generic.Dictionary<int, Il2Cpp.AddressableLoader>();
    foreach (var candidate in allLoaders)
    {
        if (candidate == null) continue;
        var candidateId = candidate.GetInstanceID();
        if (loadersById.ContainsKey(candidateId)) throw new System.InvalidOperationException("The native loader query returned a duplicate instance ID.");
        loadersById.Add(candidateId, candidate);
    }
    var rows = new System.Collections.Generic.List<System.Collections.Generic.Dictionary<string, object>>();
    foreach (var requestedLoaderId in requestedLoaderIds)
    {
        Il2Cpp.AddressableLoader target;
        if (!loadersById.TryGetValue(requestedLoaderId, out target))
            throw new System.InvalidOperationException("A requested AddressableLoader was not found in the current loaded objects.");
        if (target.gameObject == null || target.gameObject.scene.handle != scene.handle)
            throw new System.InvalidOperationException("A requested AddressableLoader belongs to a foreign scene.");
        if (target.addressableAsset == null || string.IsNullOrEmpty(target.addressableAsset.AssetGUID))
            throw new System.InvalidOperationException("A requested AddressableLoader has no valid addressable asset GUID.");
        if (getLoading(target))
            throw new System.InvalidOperationException("A requested AddressableLoader is already loading.");
        if (target.transform == null)
            throw new System.InvalidOperationException("A requested AddressableLoader has no transform.");

        var initialRoot = getAsset(target);
        var initialHandle = getHandle(target);
        if ((initialRoot != null) != initialHandle)
            throw new System.InvalidOperationException("A requested AddressableLoader has inconsistent root and instance-handle state.");
        if (initialRoot == null && target.gameObject.activeInHierarchy && target.enabled &&
            (bool)playerWithinMethod.Invoke(target, new object[] { System.Math.Max(0f, target.loadDistance) }))
            throw new System.InvalidOperationException("A requested near-player loader has not settled its automatic load. Wait for native streaming before starting the visit.");
        var row = new System.Collections.Generic.Dictionary<string, object>();
        row["loader"] = target;
        row["loaderInstanceId"] = requestedLoaderId;
        row["assetGuid"] = target.addressableAsset.AssetGUID;
        row["initiallyLoaded"] = initialRoot != null;
        row["initialRoot"] = initialRoot;
        row["initialRootInstanceId"] = initialRoot == null ? (int?)null : (int?)initialRoot.GetInstanceID();
        row["originalHoldUntil"] = getHold(target);
        row["skippedReason"] = !target.gameObject.activeInHierarchy ? "inactive" : (!target.enabled ? "disabled" : null);
        row["releaseRequested"] = false;
        row["ownedRoot"] = null;
        row["preloadRequested"] = false;
        row["holdChanged"] = false;
        rows.Add(row);
    }

    var key = "afallon-compendium.stream-visit." + System.Guid.NewGuid().ToString("N");
    var state = new System.Collections.Generic.Dictionary<string, object>();
    state["key"] = key;
    state["ownerToken"] = ownerToken;
    state["sceneHandle"] = requestedSceneHandle;
    state["scenePath"] = scene.path;
    state["nativeSceneId"] = nativeScene.ID;
    state["researchCharacter"] = requestedResearchCharacter;
    state["rows"] = rows;
    state["phase"] = "loading";
    state["readyObservedFrame"] = -1;
    state["restoreRequestedFrame"] = -1;

    var currentRow = new System.Func<System.Collections.Generic.Dictionary<string, object>, object>(row =>
    {
        var target = row["loader"] as Il2Cpp.AddressableLoader;
        if (target == null || target.gameObject == null || target.transform == null)
            throw new System.InvalidOperationException("A stream visit loader disappeared.");
        var currentPlayer = Il2Cpp.GameState.playerEntity;
        if (currentPlayer == null || currentPlayer.transform == null)
            throw new System.InvalidOperationException("The stream visit player disappeared.");
        if (target.addressableAsset == null || target.addressableAsset.AssetGUID != (string)row["assetGuid"])
            throw new System.InvalidOperationException("A stream visit loader changed its source asset.");
        var currentRoot = getAsset(target);
        var currentLoading = getLoading(target);
        var currentHandle = getHandle(target);
        var currentPosition = target.transform.position;
        var currentLoadDistance = target.loadDistance;
        var currentPlayerDistance = UnityEngine.Vector3.Distance(currentPlayer.transform.position, currentPosition);
        var currentActive = target.gameObject.activeInHierarchy;
        var currentEnabled = target.enabled;
        if ((bool)row["preloadRequested"] && !(bool)row["initiallyLoaded"] && currentRoot != null)
            row["ownedRoot"] = currentRoot;
        return new
        {
            loaderInstanceId = (int)row["loaderInstanceId"],
            assetGuid = (string)row["assetGuid"],
            activeInHierarchy = currentActive,
            enabled = currentEnabled,
            initiallyLoaded = (bool)row["initiallyLoaded"],
            loaded = currentRoot != null,
            loading = currentLoading,
            hasHandle = currentHandle,
            rootInstanceId = currentRoot == null ? (int?)null : (int?)currentRoot.GetInstanceID(),
            skippedReason = row["skippedReason"] as string,
            holdUntil = getHold(target),
            originalHoldUntil = (float)row["originalHoldUntil"],
            position = makePosition(currentPosition),
            playerDistance = currentPlayerDistance,
            loadDistance = currentLoadDistance
        };
    });
    state["currentRow"] = currentRow;
    var cleanupWritten = false;
    var writeCleanupReceipt = new System.Action(() =>
    {
        if (cleanupWritten) return;
        var cleanupRows = new System.Collections.Generic.List<object>();
        var remainingOwnedRoots = 0;
        foreach (var row in rows)
        {
            cleanupRows.Add(currentRow(row));
            if ((row["ownedRoot"] as UnityEngine.GameObject) != null) remainingOwnedRoots++;
        }
        if (remainingOwnedRoots != 0) throw new System.InvalidOperationException("Stream cleanup still has owned roots.");
        var receipt = new { schemaVersion = "compendium.stream-cleanup.v1", key = key, ownerToken = ownerToken, sceneHandle = requestedSceneHandle, frame = UnityEngine.Time.frameCount, rows = cleanupRows.ToArray(), remainingOwnedRoots = remainingOwnedRoots, errors = new string[0] };
        var temporaryPath = cleanupPath + ".tmp." + System.Guid.NewGuid().ToString("N");
        try
        {
            var bytes = System.Text.Encoding.UTF8.GetBytes(Newtonsoft.Json.JsonConvert.SerializeObject(receipt));
            using (var output = new System.IO.FileStream(temporaryPath, System.IO.FileMode.CreateNew, System.IO.FileAccess.Write, System.IO.FileShare.None))
            {
                output.Write(bytes, 0, bytes.Length);
                output.Flush(true);
            }
            if (System.IO.File.Exists(cleanupPath)) throw new System.IO.IOException("The stream cleanup receipt already exists.");
            System.IO.File.Move(temporaryPath, cleanupPath);
            cleanupWritten = true;
        }
        catch (System.Exception)
        {
            try { if (System.IO.File.Exists(temporaryPath)) System.IO.File.Delete(temporaryPath); } catch (System.Exception) { }
            throw;
        }
    });

    var removeState = new System.Action(() =>
    {
        var currentState = System.AppDomain.CurrentDomain.GetData(key);
        if (object.ReferenceEquals(currentState, state))
            System.AppDomain.CurrentDomain.SetData(key, null);
        var currentActiveKey = System.AppDomain.CurrentDomain.GetData(activeStateDataKey) as string;
        if (currentActiveKey == key)
            System.AppDomain.CurrentDomain.SetData(activeStateDataKey, null);
    });
    state["removeState"] = removeState;

    var restoreStep = new System.Func<bool>(() =>
    {
        var phase = state["phase"] as string;
        if (phase == "restored")
        {
            if ((streamOwner["state"] as string) == "cleaning") removeState();
            return true;
        }
        state["phase"] = "restoring";
        var requestFrame = (int)state["restoreRequestedFrame"];
        var firstRestore = requestFrame < 0;
        var allRestored = true;
        foreach (var row in rows)
        {
            if (!(bool)row["holdChanged"]) continue;
            var target = row["loader"] as Il2Cpp.AddressableLoader;
            var targetAlive = target != null && target.gameObject != null;
            var initialRootIdValue = row["initialRootInstanceId"];
            var initiallyLoaded = (bool)row["initiallyLoaded"];
            var initialRootId = initialRootIdValue == null ? (int?)null : (int)initialRootIdValue;
            if (!targetAlive)
                throw new System.InvalidOperationException("The owned loader was destroyed before its load and release state could be confirmed.");

            setHold(target, (float)row["originalHoldUntil"]);
            var currentRoot = getAsset(target);
            if (!initiallyLoaded && (bool)row["preloadRequested"])
            {
                if (currentRoot != null) row["ownedRoot"] = currentRoot;
                if (!(bool)row["releaseRequested"])
                {
                    releaseMethod.Invoke(target, null);
                    row["releaseRequested"] = true;
                }
                if (currentRoot != null || getLoading(target) || getHandle(target))
                    allRestored = false;
                var ownedAfterRelease = row["ownedRoot"] as UnityEngine.GameObject;
                if (ownedAfterRelease != null)
                    allRestored = false;
            }
            else
            {
                if (initialRootId.HasValue && (currentRoot == null || currentRoot.GetInstanceID() != initialRootId.Value))
                    throw new System.InvalidOperationException("An initially loaded AddressableLoader root changed during restoration.");
            }
            if (getHold(target) != (float)row["originalHoldUntil"])
                allRestored = false;
        }

        if (firstRestore)
        {
            state["restoreRequestedFrame"] = UnityEngine.Time.frameCount;
            return false;
        }
        if (UnityEngine.Time.frameCount <= (int)state["restoreRequestedFrame"])
            return false;
        if (!allRestored) return false;
        writeCleanupReceipt();
        state["phase"] = "restored";
        var ownerStateName = streamOwner["state"] as string;
        if (ownerStateName == "cleaning")
            removeState();
        return true;
    });
    state["restorationDelegate"] = restoreStep;

    var unregisterCleanup = registerRuntimeCleanupWait(restoreStep);
    state["unregisterCleanup"] = unregisterCleanup;
    System.AppDomain.CurrentDomain.SetData(key, state);
    System.AppDomain.CurrentDomain.SetData(activeStateDataKey, key);

    // Nothing above mutates loader state. Register restoration before the first HoldLoaded call.
    foreach (var row in rows)
    {
        if ((string)row["skippedReason"] != null) continue;
        var target = row["loader"] as Il2Cpp.AddressableLoader;
        row["holdChanged"] = true;
        target.HoldLoaded(holdSecondsFloat);
        row["preloadRequested"] = true;
        preloadMethod.Invoke(target, null);
    }

    var startRows = new System.Collections.Generic.List<object>();
    foreach (var row in rows) startRows.Add(currentRow(row));
    return new { key, phase = "loading", frame = UnityEngine.Time.frameCount, sceneHandle = requestedSceneHandle, rows = startRows.ToArray() };
}

var keyToken = args["key"];
if (keyToken == null || keyToken.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrEmpty((string)keyToken))
    throw new System.ArgumentException("key must be a non-empty stream visit key.");
var requestedKey = (string)keyToken;
var stateForRequest = System.AppDomain.CurrentDomain.GetData(requestedKey) as System.Collections.Generic.Dictionary<string, object>;
if (stateForRequest == null)
    throw new System.InvalidOperationException("The stream visit key is unknown or has already been restored.");
var stateOwnerToken = stateForRequest["ownerToken"] as string;
if (stateOwnerToken != ownerToken)
    throw new System.InvalidOperationException("The stream visit key belongs to another runtime owner.");
if ((string)stateForRequest["researchCharacter"] != requestedResearchCharacter)
    throw new System.InvalidOperationException("researchCharacter does not match the stream visit key.");
if ((int)stateForRequest["sceneHandle"] != requestedSceneHandle)
    throw new System.InvalidOperationException("sceneHandle does not match the stream visit key.");
var stateRows = stateForRequest["rows"] as System.Collections.Generic.List<System.Collections.Generic.Dictionary<string, object>>;
var stateCurrentRow = stateForRequest["currentRow"] as System.Func<System.Collections.Generic.Dictionary<string, object>, object>;
var stateRestoreStep = stateForRequest["restorationDelegate"] as System.Func<bool>;
var stateRemove = stateForRequest["removeState"] as System.Action;
if (stateRows == null || stateCurrentRow == null || stateRestoreStep == null || stateRemove == null)
    throw new System.InvalidOperationException("The stream visit state is incomplete.");
var statePhase = stateForRequest["phase"] as string;

if (action == "poll")
{
    ensureSameScene(stateForRequest);
    requireCharacter();
    if (statePhase == "restored")
    {
        var restoredRows = new System.Collections.Generic.List<object>();
        foreach (var row in stateRows) restoredRows.Add(stateCurrentRow(row));
        return new { key = requestedKey, phase = "restored", frame = UnityEngine.Time.frameCount, sceneHandle = requestedSceneHandle, rows = restoredRows.ToArray() };
    }
    if (statePhase == "restoring")
    {
        var restoreDoneFromPoll = stateRestoreStep();
        var restoringRows = new System.Collections.Generic.List<object>();
        foreach (var row in stateRows) restoringRows.Add(stateCurrentRow(row));
        if (restoreDoneFromPoll)
        {
            var restoringResult = new { key = requestedKey, phase = "restored", frame = UnityEngine.Time.frameCount, sceneHandle = requestedSceneHandle, rows = restoringRows.ToArray() };
            var unregisterRestoring = stateForRequest["unregisterCleanup"] as System.Action;
            if (unregisterRestoring != null) unregisterRestoring();
            stateRemove();
            return restoringResult;
        }
        return new { key = requestedKey, phase = "restoring", frame = UnityEngine.Time.frameCount, sceneHandle = requestedSceneHandle, rows = restoringRows.ToArray() };
    }

    var readyScene = sceneIsReady();
    var allReady = readyScene;
    foreach (var row in stateRows)
    {
        if ((string)row["skippedReason"] != null) continue;
        var target = row["loader"] as Il2Cpp.AddressableLoader;
        if (target == null || target.gameObject == null || getAsset(target) == null || getLoading(target) || !getHandle(target))
        {
            allReady = false;
            continue;
        }
        var initialRoot = row["initialRoot"] as UnityEngine.GameObject;
        if (initialRoot != null && getAsset(target).GetInstanceID() != initialRoot.GetInstanceID())
            allReady = false;
    }
    var readyFrame = (int)stateForRequest["readyObservedFrame"];
    if (!allReady)
    {
        stateForRequest["readyObservedFrame"] = -1;
        stateForRequest["phase"] = "loading";
    }
    else if (readyFrame < 0)
    {
        stateForRequest["readyObservedFrame"] = UnityEngine.Time.frameCount;
        stateForRequest["phase"] = "loading";
    }
    else if (UnityEngine.Time.frameCount > readyFrame)
    {
        stateForRequest["phase"] = "ready";
    }
    else
    {
        stateForRequest["phase"] = "loading";
    }
    var pollRows = new System.Collections.Generic.List<object>();
    foreach (var row in stateRows) pollRows.Add(stateCurrentRow(row));
    return new { key = requestedKey, phase = stateForRequest["phase"] as string, frame = UnityEngine.Time.frameCount, sceneHandle = requestedSceneHandle, rows = pollRows.ToArray() };
}

if (statePhase != "restoring")
    stateForRequest["phase"] = "restoring";
var restoreDone = stateRestoreStep();
var resultRows = new System.Collections.Generic.List<object>();
foreach (var row in stateRows) resultRows.Add(stateCurrentRow(row));
if (restoreDone)
{
    var restoredResult = new { key = requestedKey, phase = "restored", frame = UnityEngine.Time.frameCount, sceneHandle = requestedSceneHandle, rows = resultRows.ToArray() };
    var unregisterCleanup = stateForRequest["unregisterCleanup"] as System.Action;
    if (unregisterCleanup != null) unregisterCleanup();
    stateRemove();
    return restoredResult;
}
return new { key = requestedKey, phase = "restoring", frame = UnityEngine.Time.frameCount, sceneHandle = requestedSceneHandle, rows = resultRows.ToArray() };