import type { MechanicsRule } from '@afallon/contracts/public';

/** The number of each rule in the disclosure of a guide, which groups the rules by section in order of first use. */
export function ruleNumbers(rules: readonly MechanicsRule[]): ReadonlyMap<string, number> {
  const sections = [...new Set(rules.map((rule) => rule.section))];
  const ordered = sections.flatMap((section) => rules.filter((rule) => rule.section === section));
  return new Map(ordered.map((rule, index) => [rule.id, index + 1]));
}
