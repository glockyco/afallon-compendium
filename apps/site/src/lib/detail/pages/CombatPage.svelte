<script lang="ts">
  import { base } from '$app/paths';
  import type { CombatGuide, MechanicsRule, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import GuideSection from '../GuideSection.svelte';
  import Hero from '../Hero.svelte';
  import LinkGrid from '../LinkGrid.svelte';
  import RelationTable from '../RelationTable.svelte';
  import type { RelationColumn } from '../relation-table';
  import RulePhrase from '../sections/RulePhrase.svelte';
  import Sections from '../Sections.svelte';
  import TitleBlock from '../TitleBlock.svelte';

  export let document: CombatGuide;
  export let registry: PublicKindEntry[];

  const PREVIEW = 4;
  const recoveryEntry = (row: CombatGuide['recovery'][number], when: 'outside-combat' | 'in-combat') => row.entries.find((entry) => entry.when === when);
  const recoveryText = (row: CombatGuide['recovery'][number], when: 'outside-combat' | 'in-combat') => {
    const entry = recoveryEntry(row, when);
    return entry ? `+${formatNumber(entry.amount)} every ${formatNumber(entry.interval)} seconds` : '';
  };
  type Recovery = CombatGuide['recovery'][number];
  const recoveryColumns: RelationColumn<Recovery>[] = [
    { id: 'stat', label: 'Resource', value: (row) => row.stat.key === null ? row.stat.label : row.stat.name, sort: (row) => row.stat.key === null ? row.stat.label : row.stat.name },
    { id: 'outside', label: 'Outside combat', value: (row) => recoveryText(row, 'outside-combat') },
    { id: 'inside', label: 'In combat', value: (row) => recoveryText(row, 'in-combat') },
  ];
  const gearRule = (rule: MechanicsRule) => rule.id.startsWith('combat-gear-set-');
  const persistenceRule = (rule: MechanicsRule) => rule.id === 'effect-persistent-save';
  const requirementRule = (rule: MechanicsRule) => rule.id === 'effect-requirement-presence';
  const specialized = ['building-stats', 'damage-and-defense', 'on-hit-effects', 'effects'];
</script>

<article class="detail-page">
  <TitleBlock name={document.ref.name} {registry} />
  <Hero><p class="c-prose">{document.overview}</p></Hero>
  <Sections>
    {#each document.sections as section (section.id)}
      <GuideSection {section} {registry} rules={specialized.includes(section.id) ? section.rules.filter((rule) => rule.status === 'unknown') : section.rules}>
        {#if section.id === 'building-stats'}
          <div class="rule-group"><h3>Stat bonuses</h3>
            {#each section.rules.filter((rule) => rule.status === 'verified' && !gearRule(rule)) as rule (rule.id)}<p><RulePhrase {rule} {registry} /></p>{/each}
          </div>
          <div class="rule-group"><h3>Gear set bonuses</h3>
            {#each section.rules.filter((rule) => rule.status === 'verified' && gearRule(rule)) as rule (rule.id)}<p><RulePhrase {rule} {registry} /></p>{/each}
          </div>
        {:else if section.id === 'recovery'}
          <RelationTable columns={recoveryColumns} rows={document.recovery} label="Health and resource recovery">
            <svelte:fragment slot="cell" let:row let:column>
              {#if column === 'stat'}<EntityLink ref={row.stat} {registry} />
              {:else if column === 'outside'}{recoveryText(row, 'outside-combat')}
              {:else}{recoveryText(row, 'in-combat')}{/if}
            </svelte:fragment>
          </RelationTable>
        {:else if section.id === 'damage-and-defense' || section.id === 'on-hit-effects'}
          {#each section.rules.filter((rule) => rule.status === 'verified') as rule (rule.id)}
            <p class="rule"><RulePhrase rule={rule.links.length > PREVIEW ? { ...rule, links: [] } : rule} {registry} /></p>
            {#if rule.links.length > PREVIEW}
              <div class="examples"><h3>{section.id === 'damage-and-defense' ? 'Resistance and penetration stats' : 'On-hit stats'}</h3>
                <LinkGrid refs={rule.links} {registry} />
              </div>
            {/if}
          {/each}
        {:else if section.id === 'effects'}
          <div class="rule-group"><h3>Timed effects</h3>
            {#each section.rules.filter((rule) => rule.status === 'verified' && !persistenceRule(rule) && !requirementRule(rule)) as rule (rule.id)}<p><RulePhrase {rule} {registry} /></p>{/each}
          </div>
          <div class="rule-group"><h3>Requirement checks</h3>
            {#each section.rules.filter(requirementRule) as rule (rule.id)}<p><RulePhrase {rule} {registry} /></p>{/each}
          </div>
          <nav class="effect-links" aria-label="Other effect types">
            <h3>Other effect types</h3>
            <a class="c-link" href={`${base}/effects/?type=Instant+Damage`}>Instant damage</a>
            <a class="c-link" href={`${base}/effects/?type=Instant+Heal`}>Instant healing</a>
            <a class="c-link" href={`${base}/effects/?type=Teleport`}>Teleports</a>
          </nav>
          {#if section.rules.some(persistenceRule)}
            <details class="rule-details"><summary>Character persistence</summary>
              {#each section.rules.filter(persistenceRule) as rule (rule.id)}<p><RulePhrase {rule} {registry} /></p>{/each}
            </details>
          {/if}
        {/if}
      </GuideSection>
    {/each}
  </Sections>
</article>

<style>
  .rule-group { display: grid; gap: .55rem; line-height: 1.55; }
  .rule-group p, .rule { margin: 0; }
  .rule-group + .rule-group { padding-top: 1rem; border-top: 1px solid var(--c-line-soft); }
  h3 { color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  .examples { display: grid; gap: .5rem; margin-top: .65rem; }
  .effect-links { display: flex; flex-wrap: wrap; align-items: baseline; gap: .35rem 1rem; padding-top: .8rem; border-top: 1px solid var(--c-line-soft); }
  .effect-links h3 { width: 100%; }
  .rule-details { border-top: 1px solid var(--c-line-soft); padding-top: .8rem; }
  .rule-details summary { color: var(--c-accent); cursor: pointer; font-weight: 600; }
  .rule-details p { margin: .6rem 0 0; line-height: 1.55; }
</style>
