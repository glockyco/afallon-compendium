<script lang="ts">
  import type { AbilityVersion, PublicKindEntry, Ref } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { nameOf } from '../../format';
  import { shownRowCount, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';
  import StaticMore from '../StaticMore.svelte';

  export let versions: AbilityVersion[];
  export let relation: 'usedBy' | 'usedByItems' | 'taughtBy';
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let onShowAll: (() => void) | undefined = undefined;
  let expanded = false;

  const columns: RelationColumn<Ref>[] = [{ id: 'entity', label: 'Name', value: nameOf, sort: nameOf }];
  $: groups = versions.map((version, index) => ({ refs: version[relation], index })).filter((group) => group.refs.length);
  $: refs = groups.flatMap((group) => group.refs);
  $: count = refs.length;
  // The preview follows the rule of every list.
  $: previewCount = shownRowCount(count, false);
  $: title = relation === 'usedBy' ? 'Used by' : relation === 'usedByItems' ? 'Used by items' : 'Taught by';
  $: id = relation === 'usedBy' ? 'used-by' : relation === 'usedByItems' ? 'used-by-items' : 'taught-by';
</script>

{#if count}
  {#if compact}<div {id} class="compact"><h3>{title} {count}{#if refs.every((ref) => ref.key !== null && ref.kind === 'npcs')}{' NPCs'}{/if}</h3>
    <ul class="preview">{#each refs.slice(0, expanded ? count : previewCount) as ref}<li><EntityLink {ref} {registry} /></li>{/each}</ul>
    {#if !expanded && previewCount < count}
      <StaticMore count={count - previewCount}>
        <svelte:fragment slot="control">
          <!-- One version lists everything here. Several versions compare their users in the Versions table. -->
          {#if versions.length > 1}<a class="c-link all" href="#versions" on:click={() => onShowAll?.()}>Show All {count}</a>
          {:else}<button type="button" class="c-link all" on:click={() => (expanded = true)}>Show All {count}</button>{/if}
        </svelte:fragment>
        <ul class="preview">{#each refs.slice(previewCount) as ref}<li><EntityLink {ref} {registry} /></li>{/each}</ul>
      </StaticMore>
    {/if}
  </div>
  {:else}<Section {id} {title} {count}><div class="groups">{#each groups as group}<div>{#if versions.length > 1}<h3>Version {group.index + 1} <span>{group.refs.length}</span></h3>{/if}<RelationTable {columns} rows={group.refs} label={`${title}${versions.length > 1 ? `, version ${group.index + 1}` : ''}`}><svelte:fragment slot="cell" let:row><EntityLink ref={row} {registry} /></svelte:fragment></RelationTable></div>{/each}</div></Section>{/if}
{/if}

<style>
  .groups { display: grid; gap: 1rem; }
  h3 { margin-bottom: .5rem; color: var(--c-text-strong); font-size: 1rem; font-weight: 700; }
  h3 span { margin-left: .25rem; color: var(--c-text-mute); font-size: .875rem; font-weight: 500; }
  .compact { padding-top: var(--c-space-block); border-top: 1px solid var(--c-line-soft); }
  .preview { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .4rem .8rem; padding: 0; list-style: none; }
  .preview li { min-width: 0; }
  button.all { padding: 0; border: 0; background: none; font: inherit; cursor: pointer; }
  .all { display: inline-flex; align-items: center; min-height: 1.75rem; margin-top: .6rem; }
  @media (max-width: 640px) { .preview { grid-template-columns: minmax(0, 1fr); } }
</style>
