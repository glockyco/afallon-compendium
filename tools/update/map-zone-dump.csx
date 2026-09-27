// Dumps every MapZone in the loaded scenes: its registration and its map texture as PNG bytes.
// A map texture is usually not CPU-readable, so it is blitted to a RenderTexture and read back.
// That works for any texture the GPU can sample.
var outputDirectory = args == null ? null : (string)args["outputDirectory"];
if (string.IsNullOrEmpty(outputDirectory)) throw new System.ArgumentException("outputDirectory is required.");
var zones = Il2CppMapMinimap.MapZone.GetAll();
var results = new System.Collections.Generic.List<object>();
foreach (var zone in zones)
{
    if (zone == null || zone.map == null) continue;
    var texture = zone.map;
    var width = texture.width;
    var height = texture.height;
    var previous = UnityEngine.RenderTexture.active;
    var target = UnityEngine.RenderTexture.GetTemporary(width, height, 0, UnityEngine.RenderTextureFormat.ARGB32, UnityEngine.RenderTextureReadWrite.sRGB);
    string path = null;
    long bytes = 0;
    try
    {
        UnityEngine.Graphics.Blit(texture, target);
        UnityEngine.RenderTexture.active = target;
        var readable = new UnityEngine.Texture2D(width, height, UnityEngine.TextureFormat.RGBA32, false);
        readable.ReadPixels(new UnityEngine.Rect(0, 0, width, height), 0, 0, false);
        readable.Apply(false, false);
        var encoded = UnityEngine.ImageConversion.EncodeToPNG(readable);
        var png = new byte[encoded.Length];
        for (var i = 0; i < encoded.Length; i++) png[i] = encoded[i];
        UnityEngine.Object.Destroy(readable);
        var sceneName = zone.gameObject.scene.name;
        var safe = System.Text.RegularExpressions.Regex.Replace(sceneName + "-zone-" + zone.zone_id, "[^A-Za-z0-9._-]+", "-");
        path = System.IO.Path.Combine(outputDirectory, safe + ".png");
        System.IO.File.WriteAllBytes(path, png);
        bytes = png.Length;
    }
    finally
    {
        UnityEngine.RenderTexture.active = previous;
        UnityEngine.RenderTexture.ReleaseTemporary(target);
    }
    var corners = new System.Collections.Generic.List<object>();
    foreach (var uv in new[] { new UnityEngine.Vector2(-1f, 1f), new UnityEngine.Vector2(1f, 1f), new UnityEngine.Vector2(-1f, -1f), new UnityEngine.Vector2(1f, -1f), new UnityEngine.Vector2(0f, 0f) })
    {
        var world = zone.GetWorldPosition(uv);
        corners.Add(new { u = uv.x, v = uv.y, world = new { x = world.x, y = world.y, z = world.z } });
    }
    var center = zone.GetCenter();
    var size = zone.GetSize();
    results.Add(new
    {
        zoneId = zone.zone_id,
        scene = zone.gameObject.scene.name,
        sceneHandle = (int)zone.gameObject.scene.handle,
        texture = new { name = texture.name, width, height, path, bytes },
        center = new { x = center.x, y = center.y, z = center.z },
        size = new { x = size.x, y = size.y },
        rotation = zone.GetRotation(),
        corners,
    });
}
return new { schemaVersion = "compendium.map-zone-dump.v1", activeScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene().name, zones = results };
