<script lang="ts">
  import { base } from '$app/paths';
  import type { GuideSection, MechanicsRule, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../EntityLink.svelte';
  import Section from './Section.svelte';
  import RulePhrase from './sections/RulePhrase.svelte';

  /** One mechanic of a page: its lead, its rules, and the data that the page adds. */
  export let section: GuideSection;
  export let registry: PublicKindEntry[];
  export let topic: string | undefined = undefined;
  /** One sentence beside the heading that states a value that the whole section shares. */
  export let line: string | undefined = undefined;
  const SUPPLY_DETAILS: Record<string, true> = { 'supply-pack-picks': true, 'supply-pack-world-loot': true };
  const COMBAT_LONG_LINKS: Record<string, true> = { 'combat-resistance-penetration': true, 'combat-on-hit-chance-cooldown': true };
  const COMBAT_LINK_PREVIEW = 4;
  let expandedLinks: string[] = [];
  $: verified = section.rules.filter((rule) => rule.status === 'verified');
  $: unknown = section.rules.filter((rule) => rule.status === 'unknown');
  $: supplyDetails = topic === 'loot' && section.id === 'supply-packs' ? verified.filter((rule) => SUPPLY_DETAILS[rule.id]) : [];
  $: mainRules = verified.filter((rule) => !supplyDetails.includes(rule));
  $: groups = topic === 'combat' && section.id === 'building-stats'
    ? [{ id: 'stats', title: 'Stat bonuses', rules: mainRules.filter((rule) => !rule.id.startsWith('combat-gear-set-')) },
      { id: 'gear', title: 'Gear set bonuses', rules: mainRules.filter((rule) => rule.id.startsWith('combat-gear-set-')) }]
    : topic === 'combat' && section.id === 'effects'
      ? [{ id: 'immediate', title: 'Immediate impacts', rules: [] as MechanicsRule[] },
        { id: 'timed', title: 'Timed effects', rules: mainRules.filter((rule) => !['effect-requirement-presence', 'effect-persistent-save'].includes(rule.id)) },
        { id: 'checks', title: 'Requirement checks', rules: mainRules.filter((rule) => rule.id === 'effect-requirement-presence') },
        { id: 'travel', title: 'Travel effects', rules: [] as MechanicsRule[] }]
      : [{ id: 'main', title: '', rules: mainRules }];
  $: persistentRules = topic === 'combat' && section.id === 'effects' ? mainRules.filter((rule) => rule.id === 'effect-persistent-save') : [];
  function expandLinks(id: string): void { expandedLinks = [...expandedLinks, id]; }
  function exampleLinks(rule: MechanicsRule, expanded: boolean): MechanicsRule['links'] {
    const short = rule.id === 'combat-on-hit-chance-cooldown'
      ? rule.links.filter((ref) => (ref.key === null ? ref.label : ref.name).length <= 36)
      : [];
    const first = (short.length >= COMBAT_LINK_PREVIEW ? short : rule.links).slice(0, COMBAT_LINK_PREVIEW);
    return expanded ? [...first, ...rule.links.filter((ref) => !first.includes(ref))] : first;
  }
</script>

<Section id={section.id} title={section.title} {line}>
  <p class="lead">{section.lead}<slot name="lead" /></p>
  <slot name="top" />
  {#each groups as group (group.id)}
    {#if group.rules.length || group.id === 'immediate' || group.id === 'travel' || group.id === 'checks'}
      <div class:mechanic-group={Boolean(group.title)} class="rule-group">
        {#if group.title}<h3>{group.title}</h3>{/if}
        {#if group.id === 'immediate'}
          <p>Some effects deal damage or restore health as soon as they activate.</p>
          <p><a class="c-link" href={`${base}/effects/?type=Instant+Damage`}>Browse instant damage effects</a> · <a class="c-link" href={`${base}/effects/?type=Instant+Heal`}>Browse instant healing effects</a></p>
        {:else if group.id === 'travel'}
          <p>Teleport effects move a character between places rather than changing a combat stat.</p>
          <a class="c-link" href={`${base}/effects/?type=Teleport`}>Browse teleport effects</a>
        {/if}
        {#each group.rules as rule (rule.id)}
          <div class="rule-entry">
            <p><RulePhrase rule={topic === 'combat' && COMBAT_LONG_LINKS[rule.id] ? { ...rule, links: [] } : rule} {registry} /></p>
            {#if topic === 'combat' && COMBAT_LONG_LINKS[rule.id] && rule.links.length}
              <div class="link-cluster">
                <h4>{rule.id === 'combat-resistance-penetration' ? 'Resistance and penetration stats' : 'On-hit stats'}</h4>
                <ul>{#each exampleLinks(rule, expandedLinks.includes(rule.id)) as ref (ref.key ?? ref.label)}<li><EntityLink {ref} {registry} /></li>{/each}</ul>
                {#if !expandedLinks.includes(rule.id) && rule.links.length > COMBAT_LINK_PREVIEW}
                  <button type="button" class="c-action" on:click={() => expandLinks(rule.id)}>Show {rule.links.length - COMBAT_LINK_PREVIEW} more</button>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
        {#if group.id === 'checks'}<a class="c-link" href={`${base}/effects/?type=Effect+Checker`}>Browse effect checks</a>{/if}
      </div>
    {/if}
  {/each}
  {#if persistentRules.length}<details class="rule-details"><summary>Character persistence</summary>{#each persistentRules as rule (rule.id)}<p><RulePhrase {rule} {registry} /></p>{/each}</details>{/if}
  <slot />
  {#if supplyDetails.length}<details class="rule-details"><summary>How supply pack picks work</summary>{#each supplyDetails as rule (rule.id)}<p><RulePhrase {rule} {registry} /></p>{/each}</details>{/if}
  {#if unknown.length}<details class="rule-details"><summary>Unconfirmed details</summary>{#each unknown as rule (rule.id)}<p><RulePhrase {rule} {registry} /></p>{/each}</details>{/if}
</Section>

<style>
  .lead, .rule-entry, .rule-group, .rule-details { line-height: 1.55; overflow-wrap: anywhere; }
  .rule-entry p, .rule-group p { margin: 0; }
  .rule-group { display: grid; gap: .55rem; }
  .mechanic-group + .mechanic-group { padding-top: 1rem; border-top: 1px solid var(--c-line-soft); }
  h3 { color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  h4 { color: var(--c-text-strong); font-weight: 600; }
  .link-cluster { display: grid; gap: .5rem; margin-top: .65rem; }
  .link-cluster ul { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 12rem), 1fr)); gap: .35rem .8rem; list-style: none; margin: 0; padding: 0; }
  .link-cluster li { min-width: 0; }
  .link-cluster button { justify-self: start; }
  .rule-details { border-top: 1px solid var(--c-line-soft); padding-top: .8rem; }
  .rule-details summary { color: var(--c-accent); cursor: pointer; font-weight: 600; }
  .rule-details p { margin: .6rem 0 0; }
</style>
