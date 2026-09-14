var actionToken = args["action"];
if (actionToken == null || actionToken.Type != Newtonsoft.Json.Linq.JTokenType.String)
    throw new System.ArgumentException("action must be start, poll, or restore.");
var action = (string)actionToken;
if (action != "start" && action != "poll" && action != "restore")
    throw new System.ArgumentException("action must be start, poll, or restore.");

var sceneHandleToken = args["sceneHandle"];
if (sceneHandleToken == null || sceneHandleToken.Type != Newtonsoft.Json.Linq.JTokenType.Integer)
    throw new System.ArgumentException("sceneHandle must be an integer.");
var sceneHandleLong = sceneHandleToken.ToObject<long>();
if (sceneHandleLong < int.MinValue || sceneHandleLong > int.MaxValue)
    throw new System.ArgumentException("sceneHandle must fit in Int32.");
var requestedSceneHandle = (int)sceneHandleLong;

var researchCharacterToken = args["researchCharacter"];
if (researchCharacterToken == null || researchCharacterToken.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrEmpty((string)researchCharacterToken))
    throw new System.ArgumentException("researchCharacter must be a non-empty string.");
var requestedResearchCharacter = (string)researchCharacterToken;

var streamOwner = System.AppDomain.CurrentDomain.GetData("afallon-compendium.runtime-owner.v1") as System.Collections.Generic.Dictionary<string, object>;
if (streamOwner == null || streamOwner["token"] as string == null || streamOwner["state"] as string != "active")
    throw new System.OperationCanceledException("Runtime ownership is no longer active.");
var ownerToken = streamOwner["token"] as string;

var activeStateDataKey = "afallon-compendium.stream-visit.active.v1";
var loaderType = typeof(Il2Cpp.AddressableLoader);
var reflectionFlags = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public | System.Reflection.BindingFlags.NonPublic;
var publicInstanceFlags = System.Reflection.BindingFlags.Instance | System.Reflection.BindingFlags.Public;
var assetProperty = loaderType.GetProperty("loadedAsset", reflectionFlags);
var holdProperty = loaderType.GetProperty("holdUntil", reflectionFlags);
var handleProperty = loaderType.GetProperty("hasInstanceHandle", reflectionFlags);
var loadingMethod = loaderType.GetMethod("IsLoading", reflectionFlags, null, System.Type.EmptyTypes, null);
var preloadMethod = loaderType.GetMethod("Preload", publicInstanceFlags, null, System.Type.EmptyTypes, null);
var releaseMethod = loaderType.GetMethod("ReleaseForDisableOrDestroy", reflectionFlags, null, System.Type.EmptyTypes, null);
var playerWithinMethod = loaderType.GetMethod("PlayerIsWithin", reflectionFlags, null, new System.Type[] { typeof(float) }, null);
if (playerWithinMethod == null || playerWithinMethod.IsStatic || playerWithinMethod.ReturnType != typeof(bool))
    throw new System.InvalidOperationException("The native automatic-load range check is unavailable.");
if (assetProperty == null || !assetProperty.CanRead || holdProperty == null || !holdProperty.CanRead || !holdProperty.CanWrite || handleProperty == null || !handleProperty.CanRead || loadingMethod == null || loadingMethod.IsStatic || loadingMethod.ReturnType != typeof(bool) || preloadMethod == null || preloadMethod.IsStatic || releaseMethod == null || releaseMethod.IsStatic)
    throw new System.InvalidOperationException("The reviewed AddressableLoader state and instance operations are unavailable.");
if (loadingMethod.ReturnType != typeof(bool) || releaseMethod.ReturnType != typeof(void) || preloadMethod.ReturnType != typeof(void))
    throw new System.InvalidOperationException("The reviewed AddressableLoader operation signatures changed.");

var getAsset = new System.Func<Il2Cpp.AddressableLoader, UnityEngine.GameObject>(loader => (UnityEngine.GameObject)assetProperty.GetValue(loader));
var getLoading = new System.Func<Il2Cpp.AddressableLoader, bool>(loader => (bool)loadingMethod.Invoke(loader, null));
var getHandle = new System.Func<Il2Cpp.AddressableLoader, bool>(loader => (bool)handleProperty.GetValue(loader));
var getHold = new System.Func<Il2Cpp.AddressableLoader, float>(loader => (float)holdProperty.GetValue(loader));
var setHold = new System.Action<Il2Cpp.AddressableLoader, float>((loader, value) => holdProperty.SetValue(loader, value));

var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
var essentials = Il2CppBLINK.RPGBuilder.LogicMono.RPGBuilderEssentials.Instance;
var loadingScreen = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.Instance;
var nativeScene = Il2Cpp.GameState.CurrentGameScene;
var playerEntity = Il2Cpp.GameState.playerEntity;
var requireCharacter = new System.Action(() =>
{
    var currentCharacter = Il2CppBLINK.RPGBuilder.Characters.Character.Instance;
    if (currentCharacter == null || currentCharacter.CharacterData == null || !currentCharacter.CharacterData.IsCreated || currentCharacter.CharacterData.CharacterName != requestedResearchCharacter)
        throw new System.InvalidOperationException("The loaded research character does not match researchCharacter.");
});
var sceneIsReady = new System.Func<bool>(() =>
{
    var currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
    var currentEssentials = Il2CppBLINK.RPGBuilder.LogicMono.RPGBuilderEssentials.Instance;
    var currentLoading = Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.Instance;
    return currentScene.isLoaded && currentEssentials != null && currentEssentials.SceneInitialized && currentLoading != null && !currentLoading.isSceneLoading && !Il2CppBLINK.RPGBuilder.Managers.LoadingScreenManager.HasSceneReadyHolds;
});
var ensureSameScene = new System.Action<System.Collections.Generic.Dictionary<string, object>>((state) =>
{
    var currentScene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
    if (!currentScene.isLoaded || currentScene.handle != (int)state["sceneHandle"] || currentScene.path != (string)state["scenePath"])
        throw new System.InvalidOperationException("The active scene changed during the stream visit.");
    var expectedNativeIdValue = state["nativeSceneId"];
    var currentNativeScene = Il2Cpp.GameState.CurrentGameScene;
    if (expectedNativeIdValue != null)
    {
        if (currentNativeScene == null || (int)currentNativeScene.ID != (int)expectedNativeIdValue)
            throw new System.InvalidOperationException("The native game scene changed during the stream visit.");
    }
});
var makePosition = new System.Func<UnityEngine.Vector3, object>(value => new { x = value.x, y = value.y, z = value.z });
