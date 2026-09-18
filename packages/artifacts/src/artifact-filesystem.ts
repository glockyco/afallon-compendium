import { randomUUID } from "node:crypto";
import { link, open, rename, unlink } from "node:fs/promises";
import * as path from "node:path";

export function isSafeSegment(value: string): boolean {
  return value.length > 0 && value !== "." && value !== ".." && !/[/\\:\u0000-\u001f\u007f]/.test(value);
}

export function safeSegment(value: string, field: string): string {
  if (!isSafeSegment(value)) throw new TypeError(`${field} must be one safe path segment.`);
  return value;
}

export function isErrno(error: unknown, code: string): error is NodeJS.ErrnoException {
  return error !== null && typeof error === "object" && "code" in error && error.code === code;
}

export async function syncDirectory(directory: string): Promise<void> {
  const handle = await open(directory, "r");
  try { await handle.sync(); }
  catch (error) {
    await handle.close().catch(() => {});
    throw error;
  }
  await handle.close();
}

/** Install a new name without replacing an existing file. */
export function createImmutableFile(
  destination: string,
  contents: string,
  options?: { readonly finalMode?: number; readonly cleanup?: "best-effort" | "required" },
): Promise<void> {
  return installFile(destination, contents, link, options?.finalMode, options?.cleanup);
}

/** Replace a name atomically after synchronizing its new contents. */
export function replaceFileAtomically(destination: string, contents: string): Promise<void> {
  return installFile(destination, contents, rename);
}

async function installFile(
  destination: string,
  contents: string,
  install: (source: string, destination: string) => Promise<void>,
  finalMode?: number,
  cleanup: "best-effort" | "required" = "required",
): Promise<void> {
  const temporary = `${destination}.tmp-${randomUUID()}`;
  const handle = await open(temporary, "wx", 0o600);
  let closed = false;
  try {
    await handle.writeFile(contents, "utf8");
    if (finalMode !== undefined) await handle.chmod(finalMode);
    await handle.sync();
    await handle.close();
    closed = true;
    await install(temporary, destination);
    // Synchronize the installed name, not only the temporary directory entry.
    await syncDirectory(path.dirname(destination));
  } catch (error) {
    if (!closed) await handle.close().catch(() => {});
    await unlink(temporary).catch(() => {});
    throw error;
  }
  await unlink(temporary).catch((error: unknown) => {
    if (cleanup === "required" && !isErrno(error, "ENOENT")) throw error;
  });
}
