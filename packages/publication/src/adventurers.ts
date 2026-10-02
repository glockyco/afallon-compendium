import type { CatalogFacts, CatalogNpcFacts } from "@afallon/contracts/catalog";
import { isEntityRef, type AdventurerRole, type Art, type NpcAdventurer, type Ref } from "@afallon/contracts/public";
import { treeAnchor } from "./documents/classes";
import type { ReferenceResolver } from "./documents/projection";
import { displayName } from "./text";

const ROLES: ReadonlySet<string> = new Set<AdventurerRole>(["Tank", "Healer", "Damage"]);

/**
 * The phase abilities that an NPC fights with. An adventurer with a class that does not keep the phase abilities of its
 * record fights with the abilities that it learns from its class instead (AIEntity.InitPhaseAbilities).
 */
export function phaseAbilities(fact: CatalogNpcFacts): CatalogNpcFacts["abilityPhases"] {
  return fact.adventurer?.class?.entityKey && !fact.adventurer.keepPhaseAbilities ? [] : fact.abilityPhases;
}

/**
 * The stats of an NPC record that the NPC has. An adventurer with a race and a class takes its stats from its race and
 * class at its current level instead (MobCombatEntity.GetCustomStats), so the stats of its record are not its stats.
 */
export function recordStats(fact: CatalogNpcFacts): CatalogNpcFacts["stats"] {
  return fact.adventurer?.class?.entityKey && fact.adventurer.race?.entityKey ? [] : fact.stats;
}

/**
 * The facts of each adventurer on the world roster, by NPC key, in roster order. A specialization counts only for the
 * adventurer's own class (AdventurerSpecialization.For). The Dungeon Finder places an adventurer without one in a damage
 * role (DungeonFinderRules.RoleOf), and a specialization's preferred tree replaces the NPC's own (AdventurerClassBuild).
 * The preferred tree links its tree on the class page with the tree's icon.
 */
export function adventurerRoster(facts: CatalogFacts, resolve: ReferenceResolver, artByEntity: ReadonlyMap<string, Art>): ReadonlyMap<string, NpcAdventurer> {
  const npcs = new Map(facts.npcs.map((fact) => [fact.entityKey, fact]));
  const roster = new Map<string, NpcAdventurer>();
  for (const arrival of facts.adventurerWorld?.arrivals ?? []) {
    const key = arrival.adventurer.entityKey, adventurer = key === null ? undefined : npcs.get(key)?.adventurer;
    const classKey = adventurer?.class?.entityKey;
    if (key === null || !adventurer?.class || !classKey) throw new Error(`Roster adventurer ${arrival.adventurer.label} has no class.`);
    const specialization = adventurer.specialization?.class?.entityKey === classKey ? adventurer.specialization : null;
    const role = specialization?.role ?? "Damage";
    if (!ROLES.has(role)) throw new Error(`Roster adventurer ${arrival.adventurer.label} has an unknown role ${role}.`);
    const treeKey = (specialization?.preferredTree ?? adventurer.preferredTree)?.entityKey;
    const tree = treeKey ? facts.progression.links.find((link) => link.owner === classKey && link.linkKind === "talentTree" && link.target.entityKey === treeKey) : undefined;
    const classRef = resolve(adventurer.class), treeIcon = treeKey ? artByEntity.get(treeKey)?.icon : undefined;
    const preferredTree: Ref | undefined = !tree ? undefined : isEntityRef(classRef) && classRef.slug
      ? { key: classRef.key, kind: classRef.kind, name: displayName(tree.target.label), slug: classRef.slug, variant: treeAnchor(treeKey!), ...(treeIcon ? { icon: treeIcon } : {}) }
      : { key: null, label: displayName(tree.target.label) };
    roster.set(key, {
      class: classRef, ...(adventurer.race ? { race: resolve(adventurer.race) } : {}),
      role: role as AdventurerRole, ...(specialization ? {} : { defaultRole: true as const }),
      ...(preferredTree ? { preferredTree } : {}), startingLevel: arrival.startingLevel, joinAfterHours: arrival.joinAfterHours,
      priorityAbilities: (specialization?.priorityAbilities ?? []).map((ability) => resolve(ability)),
    });
  }
  return roster;
}
