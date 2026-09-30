<script lang="ts">
  import type { PlacedRule, PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber, nameOf } from '../../format';
  import RulePhrase from './RulePhrase.svelte';

  export let rules: PlacedRule[];
  export let registry: PublicKindEntry[];
  export let skill: Ref | undefined = undefined;

  $: groups = [...new Set(rules.map((entry) => entry.rule.section))].map((name) => {
    const entries = rules.filter((entry) => entry.rule.section === name);
    const guides = [...new Map(entries.flatMap((entry) => entry.guide ? [[entry.guide.key, entry.guide] as const] : [])).values()];
    return { name, entries, guides };
  });
  const title = (value: string) => value[0]!.toUpperCase() + value.slice(1).replaceAll('-', ' ');
  const percent = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
</script>

{#each groups as group}
      <div class="rule-group">
        <h3>{title(group.name)}</h3>
        <ul>
          {#each group.entries as entry (entry.rule.id)}
            <li>
              {#if entry.rule.status === 'unknown'}<strong>Unknown</strong>{/if}
              <RulePhrase rule={entry.rule} {registry} />
              {#if entry.levelChances?.length}
                <ul class="chances">{#each entry.levelChances as value}<li>At {skill ? nameOf(skill) : 'skill'} level {formatNumber(value.level)}: {percent.format(value.chance)}%</li>{/each}</ul>
              {/if}
            </li>
          {/each}
        </ul>
        {#if group.guides.length}<p class="guide">More in {#each group.guides as guide, index}{index > 0 ? ', ' : ''}<EntityLink ref={guide} {registry} />{/each}</p>{/if}
      </div>
{/each}

<style>
  .rule-group + .rule-group { margin-top: 1rem; }
  h3 { margin: 0 0 .4rem; color: var(--c-text-strong); font: 600 var(--c-text-lead)/1.3 var(--c-serif); }
  ul { display: grid; gap: .65rem; margin: 0; padding-left: 1.3rem; line-height: 1.55; }
  .chances { gap: .15rem; margin: .35rem 0 0; }
  .guide { margin: .5rem 0 0; font-size: var(--c-text-small); }
  strong { margin-right: .4rem; text-decoration: underline; text-decoration-color: var(--c-warning-line); }
</style>
