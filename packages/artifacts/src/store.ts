import { createHash, randomUUID } from "node:crypto";
import { chmod, link, mkdir, open, unlink } from "node:fs/promises";
import * as path from "node:path";
import type { ContentIdentity } from "@afallon/contracts";
import { isErrno, syncDirectory } from "./artifact-filesystem";

const SHA256 = /^[a-f0-9]{64}$/;
export const OBJECT_CHUNK_BYTES = 1024 * 1024;

export interface ObjectWriteProtection {
  protectPending(identity: ContentIdentity): Promise<void>;
  protect(identity: ContentIdentity): Promise<void>;
}

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

  async putBytes(bytes: Uint8Array, protection?: ObjectWriteProtection): Promise<StoredObject> {
    return this.putStream((async function* () { yield bytes; })(), protection);
  }

  async putFile(sourcePath: string, protection?: ObjectWriteProtection): Promise<StoredObject> {
    const handle = await open(sourcePath, "r");
    let failed = false;
    try {
      const metadata = await handle.stat();
      return await this.putStream((async function* () {
        const buffer = Buffer.allocUnsafe(Math.max(1, Math.min(OBJECT_CHUNK_BYTES, metadata.size)));
        while (true) {
          const { bytesRead } = await handle.read(buffer, 0, buffer.byteLength, null);
          if (bytesRead === 0) return;
          yield buffer.subarray(0, bytesRead);
        }
      })(), protection);
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      await handle.close().catch((error: unknown) => { if (!failed) throw error; });
    }
  }

  async putStream(source: AsyncIterable<Uint8Array>, protection?: ObjectWriteProtection): Promise<StoredObject> {
    await mkdir(this.temporaryRoot, { recursive: true });
    const temporaryPath = path.join(this.temporaryRoot, randomUUID());
    const handle = await open(temporaryPath, "wx", 0o600);
    const digest = createHash("sha256");
    let byteCount = 0;
    let closed = false;
    let failed = false;
    try {
      for await (const chunk of source) {
        if (!(chunk instanceof Uint8Array)) throw new TypeError("Object streams must yield Uint8Array chunks.");
        for (let offset = 0; offset < chunk.byteLength; offset += OBJECT_CHUNK_BYTES) {
          const slice = chunk.subarray(offset, Math.min(offset + OBJECT_CHUNK_BYTES, chunk.byteLength));
          digest.update(slice);
          byteCount += slice.byteLength;
          if (!Number.isSafeInteger(byteCount)) throw new RangeError("The object exceeds the supported byte count.");
          let written = 0;
          while (written < slice.byteLength) {
            const { bytesWritten } = await handle.write(slice, written, slice.byteLength - written);
            if (bytesWritten === 0) throw new Error("The object write made no progress.");
            written += bytesWritten;
          }
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
      await protection?.protectPending(identity);
      try {
        await link(temporaryPath, destination);
        await syncDirectory(path.dirname(destination));
      } catch (error) {
        if (!isErrno(error, "EEXIST")) throw error;
        await this.verify(identity);
      }
      await protection?.protect(identity);
      return { ...identity, path: this.relativeObjectPath(sha256) };
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      if (!closed) await handle.close().catch(() => undefined);
      await unlink(temporaryPath).catch((error: unknown) => {
        if (!failed && !isErrno(error, "ENOENT")) throw error;
      });
    }
  }

  async verify(identity: ContentIdentity): Promise<StoredObject> {
    const objectPath = this.objectPath(identity.sha256);
    if (!Number.isSafeInteger(identity.bytes) || identity.bytes < 0) throw new TypeError("The object byte count must be a non-negative safe integer.");
    const handle = await open(objectPath, "r");
    let failed = false;
    try {
      const metadata = await handle.stat();
      if (!metadata.isFile()) throw new ObjectIntegrityError(`Stored object is not a regular file: ${identity.sha256}`, identity.sha256, "not-a-file");
      const digest = createHash("sha256");
      const buffer = Buffer.allocUnsafe(Math.max(1, Math.min(OBJECT_CHUNK_BYTES, metadata.size)));
      let observedBytes = 0;
      while (true) {
        const { bytesRead } = await handle.read(buffer, 0, buffer.byteLength, null);
        if (bytesRead === 0) break;
        digest.update(buffer.subarray(0, bytesRead));
        observedBytes += bytesRead;
      }
      const observedSha256 = digest.digest("hex");
      if (observedBytes !== identity.bytes || observedSha256 !== identity.sha256) {
        throw new ObjectIntegrityError(
          `Stored object integrity failed: expected ${identity.bytes} bytes/${identity.sha256}, observed ${observedBytes} bytes/${observedSha256}.`,
          identity.sha256,
          observedSha256,
        );
      }
      return { ...identity, path: this.relativeObjectPath(identity.sha256) };
    } catch (error) {
      failed = true;
      throw error;
    } finally {
      await handle.close().catch((error: unknown) => { if (!failed) throw error; });
    }
  }

  private relativeObjectPath(sha256: string): string {
    return ["objects", "sha256", sha256.slice(0, 2), sha256.slice(2)].join("/");
  }

}
