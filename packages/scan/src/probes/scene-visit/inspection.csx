        status["loadedScenes"] = loadedSceneNames.ToArray();
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
