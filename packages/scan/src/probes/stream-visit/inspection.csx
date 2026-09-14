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
