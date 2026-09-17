import { createHash } from 'node:crypto';
import { lstatSync, readFileSync, realpathSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { Assert } from 'typebox/value';
import {
  StaticRootManifestSchema, StaticResourceReferenceSchema, assertStaticResourceIdentity,
  staticResourceEdges, staticResourceSchema, type StaticResourceReference, type StaticRootManifest,
} from '@afallon/contracts/public';

export function verifyPublicationGraph(directory: string, selected?: StaticResourceReference): { publication: StaticRootManifest; files: ReadonlySet<string>; sha256: string } {
  const root = realpathSync(resolve(directory));
  const verified = new Map<string, string>();
  const files = new Set<string>();
  const read = (path: string): Buffer => {
    if (path !== 'publication.json' && !/^(?:resources\/[a-f0-9]{64}\.json|assets\/[a-f0-9]{64}\.webp)$/.test(path)) throw new Error(`Unsafe publication resource path: ${path}.`);
    const target = join(root, path);
    if (!lstatSync(target).isFile() || relative(root, realpathSync(target)) !== path) throw new Error(`Publication resource is not a contained regular file: ${path}.`);
    files.add(path);
    return readFileSync(target);
  };
  const rootBytes = read('publication.json');
  if (rootBytes.length > 65_536) throw new Error('Publication root exceeds 64 KiB.');
  const sha256 = createHash('sha256').update(rootBytes).digest('hex');
  if (selected) {
    Assert(StaticResourceReferenceSchema, selected);
    if (selected.schemaId !== 'compendium.static-root.v2' || selected.sha256 !== sha256 || selected.bytes !== rootBytes.length) throw new Error('Selected publication root does not match its reference.');
  }
  const publication: unknown = JSON.parse(rootBytes.toString('utf8'));
  Assert(StaticRootManifestSchema, publication);
  if (publication.maps.length === 0 || new Set(publication.maps.map((map) => map.mapSpaceId)).size !== publication.maps.length) throw new Error('Publication maps are empty or have duplicate identities.');
  const mapIdentities = new Map<string, { mapSpaceId: string; part?: number }>();
  for (const map of publication.maps) {
    const register = (reference: StaticResourceReference, part?: number) => {
      const expected = { mapSpaceId: map.mapSpaceId, ...(part === undefined ? {} : { part }) };
      const previous = mapIdentities.get(reference.path);
      if (previous && (previous.mapSpaceId !== expected.mapSpaceId || previous.part !== expected.part)) throw new Error(`Conflicting map identity for ${reference.path}.`);
      mapIdentities.set(reference.path, expected);
    };
    map.parts.forEach(register);
    map.optionalGeometry.forEach(register);
    register(map.imagery);
  }
  const pending = staticResourceEdges(publication).map((reference) => ({ reference, parent: 'publication.json' }));
  while (pending.length) {
    const { reference, parent } = pending.pop()!;
    Assert(StaticResourceReferenceSchema, reference);
    const identity = `${reference.schemaId}:${reference.sha256}:${reference.bytes}`;
    const previous = verified.get(reference.path);
    if (previous) {
      if (previous !== identity) throw new Error(`Conflicting reference from ${parent}: ${reference.path}.`);
      continue;
    }
    const bytes = read(reference.path);
    const digest = createHash('sha256').update(bytes).digest('hex');
    if (bytes.length !== reference.bytes || digest !== reference.sha256 || !reference.path.includes(`/${digest}.`)) throw new Error(`Resource identity mismatch from ${parent}: ${reference.path}.`);
    verified.set(reference.path, identity);
    if (reference.schemaId === 'image/webp') {
      if (!reference.path.startsWith('assets/') || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WEBP') throw new Error(`Invalid WebP resource from ${parent}: ${reference.path}.`);
      continue;
    }
    if (!reference.path.startsWith('resources/')) throw new Error(`Invalid JSON resource path from ${parent}: ${reference.path}.`);
    const schema = staticResourceSchema(reference.schemaId);
    const value: unknown = JSON.parse(bytes.toString('utf8'));
    Assert(schema, value);
    assertStaticResourceIdentity(publication, value);
    const expectedMap = mapIdentities.get(reference.path);
    if (expectedMap && (!('mapSpaceId' in value) || value.mapSpaceId !== expectedMap.mapSpaceId || (expectedMap.part !== undefined && (!('part' in value) || value.part !== expectedMap.part)))) throw new Error(`Map resource identity mismatch from ${parent}: ${reference.path}.`);
    if (/^compendium\.static-(?:map|geometry|entity-search|item-search)\./.test(reference.schemaId) && bytes.length > 524_288) throw new Error(`Resource exceeds 512 KiB: ${reference.path}.`);
    for (const edge of staticResourceEdges(value)) pending.push({ reference: edge, parent: reference.path });
  }
  return { publication, files, sha256 };
}
