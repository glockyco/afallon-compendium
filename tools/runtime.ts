import { Artifact, connect, HotReplError, type Session } from "@hotrepl/sdk";
import type { ArtifactRef, EvalErrorMessage, EvalResultMessage } from "@hotrepl/protocol";
import { Database } from "bun:sqlite";
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { Type, type Static } from "typebox";
import { Assert } from "typebox/value";
import { toHostPath, toRuntimePath, type CompendiumConfig } from "./config";

async function deadline<T>(operation: Promise<T>, milliseconds: number, expire: () => void): Promise<T> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          expire();
          reject(new Error(`HotRepl exceeded the ${milliseconds} ms host deadline.`));
        }, milliseconds);
      }),
    ]);
  } finally {
    clearTimeout(timer!);
  }
}

const cleanupReceiptSchema = Type.Object({
  schemaVersion: Type.Literal("compendium.runtime-owner.v1"),
  token: Type.String(), state: Type.String(), reason: Type.String(),
  cleanupErrors: Type.Array(Type.String()),
  callbacksRemaining: Type.Integer({ minimum: 0 }), frame: Type.Integer(),
});
type CleanupReceipt = Static<typeof cleanupReceiptSchema>;

export async function withRuntime<T>(config: CompendiumConfig, operation: (runtime: Runtime) => Promise<T>): Promise<T> {
  const lockPath = resolve(homedir(), ".cache/afallon-compendium/runtime-owner.sqlite");
  await mkdir(dirname(lockPath), { recursive: true, mode: 0o700 });
  const lock = new Database(lockPath, { create: true });
  try {
    lock.exec("BEGIN EXCLUSIVE");
  } catch (error) {
    lock.close();
    if (error !== null && typeof error === "object" && "code" in error && (error.code === "SQLITE_BUSY" || error.code === "SQLITE_LOCKED")) {
      throw new Error("Afallon runtime is busy. Another operation owns the connection.", { cause: error });
    }
    throw error;
  }
  let pending: Promise<Session> | undefined;
  let session: Session | undefined;
  let runtime: Runtime | undefined;
  let interruption: Error | undefined;
  let failure: unknown;
  const interrupt = (signal: "SIGINT" | "SIGTERM") => {
    interruption ??= new Error(`Runtime operation interrupted by ${signal}.`);
    process.exitCode = signal === "SIGINT" ? 130 : 143;
    runtime?.cancel(interruption);
    session?.close();
    void pending?.then(late => late.close(), () => {});
  };
  const onInterrupt = () => interrupt("SIGINT");
  const onTerminate = () => interrupt("SIGTERM");
  process.once("SIGINT", onInterrupt);
  process.once("SIGTERM", onTerminate);
  try {
    const ownerSource = await readFile(resolve(import.meta.dir, "probes/runtime-owner.csx"), "utf8");
    const ownerToken = randomUUID();
    const receiptPath = resolve(config.outputRoot, ".runtime", `${ownerToken}.json`);
    await mkdir(dirname(receiptPath), { recursive: true });
    if (interruption) throw interruption;
    pending = connect({ url: config.hotreplUrl });
    session = await deadline(pending, config.timeoutMs, () => {
      void pending!.then(late => late.close(), () => {});
    });
    if (interruption) throw interruption;
    runtime = new Runtime(config, session, ownerToken, receiptPath, ownerSource);
    await runtime.initialize();
    const owner = runtime;
    let onAbort: () => void;
    const interrupted = new Promise<never>((_, reject) => {
      onAbort = () => reject(owner.signal.reason);
      owner.signal.addEventListener("abort", onAbort, { once: true });
      if (owner.signal.aborted) onAbort();
    });
    const running = Promise.resolve().then(() => operation(owner));
    try {
      const result = await Promise.race([running, interrupted]);
      await owner.complete();
      return result;
    } finally {
      owner.signal.removeEventListener("abort", onAbort!);
      if (owner.signal.aborted) {
        await deadline(running.then(() => {}, () => {}), config.timeoutMs, () => owner.cancel(new Error("The cancelled host operation did not finish its bookkeeping.")));
      }
    }
  } catch (error) {
    failure = error;
    runtime?.cancel(error);
    throw error;
  } finally {
    try {
      await runtime?.close();
    } catch (error) {
      throw new AggregateError(failure === undefined ? [error] : [failure, error], `Runtime cleanup is unconfirmed. See ${runtime?.cleanupReceiptPath}.`);
    } finally {
      session?.close();
      process.off("SIGINT", onInterrupt);
      process.off("SIGTERM", onTerminate);
      try { lock.exec("ROLLBACK"); } finally { lock.close(); }
    }
  }
}

export class Runtime {
  readonly ownerSourceHash: string;
  private readonly abortController = new AbortController();
  private readonly removeEvictionListener: () => void;
  private activeRequest: string | undefined;
  private receiptRuntimePath = "";
  private initialized = false;
  private completed = false;
  private closing = false;
  private cleanup: Promise<CleanupReceipt> | undefined;

  constructor(readonly config: CompendiumConfig, private readonly session: Session, readonly ownerToken: string, readonly cleanupReceiptPath: string, private readonly ownerSource: string) {
    this.ownerSourceHash = createHash("sha256").update(ownerSource).digest("hex");
    this.removeEvictionListener = session.onSessionEvicted(event => this.cancel(new Error(`Runtime ownership lost: ${event.reason}.`)));
  }

  get handshake() { return this.session.handshake; }
  get signal() { return this.abortController.signal; }

  cancel(error: unknown): void {
    if (!this.completed && !this.signal.aborted) this.abortController.abort(error);
    if (this.activeRequest) this.session.cancel(this.activeRequest);
    this.session.close();
  }

  async initialize(): Promise<void> {
    this.signal.throwIfAborted();
    if (this.initialized || this.closing) throw new Error("Runtime ownership has already been initialized or closed.");
    const product = await this.rawEvaluate<string>("UnityEngine.Application.productName");
    if (product !== "Afallon") throw new Error(`Expected Afallon, connected to ${JSON.stringify(product)}.`);
    this.receiptRuntimePath = await toRuntimePath(this.config, this.cleanupReceiptPath);
    const report = await this.control("claim", "completed");
    if (report.token !== this.ownerToken || report.state !== "active") {
      throw new Error(`Runtime ownership is blocked: ${report.state}, ${report.reason}. ${report.cleanupErrors.join("; ")}`);
    }
    this.initialized = true;
  }

  private async rawEvaluate<T>(code: string): Promise<T> {
    if (this.activeRequest) throw new Error("Another evaluation is already using this runtime operation.");
    const id = `${this.ownerToken}:${this.session.nextId("eval")}`;
    this.activeRequest = id;
    try {
      const reply = await deadline(this.session.request<EvalResultMessage | EvalErrorMessage>({ type: "eval", id, code, timeoutMs: this.config.timeoutMs }), this.config.timeoutMs + 1000, () => this.cancel(new Error("The runtime evaluation exceeded its host deadline.")));
      if (reply.type === "eval_error") throw HotReplError.fromEnvelope(reply.error);
      if (reply.type !== "eval_result" || reply.id !== id) throw new Error("The runtime returned a response for another request.");
      if (reply.truncated) throw new Error("HotRepl truncated the result. Use a file artifact instead.");
      if (!reply.hasValue) throw new Error("The runtime probe did not return a value.");
      return reply.value as T;
    } finally {
      this.activeRequest = undefined;
    }
  }

  private async control(action: "claim" | "release", reason: string): Promise<CleanupReceipt> {
    const result = await this.rawEvaluate<unknown>(`new System.Func<object>(() => {
      var ownerToken = ${JSON.stringify(this.ownerToken)};
      var ownerAction = ${JSON.stringify(action)};
      var ownerReceiptPath = ${JSON.stringify(this.receiptRuntimePath)};
      var ownerReason = ${JSON.stringify(reason)};
      ${this.ownerSource}
    })()`);
    Assert(cleanupReceiptSchema, result);
    return result;
  }

  private finishCleanup(reason: string): Promise<CleanupReceipt> {
    this.closing = true;
    return this.cleanup ??= (async () => {
      let releaseError: unknown;
      if (!this.signal.aborted) {
        try { await this.control("release", reason); }
        catch (error) { releaseError = error; this.cancel(error); }
      }
      const end = Date.now() + this.config.timeoutMs;
      while (Date.now() < end) {
        let receipt: unknown;
        try { receipt = JSON.parse(await readFile(this.cleanupReceiptPath, "utf8")); }
        catch (error) {
          if (error !== null && typeof error === "object" && "code" in error && error.code === "ENOENT") {
            await Bun.sleep(50);
            continue;
          }
          throw error;
        }
        Assert(cleanupReceiptSchema, receipt);
        if (receipt.token !== this.ownerToken) throw new Error("The cleanup receipt belongs to another runtime owner.");
        if (receipt.state !== "clean" || receipt.callbacksRemaining !== 0 || receipt.cleanupErrors.length !== 0) {
          throw new Error(`Runtime cleanup failed: ${receipt.cleanupErrors.join("; ") || receipt.state}.`);
        }
        return receipt;
      }
      throw new Error(`Runtime cleanup was not confirmed before the deadline. Receipt: ${this.cleanupReceiptPath}`, { cause: releaseError });
    })();
  }

  async complete(): Promise<void> {
    if (this.completed) return;
    this.signal.throwIfAborted();
    if (!this.initialized) throw new Error("Runtime ownership has not been established.");
    if (this.activeRequest) throw new Error("Cannot complete while an evaluation is still running.");
    const receipt = await this.finishCleanup("completed");
    this.signal.throwIfAborted();
    if (receipt.reason !== "completed") throw new Error(`Runtime operation ended before completion: ${receipt.reason}.`);
    this.completed = true;
  }

  async close(): Promise<void> {
    try {
      if (this.activeRequest) this.cancel(new Error("Runtime closed while an evaluation was still running."));
      if (this.initialized) await this.finishCleanup(this.signal.aborted ? "cancelled" : "completed");
    } finally {
      this.closing = true;
      this.removeEvictionListener();
    }
  }

  async evaluate<T>(code: string): Promise<T> {
    this.signal.throwIfAborted();
    if (!this.initialized || this.closing) throw new Error("The runtime operation does not own an active session.");
    try {
      return await this.rawEvaluate<T>(`new System.Func<object>(() => {
        var runtimeOwner = System.AppDomain.CurrentDomain.GetData("afallon-compendium.runtime-owner.v1") as System.Collections.Generic.Dictionary<string, object>;
        if (runtimeOwner == null || (string)runtimeOwner["token"] != ${JSON.stringify(this.ownerToken)} || (string)runtimeOwner["state"] != "active" || !((System.Func<bool>)runtimeOwner["isConnected"])())
          throw new System.OperationCanceledException("Runtime ownership is no longer active.");
        var ownedCallbacks = (System.Collections.Generic.List<System.Collections.Generic.KeyValuePair<long, System.Delegate>>)runtimeOwner["callbacks"];
        var registerOwnedCleanup = new System.Func<System.Delegate, System.Action>(callback => {
          if (callback == null) throw new System.ArgumentNullException("callback");
          // An in-flight frame must still register cleanup after socket loss.
          if ((string)runtimeOwner["state"] != "active") throw new System.OperationCanceledException("Cannot register cleanup after runtime ownership ends.");
          var registrationId = (long)runtimeOwner["nextCallbackId"];
          runtimeOwner["nextCallbackId"] = checked(registrationId + 1);
          ownedCallbacks.Add(new System.Collections.Generic.KeyValuePair<long, System.Delegate>(registrationId, callback));
          return new System.Action(() => {
            for (var index = ownedCallbacks.Count - 1; index >= 0; index--) {
              if (ownedCallbacks[index].Key != registrationId) continue;
              ownedCallbacks.RemoveAt(index);
              break;
            }
          });
        });
        var registerRuntimeCleanup = new System.Func<System.Action, System.Action>(callback => registerOwnedCleanup(callback));
        var registerRuntimeCleanupWait = new System.Func<System.Func<bool>, System.Action>(callback => registerOwnedCleanup(callback));
        var frameOpen = true;
        System.Collections.Generic.List<System.Action> frameCallbacks = null;
        var registerFrameCleanup = new System.Action<System.Action>(callback => {
          if (callback == null) throw new System.ArgumentNullException("callback");
          if (!frameOpen) throw new System.InvalidOperationException("The frame-local operation has ended.");
          if (frameCallbacks == null) frameCallbacks = new System.Collections.Generic.List<System.Action>();
          frameCallbacks.Add(callback);
        });
        try { return ${code}; }
        finally {
          frameOpen = false;
          if (frameCallbacks != null) {
            var failures = (System.Collections.Generic.List<string>)runtimeOwner["errors"];
            while (frameCallbacks.Count > 0) {
              var index = frameCallbacks.Count - 1;
              var callback = frameCallbacks[index];
              frameCallbacks.RemoveAt(index);
              try { callback(); }
              catch (System.Exception error) { failures.Add(error.GetType().FullName + ": " + error.Message); }
            }
            if (failures.Count > 0) {
              runtimeOwner["reason"] = "frameCleanupFailed";
              ((System.Action)runtimeOwner["cleanup"])();
              throw new System.InvalidOperationException("Frame-local restoration failed: " + string.Join("; ", failures));
            }
          }
        }
      })()`);
    } catch (error) {
      this.cancel(error);
      throw error;
    }
  }

  async probe(sourceFile: string, outputFile: string, options: { preludeFile?: string; parameters?: Record<string, unknown>; captureContext?: boolean } = {}): Promise<{ reference: ArtifactRef; value: unknown; observationContext?: unknown }> {
    const body = await readFile(sourceFile, "utf8");
    const prelude = options.preludeFile ? await readFile(options.preludeFile, "utf8") : "";
    const parameters = options.parameters === undefined ? "" : `var args = Newtonsoft.Json.Linq.JObject.Parse(${JSON.stringify(JSON.stringify(options.parameters))});`;
    const output = await toRuntimePath(this.config, outputFile);
    const contextSetup = options.captureContext ? `
      var readObservationContext = new System.Func<object>(() => {
        var character = Il2CppBLINK.RPGBuilder.Characters.Character.Instance;
        if (character == null || character.CharacterData == null || !character.CharacterData.IsCreated ||
            character.CharacterData.CharacterName != ${JSON.stringify(this.config.character)})
          throw new System.InvalidOperationException("Load the configured research character before extraction.");
        var scene = UnityEngine.SceneManagement.SceneManager.GetActiveScene();
        var nativeScene = Il2Cpp.GameState.CurrentGameScene;
        return new {
          researchCharacter = character.CharacterData.CharacterName,
          frame = UnityEngine.Time.frameCount,
          scene = new { name = scene.name, path = scene.path, handle = scene.handle, isLoaded = scene.isLoaded },
          gameSceneNativeId = nativeScene == null ? (int?)null : nativeScene.ID
        };
      });
      var observationStarted = readObservationContext();` : "";
    const expression = `new System.Func<object>(() => {
      ${contextSetup}
      var result = new System.Func<object>(() => { ${parameters}\n${prelude}\n${body}\n })();
      ${options.captureContext ? "var observationCompleted = readObservationContext();" : ""}
      var bytes = System.Text.Encoding.UTF8.GetBytes(Newtonsoft.Json.JsonConvert.SerializeObject(result));
      var path = ${JSON.stringify(output)};
      System.IO.File.WriteAllBytes(path, bytes);
      string hash;
      using (var digest = System.Security.Cryptography.SHA256.Create()) {
        hash = System.BitConverter.ToString(digest.ComputeHash(bytes)).Replace("-", "").ToLowerInvariant();
      }
      return new { uri = new System.Uri(path).AbsoluteUri, path, sha256 = hash, byteSize = bytes.LongLength, contentType = "application/json", finalized = true ${options.captureContext ? ', observationContext = new { schemaVersion = "compendium.observation-context.v1", started = observationStarted, completed = observationCompleted }' : ""} };
    })()`;
    const reference = await this.evaluate<ArtifactRef & { observationContext?: unknown }>(expression);
    if (!reference || reference.finalized !== true || !Number.isSafeInteger(reference.byteSize) || reference.byteSize < 0 || !/^[a-f0-9]{64}$/.test(reference.sha256) || reference.path !== output) {
      throw new Error("The runtime returned invalid artifact metadata.");
    }
    const value = await readRuntimeArtifact(this.config, reference);
    return { reference, value: JSON.parse(new TextDecoder().decode(value)), observationContext: reference.observationContext };
  }
}

export async function readRuntimeArtifact(config: CompendiumConfig, reference: ArtifactRef): Promise<Uint8Array> {
  if (!reference.finalized || !reference.path) throw new Error("Artifact is not a finalized local file.");
  const path = await toHostPath(config, reference.path);
  const artifact = new Artifact(reference, {
    async readArtifact() {
      const bytes = await readFile(path);
      if (bytes.byteLength !== reference.byteSize) throw new Error("Artifact byte count does not match its reference.");
      return bytes;
    },
  });
  return artifact.bytes();
}
