var ownerSchemaVersion = "compendium.runtime-owner.v1";
var ownerStateKey = "afallon-compendium.runtime-owner.v1";
var requestedOwnerToken = ownerToken;
var requestedOwnerAction = ownerAction;
var requestedOwnerReason = ownerReason ?? "";
var requestedOwnerReceiptPath = ownerReceiptPath;

if (requestedOwnerToken == null || requestedOwnerToken.Length == 0)
    throw new System.ArgumentException("ownerToken must not be empty.");
if (requestedOwnerAction != "claim" && requestedOwnerAction != "release")
    throw new System.ArgumentException("ownerAction must be claim or release.");
if (requestedOwnerReceiptPath == null || requestedOwnerReceiptPath.Length == 0)
    throw new System.ArgumentException("ownerReceiptPath must not be empty.");

var makeReport = new System.Func<string, string, string, System.Collections.Generic.List<string>, int, object>((token, state, reason, errors, callbacksRemaining) => new
{
    schemaVersion = ownerSchemaVersion,
    token = token,
    state = state,
    reason = reason,
    cleanupErrors = errors == null ? new string[0] : errors.ToArray(),
    callbacksRemaining = callbacksRemaining,
    frame = UnityEngine.Time.frameCount,
});

var formatError = new System.Func<System.Exception, string>(error =>
    error.GetType().FullName + ": " + error.Message);
var temporaryReceiptToken = requestedOwnerToken
    .Replace("\\", "_")
    .Replace("/", "_")
    .Replace(":", "_");
var temporaryReceiptPath = requestedOwnerReceiptPath + ".tmp." + temporaryReceiptToken;
var publishReceipt = new System.Func<string, bool>(serialized =>
{
    try
    {
        System.IO.File.WriteAllText(temporaryReceiptPath, serialized);
        System.IO.File.Move(temporaryReceiptPath, requestedOwnerReceiptPath);
        return true;
    }
    catch (System.Exception)
    {
        try
        {
            if (System.IO.File.Exists(temporaryReceiptPath))
                System.IO.File.Delete(temporaryReceiptPath);
        }
        catch (System.Exception)
        {
        }
        throw;
    }
});

var priorRawState = System.AppDomain.CurrentDomain.GetData(ownerStateKey);
var priorState = priorRawState as System.Collections.Generic.Dictionary<string, object>;
if (priorRawState != null && priorState == null)
    throw new System.InvalidOperationException("The runtime owner state has an unexpected type.");

if (requestedOwnerAction == "release")
{
    if (priorState == null)
        return makeReport(requestedOwnerToken, "notOwner", "The release token never owned the runtime.", new System.Collections.Generic.List<string>(), 0);

    var priorToken = priorState["token"] as string;
    if (!string.Equals(priorToken, requestedOwnerToken, System.StringComparison.Ordinal))
        return makeReport(requestedOwnerToken, "notOwner", "The release token does not own the runtime.", new System.Collections.Generic.List<string>(), 0);

    var priorCleanup = priorState["cleanup"] as System.Action;
    if (priorCleanup == null)
        throw new System.InvalidOperationException("The runtime owner has no cleanup action.");
    if ((priorState["state"] as string) == "active") priorState["reason"] = requestedOwnerReason;
    priorCleanup();
    return makeReport(
        priorState["token"] as string,
        priorState["state"] as string,
        priorState["reason"] as string,
        priorState["errors"] as System.Collections.Generic.List<string>,
        ((System.Collections.ICollection)priorState["callbacks"]).Count);
}

// Bind and verify the current Fleck socket before publishing any new owner state.
var reflectionFlags = System.Reflection.BindingFlags.Instance |
    System.Reflection.BindingFlags.Public |
    System.Reflection.BindingFlags.NonPublic;
object replMod = null;
foreach (var candidate in MelonLoader.MelonMod.RegisteredMelons)
{
    if (candidate != null && candidate.GetType().FullName == "HotRepl.Host.MelonLoader.ReplMod")
    {
        replMod = candidate;
        break;
    }
}
if (replMod == null)
    throw new System.InvalidOperationException("HotRepl ReplMod was not found.");

var engineField = replMod.GetType().GetField("_engine", reflectionFlags);
if (engineField == null)
    throw new System.InvalidOperationException("HotRepl ReplMod._engine binding was not found.");
var engine = engineField.GetValue(replMod);
if (engine == null)
    throw new System.InvalidOperationException("HotRepl ReplMod._engine is null.");

var clientsField = engine.GetType().GetField("_clients", reflectionFlags);
if (clientsField == null)
    throw new System.InvalidOperationException("HotRepl ReplEngine._clients binding was not found.");
var clients = clientsField.GetValue(engine);
if (clients == null)
    throw new System.InvalidOperationException("HotRepl ClientRegistry is null.");

var currentField = clients.GetType().GetField("_current", reflectionFlags);
if (currentField == null)
    throw new System.InvalidOperationException("HotRepl ClientRegistry._current binding was not found.");
var currentConnection = currentField.GetValue(clients);
if (currentConnection == null)
    throw new System.InvalidOperationException("HotRepl has no current socket.");

var availableProperty = currentConnection.GetType().GetProperty("IsAvailable");
if (availableProperty == null || availableProperty.GetGetMethod() == null)
    throw new System.InvalidOperationException("The current HotRepl socket has no IsAvailable getter.");
var availableGetter = availableProperty.GetGetMethod();
System.Func<bool> currentAvailable;
try
{
    currentAvailable = (System.Func<bool>)System.Delegate.CreateDelegate(typeof(System.Func<bool>), currentConnection, availableGetter);
}
catch (System.Exception error)
{
    throw new System.InvalidOperationException("The current HotRepl socket IsAvailable getter could not be bound.", error);
}

if (!object.ReferenceEquals(currentConnection, currentField.GetValue(clients)))
    throw new System.InvalidOperationException("The HotRepl current socket changed while it was being bound.");
if (!currentAvailable())
    throw new System.InvalidOperationException("The current HotRepl socket is unavailable.");

var isConnected = new System.Func<bool>(() =>
{
    try
    {
        return object.ReferenceEquals(currentConnection, currentField.GetValue(clients)) && currentAvailable();
    }
    catch (System.Exception)
    {
        return false;
    }
});

if (priorState != null)
{
    var priorStateName = priorState["state"] as string;
    var priorToken = priorState["token"] as string;
    var priorReason = priorState["reason"] as string;
    var priorErrors = priorState["errors"] as System.Collections.Generic.List<string>;
    var priorCallbacks = priorState["callbacks"] as System.Collections.ICollection;
    if (priorToken == null || priorReason == null || priorErrors == null || priorCallbacks == null)
        throw new System.InvalidOperationException("The runtime owner state is incomplete.");

    if (priorStateName == "active")
    {
        var priorIsConnected = priorState["isConnected"] as System.Func<bool>;
        var priorCleanup = priorState["cleanup"] as System.Action;
        if (priorIsConnected == null || priorCleanup == null)
            throw new System.InvalidOperationException("The active runtime owner has incomplete bindings.");

        var priorConnected = false;
        try
        {
            priorConnected = priorIsConnected();
        }
        catch (System.Exception)
        {
            priorConnected = false;
        }
        if (priorConnected)
            return makeReport(priorToken, priorStateName, priorReason, priorErrors, priorCallbacks.Count);

        priorState["reason"] = "disconnected";
        priorCleanup();
        priorStateName = priorState["state"] as string;
        priorReason = priorState["reason"] as string;
        if (priorStateName != "clean")
            return makeReport(priorToken, priorStateName, priorReason, priorErrors, priorCallbacks.Count);
    }
    else if (priorStateName == "cleaning" || priorStateName == "cleanupFailed")
    {
        return makeReport(priorToken, priorStateName, priorReason, priorErrors, priorCallbacks.Count);
    }
    else if (priorStateName != "clean")
    {
        throw new System.InvalidOperationException("The runtime owner state has an unknown state.");
    }
}

var newState = new System.Collections.Generic.Dictionary<string, object>();
var newCallbacks = new System.Collections.Generic.List<System.Collections.Generic.KeyValuePair<long, System.Delegate>>();
var newErrors = new System.Collections.Generic.List<string>();
var cleanupInvoking = false;
System.Action cleanup = null;
cleanup = new System.Action(() =>
{
    var stateName = newState["state"] as string;
    if (stateName == "clean" || stateName == "cleanupFailed" || cleanupInvoking)
        return;

    cleanupInvoking = true;
    try
    {
        newState["state"] = "cleaning";
        while (newCallbacks.Count > 0)
        {
            var registration = newCallbacks[newCallbacks.Count - 1];
            var finished = true;
            try
            {
                var immediate = registration.Value as System.Action;
                var deferred = registration.Value as System.Func<bool>;
                if (immediate != null) immediate();
                else if (deferred != null) finished = deferred();
                else throw new System.InvalidOperationException("Runtime cleanup registration has an unsupported callback type.");
            }
            catch (System.Exception error)
            {
                newErrors.Add("Runtime cleanup callback failed: " + formatError(error));
            }
            if (!finished) return;
            for (var index = newCallbacks.Count - 1; index >= 0; index--)
            {
                if (newCallbacks[index].Key != registration.Key) continue;
                newCallbacks.RemoveAt(index);
                break;
            }
        }

        newState["state"] = newErrors.Count == 0 ? "clean" : "cleanupFailed";
        var receiptWritten = false;
        try
        {
            var receipt = new
            {
                schemaVersion = ownerSchemaVersion,
                token = (string)newState["token"],
                state = (string)newState["state"],
                reason = (string)newState["reason"],
                cleanupErrors = newErrors.ToArray(),
                callbacksRemaining = newCallbacks.Count,
                frame = UnityEngine.Time.frameCount,
            };
            receiptWritten = publishReceipt(Newtonsoft.Json.JsonConvert.SerializeObject(receipt));
        }
        catch (System.Exception error)
        {
            newErrors.Add("Runtime owner receipt write failed: " + formatError(error));
        }

        if (!receiptWritten)
        {
            newState["state"] = "cleanupFailed";
            // Retry once so a transient write failure still leaves proof of failed cleanup.
            try
            {
                var failureReceipt = new
                {
                    schemaVersion = ownerSchemaVersion,
                    token = (string)newState["token"],
                    state = "cleanupFailed",
                    reason = (string)newState["reason"],
                    cleanupErrors = newErrors.ToArray(),
                    callbacksRemaining = newCallbacks.Count,
                    frame = UnityEngine.Time.frameCount,
                };
                publishReceipt(Newtonsoft.Json.JsonConvert.SerializeObject(failureReceipt));
            }
            catch (System.Exception)
            {
                // The first write error is retained in the in-memory report as proof of failure.
            }
        }

        if (!receiptWritten || newErrors.Count != 0)
            newState["state"] = "cleanupFailed";
        else
            newState["state"] = "clean";
    }
    finally
    {
        cleanupInvoking = false;
    }
});

newState["token"] = requestedOwnerToken;
newState["state"] = "active";
newState["reason"] = requestedOwnerReason;
newState["callbacks"] = newCallbacks;
newState["nextCallbackId"] = 0L;
newState["errors"] = newErrors;
newState["cleanup"] = cleanup;
newState["isConnected"] = isConnected;

var published = false;
try
{
    System.AppDomain.CurrentDomain.SetData(ownerStateKey, newState);
    published = true;

    // Keep exactly one bounded managed monitor alive for this owner.
    var ownerMonitor = System.Linq.Enumerable.Repeat<object>(null, int.MaxValue)
        .TakeWhile(_ =>
        {
            var observedState = System.AppDomain.CurrentDomain.GetData(ownerStateKey) as System.Collections.Generic.Dictionary<string, object>;
            if (!object.ReferenceEquals(observedState, newState))
                return false;
            if (!string.Equals(observedState["token"] as string, requestedOwnerToken, System.StringComparison.Ordinal))
                return false;
            var observedStateName = observedState["state"] as string;
            if (observedStateName == "cleaning")
            {
                cleanup();
                return (observedState["state"] as string) == "cleaning";
            }
            if (observedStateName != "active") return false;

            var connected = false;
            try
            {
                connected = isConnected();
            }
            catch (System.Exception)
            {
                connected = false;
            }
            if (connected)
                return true;

            newState["reason"] = "disconnected";
            cleanup();
            return (newState["state"] as string) == "cleaning";
        }).GetEnumerator();
    MelonLoader.MelonCoroutines.Start(ownerMonitor);

    // Do not publish an active owner after a disconnect raced startup.
    if (!isConnected())
    {
        newState["reason"] = "disconnected";
        cleanup();
        throw new System.InvalidOperationException("The HotRepl socket disconnected during runtime owner startup.");
    }
}
catch (System.Exception)
{
    if (published)
    {
        if ((newState["state"] as string) == "active") newState["reason"] = "startupFailed";
        cleanup();
    }
    throw;
}

return makeReport(requestedOwnerToken, "active", requestedOwnerReason, newErrors, newCallbacks.Count);