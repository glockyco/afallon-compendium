
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
    if (idsToken == null || idsToken.Count < 1 || idsToken.Count > 2048)
        throw new System.ArgumentException("loaderInstanceIds must contain 1 to 2048 unique integers.");
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

    if ((int)scene.handle != requestedSceneHandle || !scene.isLoaded)
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
