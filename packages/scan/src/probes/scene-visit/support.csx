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
// Where the player stands once the target scene is ready. Some scenes arrive outside their level
// and the player falls, so nothing near the map stays resident; placing the player at the map
// on the walkable surface makes the scene static for capture.
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
