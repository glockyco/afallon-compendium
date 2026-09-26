// Operator tool: compares two catalogs by entity kind, placements per scene, placement identity, and source identity.
// Placement and source identities are serialized authored keys, so they are stable across builds that keep a scene.
// usage: bun tools/update/compare-catalogs.ts OLD_SQLITE NEW_SQLITE
import { Database } from "bun:sqlite";

const [oldPath, newPath] = Bun.argv.slice(2);
if (!oldPath || !newPath) throw new Error("usage: compare-catalogs OLD_SQLITE NEW_SQLITE");
const open = (path: string) => new Database(path, { readonly: true, strict: true });
const [before, after] = [open(oldPath), open(newPath)];
const counts = (db: Database, sql: string) => new Map(db.query<{ key: string; n: number }, []>(sql).all().map((row) => [String(row.key), row.n]));
const report = (title: string, sql: string) => {
  const a = counts(before, sql), b = counts(after, sql);
  const rows = [...new Set([...a.keys(), ...b.keys()])].sort().filter((key) => (a.get(key) ?? 0) !== (b.get(key) ?? 0));
  console.log(`\n## ${title}: ${rows.length} differing keys`);
  for (const key of rows) console.log(`${key}\t${a.get(key) ?? 0}\t${b.get(key) ?? 0}`);
};
report("entities by kind", "SELECT kind AS key, count(*) AS n FROM canonical_entities GROUP BY kind");
report("placements by scene", "SELECT scene_native_id AS key, count(*) AS n FROM placements GROUP BY scene_native_id");
report("sources by scene", "SELECT scene_native_id || ' ' || type_name AS key, count(*) AS n FROM source_identities GROUP BY key");
const ids = (db: Database, sql: string) => new Set(db.query<{ id: string }, []>(sql).all().map((row) => row.id));
for (const [title, sql] of [["placement identities", "SELECT placement_id AS id FROM placements"], ["source identities", "SELECT source_id AS id FROM source_identities"], ["entity keys", "SELECT entity_key AS id FROM canonical_entities"]] as const) {
  const a = ids(before, sql), b = ids(after, sql);
  const removed = [...a].filter((id) => !b.has(id)), added = [...b].filter((id) => !a.has(id));
  console.log(`\n## ${title}: ${a.size} -> ${b.size}, removed ${removed.length}, added ${added.length}`);
  for (const id of removed.slice(0, 15)) console.log(`- ${id}`);
  for (const id of added.slice(0, 15)) console.log(`+ ${id}`);
}
before.close();
after.close();
