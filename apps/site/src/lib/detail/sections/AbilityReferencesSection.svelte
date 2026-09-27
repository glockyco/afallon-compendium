<script lang="ts">
  import type { AbilityVersion, PublicKindEntry } from '@afallon/contracts/public';
  import LinkGrid from '../LinkGrid.svelte';
  import Section from '../Section.svelte';

  export let versions: AbilityVersion[];
  export let relation: 'usedBy' | 'taughtBy';
  export let registry: PublicKindEntry[];

  $: groups = versions.map((version, index) => ({ refs: version[relation], index })).filter((group) => group.refs.length);
  $: count = groups.reduce((total, group) => total + group.refs.length, 0);
  $: title = relation === 'usedBy' ? 'Used by' : 'Taught by';
  $: id = relation === 'usedBy' ? 'used-by' : 'taught-by';
  $: icon = relation === 'usedBy' ? 'people' as const : 'teach' as const;
</script>

{#if count}
  <Section {id} {title} {icon} {count}>
    <div class="groups">
      {#each groups as group}
        <div>
          {#if versions.length > 1}<h3>Version {group.index + 1} <span>{group.refs.length}</span></h3>{/if}
          <LinkGrid refs={group.refs} {registry} />
        </div>
      {/each}
    </div>
  </Section>
{/if}

<style>
  .groups { display: grid; gap: 1rem; }
  h3 { margin: 0 0 .5rem; color: var(--c-accent-strong); font: 600 .88rem/1.3 var(--c-serif); }
  h3 span { margin-left: .25rem; color: var(--c-text-mute); font: 500 .78rem/1 Inter, ui-sans-serif, system-ui, sans-serif; font-variant-numeric: tabular-nums; }
</style>
