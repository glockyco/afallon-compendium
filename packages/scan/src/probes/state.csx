var character = Il2CppBLINK.RPGBuilder.Characters.Character.Instance;
if (character == null || character.CharacterData == null || !character.CharacterData.IsCreated)
    throw new System.InvalidOperationException("A loaded research character is required for scanning.");
var player = Il2Cpp.GameState.playerEntity;
if (player == null || player.transform == null)
    throw new System.InvalidOperationException("A loaded player transform is required for scanning.");
var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
if (!scene.isLoaded)
    throw new System.InvalidOperationException("The active scene is not loaded.");
var nativeScene = Il2Cpp.GameState.CurrentGameScene;
var position = player.transform.position;
var rotation = player.transform.rotation;
return new
{
    schemaVersion = "compendium.runtime-scan-state.v1",
    frame = UnityEngine.Time.frameCount,
    character = character.CharacterData.CharacterName,
    scene = new { name = scene.name, path = scene.path, handle = (int)scene.handle, isLoaded = scene.isLoaded },
    gameSceneNativeId = nativeScene == null ? (int?)null : nativeScene.ID,
    position = new { x = position.x, y = position.y, z = position.z },
    rotation = new { x = rotation.x, y = rotation.y, z = rotation.z, w = rotation.w }
};
