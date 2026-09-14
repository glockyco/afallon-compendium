
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