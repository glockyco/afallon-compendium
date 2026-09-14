import { createHash, randomUUID } from "node:crypto";
import { chmod, link, mkdir, open, readFile, stat, unlink } from "node:fs/promises";
import * as path from "node:path";
import type { ContentIdentity } from "@afallon/contracts";

const SHA256 = /^[a-f0-9]{64}$/;

export class ObjectIntegrityError extends Error {
  override name = "ObjectIntegrityError";

  constructor(
    message: string,
    readonly expectedSha256: string,
    readonly observedSha256: string,
  ) {
    super(message);
  }
}

export interface StoredObject extends ContentIdentity {
  readonly path: string;
}

export class ArtifactStore {
  readonly root: string;
  readonly objectsRoot: string;
  readonly temporaryRoot: string;

  constructor(root: string) {
    if (typeof root !== "string" || root.length === 0) throw new TypeError("The artifact store root must be a non-empty path.");
    this.root = path.resolve(root);
    this.objectsRoot = path.join(this.root, "objects", "sha256");
    this.temporaryRoot = path.join(this.objectsRoot, ".tmp");
  }

  objectPath(sha256: string): string {
    if (!SHA256.test(sha256)) throw new TypeError("The object identity must be a lowercase SHA-256 hash.");
    return path.join(this.objectsRoot, sha256.slice(0, 2), sha256.slice(2));
  }

  async putBytes(bytes: Uint8Array): Promise<StoredObject> {
    return this.putStream((async function* () { yield bytes; })());
  }

  async putFile(sourcePath: string): Promise<StoredObject> {
    const handle = await open(sourcePath, "r");
    try {
      return await this.putStream(handle.createReadStream({ autoClose: false }));
    } finally {
      await handle.close();
    }
  }

  async putStream(source: AsyncIterable<Uint8Array>): Promise<StoredObject> {
    await mkdir(this.temporaryRoot, { recursive: true });
    const temporaryPath = path.join(this.temporaryRoot, randomUUID());
    const handle = await open(temporaryPath, "wx", 0o600);
    const digest = createHash("sha256");
    let byteCount = 0;
    let closed = false;
    try {
      for await (const chunk of source) {
        if (!(chunk instanceof Uint8Array)) throw new TypeError("Object streams must yield Uint8Array chunks.");
        digest.update(chunk);
        byteCount += chunk.byteLength;
        let offset = 0;
        while (offset < chunk.byteLength) {
          const { bytesWritten } = await handle.write(chunk, offset, chunk.byteLength - offset);
          if (bytesWritten === 0) throw new Error("The object write made no progress.");
          offset += bytesWritten;
        }
      }
      await handle.sync();
      await handle.close();
      closed = true;
      await chmod(temporaryPath, 0o444);

      const sha256 = digest.digest("hex");
      const identity = { sha256, bytes: byteCount } satisfies ContentIdentity;
      const destination = this.objectPath(sha256);
      await mkdir(path.dirname(destination), { recursive: true });
      try {
        await link(temporaryPath, destination);
        await this.flushDirectory(path.dirname(destination));
      } catch (error) {
        if (!isErrno(error, "EEXIST")) throw error;
        await this.verify(identity);
      }
      return { ...identity, path: this.relativeObjectPath(sha256) };
    } finally {
      if (!closed) await handle.close().catch(() => undefined);
      await unlink(temporaryPath).catch((error: unknown) => {
        if (!isErrno(error, "ENOENT")) throw error;
      });
    }
  }

  async verify(identity: ContentIdentity): Promise<StoredObject> {
    const objectPath = this.objectPath(identity.sha256);
    const metadata = await stat(objectPath);
    if (!metadata.isFile()) throw new ObjectIntegrityError(`Stored object is not a regular file: ${identity.sha256}`, identity.sha256, "not-a-file");
    const bytes = await readFile(objectPath);
    const observedSha256 = createHash("sha256").update(bytes).digest("hex");
    if (metadata.size !== identity.bytes || observedSha256 !== identity.sha256) {
      throw new ObjectIntegrityError(
        `Stored object integrity failed: expected ${identity.bytes} bytes/${identity.sha256}, observed ${metadata.size} bytes/${observedSha256}.`,
        identity.sha256,
        observedSha256,
      );
    }
    return { ...identity, path: this.relativeObjectPath(identity.sha256) };
  }

  private relativeObjectPath(sha256: string): string {
    return ["objects", "sha256", sha256.slice(0, 2), sha256.slice(2)].join("/");
  }

  private async flushDirectory(directory: string): Promise<void> {
    const handle = await open(directory, "r");
    try {
      await handle.sync();
    } finally {
      await handle.close();
    }
  }
}

function isErrno(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error !== null && typeof error === "object" && "code" in error && error.code === code;
}
