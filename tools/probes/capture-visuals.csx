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

// Reviewed suppression: the capture plan names shader families whose renderers hide during
// capture, and whether terrain-instanced trees and details hide. Afallon marks foliage with no
// layer or tag; only its shader family identifies it, so the plan carries that decision.
(System.Collections.Generic.List<string> ShaderFamilies, bool TerrainTrees) readCaptureSuppression(Newtonsoft.Json.Linq.JToken token)
{
    if (token == null || token.Type != Newtonsoft.Json.Linq.JTokenType.Object) throw new System.ArgumentException("suppression is required.");
    var families = new System.Collections.Generic.List<string>();
    var familiesToken = token["shaderFamilies"];
    if (familiesToken == null || familiesToken.Type != Newtonsoft.Json.Linq.JTokenType.Array) throw new System.ArgumentException("suppression.shaderFamilies must be an array.");
    foreach (var entry in familiesToken)
    {
        if (entry.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrWhiteSpace((string)entry)) throw new System.ArgumentException("suppression.shaderFamilies entries must be non-empty strings.");
        families.Add((string)entry);
    }
    var treesToken = token["terrainTrees"];
    if (treesToken == null || treesToken.Type != Newtonsoft.Json.Linq.JTokenType.Boolean) throw new System.ArgumentException("suppression.terrainTrees must be a boolean.");
    return (families, (bool)treesToken);
}

bool rendererUsesShaderFamily(UnityEngine.Renderer renderer, System.Collections.Generic.List<string> families)
{
    if (families.Count == 0) return false;
    var materials = renderer.sharedMaterials;
    if (materials == null) return false;
    foreach (var material in materials)
    {
        if (material == null || material.shader == null) continue;
        var name = material.shader.name;
        if (name == null) continue;
        foreach (var family in families) if (name.StartsWith(family, System.StringComparison.Ordinal)) return true;
    }
    return false;
}

void visitReviewedShaderRenderers(System.Collections.Generic.List<string> families, System.Action<UnityEngine.Renderer, string> visit)
{
    if (families.Count == 0) return;
    foreach (var renderer in UnityEngine.Object.FindObjectsOfType<UnityEngine.Renderer>(false))
    {
        if (renderer == null || !renderer.enabled || !renderer.gameObject.activeInHierarchy) continue;
        if (rendererUsesShaderFamily(renderer, families)) visit(renderer, "reviewed-shader-family");
    }
}

System.Collections.Generic.List<UnityEngine.Terrain> collectTerrainsDrawingTrees(bool terrainTrees)
{
    var terrains = new System.Collections.Generic.List<UnityEngine.Terrain>();
    if (!terrainTrees) return terrains;
    foreach (var terrain in UnityEngine.Object.FindObjectsOfType<UnityEngine.Terrain>(false))
        if (terrain != null && terrain.enabled && terrain.gameObject.activeInHierarchy && terrain.drawTreesAndFoliage) terrains.Add(terrain);
    return terrains;
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
