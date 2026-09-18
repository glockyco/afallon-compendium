// Reads every sprite the database references for a player-facing record and writes it as a PNG
// beside this collector's JSON. A build's textures are not CPU-readable, so each sprite goes
// through a temporary RenderTexture: blit the atlas, read the sprite's pixel rectangle, encode.
// Every temporary object is released in `finally`, and the active render target is restored.
var database = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
if (database == null) throw new System.InvalidOperationException("The game database is not initialized.");

var outputDirectory = System.IO.Path.GetDirectoryName(path);
var artworkDirectory = System.IO.Path.Combine(outputDirectory, "artwork");
System.IO.Directory.CreateDirectory(artworkDirectory);

var records = new System.Collections.Generic.List<object>();
var families = new System.Collections.Generic.Dictionary<string, int>();
var extracted = 0;
var unsupported = 0;
var missing = 0;
// Sprites are shared across records (one icon sheet cell serves several items). Cache by
// texture instance and pixel rectangle so a shared sprite is read once and hashed once.
var imageCache = new System.Collections.Generic.Dictionary<string, object>();
var savedActive = UnityEngine.RenderTexture.active;

var hashBytes = new System.Func<byte[], string>((bytes) =>
{
    using (var digest = System.Security.Cryptography.SHA256.Create())
    {
        return System.BitConverter.ToString(digest.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant();
    }
});

var readSprite = new System.Func<UnityEngine.Sprite, object>((sprite) =>
{
    var texture = sprite.texture;
    if (texture == null) throw new System.InvalidOperationException("The sprite has no texture.");
    if (sprite.packed && sprite.packingRotation != UnityEngine.SpritePackingRotation.None) throw new System.InvalidOperationException("The sprite is packed with a rotation.");
    var rect = sprite.textureRect;
    var width = (int)System.Math.Round(rect.width);
    var height = (int)System.Math.Round(rect.height);
    if (width <= 0 || height <= 0) throw new System.InvalidOperationException("The sprite rectangle is empty.");
    var cacheKey = texture.GetInstanceID().ToString(System.Globalization.CultureInfo.InvariantCulture) + ":" + rect.x.ToString(System.Globalization.CultureInfo.InvariantCulture) + ":" + rect.y.ToString(System.Globalization.CultureInfo.InvariantCulture) + ":" + width.ToString(System.Globalization.CultureInfo.InvariantCulture) + ":" + height.ToString(System.Globalization.CultureInfo.InvariantCulture);
    object cached;
    if (imageCache.TryGetValue(cacheKey, out cached)) return cached;
    UnityEngine.RenderTexture target = null;
    UnityEngine.Texture2D readable = null;
    try
    {
        target = UnityEngine.RenderTexture.GetTemporary(texture.width, texture.height, 0, UnityEngine.RenderTextureFormat.ARGB32, UnityEngine.RenderTextureReadWrite.sRGB);
        UnityEngine.Graphics.Blit(texture, target);
        UnityEngine.RenderTexture.active = target;
        readable = new UnityEngine.Texture2D(width, height, UnityEngine.TextureFormat.RGBA32, false);
        readable.ReadPixels(new UnityEngine.Rect(rect.x, rect.y, width, height), 0, 0, false);
        readable.Apply(false, false);
        var png = (byte[])UnityEngine.ImageConversion.EncodeToPNG(readable);
        if (png == null || png.Length == 0) throw new System.InvalidOperationException("PNG encoding returned no bytes.");
        var sha256 = hashBytes(png);
        var file = System.IO.Path.Combine(artworkDirectory, sha256 + ".png");
        if (!System.IO.File.Exists(file)) System.IO.File.WriteAllBytes(file, png);
        var image = new { sha256 = sha256, bytes = png.Length, width = width, height = height, file = "artwork/" + sha256 + ".png" };
        imageCache[cacheKey] = image;
        return image;
    }
    finally
    {
        UnityEngine.RenderTexture.active = savedActive;
        if (readable != null) UnityEngine.Object.DestroyImmediate(readable);
        if (target != null) UnityEngine.RenderTexture.ReleaseTemporary(target);
    }
});

var record = new System.Action<string, int, string, string, UnityEngine.Sprite, string>((family, nativeId, role, sourceFieldPath, sprite, sourceName) =>
{
    int familyCount;
    families[family] = (families.TryGetValue(family, out familyCount) ? familyCount : 0) + 1;
    if (sprite == null)
    {
        missing++;
        records.Add(new { family = family, nativeId = nativeId, role = role, sourceName = sourceName ?? "", sourceFieldPath = sourceFieldPath, status = "missing", reason = "The record references no sprite.", image = (object)null });
        return;
    }
    try
    {
        var image = readSprite(sprite);
        extracted++;
        records.Add(new { family = family, nativeId = nativeId, role = role, sourceName = sprite.name ?? sourceName ?? "", sourceFieldPath = sourceFieldPath, status = "extracted", reason = (string)null, image = image });
    }
    catch (System.Exception error)
    {
        unsupported++;
        records.Add(new { family = family, nativeId = nativeId, role = role, sourceName = sprite.name ?? sourceName ?? "", sourceFieldPath = sourceFieldPath, status = "unsupported", reason = error.GetType().FullName + ": " + error.Message, image = (object)null });
    }
});

var iconRecord = new System.Action<string, Il2Cpp.RPGBuilderDatabaseEntry, string>((family, entry, role) =>
{
    if (entry == null) return;
    record(family, entry.ID, role, family + "[" + entry.ID.ToString(System.Globalization.CultureInfo.InvariantCulture) + "].entryIcon", entry.entryIcon, entry.entryName);
});

try
{
    foreach (var pair in database.GetItems()) iconRecord("items", pair.Value, "icon");
    foreach (var pair in database.GetNPCs()) iconRecord("npcs", pair.Value, "portrait");
    foreach (var pair in database.GetAbilities()) iconRecord("abilities", pair.Value, "icon");
    foreach (var pair in database.GetEffects()) iconRecord("effects", pair.Value, "icon");
    foreach (var pair in database.GetSkills()) iconRecord("skills", pair.Value, "icon");
    foreach (var pair in database.GetRecipes()) iconRecord("recipes", pair.Value, "icon");
    foreach (var pair in database.GetCurrencies()) iconRecord("currencies", pair.Value, "icon");
    foreach (var pair in database.GetFactions()) iconRecord("factions", pair.Value, "icon");
    foreach (var pair in database.GetClasses()) iconRecord("classes", pair.Value, "icon");
    foreach (var pair in database.GetRaces()) iconRecord("races", pair.Value, "icon");
    foreach (var pair in database.GetEnchantments()) iconRecord("enchantments", pair.Value, "icon");
    foreach (var pair in database.GetGearSets()) iconRecord("gearSets", pair.Value, "icon");
    foreach (var pair in database.GetStats()) iconRecord("stats", pair.Value, "icon");
    foreach (var pair in database.GetCraftingStations()) iconRecord("craftingStations", pair.Value, "icon");
    foreach (var pair in database.GetGameScenes()) iconRecord("scenes", pair.Value, "icon");
    foreach (var pair in database.GetRegionTemplates()) iconRecord("regions", pair.Value, "icon");
    foreach (var pair in database.GetProperties()) iconRecord("properties", pair.Value, "icon");
    foreach (var pair in database.GetGameScenes())
    {
        var scene = pair.Value;
        if (scene == null) continue;
        UnityEngine.Sprite guideImage = null;
        string guideError = null;
        try { guideImage = scene.GetAdventureGuideImage(); } catch (System.Exception error) { guideError = error.GetType().FullName + ": " + error.Message; }
        if (guideError != null)
        {
            unsupported++;
            int familyCount;
            families["scenes"] = (families.TryGetValue("scenes", out familyCount) ? familyCount : 0) + 1;
            records.Add(new { family = "scenes", nativeId = scene.ID, role = "artwork", sourceName = scene.adventureGuideImageKey ?? "", sourceFieldPath = "scenes[" + scene.ID.ToString(System.Globalization.CultureInfo.InvariantCulture) + "].GetAdventureGuideImage()", status = "unsupported", reason = guideError, image = (object)null });
            continue;
        }
        record("scenes", scene.ID, "artwork", "scenes[" + scene.ID.ToString(System.Globalization.CultureInfo.InvariantCulture) + "].GetAdventureGuideImage()", guideImage, scene.adventureGuideImageKey);
    }
    foreach (var pair in database.GetRegionTemplates())
    {
        var region = pair.Value;
        if (region == null) continue;
        record("regions", region.ID, "artwork", "regions[" + region.ID.ToString(System.Globalization.CultureInfo.InvariantCulture) + "].adventureGuideImage", region.adventureGuideImage, region.entryName);
    }
    foreach (var pair in database.GetProperties())
    {
        var property = pair.Value;
        if (property == null) continue;
        record("properties", property.ID, "artwork", "properties[" + property.ID.ToString(System.Globalization.CultureInfo.InvariantCulture) + "].propertyImage", property.propertyImage, property.entryName);
    }
}
finally
{
    UnityEngine.RenderTexture.active = savedActive;
}

return new
{
    schemaVersion = "compendium.artwork.v1",
    frame = UnityEngine.Time.frameCount,
    totals = new { extracted = extracted, unsupported = unsupported, missing = missing, families = families },
    records = records
};
