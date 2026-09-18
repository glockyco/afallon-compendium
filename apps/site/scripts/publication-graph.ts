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
    if (selected.schemaId !== 'compendium.static-root.v3' || selected.sha256 !== sha256 || selected.bytes !== rootBytes.length) throw new Error('Selected publication root does not match its reference.');
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
