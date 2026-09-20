var character = Il2CppBLINK.RPGBuilder.Characters.Character.Instance;
if (character == null || character.CharacterData == null || !character.CharacterData.IsCreated || character.CharacterData.CharacterName != (string)args["researchCharacter"])
    throw new System.InvalidOperationException("Load the configured research character before reading source locations.");
var guids = new System.Collections.Generic.SortedSet<string>(System.StringComparer.Ordinal);
foreach (var loader in UnityEngine.Object.FindObjectsOfType<Il2Cpp.AddressableLoader>(true))
{
    if (loader.addressableAsset == null || string.IsNullOrEmpty(loader.addressableAsset.AssetGUID)) continue;
    guids.Add(loader.addressableAsset.AssetGUID);
}
var ids = new System.Collections.Generic.Dictionary<System.IntPtr, int>();
var pending = new System.Collections.Generic.Queue<UnityEngine.ResourceManagement.ResourceLocations.IResourceLocation>();
var addLocation = new System.Func<UnityEngine.ResourceManagement.ResourceLocations.IResourceLocation, int>(location =>
{
    if (location == null) throw new System.InvalidOperationException("The catalog returned a null resource location.");
    int id;
    if (ids.TryGetValue(location.Pointer, out id)) return id;
    if (ids.Count >= 100000) throw new System.InvalidOperationException("The catalog dependency graph exceeds the source inspection limit.");
    id = ids.Count;
    ids.Add(location.Pointer, id);
    pending.Enqueue(location);
    return id;
});
var locators = new System.Collections.Generic.List<UnityEngine.AddressableAssets.ResourceLocators.IResourceLocator>();
var locatorIterator = UnityEngine.AddressableAssets.Addressables.ResourceLocators.GetEnumerator();
try
{
    var iterator = locatorIterator.Cast<Il2CppSystem.Collections.IEnumerator>();
    while (iterator.MoveNext()) locators.Add(locatorIterator.Current);
}
finally { locatorIterator.Cast<Il2CppSystem.IDisposable>().Dispose(); }
var assets = new System.Collections.Generic.List<object>();
foreach (var guid in guids)
{
    var foundIds = new System.Collections.Generic.SortedSet<int>();
    foreach (var locator in locators)
    {
        Il2CppSystem.Collections.Generic.IList<UnityEngine.ResourceManagement.ResourceLocations.IResourceLocation> found;
        if (!locator.Locate((Il2CppSystem.String)guid, Il2CppInterop.Runtime.Il2CppType.Of<UnityEngine.GameObject>(), out found)) continue;
        if (found == null) throw new System.InvalidOperationException("The catalog reported success without resource locations.");
        var count = found.Cast<Il2CppSystem.Collections.Generic.ICollection<UnityEngine.ResourceManagement.ResourceLocations.IResourceLocation>>().Count;
        for (var index = 0; index < count; index++) foundIds.Add(addLocation(found[index]));
    }
    assets.Add(new { guid, locationIds = System.Linq.Enumerable.ToArray(foundIds) });
}
var locations = new System.Collections.Generic.List<object>();
while (pending.Count > 0)
{
    var location = pending.Dequeue();
    var dependencies = new System.Collections.Generic.List<int>();
    var nativeDependencies = location.Dependencies;
    if (nativeDependencies != null)
    {
        var count = nativeDependencies.Cast<Il2CppSystem.Collections.Generic.ICollection<UnityEngine.ResourceManagement.ResourceLocations.IResourceLocation>>().Count;
        for (var index = 0; index < count; index++) dependencies.Add(addLocation(nativeDependencies[index]));
    }
    locations.Add(new
    {
        id = ids[location.Pointer],
        primaryKey = location.PrimaryKey,
        internalId = location.InternalId,
        transformedInternalId = UnityEngine.AddressableAssets.Addressables.ResourceManager.TransformInternalId(location),
        providerId = location.ProviderId,
        resourceType = location.ResourceType == null ? null : location.ResourceType.FullName,
        dependencyIds = dependencies.ToArray()
    });
}
var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
return new
{
    schemaVersion = "compendium.addressable-locations.v1",
    frame = UnityEngine.Time.frameCount,
    dataPath = UnityEngine.Application.dataPath,
    scene = new { path = scene.path, handle = (int)scene.handle, buildIndex = scene.buildIndex },
    assets = assets.ToArray(),
    locations = locations.ToArray()
};
