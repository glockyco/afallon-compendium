
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
        var finalSceneId = (int)sceneVisitState["finalSceneNativeId"];
        var currentNativeId = currentNativeScene == null ? -1 : currentNativeScene.ID;
        var restoreRequested = (bool)sceneVisitState["restoreRequested"];
        var targetMayStillActivate = !(bool)sceneVisitState["sawTargetScene"] && (int)sceneVisitState["targetSceneNativeId"] != finalSceneId;
        if (!restoreRequested && targetMayStillActivate && currentNativeId == finalSceneId)
            return false;
        if (currentNativeId != finalSceneId)
        {
            if (!restoreRequested)
            {
                sceneVisitState["restoreRequested"] = true;
                sceneVisitState["restoreRequestFrame"] = UnityEngine.Time.frameCount;
                currentLoader.LoadGameScene(finalSceneId);
            }
            return false;
        }

        if ((bool)sceneVisitState["restoreRequested"] && UnityEngine.Time.frameCount <= (int)sceneVisitState["restoreRequestFrame"])
            return false;

        if (finalSceneId == (int)sceneVisitState["sourceSceneNativeId"])
        {
            if (restoreRequested && currentScene.handle == (int)sceneVisitState["sourceSceneHandle"])
                return false;
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
        }
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
