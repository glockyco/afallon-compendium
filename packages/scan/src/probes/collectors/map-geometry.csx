var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var gameScene = Il2Cpp.GameState.CurrentGameScene;
var player = Il2Cpp.GameState.playerEntity;
if (!scene.isLoaded || gameScene == null || player == null) throw new System.InvalidOperationException("Map geometry requires a loaded scene and player.");
var vector = new System.Func<UnityEngine.Vector3, object>(v => new { x = v.x, y = v.y, z = v.z });
var vector2 = new System.Func<UnityEngine.Vector2, object>(v => new { x = v.x, y = v.y });
var quaternion = new System.Func<UnityEngine.Quaternion, object>(q => new { x = q.x, y = q.y, z = q.z, w = q.w });
var bounds = new System.Func<UnityEngine.Bounds, object>(b => new { center = vector(b.center), size = vector(b.size) });
var source = new System.Func<UnityEngine.Component, object>(component =>
{
    var transform = component.transform;
    var go = component.gameObject;
    var parent = transform.parent;
    return new { componentInstanceId = component.GetInstanceID(), gameObjectInstanceId = go.GetInstanceID(), transformInstanceId = transform.GetInstanceID(), parentTransformInstanceId = parent == null ? (int?)null : parent.GetInstanceID(), rootGameObjectInstanceId = transform.root.gameObject.GetInstanceID(), name = go.name, position = vector(transform.position), rotation = quaternion(transform.rotation), scale = vector(transform.lossyScale), localScale = vector(transform.localScale), isStatic = go.isStatic, activeSelf = go.activeSelf, activeInHierarchy = go.activeInHierarchy };
});
var colliderEvidence = new System.Func<UnityEngine.Collider, object>(collider =>
{
    object shape = null;
    var box = collider.TryCast<UnityEngine.BoxCollider>();
    var sphere = collider.TryCast<UnityEngine.SphereCollider>();
    var transform = collider.transform;
    if (box != null)
    {
        var center = box.center;
        var size = box.size;
        var corners = new object[8];
        for (var index = 0; index < corners.Length; index++) corners[index] = vector(transform.TransformPoint(center + new UnityEngine.Vector3((index & 1) == 0 ? -size.x * 0.5f : size.x * 0.5f, (index & 2) == 0 ? -size.y * 0.5f : size.y * 0.5f, (index & 4) == 0 ? -size.z * 0.5f : size.z * 0.5f)));
        shape = new { kind = "box", center = vector(center), size = vector(size), worldCorners = corners };
    }
    else if (sphere != null)
    {
        var scale = transform.lossyScale;
        var radius = sphere.radius;
        shape = new { kind = "sphere", center = vector(sphere.center), radius = radius, worldCenter = vector(transform.TransformPoint(sphere.center)), worldRadius = radius * UnityEngine.Mathf.Max(UnityEngine.Mathf.Abs(scale.x), UnityEngine.Mathf.Max(UnityEngine.Mathf.Abs(scale.y), UnityEngine.Mathf.Abs(scale.z))) };
    }
    return new { instanceId = collider.GetInstanceID(), type = collider.GetIl2CppType().FullName, bounds = bounds(collider.bounds), enabled = collider.enabled, isTrigger = collider.isTrigger, shape = shape };
});
var queries = new System.Collections.Generic.List<object>();
var recordQuery = new System.Action<string, int, int>((type, total, matched) => queries.Add(new { nativeType = type, includeInactiveCount = total, sceneCount = matched, foreignSceneCount = total - matched }));
var landmarks = new System.Collections.Generic.List<object>();
var addLandmark = new System.Action<string, int?, int?, UnityEngine.Vector3>((kind, instanceId, nativeId, position) =>
{
    UnityEngine.AI.NavMeshHit hit;
    var found = UnityEngine.AI.NavMesh.SamplePosition(position, out hit, 1.0f, -1);
    landmarks.Add(new { kind = kind, componentInstanceId = instanceId, nativeId = nativeId, position = vector(position), navigation = found ? (object)new { position = vector(hit.position), distance = hit.distance, areaMask = hit.mask } : null });
});
addLandmark("player", player.GetInstanceID(), null, player.transform.position);
var database = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
foreach (var pair in database.GetWorldPositions())
{
    var position = pair.Value;
    if (position != null && position.ID == gameScene.startPositionID) addLandmark("authored-start", null, position.ID, position.position);
}
var nativeSpawners = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.AI.NPCSpawner>(true);
var landmarkStart = landmarks.Count;
foreach (var component in nativeSpawners)
    if (component.gameObject.scene.handle == scene.handle) addLandmark("npc-producer", component.GetInstanceID(), null, component.transform.position);
recordQuery("BLINK.RPGBuilder.AI.NPCSpawner", nativeSpawners.Length, landmarks.Count - landmarkStart);
var nativeInteractions = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.World.InteractableObject>(true);
landmarkStart = landmarks.Count;
foreach (var component in nativeInteractions)
    if (component.gameObject.scene.handle == scene.handle) addLandmark("interaction", component.GetInstanceID(), null, component.transform.position);
recordQuery("BLINK.RPGBuilder.World.InteractableObject", nativeInteractions.Length, landmarks.Count - landmarkStart);
var zones = new System.Collections.Generic.List<object>();
var nativeZones = UnityEngine.Object.FindObjectsOfType<Il2CppMapMinimap.MapZone>(true);
foreach (var zone in nativeZones)
{
    if (zone.gameObject.scene.handle != scene.handle) continue;
    var collider = zone.GetComponent<UnityEngine.BoxCollider>();
    object calibration = null;
    string error = null;
    try
    {
        var samples = new System.Collections.Generic.List<object>();
        foreach (var point in new[] { new UnityEngine.Vector2(-1, -1), new UnityEngine.Vector2(0, 0), new UnityEngine.Vector2(1, 0), new UnityEngine.Vector2(0, 1), new UnityEngine.Vector2(1, 1) })
        {
            var world = zone.GetWorldPosition(point);
            samples.Add(new { map = vector2(point), world = vector(world), roundTrip = vector2(zone.GetNormalizedPos(world)) });
        }
        calibration = new { center = vector(zone.GetCenter()), size = vector2(zone.GetSize()), extents = vector2(zone.GetExtents()), rotation = zone.GetRotation(), samples = samples, playerNormalized = vector2(zone.GetNormalizedPos(player.transform.position)), playerInside = zone.IsInside(player.transform.position), playerProjected = vector(zone.GetProjectedPosition(player.transform.position)) };
    }
    catch (System.Exception exception) { error = exception.GetType().FullName + ": " + exception.Message; }
    var texture = zone.map;
    zones.Add(new { source = source(zone), zoneId = zone.zone_id, texture = texture == null ? null : (object)new { instanceId = texture.GetInstanceID(), name = texture.name, width = texture.width, height = texture.height }, collider = collider == null ? null : colliderEvidence(collider), calibration = calibration, error = error });
}
recordQuery("MapMinimap.MapZone", nativeZones.Length, zones.Count);
var regions = new System.Collections.Generic.List<object>();
var nativeRegions = UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder._THMSV.RPGBuilder.Scripts.World.Region>(true);
foreach (var region in nativeRegions)
{
    if (region.gameObject.scene.handle != scene.handle) continue;
    var colliders = new System.Collections.Generic.List<object>();
    foreach (var collider in region.GetComponents<UnityEngine.Collider>()) colliders.Add(colliderEvidence(collider));
    regions.Add(new { source = source(region), nativeId = region.RegionTemplate == null ? (int?)null : region.RegionTemplate.ID, shape = region.shapeType.ToString(), colliders = colliders });
}
recordQuery("BLINK.RPGBuilder._THMSV.RPGBuilder.Scripts.World.Region", nativeRegions.Length, regions.Count);
var meshes = new System.Collections.Generic.Dictionary<int, object>();
var renderers = new System.Collections.Generic.List<object>();
var nativeRenderers = UnityEngine.Object.FindObjectsOfType<UnityEngine.Renderer>(true);
var rendererTypeNames = new System.Collections.Generic.Dictionary<System.IntPtr, string>();
foreach (var renderer in nativeRenderers)
{
    if (renderer.gameObject.scene.handle != scene.handle) continue;
    UnityEngine.Mesh mesh = null;
    var meshRenderer = renderer.TryCast<UnityEngine.MeshRenderer>();
    if (meshRenderer != null)
    {
        var filter = renderer.GetComponent<UnityEngine.MeshFilter>();
        if (filter != null) mesh = filter.sharedMesh;
    }
    else
    {
        var skinned = renderer.TryCast<UnityEngine.SkinnedMeshRenderer>();
        if (skinned != null) mesh = skinned.sharedMesh;
    }
    var meshId = mesh == null ? (int?)null : mesh.GetInstanceID();
    if (meshId.HasValue && !meshes.ContainsKey(meshId.Value)) meshes.Add(meshId.Value, new { instanceId = meshId.Value, name = mesh.name, vertices = mesh.vertexCount, bounds = bounds(mesh.bounds) });
    var rendererType = renderer.GetIl2CppType();
    string rendererTypeName;
    if (!rendererTypeNames.TryGetValue(rendererType.Pointer, out rendererTypeName))
    {
        rendererTypeName = rendererType.FullName;
        rendererTypeNames.Add(rendererType.Pointer, rendererTypeName);
    }
    renderers.Add(new { source = source(renderer), type = rendererTypeName, enabled = renderer.enabled, isPartOfStaticBatch = renderer.isPartOfStaticBatch, bounds = bounds(renderer.bounds), meshInstanceId = meshId });
}
recordQuery("UnityEngine.Renderer", nativeRenderers.Length, renderers.Count);
var terrains = new System.Collections.Generic.List<object>();
var nativeTerrains = UnityEngine.Object.FindObjectsOfType<UnityEngine.Terrain>(true);
foreach (var terrain in nativeTerrains)
{
    if (terrain.gameObject.scene.handle != scene.handle) continue;
    var data = terrain.terrainData;
    terrains.Add(new { source = source(terrain), enabled = terrain.enabled, terrainData = data == null ? null : (object)new { instanceId = data.GetInstanceID(), name = data.name, bounds = bounds(data.bounds), size = vector(data.size), heightmapResolution = data.heightmapResolution } });
}
recordQuery("UnityEngine.Terrain", nativeTerrains.Length, terrains.Count);
var navigationSurfaces = new System.Collections.Generic.List<object>();
var modernSurfaces = UnityEngine.Object.FindObjectsOfType<Unity.AI.Navigation.NavMeshSurface>(true);
foreach (var surface in modernSurfaces)
{
    if (surface.gameObject.scene.handle != scene.handle) continue;
    var data = surface.navMeshData;
    navigationSurfaces.Add(new { source = source(surface), implementation = "modern", enabled = surface.enabled, agentTypeId = surface.agentTypeID, collectObjects = surface.collectObjects.ToString(), center = vector(surface.center), size = vector(surface.size), navMeshData = data == null ? null : (object)new { instanceId = data.GetInstanceID(), name = data.name, sourceBounds = bounds(data.sourceBounds) } });
}
recordQuery("Unity.AI.Navigation.NavMeshSurface", modernSurfaces.Length, navigationSurfaces.Count);
var modernCount = navigationSurfaces.Count;
var legacySurfaces = UnityEngine.Object.FindObjectsOfType<UnityEngine.AI.NavMeshSurface>(true);
foreach (var surface in legacySurfaces)
{
    if (surface.gameObject.scene.handle != scene.handle) continue;
    var data = surface.navMeshData;
    navigationSurfaces.Add(new { source = source(surface), implementation = "legacy", enabled = surface.enabled, agentTypeId = surface.agentTypeID, collectObjects = surface.collectObjects.ToString(), center = vector(surface.center), size = vector(surface.size), navMeshData = data == null ? null : (object)new { instanceId = data.GetInstanceID(), name = data.name, sourceBounds = bounds(data.sourceBounds) } });
}
recordQuery("UnityEngine.AI.NavMeshSurface", legacySurfaces.Length, navigationSurfaces.Count - modernCount);
var cameras = new System.Collections.Generic.List<object>();
var mainCamera = UnityEngine.Camera.main;
foreach (var camera in UnityEngine.Object.FindObjectsOfType<UnityEngine.Camera>(true))
    cameras.Add(new { source = source(camera), sceneHandle = (int)camera.gameObject.scene.handle, isMain = camera == mainCamera, enabled = camera.enabled, orthographic = camera.orthographic, orthographicSize = camera.orthographicSize, fieldOfView = camera.fieldOfView, aspect = camera.aspect, nearClip = camera.nearClipPlane, farClip = camera.farClipPlane });
return new { schemaVersion = "compendium.map-geometry.v3", frame = UnityEngine.Time.frameCount, scene = new { nativeId = gameScene.ID, path = scene.path, name = scene.name, handle = (int)scene.handle, buildIndex = scene.buildIndex }, coverage = new { scope = "loaded-scene-observations", completeGeometryCoverage = false }, queries = queries, navigationScope = "SamplePosition within one world unit of recorded source landmarks in the currently loaded navigation mesh", player = source(player), mapZones = zones, regions = regions, meshes = meshes.Values, renderers = renderers, terrains = terrains, navigationSurfaces = navigationSurfaces, landmarks = landmarks, cameras = cameras };
