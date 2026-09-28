import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { Assert } from 'typebox/value';
import { isPublicationFile } from './deployment-files';
import {
  PUBLICATION_ROOT_BUDGET, StaticRootManifestSchema, assertStaticResourceReference,
  assertStaticPublicationBudgets, assertStaticPublicationSemantics,
  staticResourceEdges, staticResourceSchema, type StaticResource, type StaticResourceReference,
  type VerifiedPublicationGraph,
} from '@afallon/contracts/public';

export interface VerifiedFilePublication extends VerifiedPublicationGraph {
  files: ReadonlySet<string>;
  sha256: string;
}

export function verifyPublicationGraph(directory: string, selected?: StaticResourceReference): VerifiedFilePublication {
  const root = realpathSync(resolve(directory));
  const references = new Map<string, StaticResourceReference>();
  const resources = new Map<string, StaticResource>();
  const files = new Set<string>();
  const read = (path: string): Buffer => {
    if (!isPublicationFile(path)) throw new Error(`Unsafe publication resource path: ${path}.`);
    const target = join(root, path);
    if (!lstatSync(target).isFile() || relative(root, realpathSync(target)) !== path) throw new Error(`Publication resource is not a contained regular file: ${path}.`);
    files.add(path);
    return readFileSync(target);
  };
  const rootBytes = read('publication.json');
  if (rootBytes.length > PUBLICATION_ROOT_BUDGET) throw new Error('Publication root exceeds its byte budget.');
  const sha256 = createHash('sha256').update(rootBytes).digest('hex');
  if (selected) {
    assertStaticResourceReference(selected);
    if (selected.schemaId !== 'compendium.static-root.v5' || selected.sha256 !== sha256 || selected.bytes !== rootBytes.length) throw new Error('Selected publication root does not match its reference.');
  }
  const publication: unknown = JSON.parse(rootBytes.toString('utf8'));
  Assert(StaticRootManifestSchema, publication);
  assertStaticPublicationBudgets(publication, rootBytes.length);
  const pending = staticResourceEdges(publication).map((reference) => ({ reference, parent: 'publication.json' }));
  while (pending.length) {
    const { reference, parent } = pending.pop()!;
    assertStaticResourceReference(reference);
    const previous = references.get(reference.path);
    if (previous) {
      if (previous.schemaId !== reference.schemaId || previous.sha256 !== reference.sha256 || previous.bytes !== reference.bytes) throw new Error(`Conflicting reference from ${parent}: ${reference.path}.`);
      continue;
    }
    const bytes = read(reference.path);
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (bytes.length !== reference.bytes || digest !== reference.sha256) throw new Error(`Resource identity mismatch from ${parent}: ${reference.path}.`);
    references.set(reference.path, reference);
    if (reference.schemaId === 'image/webp') {
      if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`Invalid WebP resource from ${parent}: ${reference.path}.`);
      continue;
    }
    const value: unknown = JSON.parse(bytes.toString('utf8'));
    Assert(staticResourceSchema(reference.schemaId), value);
    const resource = value as StaticResource;
    resources.set(reference.path, resource);
    for (const edge of staticResourceEdges(resource)) pending.push({ reference: edge, parent: reference.path });
  }
  assertStaticPublicationSemantics(publication, resources);
  return { publication, resources, references, files, sha256 };
}

/** A publication that an earlier release verified with the schemas of its own time. */
export interface PublicationBaseline {
  publication: unknown;
  resources: ReadonlyMap<string, unknown>;
  references: ReadonlyMap<string, StaticResourceReference>;
}

// Every resource or image reference in a value, found by shape: a resource has a path and a schema id, and an image has
// a url. This does not depend on the schema versions that the value uses.
function referenceEdges(value: unknown, into: StaticResourceReference[] = []): StaticResourceReference[] {
  if (Array.isArray(value)) {
    for (const entry of value) referenceEdges(entry, into);
    return into;
  }
  if (value === null || typeof value !== 'object') return into;
  const record = value as Record<string, unknown>;
  if (typeof record.sha256 === 'string' && typeof record.bytes === 'number') {
    if (typeof record.path === 'string' && typeof record.schemaId === 'string') into.push({ path: record.path, schemaId: record.schemaId, sha256: record.sha256, bytes: record.bytes });
    else if (typeof record.url === 'string') into.push({ path: record.url, schemaId: typeof record.schemaId === 'string' ? record.schemaId : 'image/webp', sha256: record.sha256, bytes: record.bytes });
  }
  for (const child of Object.values(record)) referenceEdges(child, into);
  return into;
}

/**
 * Reads a baseline for parity. It checks that every referenced file is a contained regular file with the referenced
 * hash and size, and that images are WebP. It does not assert today's schemas, because an older publication uses the
 * schemas of its own release.
 */
export function readPublicationBaseline(directory: string): PublicationBaseline {
  const root = realpathSync(resolve(directory));
  const read = (path: string): Buffer => {
    if (!isPublicationFile(path)) throw new Error(`Unsafe baseline resource path: ${path}.`);
    const target = join(root, path);
    if (!lstatSync(target).isFile() || relative(root, realpathSync(target)) !== path) throw new Error(`Baseline resource is not a contained regular file: ${path}.`);
    return readFileSync(target);
  };
  const publication: unknown = JSON.parse(read('publication.json').toString('utf8'));
  const references = new Map<string, StaticResourceReference>(), resources = new Map<string, unknown>();
  const pending = referenceEdges(publication).map((reference) => ({ reference, parent: 'publication.json' }));
  while (pending.length) {
    const { reference, parent } = pending.pop()!;
    const previous = references.get(reference.path);
    if (previous) {
      if (previous.sha256 !== reference.sha256 || previous.bytes !== reference.bytes) throw new Error(`Conflicting baseline reference from ${parent}: ${reference.path}.`);
      continue;
    }
    const bytes = read(reference.path);
    if (bytes.length !== reference.bytes || createHash('sha256').update(bytes).digest('hex') !== reference.sha256) throw new Error(`Baseline resource identity mismatch from ${parent}: ${reference.path}.`);
    references.set(reference.path, reference);
    if (reference.schemaId === 'image/webp') {
      if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`Invalid baseline WebP resource from ${parent}: ${reference.path}.`);
      continue;
    }
    const value: unknown = JSON.parse(bytes.toString('utf8'));
    resources.set(reference.path, value);
    for (const edge of referenceEdges(value)) pending.push({ reference: edge, parent: reference.path });
  }
  return { publication, resources, references };
}
