import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join, relative, sep } from "node:path";

export function listFiles(root: string): string[] {
  const files: string[] = [];
  const visit = (directory: string): void => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const entryPath = join(directory, entry.name);
      const name = relative(root, entryPath).split(sep).join("/");
      if (entry.isSymbolicLink()) throw new Error(`Deployment file cannot be a symlink: ${name}.`);
      if (entry.isDirectory()) visit(entryPath);
      else if (entry.isFile()) files.push(name);
      else throw new Error(`Deployment entry is not a regular file: ${name}.`);
    }
  };
  visit(root);
  return files.sort();
}

export function parseJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

export function hashFile(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
