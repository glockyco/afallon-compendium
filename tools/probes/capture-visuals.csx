(System.Collections.Generic.List<(UnityEngine.GameObject Root, string Reason, bool ParticlesOnly)> Roots,
 Il2CppInterop.Runtime.InteropTypes.Arrays.Il2CppArrayBase<UnityEngine.ParticleSystemRenderer> Particles) collectCaptureVisuals()
{
    var roots = new System.Collections.Generic.List<(UnityEngine.GameObject Root, string Reason, bool ParticlesOnly)>();
    var seen = new System.Collections.Generic.HashSet<(int, bool)>();
    void addRoot(UnityEngine.GameObject root, string reason, bool particlesOnly)
    {
        if (root != null && root.activeInHierarchy && seen.Add((root.GetInstanceID(), particlesOnly))) roots.Add((root, reason, particlesOnly));
    }
    var player = Il2Cpp.GameState.playerEntity;
    if (player == null) throw new System.InvalidOperationException("Player ownership is required for capture suppression.");
    addRoot(player.gameObject, "player", false);
    addRoot(player.GetMount(), "player-mount", false);
    addRoot(player.ShapeshiftingGameobject, "player-shapeshift", false);
    foreach (var entity in UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.Combat.CombatEntity>(true))
    {
        if (entity == null || !entity.gameObject.activeInHierarchy) continue;
        if (entity != player && entity.GetOwnerEntity() == player) addRoot(entity.gameObject, "player-owned-actor", false);
        else if (entity != player && !entity.IsEnvironmentEntity()) addRoot(entity.gameObject, "actor-particles", true);
        var visuals = entity.GetOwnedCombatVisuals();
        var logic = entity.GetOwnedLogicCombatVisuals();
        if (visuals != null) foreach (var root in visuals) addRoot(root, "combat-visual", false);
        if (logic != null) foreach (var root in logic) addRoot(root, "combat-logic-visual", false);
    }
    foreach (var weather in UnityEngine.Object.FindObjectsOfType<Il2CppDistantLands.Cozy.CozyWeather>(true)) if (weather != null) addRoot(weather.gameObject, "weather", false);
    foreach (var weather in UnityEngine.Object.FindObjectsOfType<Il2CppDistantLands.Cozy.FXParent>(true)) if (weather != null) addRoot(weather.gameObject, "weather-fx", false);
    foreach (var effect in UnityEngine.Object.FindObjectsOfType<Il2Cpp.CameraParticleObject>(true)) if (effect != null) addRoot(effect.gameObject, "camera-particles", false);
    foreach (var indicator in UnityEngine.Object.FindObjectsOfType<Il2CppBLINK.RPGBuilder.LogicMono.GroundIndicator>(true)) if (indicator != null) addRoot(indicator.gameObject, "ground-indicator", false);
    var particles = UnityEngine.Object.FindObjectsOfType<UnityEngine.ParticleSystemRenderer>(true);
    var checkedParticleRoots = new System.Collections.Generic.HashSet<int>();
    foreach (var renderer in particles)
    {
        if (renderer == null || !renderer.enabled || !renderer.gameObject.activeInHierarchy) continue;
        var root = renderer.transform.root;
        if (root == null || !checkedParticleRoots.Add(root.GetInstanceID())) continue;
        var system = root.GetComponent<UnityEngine.ParticleSystem>();
        if (system != null && !system.main.loop) addRoot(root.gameObject, "finite-root-particles", true);
    }
    return (roots, particles);
}

void visitCaptureVisualRenderers(
    System.Collections.Generic.List<(UnityEngine.GameObject Root, string Reason, bool ParticlesOnly)> roots,
    System.Action<UnityEngine.Renderer, string> visit)
{
    foreach (var entry in roots)
    {
        foreach (var renderer in entry.Root.GetComponentsInChildren<UnityEngine.Renderer>(false))
        {
            if (renderer == null || !renderer.enabled || !renderer.gameObject.activeInHierarchy) continue;
            if (entry.ParticlesOnly && renderer.TryCast<UnityEngine.ParticleSystemRenderer>() == null && renderer.TryCast<UnityEngine.TrailRenderer>() == null && renderer.TryCast<UnityEngine.LineRenderer>() == null) continue;
            visit(renderer, entry.Reason);
        }
    }
}

(System.Collections.Generic.IReadOnlyList<UnityEngine.Renderer> Ceilings,
 System.Collections.Generic.IReadOnlyList<UnityEngine.Renderer> Floors,
 System.Collections.Generic.IReadOnlyList<string> Issues) resolveCaptureCeilingReview(
    Newtonsoft.Json.Linq.JToken review,
    Il2CppInterop.Runtime.InteropTypes.Arrays.Il2CppArrayBase<UnityEngine.Renderer> renderers,
    int sceneHandle, int cullingMask, bool requireResolved)
{
    if (review == null) throw new System.ArgumentException("ceilingReview must be explicit.");
    if (review.Type == Newtonsoft.Json.Linq.JTokenType.Null) return (System.Array.Empty<UnityEngine.Renderer>(), System.Array.Empty<UnityEngine.Renderer>(), System.Array.Empty<string>());
    var ceilings = new System.Collections.Generic.List<UnityEngine.Renderer>();
    var floors = new System.Collections.Generic.List<UnityEngine.Renderer>();
    var issues = new System.Collections.Generic.List<string>();
    if (review.Type != Newtonsoft.Json.Linq.JTokenType.Object) throw new System.ArgumentException("ceilingReview must be null or an object.");
    string text(Newtonsoft.Json.Linq.JToken token)
    {
        if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrWhiteSpace((string)token)) throw new System.ArgumentException("A ceiling review text field is invalid.");
        return (string)token;
    }
    float number(Newtonsoft.Json.Linq.JToken token)
    {
        if (token == null || (token.Type != Newtonsoft.Json.Linq.JTokenType.Float && token.Type != Newtonsoft.Json.Linq.JTokenType.Integer)) throw new System.ArgumentException("A ceiling review coordinate is invalid.");
        var value = (float)token;
        if (float.IsNaN(value) || float.IsInfinity(value)) throw new System.ArgumentException("Ceiling review coordinates must be finite.");
        return value;
    }
    UnityEngine.Vector3 vector(Newtonsoft.Json.Linq.JToken token)
    {
        if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.Object) throw new System.ArgumentException("A ceiling review vector is invalid.");
        return new UnityEngine.Vector3(number(token["x"]), number(token["y"]), number(token["z"]));
    }
    var evidence = review["evidence"];
    if (evidence == null || evidence.Type != Newtonsoft.Json.Linq.JTokenType.Object) throw new System.ArgumentException("Ceiling review evidence is required.");
    text(evidence["path"]);
    var evidenceHash = text(evidence["sha256"]);
    if (!System.Text.RegularExpressions.Regex.IsMatch(evidenceHash, "^[a-f0-9]{64}$")) throw new System.ArgumentException("The ceiling review evidence hash is invalid.");
    var selectors = new System.Collections.Generic.List<(Newtonsoft.Json.Linq.JArray Hierarchy, string MeshName, int Vertices, UnityEngine.Bounds Bounds, bool Floor, string Label)>();
    var byName = new System.Collections.Generic.Dictionary<string, System.Collections.Generic.List<int>>(System.StringComparer.Ordinal);
    for (var group = 0; group < 2; group++)
    {
        var field = group == 0 ? "ceilings" : "floors";
        var entries = review[field] as Newtonsoft.Json.Linq.JArray;
        if (entries == null || entries.Count > 5000 || (group == 0 && entries.Count == 0)) throw new System.ArgumentException("The ceiling review renderer list is invalid.");
        for (var index = 0; index < entries.Count; index++)
        {
            var entry = entries[index];
            if (entry.Type != Newtonsoft.Json.Linq.JTokenType.Object) throw new System.ArgumentException("A ceiling review selector is invalid.");
            var hierarchy = entry["hierarchy"] as Newtonsoft.Json.Linq.JArray;
            if (hierarchy == null || hierarchy.Count == 0 || hierarchy.Count > 128) throw new System.ArgumentException("A ceiling review hierarchy is invalid.");
            foreach (var name in hierarchy) text(name);
            var vertices = entry["vertices"];
            if (vertices == null || vertices.Type != Newtonsoft.Json.Linq.JTokenType.Integer || (long)vertices < 1 || (long)vertices > int.MaxValue) throw new System.ArgumentException("A ceiling review vertex count is invalid.");
            var bounds = entry["bounds"];
            if (bounds == null || bounds.Type != Newtonsoft.Json.Linq.JTokenType.Object) throw new System.ArgumentException("Ceiling review bounds are required.");
            var size = vector(bounds["size"]);
            if (size.x < 0f || size.y < 0f || size.z < 0f) throw new System.ArgumentException("Ceiling review sizes must not be negative.");
            var selectorIndex = selectors.Count;
            selectors.Add((hierarchy, text(entry["meshName"]), (int)vertices, new UnityEngine.Bounds(vector(bounds["center"]), size), group == 1, field + "[" + index + "]"));
            var leafName = (string)hierarchy[0];
            System.Collections.Generic.List<int> named;
            if (!byName.TryGetValue(leafName, out named)) { named = new System.Collections.Generic.List<int>(); byName.Add(leafName, named); }
            named.Add(selectorIndex);
        }
    }
    var matches = new UnityEngine.Renderer[selectors.Count];
    var counts = new int[selectors.Count];
    foreach (var renderer in renderers)
    {
        if (renderer == null || !renderer.enabled || !renderer.gameObject.activeInHierarchy || renderer.gameObject.scene.handle != sceneHandle || renderer.TryCast<UnityEngine.MeshRenderer>() == null) continue;
        var layer = renderer.gameObject.layer;
        if (layer < 0 || layer > 31 || (((uint)cullingMask) & (1u << layer)) == 0u) continue;
        System.Collections.Generic.List<int> named;
        if (!byName.TryGetValue(renderer.name, out named)) continue;
        var filter = renderer.GetComponent<UnityEngine.MeshFilter>();
        var mesh = filter == null ? null : filter.sharedMesh;
        if (mesh == null) continue;
        var meshName = mesh.name;
        var vertexCount = mesh.vertexCount;
        var actual = renderer.bounds;
        foreach (var index in named)
        {
            var selector = selectors[index];
            if (meshName != selector.MeshName || vertexCount != selector.Vertices) continue;
            var deltaCenter = actual.center - selector.Bounds.center;
            var deltaSize = actual.size - selector.Bounds.size;
            if (System.Math.Abs(deltaCenter.x) >= 0.01f || System.Math.Abs(deltaCenter.y) >= 0.01f || System.Math.Abs(deltaCenter.z) >= 0.01f || System.Math.Abs(deltaSize.x) >= 0.01f || System.Math.Abs(deltaSize.y) >= 0.01f || System.Math.Abs(deltaSize.z) >= 0.01f) continue;
            var cursor = renderer.transform;
            var sameHierarchy = true;
            foreach (var name in selector.Hierarchy)
            {
                if (cursor == null || cursor.name != (string)name) { sameHierarchy = false; break; }
                cursor = cursor.parent;
            }
            if (!sameHierarchy || cursor != null) continue;
            counts[index]++;
            matches[index] = renderer;
        }
    }
    var used = new System.Collections.Generic.HashSet<int>();
    for (var index = 0; index < selectors.Count; index++)
    {
        var selector = selectors[index];
        if (counts[index] != 1) { issues.Add(selector.Label + " resolved to " + counts[index] + " active renderers."); continue; }
        var renderer = matches[index];
        if (!used.Add(renderer.GetInstanceID())) throw new System.ArgumentException("Ceiling and floor selectors must resolve to distinct renderers.");
        if (selector.Floor) floors.Add(renderer); else ceilings.Add(renderer);
    }
    if (requireResolved && issues.Count != 0) throw new System.InvalidOperationException(string.Join(" ", issues));
    return (ceilings, floors, issues);
}
