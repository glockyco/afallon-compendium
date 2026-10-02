import type { CatalogFacts } from "@afallon/contracts/catalog";
import type { Attunement } from "@afallon/contracts/public";
import type { ReferenceResolver } from "./documents/projection";
import { displayName } from "./text";

/**
 * The attunements of the verified attunement rules. A rule links the item that gives the attunement and then the nodes
 * it favours, and its `boostWeight` is the bonus. The item's effect action names the attunement and sets how long it
 * lasts, and the rule's phrase must name the same attunement.
 */
export function attunements(facts: CatalogFacts, resolve: ReferenceResolver): Attunement[] {
  return facts.progression.mechanicsRules.filter((rule) => rule.topic === "crafting-and-gathering" && rule.section === "attunement" && rule.status === "verified").map((rule) => {
    const [itemLink, ...nodeLinks] = rule.links, boost = rule.operands.boostWeight;
    const item = facts.items.find((candidate) => candidate.entityKey === itemLink?.entityKey);
    const action = item?.gameActions.find((candidate) => candidate.type === "Effect" && candidate.target?.entityKey?.startsWith("effects:"));
    const effect = action?.target?.entityKey ? facts.progression.facts.find((fact) => fact.entityKey === action.target!.entityKey) : undefined;
    const name = displayName(action?.target?.label ?? "");
    if (!item || effect?.kind !== "effects" || !name || boost === undefined || nodeLinks.length === 0 || nodeLinks.some((link) => !link.entityKey?.startsWith("gatheringNodes:")))
      throw new Error(`Attunement rule ${rule.ruleId} must link an item with an effect action and then the nodes that it favours, with a boostWeight.`);
    if (!rule.phrase.includes(name)) throw new Error(`Attunement rule ${rule.ruleId} does not name ${name}, the effect of its item.`);
    return { item: resolve(itemLink!), effect: name, boost, nodes: nodeLinks.map((link) => resolve(link)), ...(effect.details.endless ? {} : { minutes: effect.details.duration / 60 }) };
  });
}
