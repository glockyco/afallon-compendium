import { Artifact, connect, type Session } from "@hotrepl/sdk";
import type { ArtifactRef } from "@hotrepl/protocol";
import { readFile } from "node:fs/promises";
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

export async function withRuntime<T>(config: CompendiumConfig, operation: (runtime: Runtime) => Promise<T>): Promise<T> {
  const pending = connect({ url: config.hotreplUrl });
  let session: Session | undefined;
  try {
    session = await deadline(pending, config.timeoutMs, () => {
      void pending.then(late => late.close(), () => {});
    });
    const runtime = new Runtime(config, session);
    const product = await runtime.evaluate<string>("UnityEngine.Application.productName");
    if (product !== "Afallon") throw new Error(`Expected Afallon, connected to ${JSON.stringify(product)}.`);
    return await operation(runtime);
  } finally {
    session?.close();
  }
}

export class Runtime {
  constructor(readonly config: CompendiumConfig, readonly session: Session) {}

  async evaluate<T>(code: string): Promise<T> {
    const reply = await deadline(this.session.eval<T>(code, this.config.timeoutMs), this.config.timeoutMs + 1000, () => this.session.close());
    if (reply.truncated) throw new Error("HotRepl truncated the result. Use a file artifact instead.");
    if (!reply.hasValue) throw new Error("The runtime probe did not return a value.");
    return reply.value as T;
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
