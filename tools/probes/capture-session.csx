if (args == null)
    throw new System.ArgumentNullException("args");

var captureActionToken = args["action"];
if (captureActionToken == null || captureActionToken.Type != Newtonsoft.Json.Linq.JTokenType.String)
    throw new System.ArgumentException("action is required.");
var captureAction = (string)captureActionToken;
if (captureAction != "start" && captureAction != "inspect" && captureAction != "render" && captureAction != "restore")
    throw new System.ArgumentException("action must be start, inspect, render, or restore.");

var ownerState = System.AppDomain.CurrentDomain.GetData("afallon-compendium.runtime-owner.v1") as System.Collections.Generic.Dictionary<string, object>;
if (ownerState == null || (ownerState["state"] as string) != "active")
    throw new System.OperationCanceledException("The runtime owner is no longer active.");
var ownerToken = ownerState["token"] as string;
if (string.IsNullOrEmpty(ownerToken))
    throw new System.InvalidOperationException("The runtime owner token is missing.");
var ownerConnected = ownerState["isConnected"] as System.Func<bool>;
if (ownerConnected == null || !ownerConnected())
    throw new System.OperationCanceledException("The runtime owner socket is no longer connected.");

var captureActiveKeyName = "afallon-compendium.capture.active.v1";
var formatError = new System.Func<System.Exception, string>(error => error.GetType().FullName + ": " + error.Message);
var isFinite = new System.Func<float, bool>(value => !float.IsNaN(value) && !float.IsInfinity(value));
var number = new System.Func<Newtonsoft.Json.Linq.JToken, string, float>((token, name) =>
{
    if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.Float && token.Type != Newtonsoft.Json.Linq.JTokenType.Integer)
        throw new System.ArgumentException(name + " must be a finite number.");
    var value = token.ToObject<float>();
    if (!isFinite(value)) throw new System.ArgumentException(name + " must be a finite number.");
    return value;
});
var integer = new System.Func<Newtonsoft.Json.Linq.JToken, string, int>((token, name) =>
{
    if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.Integer)
        throw new System.ArgumentException(name + " must be an integer.");
    return token.ToObject<int>();
});
var requiredText = new System.Func<Newtonsoft.Json.Linq.JToken, string, string>((token, name) =>
{
    if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrEmpty((string)token))
        throw new System.ArgumentException(name + " must be a non-empty string.");
    return (string)token;
});
var vector = new System.Func<Newtonsoft.Json.Linq.JToken, string, UnityEngine.Vector3>((token, name) =>
{
    if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.Object)
        throw new System.ArgumentException(name + " must be an object.");
    var result = new UnityEngine.Vector3(number(token["x"], name + ".x"), number(token["y"], name + ".y"), number(token["z"], name + ".z"));
    return result;
});
var color = new System.Func<Newtonsoft.Json.Linq.JToken, string, UnityEngine.Color>((token, name) =>
{
    if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.Object)
        throw new System.ArgumentException(name + " must be an object.");
    var result = new UnityEngine.Color(number(token["r"], name + ".r"), number(token["g"], name + ".g"), number(token["b"], name + ".b"), 1f);
    if (result.r < 0f || result.r > 4f || result.g < 0f || result.g > 4f || result.b < 0f || result.b > 4f)
        throw new System.ArgumentException(name + " channels must be between 0 and 4.");
    return result;
});
var array = new System.Func<Newtonsoft.Json.Linq.JToken, string, Newtonsoft.Json.Linq.JArray>((token, name) =>
{
    if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.Array)
        throw new System.ArgumentException(name + " must be an array.");
    return (Newtonsoft.Json.Linq.JArray)token;
});

var cleanupPathFromArgs = args["cleanupPath"];
var pathFull = new System.Func<string, string>((path) =>
{
    if (string.IsNullOrEmpty(path)) throw new System.ArgumentException("Path must be non-empty.");
    try { return System.IO.Path.GetFullPath(path); }
    catch (System.Exception error) { throw new System.ArgumentException("Path is invalid: " + error.Message); }
});
var cleanupPath = cleanupPathFromArgs == null || cleanupPathFromArgs.Type == Newtonsoft.Json.Linq.JTokenType.Null ? null : requiredText(cleanupPathFromArgs, "cleanupPath");
var cleanupFullPath = cleanupPath == null ? null : pathFull(cleanupPath);
var cleanupDirectory = cleanupFullPath == null ? null : System.IO.Path.GetDirectoryName(cleanupFullPath);
if (cleanupFullPath != null && string.IsNullOrEmpty(cleanupDirectory))
    throw new System.ArgumentException("cleanupPath must have a directory.");
if (cleanupDirectory != null)
    System.IO.Directory.CreateDirectory(cleanupDirectory);
var pathContained = new System.Func<string, string, bool>((candidate, root) =>
{
    var full = pathFull(candidate);
    var rootFull = pathFull(root);
    var prefix = rootFull.EndsWith(System.IO.Path.DirectorySeparatorChar.ToString(), System.StringComparison.Ordinal) ? rootFull : rootFull + System.IO.Path.DirectorySeparatorChar;
    return !string.Equals(full, rootFull, System.StringComparison.OrdinalIgnoreCase) && full.StartsWith(prefix, System.StringComparison.OrdinalIgnoreCase);
});
var normalizeSafePath = new System.Func<string, string, string>((candidate, name) =>
{
    var full = pathFull(candidate);
    if (!pathContained(full, cleanupDirectory)) throw new System.ArgumentException(name + " must be contained under the cleanup directory.");
    return full;
});
var writeAtomicText = new System.Action<string, string>((destination, text) =>
{
    var temp = destination + ".tmp." + System.Guid.NewGuid().ToString("N");
    try
    {
        using (var stream = new System.IO.FileStream(temp, System.IO.FileMode.CreateNew, System.IO.FileAccess.Write, System.IO.FileShare.None))
        using (var writer = new System.IO.StreamWriter(stream, new System.Text.UTF8Encoding(false)))
        {
            writer.Write(text);
            writer.Flush();
            stream.Flush(true);
        }
        if (System.IO.File.Exists(destination)) throw new System.IO.IOException("The destination already exists: " + destination);
        System.IO.File.Move(temp, destination);
    }
    catch (System.Exception)
    {
        try { if (System.IO.File.Exists(temp)) System.IO.File.Delete(temp); } catch (System.Exception) { }
        throw;
    }
});

var readCurrentScene = new System.Func<object>(() =>
{
    var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
    var nativeScene = Il2Cpp.GameState.CurrentGameScene;
    if (!scene.isLoaded || nativeScene == null)
        throw new System.InvalidOperationException("A loaded native game scene is required.");
    var result = new System.Collections.Generic.Dictionary<string, object>();
    result["scene"] = scene;
    result["nativeId"] = nativeScene.ID;
    return result;
});
var checkCharacter = new System.Action<string>((requestedCharacter) =>
{
    var character = Il2CppBLINK.RPGBuilder.Characters.Character.Instance;
    var data = character == null ? null : character.CharacterData;
    if (data == null || !data.IsCreated || data.CharacterName != requestedCharacter)
        throw new System.InvalidOperationException("The configured research character is not active.");
});
var checkDimensions = new System.Func<int, int, bool>((width, height) => width >= 64 && width <= 2048 && height >= 64 && height <= 2048);
var readFrame = new System.Func<Newtonsoft.Json.Linq.JToken, object>((token) =>
{
    if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.Object)
        throw new System.ArgumentException("frame must be an object.");
    var center = token["center"];
    var worldSize = token["worldSize"];
    if (center == null || center.Type != Newtonsoft.Json.Linq.JTokenType.Object || worldSize == null || worldSize.Type != Newtonsoft.Json.Linq.JTokenType.Object)
        throw new System.ArgumentException("frame center and worldSize are required.");
    var centerX = number(center["x"], "frame.center.x");
    var centerZ = number(center["z"], "frame.center.z");
    var sizeX = number(worldSize["x"], "frame.worldSize.x");
    var sizeZ = number(worldSize["z"], "frame.worldSize.z");
    var cameraY = number(token["cameraY"], "frame.cameraY");
    var nearClip = number(token["nearClip"], "frame.nearClip");
    var farClip = number(token["farClip"], "frame.farClip");
    if (sizeX <= 0f || sizeZ <= 0f || sizeX > 100000f || sizeZ > 100000f) throw new System.ArgumentException("frame worldSize must be greater than zero and at most 100000.");
    if (nearClip <= 0f || farClip <= 0f || farClip <= nearClip || farClip > 100000f) throw new System.ArgumentException("frame clip planes are invalid.");
    var result = new System.Collections.Generic.Dictionary<string, float>();
    result["centerX"] = centerX;
    result["centerZ"] = centerZ;
    result["sizeX"] = sizeX;
    result["sizeZ"] = sizeZ;
    result["cameraY"] = cameraY;
    result["nearClip"] = nearClip;
    result["farClip"] = farClip;
    return result;
});
var probeEqual = new System.Func<UnityEngine.Rendering.SphericalHarmonicsL2, UnityEngine.Rendering.SphericalHarmonicsL2, bool>((left, right) =>
{
    for (var rgb = 0; rgb < 3; rgb++) for (var coefficient = 0; coefficient < 9; coefficient++)
        if (left[rgb, coefficient] != right[rgb, coefficient]) return false;
    return true;
});
var renderTextureInventory = new System.Func<object>(() =>
{
    var rows = new System.Collections.Generic.List<object>();
    foreach (var target in UnityEngine.Resources.FindObjectsOfTypeAll<UnityEngine.RenderTexture>())
    {
        if (target == null) continue;
        rows.Add(new
        {
            instanceId = target.GetInstanceID(),
            name = target.name ?? "",
            width = target.width,
            height = target.height,
            depth = target.depth,
            created = target.IsCreated(),
            owned = (target.name ?? "").StartsWith("AfallonCapture.", System.StringComparison.Ordinal),
        });
    }
    return rows.ToArray();
});

var faultAt = args["faultAt"] == null || args["faultAt"].Type == Newtonsoft.Json.Linq.JTokenType.Null ? null : requiredText(args["faultAt"], "faultAt");
var allowedFault = faultAt == null || faultAt == "after-camera" || faultAt == "after-target" || faultAt == "after-texture" || faultAt == "after-light" || faultAt == "after-visuals" || faultAt == "after-render" || faultAt == "after-encode";
if (!allowedFault) throw new System.ArgumentException("faultAt is not a supported bounded verification hook.");
var fault = new System.Action<string>((point) => { if (faultAt == point) throw new System.InvalidOperationException("Injected capture failure at " + point + "."); });

if (captureAction == "start")
{
    var researchCharacter = requiredText(args["researchCharacter"], "researchCharacter");
    var requestedSceneId = integer(args["sceneNativeId"], "sceneNativeId");
    if (requestedSceneId < 0) throw new System.ArgumentException("sceneNativeId must be non-negative.");
    var requestedScenePath = requiredText(args["scenePath"], "scenePath");
    var requestedWidth = integer(args["width"], "width");
    var requestedHeight = integer(args["height"], "height");
    if (!checkDimensions(requestedWidth, requestedHeight)) throw new System.ArgumentException("width and height must be between 64 and 2048.");
    if (cleanupFullPath == null) throw new System.ArgumentException("cleanupPath is required for start.");
    if (System.IO.File.Exists(cleanupFullPath)) throw new System.IO.IOException("The cleanup receipt destination already exists.");
    checkCharacter(researchCharacter);
    var current = readCurrentScene();
    var currentDictionary = (System.Collections.Generic.Dictionary<string, object>)current;
    var currentScene = (UnityEngine.SceneManagement.Scene)currentDictionary["scene"];
    var currentNativeId = (int)currentDictionary["nativeId"];
    if (currentNativeId != requestedSceneId || currentScene.path != requestedScenePath)
        throw new System.InvalidOperationException("The current scene does not match sceneNativeId and scenePath.");
    var priorActive = System.AppDomain.CurrentDomain.GetData(captureActiveKeyName) as string;
    if (!string.IsNullOrEmpty(priorActive))
        throw new System.InvalidOperationException("Another capture session is already active.");

    var sessionKey = "afallon-compendium.capture." + System.Guid.NewGuid().ToString("N");
    var resourcePrefix = "AfallonCapture." + sessionKey.Substring(sessionKey.Length - 16);
    var state = new System.Collections.Generic.Dictionary<string, object>();
    state["key"] = sessionKey;
    state["ownerToken"] = ownerToken;
    state["researchCharacter"] = researchCharacter;
    state["sceneNativeId"] = requestedSceneId;
    state["scenePath"] = requestedScenePath;
    state["sceneHandle"] = currentScene.handle;
    state["resourcePrefix"] = resourcePrefix;
    state["width"] = requestedWidth;
    state["height"] = requestedHeight;
    state["cleanupPath"] = cleanupFullPath;
    state["phase"] = "ready";
    state["completedCaptures"] = 0;
    state["lastCapture"] = null;
    state["pendingFrameRestore"] = null;
    state["cleanupFinished"] = false;
    state["explicitRestoreRequested"] = false;
    state["cleanupRunning"] = false;
    state["cameraGo"] = null;
    state["camera"] = null;
    state["lightGo"] = null;
    state["light"] = null;
    state["renderTexture"] = null;
    state["captureTexture"] = null;
    System.AppDomain.CurrentDomain.SetData(sessionKey, state);
    System.AppDomain.CurrentDomain.SetData(captureActiveKeyName, sessionKey);

    System.Action unregisterRuntimeCleanup = null;
    System.Action cleanupSession = null;
    cleanupSession = new System.Action(() =>
    {
        if ((bool)state["cleanupFinished"]) return;
        if ((bool)state["cleanupRunning"]) return;
        state["cleanupRunning"] = true;
        var cleanupErrors = new System.Collections.Generic.List<string>();
        var pending = state["pendingFrameRestore"] as System.Action;
        if (pending != null)
        {
            try { pending(); }
            catch (System.Exception error) { cleanupErrors.Add("Frame restoration failed: " + formatError(error)); }
        }
        var camera = state["camera"] as UnityEngine.Camera;
        var cameraGo = state["cameraGo"] as UnityEngine.GameObject;
        var light = state["light"] as UnityEngine.Light;
        var lightGo = state["lightGo"] as UnityEngine.GameObject;
        var renderTexture = state["renderTexture"] as UnityEngine.RenderTexture;
        var captureTexture = state["captureTexture"] as UnityEngine.Texture2D;
        try { if (camera != null) camera.targetTexture = null; } catch (System.Exception error) { cleanupErrors.Add("Camera target detach failed: " + formatError(error)); }
        try { if (renderTexture != null && UnityEngine.RenderTexture.active == renderTexture) UnityEngine.RenderTexture.active = null; } catch (System.Exception error) { cleanupErrors.Add("Active render target detach failed: " + formatError(error)); }
        try { if (renderTexture != null) renderTexture.Release(); } catch (System.Exception error) { cleanupErrors.Add("RenderTexture release failed: " + formatError(error)); }
        try { if (captureTexture != null) UnityEngine.Object.DestroyImmediate(captureTexture); } catch (System.Exception error) { cleanupErrors.Add("Texture destruction failed: " + formatError(error)); }
        try { if (renderTexture != null) UnityEngine.Object.DestroyImmediate(renderTexture); } catch (System.Exception error) { cleanupErrors.Add("RenderTexture destruction failed: " + formatError(error)); }
        try { if (cameraGo != null) UnityEngine.Object.DestroyImmediate(cameraGo); } catch (System.Exception error) { cleanupErrors.Add("Camera destruction failed: " + formatError(error)); }
        try { if (lightGo != null) UnityEngine.Object.DestroyImmediate(lightGo); } catch (System.Exception error) { cleanupErrors.Add("Light destruction failed: " + formatError(error)); }
        var remaining = 0;
        try { if (cameraGo != null) remaining++; } catch (System.Exception) { remaining++; }
        try { if (lightGo != null) remaining++; } catch (System.Exception) { remaining++; }
        try { if (renderTexture != null) remaining++; } catch (System.Exception) { remaining++; }
        try { if (captureTexture != null) remaining++; } catch (System.Exception) { remaining++; }
        if (remaining != 0) cleanupErrors.Add("Owned capture objects remain alive after destruction.");
        if (cleanupErrors.Count != 0)
        {
            state["cleanupRunning"] = false;
            throw new System.InvalidOperationException("Capture cleanup failed: " + string.Join("; ", cleanupErrors.ToArray()));
        }
        state["camera"] = null;
        state["cameraGo"] = null;
        state["light"] = null;
        state["lightGo"] = null;
        state["renderTexture"] = null;
        state["captureTexture"] = null;
        state["phase"] = "restored";
        var receipt = new { schemaVersion = "compendium.capture-cleanup.v1", key = sessionKey, ownerToken = ownerToken, resourcePrefix = resourcePrefix, phase = "restored", frame = UnityEngine.Time.frameCount, remainingObjects = 0, errors = new string[0] };
        try { writeAtomicText(cleanupFullPath, Newtonsoft.Json.JsonConvert.SerializeObject(receipt)); }
        catch (System.Exception)
        {
            state["cleanupRunning"] = false;
            throw;
        }
        state["cleanupFinished"] = true;
        state["cleanupRunning"] = false;
        if (string.Equals(System.AppDomain.CurrentDomain.GetData(captureActiveKeyName) as string, sessionKey, System.StringComparison.Ordinal)) System.AppDomain.CurrentDomain.SetData(captureActiveKeyName, null);
        if (object.ReferenceEquals(System.AppDomain.CurrentDomain.GetData(sessionKey), state)) System.AppDomain.CurrentDomain.SetData(sessionKey, null);
        if ((bool)state["explicitRestoreRequested"] && unregisterRuntimeCleanup != null) unregisterRuntimeCleanup();
    });

    try
    {
        state["cleanupAction"] = cleanupSession;
        unregisterRuntimeCleanup = registerRuntimeCleanup(cleanupSession);
        var cameraGo = new UnityEngine.GameObject(resourcePrefix + ".Camera");
        state["cameraGo"] = cameraGo;
        cameraGo.SetActive(false);
        var camera = cameraGo.AddComponent<UnityEngine.Camera>();
        state["camera"] = camera;
        camera.enabled = false;
        fault("after-camera");
        var lightGo = new UnityEngine.GameObject(resourcePrefix + ".Light");
        state["lightGo"] = lightGo;
        lightGo.SetActive(false);
        var light = lightGo.AddComponent<UnityEngine.Light>();
        state["light"] = light;
        light.enabled = false;
        light.type = UnityEngine.LightType.Directional;
        light.shadows = UnityEngine.LightShadows.None;
        fault("after-light");
        var renderTexture = new UnityEngine.RenderTexture(requestedWidth, requestedHeight, 24);
        if (renderTexture == null) throw new System.InvalidOperationException("RenderTexture allocation returned null.");
        state["renderTexture"] = renderTexture;
        renderTexture.name = resourcePrefix + ".RenderTexture";
        renderTexture.Create();
        if (!renderTexture.IsCreated()) throw new System.InvalidOperationException("RenderTexture.Create did not create a live target.");
        fault("after-target");
        var captureTexture = new UnityEngine.Texture2D(requestedWidth, requestedHeight, UnityEngine.TextureFormat.RGB24, false);
        if (captureTexture == null) throw new System.InvalidOperationException("Texture2D allocation returned null.");
        state["captureTexture"] = captureTexture;
        captureTexture.name = resourcePrefix + ".Texture2D";
        fault("after-texture");
        return new { schemaVersion = "compendium.capture-session.v5", key = sessionKey, phase = "ready", ownerToken = ownerToken, sceneNativeId = requestedSceneId, scenePath = requestedScenePath, sceneHandle = currentScene.handle, resourcePrefix = resourcePrefix, resources = new object[]
        {
            new { kind = "camera", instanceId = (int?)camera.GetInstanceID(), alive = camera != null && cameraGo != null },
            new { kind = "light", instanceId = (int?)light.GetInstanceID(), alive = light != null && lightGo != null },
            new { kind = "renderTexture", instanceId = (int?)renderTexture.GetInstanceID(), alive = renderTexture != null },
            new { kind = "texture2D", instanceId = (int?)captureTexture.GetInstanceID(), alive = captureTexture != null },
        }, completedCaptures = 0, lastCapture = (object)null, renderTextures = renderTextureInventory() };
    }
    catch (System.Exception error)
    {
        try { cleanupSession(); } catch (System.Exception cleanupError) { throw new System.InvalidOperationException(formatError(error) + " Cleanup: " + formatError(cleanupError)); }
        throw;
    }
}

var requestedKey = requiredText(args["key"], "key");
var activeKey = System.AppDomain.CurrentDomain.GetData(captureActiveKeyName) as string;
if (!string.Equals(requestedKey, activeKey, System.StringComparison.Ordinal))
    throw new System.InvalidOperationException("The capture key is stale or is not the active session.");
var sessionState = System.AppDomain.CurrentDomain.GetData(requestedKey) as System.Collections.Generic.Dictionary<string, object>;
if (sessionState == null) throw new System.InvalidOperationException("The capture session key is unknown.");
if (!string.Equals(sessionState["ownerToken"] as string, ownerToken, System.StringComparison.Ordinal))
    throw new System.InvalidOperationException("The capture session belongs to another runtime owner.");
if ((sessionState["phase"] as string) != "ready") throw new System.InvalidOperationException("The capture session is already restored.");
var sessionCleanupFullPath = pathFull((string)sessionState["cleanupPath"]);
if (cleanupFullPath != null && !string.Equals(cleanupFullPath, sessionCleanupFullPath, System.StringComparison.OrdinalIgnoreCase)) throw new System.ArgumentException("cleanupPath does not match the capture session.");
cleanupFullPath = sessionCleanupFullPath;
cleanupDirectory = System.IO.Path.GetDirectoryName(sessionCleanupFullPath);
var sessionScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var sessionNativeScene = Il2Cpp.GameState.CurrentGameScene;
if (!sessionScene.isLoaded || sessionNativeScene == null || sessionNativeScene.ID != (int)sessionState["sceneNativeId"] || sessionScene.path != (string)sessionState["scenePath"] || sessionScene.handle != (int)sessionState["sceneHandle"])
    throw new System.InvalidOperationException("The active scene no longer matches the capture session.");

var sessionCamera = sessionState["camera"] as UnityEngine.Camera;
var sessionCameraGo = sessionState["cameraGo"] as UnityEngine.GameObject;
var sessionLight = sessionState["light"] as UnityEngine.Light;
var sessionLightGo = sessionState["lightGo"] as UnityEngine.GameObject;
var sessionRenderTexture = sessionState["renderTexture"] as UnityEngine.RenderTexture;
var sessionTexture = sessionState["captureTexture"] as UnityEngine.Texture2D;
if (sessionCamera == null || sessionCameraGo == null || sessionLight == null || sessionLightGo == null || sessionRenderTexture == null || sessionTexture == null)
    throw new System.InvalidOperationException("The capture session resources are incomplete.");

var sessionResources = new System.Func<object>(() =>
{
    return new object[]
    {
        new { kind = "camera", instanceId = (int?)sessionCamera.GetInstanceID(), alive = sessionCamera != null && sessionCameraGo != null },
        new { kind = "light", instanceId = (int?)sessionLight.GetInstanceID(), alive = sessionLight != null && sessionLightGo != null },
        new { kind = "renderTexture", instanceId = (int?)sessionRenderTexture.GetInstanceID(), alive = sessionRenderTexture != null },
        new { kind = "texture2D", instanceId = (int?)sessionTexture.GetInstanceID(), alive = sessionTexture != null },
    };
});
var sessionReport = new System.Func<object>(() => new
{
    schemaVersion = "compendium.capture-session.v5",
    key = requestedKey,
    phase = sessionState["phase"] as string,
    ownerToken = ownerToken,
    sceneNativeId = (int)sessionState["sceneNativeId"],
    scenePath = sessionState["scenePath"] as string,
    sceneHandle = (int)sessionState["sceneHandle"],
    resourcePrefix = sessionState["resourcePrefix"] as string,
    resources = sessionResources(),
    completedCaptures = (int)sessionState["completedCaptures"],
    lastCapture = sessionState["lastCapture"],
    renderTextures = renderTextureInventory(),
});

if (captureAction == "inspect")
    return sessionReport();

if (captureAction == "restore")
{
    sessionState["explicitRestoreRequested"] = true;
    var restoreCleanup = sessionState["cleanupAction"] as System.Action;
    if (restoreCleanup == null) throw new System.InvalidOperationException("The capture session has no cleanup action.");
    restoreCleanup();
    return new
    {
        schemaVersion = "compendium.capture-session.v5",
        key = requestedKey,
        phase = "restored",
        ownerToken = ownerToken,
        sceneNativeId = (int)sessionState["sceneNativeId"],
        scenePath = sessionState["scenePath"] as string,
        sceneHandle = (int)sessionState["sceneHandle"],
        resourcePrefix = sessionState["resourcePrefix"] as string,
        resources = new object[]
        {
            new { kind = "camera", instanceId = (int?)null, alive = false },
            new { kind = "light", instanceId = (int?)null, alive = false },
            new { kind = "renderTexture", instanceId = (int?)null, alive = false },
            new { kind = "texture2D", instanceId = (int?)null, alive = false },
        },
        completedCaptures = (int)sessionState["completedCaptures"],
        lastCapture = sessionState["lastCapture"],
        renderTextures = renderTextureInventory(),
    };
}

if (captureAction != "render") throw new System.InvalidOperationException("Unsupported capture action.");
var tileId = requiredText(args["tileId"], "tileId");
if (!System.Text.RegularExpressions.Regex.IsMatch(tileId, "^[a-z0-9]+(?:-[a-z0-9]+)*$") || tileId.Length > 80)
    throw new System.ArgumentException("tileId has an invalid format.");
var frameValue = (System.Collections.Generic.Dictionary<string, float>)readFrame(args["frame"]);
var requestedLighting = args["lighting"];
if (requestedLighting == null || requestedLighting.Type != Newtonsoft.Json.Linq.JTokenType.Object) throw new System.ArgumentException("lighting is required.");
var ambient = color(requestedLighting["ambient"], "lighting.ambient");
var directionalIntensity = number(requestedLighting["directionalIntensity"], "lighting.directionalIntensity");
var directionalEuler = vector(requestedLighting["directionalEuler"], "lighting.directionalEuler");
if (directionalIntensity < 0f || directionalIntensity > 4f) throw new System.ArgumentException("lighting.directionalIntensity must be between 0 and 4.");
var cullingMask = integer(args["cullingMask"], "cullingMask");
var suppression = readCaptureSuppression(args["suppression"]);
// Cut heights, nearest-plane first. Each becomes one slice rendered with the near plane at
// that height; the frame's own nearClip renders when the list is empty or absent.
var cutHeights = new System.Collections.Generic.List<float>();
var cutToken = args["cutHeights"];
if (cutToken != null && cutToken.Type != Newtonsoft.Json.Linq.JTokenType.Null)
{
    if (cutToken.Type != Newtonsoft.Json.Linq.JTokenType.Array) throw new System.ArgumentException("cutHeights must be an array.");
    foreach (var entry in cutToken)
    {
        if (entry.Type != Newtonsoft.Json.Linq.JTokenType.Float && entry.Type != Newtonsoft.Json.Linq.JTokenType.Integer) throw new System.ArgumentException("cutHeights entries must be numbers.");
        cutHeights.Add((float)entry);
    }
    if (cutHeights.Count > 256) throw new System.ArgumentException("cutHeights allows at most 256 slices.");
    for (var index = 1; index < cutHeights.Count; index++) if (cutHeights[index] <= cutHeights[index - 1]) throw new System.ArgumentException("cutHeights must increase strictly.");
}
var captureWidth = (int)sessionState["width"];
var captureHeight = (int)sessionState["height"];
var worldAspect = (double)frameValue["sizeX"] / (double)frameValue["sizeZ"];
var pixelAspect = (double)captureWidth / (double)captureHeight;
if (System.Math.Abs(worldAspect - pixelAspect) > 0.000001d) throw new System.ArgumentException("frame world aspect must match the pixel aspect.");
var outputPathArgument = requiredText(args["outputPath"], "outputPath");
var outputPath = normalizeSafePath(outputPathArgument, "outputPath");
if (!outputPath.EndsWith(".png", System.StringComparison.OrdinalIgnoreCase)) throw new System.ArgumentException("outputPath must end with .png.");
if (System.IO.File.Exists(outputPath)) throw new System.IO.IOException("The PNG destination already exists.");
var restorationPath = normalizeSafePath(requiredText(args["restorationPath"], "restorationPath"), "restorationPath");
if (System.IO.File.Exists(restorationPath)) throw new System.IO.IOException("The restoration audit destination already exists.");
if (string.Equals(outputPath, restorationPath, System.StringComparison.OrdinalIgnoreCase) || string.Equals(outputPath, cleanupFullPath, System.StringComparison.OrdinalIgnoreCase) || string.Equals(restorationPath, cleanupFullPath, System.StringComparison.OrdinalIgnoreCase)) throw new System.ArgumentException("Capture output, restoration audit, and cleanup receipt paths must differ.");
var pauseAfterVisualsMs = args["pauseAfterVisualsMs"] == null || args["pauseAfterVisualsMs"].Type == Newtonsoft.Json.Linq.JTokenType.Null ? 0 : integer(args["pauseAfterVisualsMs"], "pauseAfterVisualsMs");
if (pauseAfterVisualsMs < 0 || pauseAfterVisualsMs > 1000) throw new System.ArgumentException("pauseAfterVisualsMs must be between 0 and 1000.");
var signalPath = args["signalPath"] == null || args["signalPath"].Type == Newtonsoft.Json.Linq.JTokenType.Null ? null : normalizeSafePath(requiredText(args["signalPath"], "signalPath"), "signalPath");
if (signalPath != null && (string.Equals(signalPath, outputPath, System.StringComparison.OrdinalIgnoreCase) || string.Equals(signalPath, restorationPath, System.StringComparison.OrdinalIgnoreCase) || string.Equals(signalPath, cleanupFullPath, System.StringComparison.OrdinalIgnoreCase))) throw new System.ArgumentException("The interruption signal path must differ from capture output paths.");
var signal = new System.Action(() =>
{
    if (signalPath != null)
    {
        writeAtomicText(signalPath, Newtonsoft.Json.JsonConvert.SerializeObject(new { frame = UnityEngine.Time.frameCount, lightEnabled = sessionLight.enabled }));
    }
    if (pauseAfterVisualsMs > 0) System.Threading.Thread.Sleep(pauseAfterVisualsMs);
    if (!ownerConnected()) throw new System.OperationCanceledException("The runtime owner socket disconnected during capture.");
});

var rgba = new System.Func<UnityEngine.Color, object>(value => new { r = value.r, g = value.g, b = value.b, a = value.a });
var renderers = new System.Collections.Generic.List<UnityEngine.Renderer>();
var rendererFlags = new System.Collections.Generic.List<bool>();
var selectedRenderers = new System.Collections.Generic.Dictionary<int, UnityEngine.Renderer>();
var selectedLights = new System.Collections.Generic.Dictionary<int, UnityEngine.Light>();
var selectedProjectors = new System.Collections.Generic.Dictionary<int, UnityEngine.Projector>();
var selections = new System.Collections.Generic.List<object>();
var visualSelection = collectCaptureVisuals();
visitCaptureVisualRenderers(visualSelection.Roots, (renderer, reason) =>
{
    var id = renderer.GetInstanceID();
    if (selectedRenderers.ContainsKey(id)) return;
    selectedRenderers.Add(id, renderer);
    selections.Add(new { kind = "renderer", instanceId = id, reason = reason });
});
visitReviewedShaderRenderers(suppression.ShaderFamilies, (renderer, reason) =>
{
    var id = renderer.GetInstanceID();
    if (selectedRenderers.ContainsKey(id)) return;
    selectedRenderers.Add(id, renderer);
    selections.Add(new { kind = "renderer", instanceId = id, reason = reason });
});
var terrains = collectTerrainsDrawingTrees(suppression.TerrainTrees);
var terrainFlags = new System.Collections.Generic.List<bool>();
foreach (var terrain in terrains)
{
    terrainFlags.Add(terrain.drawTreesAndFoliage);
    selections.Add(new { kind = "terrain-trees", instanceId = terrain.GetInstanceID(), reason = "reviewed-terrain-trees" });
}
var selectRootLightsAndProjectors = new System.Action<UnityEngine.GameObject, string>((root, reason) =>
{
    foreach (var light in root.GetComponentsInChildren<UnityEngine.Light>(false))
    {
        if (light == null || light == sessionLight || !light.enabled || !light.gameObject.activeInHierarchy) continue;
        var id = light.GetInstanceID();
        if (selectedLights.ContainsKey(id)) continue;
        selectedLights.Add(id, light);
        selections.Add(new { kind = "light", instanceId = id, reason = reason });
    }
    foreach (var projector in root.GetComponentsInChildren<UnityEngine.Projector>(false))
    {
        if (projector == null || !projector.enabled || !projector.gameObject.activeInHierarchy) continue;
        var id = projector.GetInstanceID();
        if (selectedProjectors.ContainsKey(id)) continue;
        selectedProjectors.Add(id, projector);
        selections.Add(new { kind = "projector", instanceId = id, reason = reason });
    }
});
var player = Il2Cpp.GameState.playerEntity;
foreach (var root in visualSelection.Roots) selectRootLightsAndProjectors(root.Root, root.Reason);
var allParticles = visualSelection.Particles;
var lightingInputs = new System.Collections.Generic.List<object>();
foreach (var light in UnityEngine.Object.FindObjectsOfType<UnityEngine.Light>(true))
{
    if (light == null || light == sessionLight) continue;
    var id = light.GetInstanceID();
    if (light.enabled && light.gameObject.activeInHierarchy && !selectedLights.ContainsKey(id))
    {
        selectedLights.Add(id, light);
        selections.Add(new { kind = "light", instanceId = id, reason = "game-light" });
    }
    if (!light.enabled || !light.gameObject.activeInHierarchy) continue;
    var position = light.transform.position;
    lightingInputs.Add(new { instanceId = id, type = (int)light.type, enabled = light.enabled, active = light.gameObject.activeInHierarchy, color = rgba(light.color), intensity = light.intensity, range = light.range, cullingMask = light.cullingMask, position = new { x = position.x, y = position.y, z = position.z } });
}
foreach (var renderer in selectedRenderers.Values) { renderers.Add(renderer); rendererFlags.Add(renderer.enabled); }
var lights = new System.Collections.Generic.List<UnityEngine.Light>(selectedLights.Values);
var lightFlags = new System.Collections.Generic.List<bool>();
foreach (var light in lights) lightFlags.Add(light.enabled);
var projectors = new System.Collections.Generic.List<UnityEngine.Projector>(selectedProjectors.Values);
var projectorFlags = new System.Collections.Generic.List<bool>();
foreach (var projector in projectors) projectorFlags.Add(projector.enabled);
var highlights = new System.Collections.Generic.List<Il2CppHighlightPlus.HighlightEffect>();
var highlightMasks = new System.Collections.Generic.List<UnityEngine.LayerMask>();
foreach (var effect in UnityEngine.Object.FindObjectsOfType<Il2CppHighlightPlus.HighlightEffect>(true))
{
    if (effect == null || !effect.enabled || !effect.gameObject.activeInHierarchy) continue;
    highlights.Add(effect); highlightMasks.Add(effect.camerasLayerMask);
    selections.Add(new { kind = "highlight", instanceId = effect.GetInstanceID(), reason = "camera-highlight" });
}
var captureBounds = new UnityEngine.Bounds(new UnityEngine.Vector3(frameValue["centerX"], frameValue["cameraY"] - (frameValue["nearClip"] + frameValue["farClip"]) * 0.5f, frameValue["centerZ"]), new UnityEngine.Vector3(frameValue["sizeX"], frameValue["farClip"] - frameValue["nearClip"], frameValue["sizeZ"]));
var retainedParticles = new System.Collections.Generic.List<UnityEngine.ParticleSystemRenderer>();
foreach (var renderer in allParticles)
    if (renderer != null && renderer.enabled && renderer.gameObject.activeInHierarchy && !selectedRenderers.ContainsKey(renderer.GetInstanceID()) && renderer.bounds.Intersects(captureBounds)) retainedParticles.Add(renderer);

var beforeFrame = UnityEngine.Time.frameCount;
var renderTexturesBefore = renderTextureInventory();
var renderTexturesAfter = (object)new object[0];
var savedActive = UnityEngine.RenderTexture.active;
var savedFog = UnityEngine.RenderSettings.fog;
var savedAmbientMode = UnityEngine.RenderSettings.ambientMode;
var savedAmbientLight = UnityEngine.RenderSettings.ambientLight;
var savedSkyColor = UnityEngine.RenderSettings.ambientSkyColor;
var savedEquatorColor = UnityEngine.RenderSettings.ambientEquatorColor;
var savedGroundColor = UnityEngine.RenderSettings.ambientGroundColor;
var savedAmbientIntensity = UnityEngine.RenderSettings.ambientIntensity;
var savedAmbientProbe = UnityEngine.RenderSettings.ambientProbe;
var savedReflectionIntensity = UnityEngine.RenderSettings.reflectionIntensity;
var savedSun = UnityEngine.RenderSettings.sun;
var savedCameraTarget = sessionCamera.targetTexture;
var savedCameraEnabled = sessionCamera.enabled;
var savedCameraObjectActive = sessionCameraGo.activeSelf;
var savedLightEnabled = sessionLight.enabled;
var savedLightObjectActive = sessionLightGo.activeSelf;
var savedLightIntensity = sessionLight.intensity;
var savedLightColor = sessionLight.color;
var savedLightRotation = sessionLight.transform.rotation;
var visualState = new System.Func<object>(() =>
{
    var currentProbe = UnityEngine.RenderSettings.ambientProbe;
    var values = new System.Collections.Generic.List<float>();
    for (var rgb = 0; rgb < 3; rgb++) for (var coefficient = 0; coefficient < 9; coefficient++) values.Add(currentProbe[rgb, coefficient]);
    var currentRenderers = new System.Collections.Generic.List<object>();
    for (var rendererIndex = 0; rendererIndex < renderers.Count; rendererIndex++) currentRenderers.Add(new { instanceId = renderers[rendererIndex].GetInstanceID(), enabled = renderers[rendererIndex].enabled });
    var currentLights = new System.Collections.Generic.List<object>();
    foreach (var light in lights) currentLights.Add(new { instanceId = light.GetInstanceID(), enabled = light.enabled });
    var currentProjectors = new System.Collections.Generic.List<object>();
    foreach (var projector in projectors) currentProjectors.Add(new { instanceId = projector.GetInstanceID(), enabled = projector.enabled });
    var currentHighlights = new System.Collections.Generic.List<object>();
    foreach (var effect in highlights) currentHighlights.Add(new { instanceId = effect.GetInstanceID(), cameraMask = effect.camerasLayerMask.value });
    var currentRetained = new System.Collections.Generic.List<object>();
    foreach (var renderer in retainedParticles) currentRetained.Add(new { instanceId = renderer.GetInstanceID(), enabled = renderer.enabled });
    var currentTerrains = new System.Collections.Generic.List<object>();
    foreach (var terrain in terrains) currentTerrains.Add(new { instanceId = terrain.GetInstanceID(), drawTreesAndFoliage = terrain.drawTreesAndFoliage });
    var target = UnityEngine.RenderTexture.active;
    var sun = UnityEngine.RenderSettings.sun;
    return new
    {
        fog = UnityEngine.RenderSettings.fog,
        ambientMode = (int)UnityEngine.RenderSettings.ambientMode,
        ambientLight = rgba(UnityEngine.RenderSettings.ambientLight),
        ambientSky = rgba(UnityEngine.RenderSettings.ambientSkyColor),
        ambientEquator = rgba(UnityEngine.RenderSettings.ambientEquatorColor),
        ambientGround = rgba(UnityEngine.RenderSettings.ambientGroundColor),
        ambientIntensity = UnityEngine.RenderSettings.ambientIntensity,
        ambientProbe = values.ToArray(),
        reflectionIntensity = UnityEngine.RenderSettings.reflectionIntensity,
        sunInstanceId = sun == null ? (int?)null : sun.GetInstanceID(),
        activeTargetInstanceId = target == null ? (int?)null : (int?)target.GetInstanceID(),
        lightEnabled = sessionLight.enabled,
        lightInstanceId = sessionLight.GetInstanceID(), lightIntensity = sessionLight.intensity, lightColor = rgba(sessionLight.color),
        renderers = currentRenderers.ToArray(), lights = currentLights.ToArray(), projectors = currentProjectors.ToArray(),
        highlights = currentHighlights.ToArray(), retainedParticles = currentRetained.ToArray(), terrains = currentTerrains.ToArray(),
    };
});
var beforeVisualState = visualState();
var restoreDone = false;
var restoreRunning = false;
var restorationErrors = new System.Collections.Generic.List<string>();
var attemptRestore = new System.Action<string, System.Action>((name, operation) =>
{
    try { operation(); } catch (System.Exception error) { restorationErrors.Add(name + ": " + formatError(error)); }
});
System.Action restoreFrame = null;
restoreFrame = new System.Action(() =>
{
    if (restoreDone) return;
    if (restoreRunning) return;
    restoreRunning = true;
    restorationErrors.Clear();
    for (var index = 0; index < renderers.Count; index++)
    {
        try { if (renderers[index] != null) renderers[index].enabled = rendererFlags[index]; }
        catch (System.Exception error) { restorationErrors.Add("renderer " + index + ": " + formatError(error)); }
    }
    for (var index = 0; index < lights.Count; index++)
    {
        try { if (lights[index] != null) lights[index].enabled = lightFlags[index]; }
        catch (System.Exception error) { restorationErrors.Add("game light " + index + ": " + formatError(error)); }
    }
    for (var index = 0; index < projectors.Count; index++)
    {
        try { if (projectors[index] != null) projectors[index].enabled = projectorFlags[index]; }
        catch (System.Exception error) { restorationErrors.Add("projector " + index + ": " + formatError(error)); }
    }
    for (var index = 0; index < highlights.Count; index++)
    {
        try { if (highlights[index] != null) highlights[index].camerasLayerMask = highlightMasks[index]; }
        catch (System.Exception error) { restorationErrors.Add("highlight mask " + index + ": " + formatError(error)); }
    }
    for (var index = 0; index < terrains.Count; index++)
    {
        try { if (terrains[index] != null) terrains[index].drawTreesAndFoliage = terrainFlags[index]; }
        catch (System.Exception error) { restorationErrors.Add("terrain trees " + index + ": " + formatError(error)); }
    }
    attemptRestore("sun", () => { UnityEngine.RenderSettings.sun = savedSun; });
    attemptRestore("reflection intensity", () => { UnityEngine.RenderSettings.reflectionIntensity = savedReflectionIntensity; });
    attemptRestore("active render target", () => { UnityEngine.RenderTexture.active = savedActive; });
    attemptRestore("fog", () => { UnityEngine.RenderSettings.fog = savedFog; });
    attemptRestore("ambient mode", () => { UnityEngine.RenderSettings.ambientMode = savedAmbientMode; });
    attemptRestore("ambient light", () => { UnityEngine.RenderSettings.ambientLight = savedAmbientLight; });
    attemptRestore("ambient sky", () => { UnityEngine.RenderSettings.ambientSkyColor = savedSkyColor; });
    attemptRestore("ambient equator", () => { UnityEngine.RenderSettings.ambientEquatorColor = savedEquatorColor; });
    attemptRestore("ambient ground", () => { UnityEngine.RenderSettings.ambientGroundColor = savedGroundColor; });
    attemptRestore("ambient intensity", () => { UnityEngine.RenderSettings.ambientIntensity = savedAmbientIntensity; });
    attemptRestore("camera target", () => { sessionCamera.targetTexture = savedCameraTarget; });
    attemptRestore("camera enabled", () => { sessionCamera.enabled = savedCameraEnabled; });
    attemptRestore("camera active", () => { sessionCameraGo.SetActive(savedCameraObjectActive); });
    attemptRestore("light intensity", () => { sessionLight.intensity = savedLightIntensity; });
    attemptRestore("light color", () => { sessionLight.color = savedLightColor; });
    attemptRestore("light rotation", () => { sessionLight.transform.rotation = savedLightRotation; });
    attemptRestore("light enabled", () => { sessionLight.enabled = savedLightEnabled; });
    attemptRestore("light active", () => { sessionLightGo.SetActive(savedLightObjectActive); });
    var restoredProbe = UnityEngine.RenderSettings.ambientProbe;
    if (!probeEqual(savedAmbientProbe, restoredProbe)) restorationErrors.Add("ambient probe: the saved probe was not restored.");
    if (sessionCamera.targetTexture != savedCameraTarget) restorationErrors.Add("camera target: verification failed.");
    if (UnityEngine.RenderTexture.active != savedActive) restorationErrors.Add("active render target: verification failed.");
    if (UnityEngine.RenderSettings.sun != savedSun) restorationErrors.Add("sun: verification failed.");
    if (UnityEngine.RenderSettings.reflectionIntensity != savedReflectionIntensity) restorationErrors.Add("reflection intensity: verification failed.");
    for (var index = 0; index < lights.Count; index++) if (lights[index] == null || lights[index].enabled != lightFlags[index]) restorationErrors.Add("game light: verification failed.");
    for (var index = 0; index < projectors.Count; index++) if (projectors[index] == null || projectors[index].enabled != projectorFlags[index]) restorationErrors.Add("projector: verification failed.");
    for (var index = 0; index < highlights.Count; index++) if (highlights[index] == null || highlights[index].camerasLayerMask.value != highlightMasks[index].value) restorationErrors.Add("highlight mask: verification failed.");
    if (UnityEngine.RenderSettings.fog != savedFog) restorationErrors.Add("fog: verification failed.");
    if (UnityEngine.RenderSettings.ambientMode != savedAmbientMode) restorationErrors.Add("ambient mode: verification failed.");
    if (UnityEngine.RenderSettings.ambientLight != savedAmbientLight) restorationErrors.Add("ambient light: verification failed.");
    if (UnityEngine.RenderSettings.ambientSkyColor != savedSkyColor) restorationErrors.Add("ambient sky: verification failed.");
    if (UnityEngine.RenderSettings.ambientEquatorColor != savedEquatorColor) restorationErrors.Add("ambient equator: verification failed.");
    if (UnityEngine.RenderSettings.ambientGroundColor != savedGroundColor) restorationErrors.Add("ambient ground: verification failed.");
    if (System.Math.Abs(UnityEngine.RenderSettings.ambientIntensity - savedAmbientIntensity) > 0.0001f) restorationErrors.Add("ambient intensity: verification failed.");
    for (var index = 0; index < renderers.Count; index++) if (renderers[index] == null || renderers[index].enabled != rendererFlags[index]) restorationErrors.Add("renderer suppression: verification failed.");
    for (var index = 0; index < terrains.Count; index++) if (terrains[index] == null || terrains[index].drawTreesAndFoliage != terrainFlags[index]) restorationErrors.Add("terrain trees: verification failed.");
    if (sessionLight.enabled != savedLightEnabled || sessionLightGo.activeSelf != savedLightObjectActive) restorationErrors.Add("owned light: verification failed.");
    restoreRunning = false;
    if (restorationErrors.Count != 0) throw new System.InvalidOperationException("Frame restoration failed: " + string.Join("; ", restorationErrors.ToArray()));
    restoreDone = true;
    sessionState["pendingFrameRestore"] = null;
});
registerFrameCleanup(restoreFrame);
sessionState["pendingFrameRestore"] = restoreFrame;
var captureFailure = (System.Exception)null;
var restorationFailure = (System.Exception)null;
var auditFailure = (System.Exception)null;
var encodedSlices = new System.Collections.Generic.List<(int Index, float Cut, byte[] Bytes, string Hash)>();
var encodedPath = outputPathArgument;
var projectionSamples = new System.Collections.Generic.List<object>(5);
object actualCameraFrame = null;
object duringVisualState = null;
var captureAmbientProbe = new UnityEngine.Rendering.SphericalHarmonicsL2();
var captureAmbientColor = UnityEngine.QualitySettings.activeColorSpace == UnityEngine.ColorSpace.Linear ? ambient.linear : ambient;
captureAmbientProbe[0, 0] = captureAmbientColor.r;
captureAmbientProbe[1, 0] = captureAmbientColor.g;
captureAmbientProbe[2, 0] = captureAmbientColor.b;
try
{
    sessionCamera.enabled = false;
    sessionCamera.orthographic = true;
    sessionCamera.orthographicSize = frameValue["sizeZ"] * 0.5f;
    sessionCamera.aspect = (float)pixelAspect;
    sessionCamera.nearClipPlane = (float)frameValue["nearClip"];
    sessionCamera.farClipPlane = (float)frameValue["farClip"];
    sessionCamera.useOcclusionCulling = false;
    sessionCamera.clearFlags = UnityEngine.CameraClearFlags.SolidColor;
    sessionCamera.backgroundColor = UnityEngine.Color.gray;
    sessionCamera.cullingMask = cullingMask;
    sessionCamera.transform.position = new UnityEngine.Vector3((float)frameValue["centerX"], (float)frameValue["cameraY"], (float)frameValue["centerZ"]);
    sessionCamera.transform.rotation = UnityEngine.Quaternion.Euler(90f, 0f, 0f);
    fault("after-camera");
    sessionCamera.targetTexture = sessionRenderTexture;
    fault("after-target");
    if (!sessionRenderTexture.IsCreated()) throw new System.InvalidOperationException("The capture RenderTexture is no longer created.");
    fault("after-texture");
    var actualPosition = sessionCamera.transform.position;
    var actualSizeZ = sessionCamera.orthographicSize * 2f;
    var actualSizeX = actualSizeZ * sessionCamera.aspect;
    var actualNear = sessionCamera.nearClipPlane;
    var actualFar = sessionCamera.farClipPlane;
    actualCameraFrame = new { center = new { x = actualPosition.x, z = actualPosition.z }, worldSize = new { x = actualSizeX, z = actualSizeZ }, cameraY = actualPosition.y, nearClip = actualNear, farClip = actualFar };
    for (var sampleIndex = 0; sampleIndex < 5; sampleIndex++)
    {
        var offsetX = sampleIndex == 0 ? 0f : ((sampleIndex - 1) & 1) == 0 ? -0.5f : 0.5f;
        var offsetZ = sampleIndex == 0 ? 0f : sampleIndex <= 2 ? -0.5f : 0.5f;
        var world = new UnityEngine.Vector3(actualPosition.x + offsetX * actualSizeX, actualPosition.y - (actualNear + actualFar) * 0.5f, actualPosition.z + offsetZ * actualSizeZ);
        var viewport = sessionCamera.WorldToViewportPoint(world);
        projectionSamples.Add(new { world = new { x = world.x, y = world.y, z = world.z }, viewport = new { x = viewport.x, y = viewport.y, z = viewport.z } });
    }
    sessionLight.type = UnityEngine.LightType.Directional;
    sessionLight.intensity = directionalIntensity;
    sessionLight.color = ambient;
    sessionLight.shadows = UnityEngine.LightShadows.None;
    sessionLight.transform.rotation = UnityEngine.Quaternion.Euler(directionalEuler);
    fault("after-light");
    UnityEngine.RenderSettings.fog = false;
    UnityEngine.RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Flat;
    UnityEngine.RenderSettings.ambientLight = ambient;
    UnityEngine.RenderSettings.ambientSkyColor = ambient;
    UnityEngine.RenderSettings.ambientEquatorColor = ambient;
    UnityEngine.RenderSettings.ambientGroundColor = ambient;
    UnityEngine.RenderSettings.ambientIntensity = 1f;
    foreach (var renderer in renderers) renderer.enabled = false;
    foreach (var light in lights) light.enabled = false;
    foreach (var projector in projectors) projector.enabled = false;
    foreach (var effect in highlights) effect.camerasLayerMask = new UnityEngine.LayerMask { value = 0 };
    foreach (var terrain in terrains) terrain.drawTreesAndFoliage = false;
    UnityEngine.RenderSettings.reflectionIntensity = 0f;
    UnityEngine.RenderSettings.sun = sessionLight;
    sessionLightGo.SetActive(true);
    sessionLight.enabled = true;
    sessionCameraGo.SetActive(true);
    sessionCamera.enabled = false;
    if (!probeEqual(captureAmbientProbe, UnityEngine.RenderSettings.ambientProbe)) throw new System.InvalidOperationException("The engine-derived flat ambient probe does not match the capture color.");
    duringVisualState = visualState();
    fault("after-visuals");
    signal();
    sessionCamera.Render();
    if (UnityEngine.RenderSettings.sun != sessionLight || UnityEngine.RenderSettings.reflectionIntensity != 0f || !probeEqual(captureAmbientProbe, UnityEngine.RenderSettings.ambientProbe)
        || UnityEngine.RenderSettings.fog || UnityEngine.RenderSettings.ambientMode != UnityEngine.Rendering.AmbientMode.Flat || UnityEngine.RenderSettings.ambientIntensity != 1f
        || UnityEngine.RenderSettings.ambientLight != ambient || UnityEngine.RenderSettings.ambientSkyColor != ambient || UnityEngine.RenderSettings.ambientEquatorColor != ambient || UnityEngine.RenderSettings.ambientGroundColor != ambient
        || !sessionLight.enabled || !sessionLightGo.activeInHierarchy || sessionLight.intensity != directionalIntensity || sessionLight.color != ambient)
        throw new System.InvalidOperationException("Rendering changed the controlled lighting state.");
    foreach (var renderer in renderers) if (renderer == null || renderer.enabled) throw new System.InvalidOperationException("Rendering changed a suppressed renderer.");
    foreach (var light in lights) if (light == null || light.enabled) throw new System.InvalidOperationException("Rendering changed a suppressed light.");
    foreach (var light in UnityEngine.Object.FindObjectsOfType<UnityEngine.Light>(true)) if (light != null && light != sessionLight && light.enabled && light.gameObject.activeInHierarchy) throw new System.InvalidOperationException("A game light remained active during capture.");
    foreach (var projector in projectors) if (projector == null || projector.enabled) throw new System.InvalidOperationException("Rendering changed a suppressed projector.");
    foreach (var effect in highlights) if (effect == null || effect.camerasLayerMask.value != 0) throw new System.InvalidOperationException("Rendering changed a highlight camera mask.");
    foreach (var terrain in terrains) if (terrain == null || terrain.drawTreesAndFoliage) throw new System.InvalidOperationException("Rendering changed suppressed terrain trees.");
    foreach (var renderer in player.GetComponentsInChildren<UnityEngine.Renderer>(false)) if (renderer != null && renderer.enabled && renderer.gameObject.activeInHierarchy) throw new System.InvalidOperationException("A player renderer remained enabled during capture.");
    fault("after-render");
    // The first render above verified the controlled state. Each cut now re-renders with the
    // near plane at that height and encodes its own slice; without cuts the frame's own near
    // plane is the single slice.
    var sliceCuts = new System.Collections.Generic.List<float>();
    if (cutHeights.Count == 0) sliceCuts.Add(actualPosition.y - actualNear);
    else sliceCuts.AddRange(cutHeights);
    for (var sliceIndex = 0; sliceIndex < sliceCuts.Count; sliceIndex++)
    {
        var cut = sliceCuts[sliceIndex];
        var near = actualPosition.y - cut;
        if (near <= 0f || near >= actualFar) throw new System.ArgumentException("A cut height must lie below the camera and above its far plane.");
        if (sliceIndex > 0 || cutHeights.Count > 0)
        {
            sessionCamera.nearClipPlane = near;
            sessionCamera.Render();
        }
        UnityEngine.RenderTexture.active = sessionRenderTexture;
        sessionTexture.ReadPixels(new UnityEngine.Rect(0, 0, captureWidth, captureHeight), 0, 0, false);
        sessionTexture.Apply(false, false);
        var nativeEncoded = UnityEngine.ImageConversion.EncodeToPNG(sessionTexture);
        if (nativeEncoded == null || nativeEncoded.Length == 0) throw new System.InvalidOperationException("EncodeToPNG returned no bytes.");
        var sliceBytes = (byte[])nativeEncoded;
        string sliceHash;
        using (var digest = System.Security.Cryptography.SHA256.Create()) sliceHash = System.BitConverter.ToString(digest.ComputeHash(sliceBytes)).Replace("-", "").ToLowerInvariant();
        encodedSlices.Add((sliceIndex, cut, sliceBytes, sliceHash));
    }
    sessionCamera.nearClipPlane = actualNear;
    fault("after-encode");
    if (!ownerConnected()) throw new System.OperationCanceledException("The runtime owner socket disconnected before publishing the capture.");
}
catch (System.Exception error) { captureFailure = error; }
finally
{
    try { restoreFrame(); } catch (System.Exception error) { restorationFailure = error; }
    try { renderTexturesAfter = renderTextureInventory(); } catch (System.Exception error) { if (restorationFailure == null) restorationFailure = error; }
    var afterVisualState = (object)null;
    try { afterVisualState = visualState(); }
    catch (System.Exception error)
    {
        restorationErrors.Add("visual state read: " + formatError(error));
        if (restorationFailure == null) restorationFailure = error;
    }
    var audit = new
    {
        schemaVersion = "compendium.capture-restoration.v4",
        visualPolicy = "compendium.capture-visual-policy.v3",
        colorSpace = UnityEngine.QualitySettings.activeColorSpace.ToString(),
        selections = selections.ToArray(), lightingInputs = lightingInputs.ToArray(),
        key = requestedKey,
        tileId = tileId,
        frameStarted = beforeFrame,
        frameRestored = UnityEngine.Time.frameCount,
        renderSucceeded = captureFailure == null,
        before = beforeVisualState,
        during = duringVisualState,
        after = afterVisualState,
        errors = restorationErrors.ToArray(),
    };
    try { writeAtomicText(restorationPath, Newtonsoft.Json.JsonConvert.SerializeObject(audit)); } catch (System.Exception error) { auditFailure = error; }
}
if (restorationFailure != null) throw restorationFailure;
if (captureFailure != null) throw captureFailure;
if (auditFailure != null) throw auditFailure;
if (encodedSlices.Count == 0) throw new System.InvalidOperationException("The capture did not produce encoded slices.");
if (System.IO.File.Exists(outputPath)) throw new System.IO.IOException("The PNG destination appeared during capture.");
// Slices publish beside the destination as <output>.slice-NNN.png. The host composites them
// into the destination itself, so the destination stays absent here.
var slicePath = new System.Func<int, string>(index => outputPath.Substring(0, outputPath.Length - 4) + ".slice-" + index.ToString("D3") + ".png");
var sliceArgumentPath = new System.Func<int, string>(index => outputPathArgument.Substring(0, outputPathArgument.Length - 4) + ".slice-" + index.ToString("D3") + ".png");
var published = new System.Collections.Generic.List<string>();
try
{
    foreach (var slice in encodedSlices)
    {
        var destination = slicePath(slice.Index);
        if (System.IO.File.Exists(destination)) throw new System.IO.IOException("A slice destination already exists.");
        var temporaryOutput = destination + ".tmp." + System.Guid.NewGuid().ToString("N");
        try
        {
            using (var stream = new System.IO.FileStream(temporaryOutput, System.IO.FileMode.CreateNew, System.IO.FileAccess.Write, System.IO.FileShare.None))
            {
                stream.Write(slice.Bytes, 0, slice.Bytes.Length);
                stream.Flush(true);
            }
            if (!ownerConnected()) throw new System.OperationCanceledException("The runtime owner socket disconnected before publishing the capture.");
            System.IO.File.Move(temporaryOutput, destination);
            published.Add(destination);
        }
        catch (System.Exception)
        {
            try { if (System.IO.File.Exists(temporaryOutput)) System.IO.File.Delete(temporaryOutput); } catch (System.Exception) { }
            throw;
        }
    }
}
catch (System.Exception)
{
    foreach (var path in published) { try { System.IO.File.Delete(path); } catch (System.Exception) { } }
    throw;
}
var sliceReports = new System.Collections.Generic.List<object>();
foreach (var slice in encodedSlices) sliceReports.Add(new { index = slice.Index, cut = slice.Cut, path = sliceArgumentPath(slice.Index), sha256 = slice.Hash, byteSize = slice.Bytes.LongLength });
var firstSlice = encodedSlices[0];

var captureFrameMetadata = new
{
    tileId = tileId,
    path = encodedPath,
    sha256 = firstSlice.Hash,
    byteSize = firstSlice.Bytes.LongLength,
    slices = sliceReports.ToArray(),
    width = captureWidth,
    height = captureHeight,
    frame = beforeFrame,
    restoredFrame = UnityEngine.Time.frameCount,
    renderTexturesBefore = renderTexturesBefore,
    renderTexturesAfter = renderTexturesAfter,
    lightingRestored = true,
    suppressionRestored = true,
    activeTargetRestored = true,
    suppressedRenderers = renderers.Count,
    visualPolicy = "compendium.capture-visual-policy.v3",
    cameraFrame = actualCameraFrame,
    projectionSamples = projectionSamples.ToArray(),
};
sessionState["completedCaptures"] = (int)sessionState["completedCaptures"] + 1;
sessionState["lastCapture"] = captureFrameMetadata;
return sessionReport();