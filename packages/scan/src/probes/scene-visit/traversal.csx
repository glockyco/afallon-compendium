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
    var finalSceneId = requestedFinalId < 0 ? sourceNativeScene.ID : requestedFinalId;
    if (!databaseScenes.ContainsKey(finalSceneId) || databaseScenes[finalSceneId] == null || databaseScenes[finalSceneId].ID != finalSceneId)
        throw new System.ArgumentException("finalSceneNativeId does not resolve to a valid runtime scene record.");
    var finalNativeScene = databaseScenes[finalSceneId];
    if (requestedFinalPath != null && !string.Equals(System.IO.Path.GetFileNameWithoutExtension(requestedFinalPath), finalNativeScene.entryName, System.StringComparison.Ordinal))
        throw new System.ArgumentException("finalScenePath does not match finalSceneNativeId.");
    if (string.IsNullOrEmpty(finalNativeScene.entryName) || !UnityEngine.Application.CanStreamedLevelBeLoaded(finalNativeScene.entryName))
        throw new System.InvalidOperationException("The final scene must be available to the native scene loader.");
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
    sceneVisitState["sourceSceneName"] = activeScene.name;
    sceneVisitState["sawTargetScene"] = false;
    sceneVisitState["sourceSceneHandle"] = activeScene.handle;
    sceneVisitState["sourceScenePath"] = activeScene.path;
    sceneVisitState["targetSceneNativeId"] = requestedTargetId;
    // A game scene record names its Unity scene by entryName. A challenge-stone variant keeps
    // its parent's id in GameState.CurrentGameScene while its own Unity scene is loaded, so the
    // loaded scene is identified by that name, the rule the world inventory applies as well.
    sceneVisitState["targetSceneName"] = targetNativeScene.entryName;
    sceneVisitState["finalSceneNativeId"] = finalSceneId;
    sceneVisitState["finalScenePath"] = finalNativeScene.entryName;
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
        status["sceneName"] = currentScene.name;
        var loadedSceneNames = new System.Collections.Generic.List<string>();
        for (var index = 0; index < UnityEngine.SceneManagement.SceneManager.sceneCount; index++)
        {
            var loadedScene = UnityEngine.SceneManagement.SceneManager.GetSceneAt(index);
            loadedSceneNames.Add(loadedScene.name + (loadedScene.isLoaded ? "" : " (loading)"));
        }
