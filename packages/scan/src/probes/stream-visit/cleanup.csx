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
            var initiallyLoaded = (bool)row["initiallyLoaded"];
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
            // Restoration undoes the visit's footprint: the holds it set and the loads it requested.
            // A loader that was loaded before the visit was never loaded or released by it, so its
            // root is the game's and is not checked here.
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
