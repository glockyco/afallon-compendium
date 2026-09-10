if (args == null)
    throw new System.ArgumentNullException("args");

var ownerState = System.AppDomain.CurrentDomain.GetData("afallon-compendium.runtime-owner.v1") as System.Collections.Generic.Dictionary<string, object>;
if (ownerState == null || ownerState["state"] as string != "active" || string.IsNullOrEmpty(ownerState["token"] as string))
    throw new System.OperationCanceledException("Runtime ownership is no longer active.");
var finite = new System.Func<float, bool>(value => !float.IsNaN(value) && !float.IsInfinity(value));
var readNumber = new System.Func<Newtonsoft.Json.Linq.JToken, string, float>((token, name) =>
{
    if (token == null || (token.Type != Newtonsoft.Json.Linq.JTokenType.Integer && token.Type != Newtonsoft.Json.Linq.JTokenType.Float))
        throw new System.ArgumentException(name + " must be a finite number.");
    var value = token.ToObject<float>();
    if (!finite(value)) throw new System.ArgumentException(name + " must be a finite number.");
    return value;
});
var readInteger = new System.Func<Newtonsoft.Json.Linq.JToken, string, int>((token, name) =>
{
    if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.Integer)
        throw new System.ArgumentException(name + " must be an integer.");
    var value = token.ToObject<long>();
    if (value < int.MinValue || value > int.MaxValue)
        throw new System.ArgumentException(name + " must fit in Int32.");
    return (int)value;
});
var trackedRendererTokens = args["trackedRendererIds"] as Newtonsoft.Json.Linq.JArray;
if (trackedRendererTokens == null) throw new System.ArgumentException("trackedRendererIds must be an array.");
var trackedRendererIds = new System.Collections.Generic.HashSet<int>();
foreach (var token in trackedRendererTokens)
    if (!trackedRendererIds.Add(readInteger(token, "trackedRendererIds entry")))
        throw new System.ArgumentException("trackedRendererIds must contain unique IDs.");
var readText = new System.Func<Newtonsoft.Json.Linq.JToken, string, string>((token, name) =>
{
    if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrEmpty((string)token))
        throw new System.ArgumentException(name + " must be a non-empty string.");
    return (string)token;
});
var readFrame = new System.Func<Newtonsoft.Json.Linq.JToken, System.Collections.Generic.Dictionary<string, float>>((token) =>
{
    if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.Object)
        throw new System.ArgumentException("frame must be an object.");
    var center = token["center"];
    var worldSize = token["worldSize"];
    if (center == null || center.Type != Newtonsoft.Json.Linq.JTokenType.Object || worldSize == null || worldSize.Type != Newtonsoft.Json.Linq.JTokenType.Object)
        throw new System.ArgumentException("frame.center and frame.worldSize are required.");
    var result = new System.Collections.Generic.Dictionary<string, float>();
    result["centerX"] = readNumber(center["x"], "frame.center.x");
    result["centerZ"] = readNumber(center["z"], "frame.center.z");
    result["sizeX"] = readNumber(worldSize["x"], "frame.worldSize.x");
    result["sizeZ"] = readNumber(worldSize["z"], "frame.worldSize.z");
    result["cameraY"] = readNumber(token["cameraY"], "frame.cameraY");
    result["nearClip"] = readNumber(token["nearClip"], "frame.nearClip");
    result["farClip"] = readNumber(token["farClip"], "frame.farClip");
    if (result["sizeX"] <= 0f || result["sizeZ"] <= 0f || result["sizeX"] > 100000f || result["sizeZ"] > 100000f)
        throw new System.ArgumentException("frame.worldSize must be greater than zero and at most 100000.");
    if (result["nearClip"] <= 0f || result["farClip"] <= result["nearClip"] || result["farClip"] > 100000f)
        throw new System.ArgumentException("frame clip planes must be positive, ordered, and at most 100000.");
    return result;
});

var researchCharacter = readText(args["researchCharacter"], "researchCharacter");
var requestedSceneNativeId = readInteger(args["sceneNativeId"], "sceneNativeId");
if (requestedSceneNativeId < 0) throw new System.ArgumentException("sceneNativeId must be non-negative.");
var requestedScenePath = readText(args["scenePath"], "scenePath");
var frameValues = readFrame(args["frame"]);
var boundaryOverlap = readNumber(args["boundaryOverlap"], "boundaryOverlap");
if (boundaryOverlap < 0f || boundaryOverlap > 1000f)
    throw new System.ArgumentException("boundaryOverlap must be between 0 and 1000.");
var cullingMask = readInteger(args["cullingMask"], "cullingMask");

var character = Il2CppBLINK.RPGBuilder.Characters.Character.Instance;
var characterData = character == null ? null : character.CharacterData;
if (characterData == null || !characterData.IsCreated || characterData.CharacterName != researchCharacter)
    throw new System.InvalidOperationException("The configured research character is not active.");

var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var nativeScene = Il2Cpp.GameState.CurrentGameScene;
if (!scene.isLoaded || nativeScene == null)
    throw new System.InvalidOperationException("A loaded native game scene is required.");
if ((int)nativeScene.ID != requestedSceneNativeId || scene.path != requestedScenePath)
    throw new System.InvalidOperationException("The current scene does not match sceneNativeId and scenePath.");
var player = Il2Cpp.GameState.playerEntity;
if (player == null || player.transform == null)
    throw new System.InvalidOperationException("GameState.playerEntity.transform is required for native automatic-load checks.");

var essentials = Il2CppBLINK.RPGBuilder.LogicMono.RPGBuilderEssentials.Instance;
var loadingScreen = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.Instance;
var sceneReady = scene.isLoaded && essentials != null && essentials.SceneInitialized && loadingScreen != null && !loadingScreen.isSceneLoading && !Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.HasSceneReadyHolds;

var frustumCenter = new UnityEngine.Vector3(
    frameValues["centerX"],
    frameValues["cameraY"] - (frameValues["nearClip"] + frameValues["farClip"]) * 0.5f,
    frameValues["centerZ"]);
var frustumSize = new UnityEngine.Vector3(
    frameValues["sizeX"] + boundaryOverlap * 2f,
    frameValues["farClip"] - frameValues["nearClip"],
    frameValues["sizeZ"] + boundaryOverlap * 2f);
var finiteVector = new System.Action<UnityEngine.Vector3, string>((value, name) =>
{
    if (!finite(value.x) || !finite(value.y) || !finite(value.z))
        throw new System.InvalidOperationException(name + " contains a non-finite native value.");
});
finiteVector(frustumCenter, "frustum.center");
finiteVector(frustumSize, "frustum.size");
var frustum = new UnityEngine.Bounds(frustumCenter, frustumSize);
var radiusDouble = 0.5 * System.Math.Sqrt((double)frustumSize.x * frustumSize.x + (double)frustumSize.y * frustumSize.y + (double)frustumSize.z * frustumSize.z);
if (double.IsNaN(radiusDouble) || double.IsInfinity(radiusDouble) || radiusDouble > float.MaxValue)
    throw new System.InvalidOperationException("The preload envelope radius is not finite.");
var preloadRadius = (float)radiusDouble;
var preloadCenter = frustumCenter;

var reflectionFlags = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic;
var loaderType = typeof(Il2Cpp.AddressableLoader);
var coversMethod = loaderType.GetMethod("Covers", reflectionFlags, null, new System.Type[] { typeof(UnityEngine.Vector3), typeof(float) }, null);
if (coversMethod == null || coversMethod.IsStatic || coversMethod.ReturnType != typeof(bool))
    throw new System.InvalidOperationException("The native AddressableLoader.Covers(Vector3,float) method is unavailable.");
var covers = (System.Func<Il2Cpp.AddressableLoader, UnityEngine.Vector3, float, bool>)coversMethod.CreateDelegate(typeof(System.Func<Il2Cpp.AddressableLoader, UnityEngine.Vector3, float, bool>));
var nativeNeedsPreload = Il2Cpp.AddressableLoader.NeedsPreloadAround(preloadCenter, preloadRadius);

var assetProperty = loaderType.GetProperty("loadedAsset", reflectionFlags);
var holdProperty = loaderType.GetProperty("holdUntil", reflectionFlags);
var handleProperty = loaderType.GetProperty("hasInstanceHandle", reflectionFlags);
var loadedOrLoadingProperty = loaderType.GetProperty("IsLoadedOrLoading", reflectionFlags);
var loadingMethod = loaderType.GetMethod("IsLoading", reflectionFlags, null, System.Type.EmptyTypes, null);
var playerWithinMethod = loaderType.GetMethod("PlayerIsWithin", reflectionFlags, null, new System.Type[] { typeof(float) }, null);
if (assetProperty == null || !assetProperty.CanRead || holdProperty == null || !holdProperty.CanRead || handleProperty == null || !handleProperty.CanRead || loadedOrLoadingProperty == null || !loadedOrLoadingProperty.CanRead || loadedOrLoadingProperty.PropertyType != typeof(bool) || loadingMethod == null || loadingMethod.IsStatic || loadingMethod.ReturnType != typeof(bool) || playerWithinMethod == null || playerWithinMethod.IsStatic || playerWithinMethod.ReturnType != typeof(bool))
    throw new System.InvalidOperationException("The reviewed AddressableLoader state and automatic-load methods are unavailable.");
if (holdProperty.PropertyType != typeof(float) || handleProperty.PropertyType != typeof(bool) || assetProperty.PropertyType != typeof(UnityEngine.GameObject))
    throw new System.InvalidOperationException("The reviewed AddressableLoader state property signatures changed.");
var getAsset = new System.Func<Il2Cpp.AddressableLoader, UnityEngine.GameObject>(loader => (UnityEngine.GameObject)assetProperty.GetValue(loader));
var getHold = new System.Func<Il2Cpp.AddressableLoader, float>(loader => (float)holdProperty.GetValue(loader));
var getHandle = new System.Func<Il2Cpp.AddressableLoader, bool>(loader => (bool)handleProperty.GetValue(loader));
var getLoadedOrLoading = new System.Func<Il2Cpp.AddressableLoader, bool>(loader => (bool)loadedOrLoadingProperty.GetValue(loader));
var getLoading = new System.Func<Il2Cpp.AddressableLoader, bool>(loader => (bool)loadingMethod.Invoke(loader, null));
var getAutomaticLoadPending = new System.Func<Il2Cpp.AddressableLoader, float, bool>((loader, distance) => (bool)playerWithinMethod.Invoke(loader, new object[] { System.Math.Max(0f, distance) }));

var vector = new System.Func<UnityEngine.Vector3, object>(value =>
{
    finiteVector(value, "native vector");
    return new { x = value.x, y = value.y, z = value.z };
});
var boundsObject = new System.Func<UnityEngine.Bounds, object>(value =>
{
    finiteVector(value.center, "native bounds center");
    finiteVector(value.size, "native bounds size");
    return new { center = vector(value.center), size = vector(value.size) };
});
var addIssue = new System.Action<System.Collections.Generic.List<object>, string, int, string>((issues, kind, sourceId, detail) =>
{
    if (string.IsNullOrEmpty(kind) || string.IsNullOrEmpty(detail)) throw new System.InvalidOperationException("A geometry issue must have a kind and detail.");
    issues.Add(new { kind = kind, sourceId = sourceId, detail = detail });
});

var hierarchyPath = new System.Func<UnityEngine.Transform, string>((transform) =>
{
    if (transform == null) throw new System.InvalidOperationException("A source transform is missing.");
    var parts = new System.Collections.Generic.List<string>();
    var cursor = transform;
    var guard = 0;
    while (cursor != null && guard < 512)
    {
        var name = cursor.name ?? "";
        parts.Add(name + "[" + cursor.GetSiblingIndex().ToString() + "]");
        cursor = cursor.parent;
        guard++;
    }
    if (cursor != null) throw new System.InvalidOperationException("A source hierarchy exceeds the 512-node integrity bound.");
    for (var index = 0; index < parts.Count / 2; index++)
    {
        var opposite = parts.Count - index - 1;
        var part = parts[index];
        parts[index] = parts[opposite];
        parts[opposite] = part;
    }
    var result = string.Join("/", parts.ToArray());
    if (string.IsNullOrEmpty(result)) throw new System.InvalidOperationException("A source hierarchy path is empty.");
    return result;
});

var issues = new System.Collections.Generic.List<object>();
var sources = new System.Collections.Generic.List<System.Collections.Generic.Dictionary<string, object>>();
var sourceById = new System.Collections.Generic.Dictionary<int, System.Collections.Generic.Dictionary<string, object>>();
var rootLoaderByTransformId = new System.Collections.Generic.Dictionary<int, int>();
var allLoaders = UnityEngine.Object.FindObjectsOfType<Il2Cpp.AddressableLoader>(true);
var loaderSceneCount = 0;
foreach (var loader in allLoaders)
{
    if (loader == null || loader.gameObject == null || loader.transform == null)
        throw new System.InvalidOperationException("FindObjectsOfType returned an invalid AddressableLoader.");
    if (loader.gameObject.scene.handle != scene.handle) continue;
    loaderSceneCount++;

    var loaderId = loader.GetInstanceID();
    var gameObject = loader.gameObject;
    var transform = loader.transform;
    var assetGuid = (string)null;
    if (loader.addressableAsset != null) assetGuid = loader.addressableAsset.AssetGUID;
    if (string.IsNullOrEmpty(assetGuid)) addIssue(issues, "source-integrity", loaderId, "AddressableLoader.addressableAsset.AssetGUID is missing.");

    var category = (string)null;
    try { category = loader.DisplayCategory; }
    catch (System.Exception error) { addIssue(issues, "source-integrity", loaderId, "AddressableLoader.DisplayCategory could not be read: " + error.GetType().FullName + ": " + error.Message); }

    var root = getAsset(loader);
    var loading = getLoading(loader);
    var hasHandle = getHandle(loader);
    var holdUntil = getHold(loader);
    var loadDistance = loader.loadDistance;
    if (!finite(holdUntil) || !finite(loadDistance))
        throw new System.InvalidOperationException("AddressableLoader state contains a non-finite holdUntil or loadDistance.");
    if (!loading && (root != null) != hasHandle)
        addIssue(issues, "source-integrity", loaderId, "A settled AddressableLoader has inconsistent loadedAsset and hasInstanceHandle state.");

    var rootId = root == null ? (int?)null : (int?)root.GetInstanceID();
    var rootActive = root == null ? (bool?)null : (bool?)root.activeInHierarchy;
    if (root != null)
    {
        if (root.transform == null)
        {
            addIssue(issues, "source-integrity", loaderId, "AddressableLoader.loadedAsset has no root Transform.");
        }
        else
        {
            var rootTransformId = root.transform.GetInstanceID();
            int priorLoaderId;
            if (rootLoaderByTransformId.TryGetValue(rootTransformId, out priorLoaderId))
            {
                addIssue(issues, "source-integrity", loaderId, "The loadedAsset root Transform is also owned by AddressableLoader " + priorLoaderId.ToString() + ".");
            }
            else
            {
                rootLoaderByTransformId.Add(rootTransformId, loaderId);
            }
        }
    }

    var activeSelf = gameObject.activeSelf;
    var activeInHierarchy = gameObject.activeInHierarchy;
    var enabled = loader.enabled;
    var automaticLoadPending = false;
    if (activeInHierarchy && enabled && root == null && !loading && !hasHandle)
        automaticLoadPending = getAutomaticLoadPending(loader, loadDistance);

    var row = new System.Collections.Generic.Dictionary<string, object>();
    row["instanceId"] = loaderId;
    row["assetGuid"] = string.IsNullOrEmpty(assetGuid) ? null : (object)assetGuid;
    row["hierarchyPath"] = hierarchyPath(transform);
    row["category"] = string.IsNullOrEmpty(category) ? null : (object)category;
    row["position"] = vector(transform.position);
    row["activeSelf"] = activeSelf;
    row["activeInHierarchy"] = activeInHierarchy;
    row["enabled"] = enabled;
    row["coversEnvelope"] = covers(loader, preloadCenter, preloadRadius);
    row["coversFrustum"] = covers(loader, frustum.ClosestPoint(transform.position), 0f);
    row["intersectsFrustum"] = false;
    row["loadedOrLoading"] = getLoadedOrLoading(loader);
    row["loaded"] = root != null;
    row["loading"] = loading;
    row["hasHandle"] = hasHandle;
    row["automaticLoadPending"] = automaticLoadPending;
    row["rootId"] = rootId;
    row["rootActive"] = rootActive;
    row["holdUntil"] = holdUntil;
    row["loadDistance"] = loadDistance;
    sources.Add(row);
    sourceById.Add(loaderId, row);
}

var ancestryMemo = new System.Collections.Generic.Dictionary<int, int?>();
var findSourceLoader = new System.Func<UnityEngine.Transform, int?>((start) =>
{
    if (start == null) return null;
    var visited = new System.Collections.Generic.List<int>();
    var cursor = start;
    int? result = null;
    var guard = 0;
    while (cursor != null && guard < 512)
    {
        var transformId = cursor.GetInstanceID();
        int? memoized;
        if (ancestryMemo.TryGetValue(transformId, out memoized))
        {
            result = memoized;
            break;
        }
        visited.Add(transformId);
        int loaderId;
        if (rootLoaderByTransformId.TryGetValue(transformId, out loaderId))
        {
            result = loaderId;
            break;
        }
        cursor = cursor.parent;
        guard++;
    }
    if (cursor != null && guard >= 512)
        throw new System.InvalidOperationException("A geometry hierarchy exceeds the 512-node integrity bound.");
    foreach (var transformId in visited) ancestryMemo[transformId] = result;
    return result;
});

var isMaskVisible = new System.Func<UnityEngine.GameObject, bool>(gameObject =>
{
    if (gameObject == null || gameObject.layer < 0 || gameObject.layer > 31) return false;
    return (((uint)cullingMask) & (1u << gameObject.layer)) != 0u;
});
var markSourceIntersection = new System.Action<int?>((sourceLoaderId) =>
{
    if (!sourceLoaderId.HasValue) return;
    System.Collections.Generic.Dictionary<string, object> source;
    if (!sourceById.TryGetValue(sourceLoaderId.Value, out source))
    {
        addIssue(issues, "source-integrity", sourceLoaderId.Value, "Geometry resolved to a loader outside the active scene inventory.");
        return;
    }
    source["intersectsFrustum"] = true;
});

var visualSelection = collectCaptureVisuals();
var excludedRendererReasons = new System.Collections.Generic.Dictionary<int, string>();
visitCaptureVisualRenderers(visualSelection.Roots, (renderer, reason) =>
{
    var id = renderer.GetInstanceID();
    if (!excludedRendererReasons.ContainsKey(id)) excludedRendererReasons.Add(id, reason);
});
var allRenderers = UnityEngine.Object.FindObjectsOfType<UnityEngine.Renderer>(true);
var excludedRenderers = new System.Collections.Generic.List<object>();
var meshes = new System.Collections.Generic.List<object>();
var otherRenderers = new System.Collections.Generic.List<object>();
var rendererSceneCount = 0;
foreach (var renderer in allRenderers)
{
    if (renderer == null || renderer.gameObject == null || renderer.transform == null) continue;
    if (renderer.gameObject.scene.handle != scene.handle) continue;
    rendererSceneCount++;
    if (!renderer.gameObject.activeInHierarchy || !renderer.enabled || !isMaskVisible(renderer.gameObject)) continue;
    string exclusionReason;
    if (excludedRendererReasons.TryGetValue(renderer.GetInstanceID(), out exclusionReason))
    {
        excludedRenderers.Add(new { instanceId = renderer.GetInstanceID(), reason = exclusionReason });
        continue;
    }

    UnityEngine.Bounds rendererBounds;
    try { rendererBounds = renderer.bounds; }
    catch (System.Exception error)
    {
        addIssue(issues, "source-integrity", renderer.GetInstanceID(), "Renderer.bounds could not be read: " + error.GetType().FullName + ": " + error.Message);
        continue;
    }
    var intersects = rendererBounds.Intersects(frustum);
    var sourceLoaderId = findSourceLoader(renderer.transform);
    System.Collections.Generic.Dictionary<string, object> source;
    var selectedSource = sourceLoaderId.HasValue && sourceById.TryGetValue(sourceLoaderId.Value, out source) && (bool)source["coversFrustum"] && (bool)source["activeInHierarchy"] && (bool)source["enabled"];
    var tracked = trackedRendererIds.Contains(renderer.GetInstanceID());
    if (!intersects && !selectedSource && !tracked) continue;
    var meshRenderer = renderer.TryCast<UnityEngine.MeshRenderer>();
    var skinnedRenderer = meshRenderer == null ? renderer.TryCast<UnityEngine.SkinnedMeshRenderer>() : null;

    if (meshRenderer != null || skinnedRenderer != null)
    {
        UnityEngine.Mesh mesh = null;
        var kind = meshRenderer != null ? "mesh" : "skinned";
        if (meshRenderer != null)
        {
            var filter = renderer.GetComponent<UnityEngine.MeshFilter>();
            if (filter != null) mesh = filter.sharedMesh;
        }
        else mesh = skinnedRenderer.sharedMesh;
        if (!intersects && !tracked && mesh != null) continue;
        if (intersects) markSourceIntersection(sourceLoaderId);

        var materialIds = new System.Collections.Generic.List<object>();
        Il2CppInterop.Runtime.InteropTypes.Arrays.Il2CppReferenceArray<UnityEngine.Material> sharedMaterials = null;
        try { sharedMaterials = renderer.sharedMaterials; }
        catch (System.Exception error)
        {
            addIssue(issues, "missing-material", renderer.GetInstanceID(), "Renderer.sharedMaterials could not be read: " + error.GetType().FullName + ": " + error.Message);
        }
        if (sharedMaterials == null || sharedMaterials.Length == 0)
        {
            if (mesh != null) addIssue(issues, "missing-material", renderer.GetInstanceID(), "Selected mesh renderer has no shared materials.");
        }
        else
        {
            for (var materialIndex = 0; materialIndex < sharedMaterials.Length; materialIndex++)
            {
                var material = sharedMaterials[materialIndex];
                if (material == null)
                {
                    materialIds.Add(null);
                    if (mesh != null) addIssue(issues, "missing-material", renderer.GetInstanceID(), "Selected mesh renderer has a missing shared material at slot " + materialIndex.ToString() + ".");
                }
                else materialIds.Add(material.GetInstanceID());
            }
        }

        var meshId = mesh == null ? (int?)null : (int?)mesh.GetInstanceID();
        var meshName = mesh == null || string.IsNullOrEmpty(mesh.name) ? null : mesh.name;
        var vertices = mesh == null ? (int?)null : (int?)mesh.vertexCount;
        var meshRow = new System.Collections.Generic.Dictionary<string, object>();
        meshRow["rendererId"] = renderer.GetInstanceID();
        meshRow["kind"] = kind;
        meshRow["meshId"] = meshId;
        meshRow["meshName"] = meshName;
        meshRow["vertices"] = vertices;
        meshRow["bounds"] = boundsObject(rendererBounds);
        meshRow["intersectsFrustum"] = intersects;
        meshRow["sourceLoaderId"] = sourceLoaderId;
        meshRow["materialIds"] = materialIds.ToArray();
        meshes.Add(meshRow);
    }
    else
    {
        if (!intersects && !tracked) continue;
        if (intersects) markSourceIntersection(sourceLoaderId);
        var rendererType = renderer.GetIl2CppType();
        var rendererTypeName = rendererType == null ? null : rendererType.FullName;
        if (string.IsNullOrEmpty(rendererTypeName))
            throw new System.InvalidOperationException("A visible non-mesh Renderer has no native type name.");
        otherRenderers.Add(new
        {
            instanceId = renderer.GetInstanceID(),
            type = rendererTypeName,
            bounds = boundsObject(rendererBounds),
            sourceLoaderId = sourceLoaderId
        });
    }
}

var transformTerrainBounds = new System.Func<UnityEngine.TerrainData, UnityEngine.Transform, UnityEngine.Bounds>((data, transform) =>
{
    if (data == null || transform == null) throw new System.ArgumentNullException();
    var localBounds = data.bounds;
    finiteVector(localBounds.center, "TerrainData.bounds.center");
    finiteVector(localBounds.size, "TerrainData.bounds.size");
    var extents = localBounds.extents;
    var localCenter = localBounds.center;
    var minimum = new UnityEngine.Vector3(float.MaxValue, float.MaxValue, float.MaxValue);
    var maximum = new UnityEngine.Vector3(float.MinValue, float.MinValue, float.MinValue);
    for (var cornerIndex = 0; cornerIndex < 8; cornerIndex++)
    {
        var corner = transform.TransformPoint(localCenter + new UnityEngine.Vector3(
            (cornerIndex & 1) == 0 ? -extents.x : extents.x,
            (cornerIndex & 2) == 0 ? -extents.y : extents.y,
            (cornerIndex & 4) == 0 ? -extents.z : extents.z));
        finiteVector(corner, "TerrainData transformed bound corner");
        minimum = UnityEngine.Vector3.Min(minimum, corner);
        maximum = UnityEngine.Vector3.Max(maximum, corner);
    }
    return new UnityEngine.Bounds((minimum + maximum) * 0.5f, maximum - minimum);
});

var terrains = new System.Collections.Generic.List<object>();
var allTerrains = UnityEngine.Object.FindObjectsOfType<UnityEngine.Terrain>(true);
var terrainSceneCount = 0;
foreach (var terrain in allTerrains)
{
    if (terrain == null || terrain.gameObject == null || terrain.transform == null) continue;
    if (terrain.gameObject.scene.handle != scene.handle) continue;
    terrainSceneCount++;
    if (!terrain.gameObject.activeInHierarchy || !terrain.enabled || !isMaskVisible(terrain.gameObject)) continue;
    var sourceLoaderId = findSourceLoader(terrain.transform);
    var data = terrain.terrainData;
    if (data == null)
    {
        addIssue(issues, "missing-terrain", terrain.GetInstanceID(), "Terrain.terrainData is missing.");
        terrains.Add(new
        {
            instanceId = terrain.GetInstanceID(),
            dataId = (int?)null,
            dataName = (string)null,
            bounds = (object)null,
            heightmapResolution = (int?)null,
            sourceLoaderId = sourceLoaderId
        });
        continue;
    }
    UnityEngine.Bounds terrainBounds;
    try { terrainBounds = transformTerrainBounds(data, terrain.transform); }
    catch (System.Exception error)
    {
        addIssue(issues, "source-integrity", terrain.GetInstanceID(), "TerrainData bounds could not be transformed: " + error.GetType().FullName + ": " + error.Message);
        terrains.Add(new
        {
            instanceId = terrain.GetInstanceID(),
            dataId = (int?)data.GetInstanceID(),
            dataName = string.IsNullOrEmpty(data.name) ? null : data.name,
            bounds = (object)null,
            heightmapResolution = (int?)data.heightmapResolution,
            sourceLoaderId = sourceLoaderId
        });
        continue;
    }
    if (!terrainBounds.Intersects(frustum)) continue;
    markSourceIntersection(sourceLoaderId);
    terrains.Add(new
    {
        instanceId = terrain.GetInstanceID(),
        dataId = (int?)data.GetInstanceID(),
        dataName = string.IsNullOrEmpty(data.name) ? null : data.name,
        bounds = boundsObject(terrainBounds),
        heightmapResolution = (int?)data.heightmapResolution,
        sourceLoaderId = sourceLoaderId
    });
}

return new
{
    schemaVersion = "compendium.capture-geometry.v3",
    visualPolicy = "compendium.capture-visual-policy.v2",
    excludedRenderers = excludedRenderers.ToArray(),
    frame = UnityEngine.Time.frameCount,
    scene = new { nativeId = (int)nativeScene.ID, handle = scene.handle, path = scene.path, ready = sceneReady },
    frustum = boundsObject(frustum),
    preloadEnvelope = new { center = vector(preloadCenter), radius = preloadRadius },
    nativeNeedsPreload = nativeNeedsPreload,
    queries = new
    {
        loaders = new { all = allLoaders.Length, scene = loaderSceneCount, foreign = allLoaders.Length - loaderSceneCount },
        renderers = new { all = allRenderers.Length, scene = rendererSceneCount, foreign = allRenderers.Length - rendererSceneCount },
        terrains = new { all = allTerrains.Length, scene = terrainSceneCount, foreign = allTerrains.Length - terrainSceneCount }
    },
    sources = sources.ToArray(),
    meshes = meshes.ToArray(),
    terrains = terrains.ToArray(),
    otherRenderers = otherRenderers.ToArray(),
    issues = issues.ToArray()
};
