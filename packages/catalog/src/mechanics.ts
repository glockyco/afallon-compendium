import { placementScopeAllowed, placementTargetKind, type ArtifactReference, type MechanicsRules, type NormalizedMechanicsRule } from "@afallon/contracts/catalog";
import { pointer, type Blocker } from "./context";

/**
 * Turns the reviewed mechanics rules into catalog rows. Each rule keeps the evidence object of every cited method and
 * resolves its links against catalog records. An unknown evidence id, a phrase operand without a value, a value that
 * the phrase does not name, a rule without a topic or a placement, and a placement with a target or scope that its page
 * kind lacks stop the build; a link to a missing record is a coverage issue.
 */
export function normalizeMechanicsRules(rules: MechanicsRules, reference: ArtifactReference, labels: ReadonlyMap<string, string | null>, blockers: Blocker[]): NormalizedMechanicsRule[] {
  const evidence = new Map(rules.evidence.map((item) => [item.id, item]));
  const ids = new Set<string>();
  const ordinals = new Map<string, number>();
  return rules.rules.map((rule, index) => {
    const path = `/rules/${index}`;
    if (ids.has(rule.id)) throw new Error(`Mechanics rules repeat rule ${rule.id}.`);
    ids.add(rule.id);
    const named = new Set([...rule.phrase.matchAll(/\{([A-Za-z0-9]+)\}/g)].map((match) => match[1]!));
    const operands = Object.keys(rule.operands);
    const missing = [...named].filter((name) => !operands.includes(name)), unused = operands.filter((name) => !named.has(name));
    if (missing.length > 0 || unused.length > 0) throw new Error(`Mechanics rule ${rule.id} names operands [${missing.join(", ")}] without values and has values [${unused.join(", ")}] outside its phrase.`);
    if (rule.topic === undefined && rule.placements.length === 0) throw new Error(`Mechanics rule ${rule.id} has no topic and no placement.`);
    const placed = new Set<string>();
    for (const placement of rule.placements) {
      if (placementTargetKind(placement.page, placement.target) === null) throw new Error(`Mechanics rule ${rule.id} places itself on target ${placement.target}, which ${placement.page} pages lack.`);
      if (!placementScopeAllowed(placement.page, placement.scope)) throw new Error(`Mechanics rule ${rule.id} uses scope ${placement.scope}, which ${placement.page} pages lack.`);
      if (placement.scope === "linked" && rule.links.length === 0) throw new Error(`Mechanics rule ${rule.id} uses the linked scope without links.`);
      const key = `${placement.page}/${placement.target}`;
      if (placed.has(key)) throw new Error(`Mechanics rule ${rule.id} repeats placement ${key}.`);
      placed.add(key);
    }
    const sources = rule.sources.map((source) => {
      const item = evidence.get(source.evidence);
      if (!item) throw new Error(`Mechanics rule ${rule.id} cites unknown evidence ${source.evidence}.`);
      return { method: source.method, description: item.description, object: { sha256: item.object.sha256, bytes: item.object.bytes } };
    });
    const links = rule.links.map((key, linkIndex) => {
      if (!labels.has(key)) {
        blockers.push({ kind: "missing-reference", key: `mechanics:${rule.id}:${key}`, detail: `Mechanics rule ${rule.id} links missing ${key}.`, provenance: [pointer(reference, `${path}/links/${linkIndex}`)] });
        return { entityKey: null, label: key };
      }
      return { entityKey: key, label: labels.get(key) ?? key };
    });
    const topic = rule.topic ?? null;
    const ordinal = ordinals.get(topic ?? "") ?? 0;
    ordinals.set(topic ?? "", ordinal + 1);
    return { ruleId: rule.id, topic, section: rule.section, ordinal, status: rule.status, phrase: rule.phrase, operands: rule.operands, links, sources, placements: rule.placements, provenance: [pointer(reference, path)] };
  });
}
