var requestedAction = args == null ? (string)null : (string)args["action"];
if (requestedAction != "start" && requestedAction != "retarget" && requestedAction != "poll" && requestedAction != "restore")
    throw new System.ArgumentException("action must be start, retarget, poll, or restore.");

var sceneOwner = System.AppDomain.CurrentDomain.GetData("afallon-compendium.runtime-owner.v1") as System.Collections.Generic.Dictionary<string, object>;
if (sceneOwner == null || sceneOwner["state"] as string != "active")
    throw new System.OperationCanceledException("The runtime owner is no longer active.");
var sceneOwnerToken = sceneOwner["token"] as string;
if (sceneOwnerToken == null || sceneOwnerToken.Length == 0)
    throw new System.InvalidOperationException("The runtime owner token is missing.");

var activeStateKey = "afallon-compendium.scene-visit.active.v1";
var sceneVisitState = (System.Collections.Generic.Dictionary<string, object>)null;
var sceneVisitKey = (string)null;
var requestedResearchCharacter = (string)null;
var requestedResearchToken = args["researchCharacter"];
if (requestedResearchToken != null && requestedResearchToken.Type != Newtonsoft.Json.Linq.JTokenType.Null)
{
    if (requestedResearchToken.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrEmpty((string)requestedResearchToken))
        throw new System.ArgumentException("researchCharacter must be a non-empty string.");
    requestedResearchCharacter = (string)requestedResearchToken;
}
var requestedTargetToken = args["targetSceneNativeId"];
var requestedTargetId = -1;
var requestedFinalToken = args["finalSceneNativeId"];
var requestedFinalPathToken = args["finalScenePath"];
var requestedFinalPath = (string)null;
if (requestedFinalPathToken != null && requestedFinalPathToken.Type != Newtonsoft.Json.Linq.JTokenType.Null)
{
    if (requestedFinalPathToken.Type != Newtonsoft.Json.Linq.JTokenType.String || string.IsNullOrEmpty((string)requestedFinalPathToken))
        throw new System.ArgumentException("finalScenePath must be a non-empty string.");
    requestedFinalPath = (string)requestedFinalPathToken;
}
// Where the player stands once the target scene is ready. The authored arrival can lie far from
// the mapped area, where no loader near the map is within range; placing the player at the map on
// the walkable surface makes the scene static for capture.
var capturePositionToken = args["capturePosition"];
var hasCapturePosition = capturePositionToken != null && capturePositionToken.Type == Newtonsoft.Json.Linq.JTokenType.Object;
var placeAtCapturePosition = new System.Action(() =>
{
    if (!hasCapturePosition) return;
    var playerEntity = Il2Cpp.GameState.playerEntity;
    if (playerEntity == null || playerEntity.transform == null) throw new System.InvalidOperationException("The player is required to place the capture position.");
    var requested = new UnityEngine.Vector3((float)capturePositionToken["x"], (float)capturePositionToken["y"], (float)capturePositionToken["z"]);
    UnityEngine.AI.NavMeshHit hit;
    if (!UnityEngine.AI.NavMesh.SamplePosition(requested, out hit, 64f, UnityEngine.AI.NavMesh.AllAreas)) throw new System.InvalidOperationException("No walkable surface lies within 64 units of the capture position.");
    // A CharacterController keeps its own position and overrides a transform write on its next
    // move, so it is disabled around the write; syncing physics drops the accumulated fall.
    var controller = playerEntity.GetComponent<UnityEngine.CharacterController>();
    var controllerWasEnabled = controller != null && controller.enabled;
    if (controller != null) controller.enabled = false;
    playerEntity.transform.position = hit.position + UnityEngine.Vector3.up * 0.5f;
    UnityEngine.Physics.SyncTransforms();
    if (controller != null) controller.enabled = controllerWasEnabled;
    sceneVisitState["capturePosition"] = playerEntity.transform.position;
});
// Where a visit enters a scene. A later native entry lands where the character last left the
// scene, so arrival through LoadGameScene depends on the character's save history, and a stale
// saved position can lie outside the scene. Since build 25434619 the game cancels such an entry.
// A visit therefore enters like a door does: RPGBuilderEssentials.TeleportToGameScene with the
// destination of the lowest-ID gameScene teleport effect into the scene, or, for a scene that no
// teleport effect enters, the scene's authored start position.
var authoredArrival = new System.Func<int, UnityEngine.Vector3>(sceneId =>
{
    var arrivalDatabase = Il2CppBLINK.RPGBuilder.Managers.GameDatabase.Instance;
    if (arrivalDatabase == null) throw new System.InvalidOperationException("The runtime database is required to resolve a scene arrival.");
    var arrivalEffectId = int.MaxValue;
    var arrival = UnityEngine.Vector3.zero;
    foreach (var pair in arrivalDatabase.GetEffects())
    {
        var effect = pair.Value;
        if (effect == null || effect.effectType != Il2Cpp.RPGEffect.EFFECT_TYPE.Teleport || effect.ranks == null || effect.ranks.Count == 0 || effect.ID >= arrivalEffectId) continue;
        var rank = effect.ranks[0];
        if (rank == null || rank.teleportType != Il2Cpp.RPGEffect.TELEPORT_TYPE.gameScene || rank.gameSceneID != sceneId) continue;
        arrivalEffectId = effect.ID;
        arrival = rank.teleportPOS;
    }
    if (arrivalEffectId != int.MaxValue) return arrival;
    var arrivalScene = arrivalDatabase.GetGameScenes()[sceneId];
    foreach (var pair in arrivalDatabase.GetWorldPositions())
        if (pair.Value != null && pair.Value.ID == arrivalScene.startPositionID) return pair.Value.position;
    throw new System.InvalidOperationException("Scene " + sceneId + " has neither a gameScene teleport effect nor an authored start position.");
});
var enterScene = new System.Action<int, UnityEngine.Vector3>((sceneId, position) =>
{
    var enteringEssentials = Il2CppBLINK.RPGBuilder.LogicMono.RPGBuilderEssentials.Instance;
    if (enteringEssentials == null) throw new System.InvalidOperationException("RPGBuilderEssentials is required to enter a scene.");
    enteringEssentials.TeleportToGameScene(sceneId, position);
});
if (requestedTargetToken != null && requestedTargetToken.Type != Newtonsoft.Json.Linq.JTokenType.Null)
{
    if (requestedTargetToken.Type != Newtonsoft.Json.Linq.JTokenType.Integer)
        throw new System.ArgumentException("targetSceneNativeId must be an integer.");
    requestedTargetId = requestedTargetToken.ToObject<int>();
    if (requestedTargetId < 0)
        throw new System.ArgumentException("targetSceneNativeId must be greater than or equal to zero.");
}
var requestedFinalId = -1;
if (requestedFinalToken != null && requestedFinalToken.Type != Newtonsoft.Json.Linq.JTokenType.Null)
{
    if (requestedFinalToken.Type != Newtonsoft.Json.Linq.JTokenType.Integer)
        throw new System.ArgumentException("finalSceneNativeId must be an integer.");
    requestedFinalId = requestedFinalToken.ToObject<int>();
    if (requestedFinalId < 0)
        throw new System.ArgumentException("finalSceneNativeId must be greater than or equal to zero.");
}

if (requestedAction == "start")
{
    if (requestedTargetToken == null || requestedTargetToken.Type == Newtonsoft.Json.Linq.JTokenType.Null)
        throw new System.ArgumentException("targetSceneNativeId is required for start.");
    if (requestedResearchCharacter == null || requestedResearchCharacter.Length == 0)
        throw new System.ArgumentException("researchCharacter is required for start.");

    if (System.AppDomain.CurrentDomain.GetData("afallon-compendium.stream-visit.active.v1") != null)
