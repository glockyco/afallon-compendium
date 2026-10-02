<script lang="ts">
  import { base } from '$app/paths';
  import type { AbilityVersion, PublicKindEntry } from '@afallon/contracts/public';
  import NativeText from '../../NativeText.svelte';
  import AppliedEffects from './AppliedEffects.svelte';
  import LinkGrid from '../LinkGrid.svelte';
  import Requirements from '../../Requirements.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let versions: AbilityVersion[];
  export let registry: PublicKindEntry[];
  export let showAllUsers = false;

  type VersionRow = { version: AbilityVersion; index: number };
  const columns: RelationColumn<VersionRow>[] = [
    { id: 'version', label: 'Version', value: (row) => `Version ${row.index + 1}` },
    { id: 'text', label: 'Text', value: (row) => row.version.ranks.flatMap((rank) => rank.lines.flatMap((line) => line.spans.map((span) => span.text))).join(' ') },
    // The hero shows the requirements of the main version, so a column that every version shares leaves the table.
    { id: 'requirements', label: 'Requirements', value: (row) => row.version.useRequirements.flatMap((group) => group.requirements.map((requirement) => requirement.label)).join(', ') || undefined, whenShared: () => 'omit' },
    { id: 'users', label: 'Users', value: (row) => row.version.usedBy.length + row.version.usedByItems.length || undefined },
  ];

  $: rows = versions.map((version, index) => ({ version, index }));
  $: plan = planColumns(columns, rows);
</script>

{#if versions.length > 1}
  <Section id="versions" title="Versions" count={rows.length}>
    <RelationTable columns={plan.columns} {rows} label="Versions" rowAnchors={(row) => [row.version.anchor]}>
      <svelte:fragment slot="cell" let:row let:column>
        {#if column === 'version'}
          <span class="version">{#if row.version.icon}<img src={`${base}/data/${row.version.icon.url}`} width={row.version.icon.width} height={row.version.icon.height} alt="" loading="lazy" />{/if}Version {row.index + 1}</span>
        {:else if column === 'text'}
          <div class="ranks">
            {#each row.version.ranks as rank}
              <div>{#if row.version.ranks.length > 1}<h3>Rank {rank.rankIndex + 1}</h3>{/if}<NativeText lines={rank.lines} /></div>
            {/each}
          </div>
          <AppliedEffects rows={row.version.appliedEffects} {registry} />
        {:else if column === 'requirements'}<Requirements requirements={row.version.useRequirements} {registry} kindLabels={false} />
        {:else if column === 'users'}
          {#if row.version.usedBy.length + row.version.usedByItems.length}
            <details class="users" open={showAllUsers}>
              <summary>{row.version.usedBy.length + row.version.usedByItems.length} users</summary>
              {#if row.version.usedBy.length}<h3>NPCs</h3><LinkGrid refs={row.version.usedBy} {registry} />{/if}
              {#if row.version.usedByItems.length}<h3>Items</h3><LinkGrid refs={row.version.usedByItems} {registry} />{/if}
            </details>
          {:else}0{/if}
        {/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}

<style>
  /* The icon sits inline and centers on the letters, so the name keeps the text baseline that the other cells align to. */
  .version { white-space: nowrap; }
  img { width: 2rem; height: 2rem; margin-right: .5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); object-fit: cover; vertical-align: middle; }
  .ranks { display: grid; gap: .75rem; }
  h3 { margin: 0 0 .2rem; color: var(--c-accent-strong); font: 600 var(--c-text-body)/1.3 var(--c-serif); }
  .users { min-width: 0; text-align: left; }
  .users summary { min-height: 1.5rem; cursor: pointer; color: var(--c-accent-strong); }
  .users :global(.link-grid) { grid-template-columns: minmax(0, 1fr); margin: .5rem 0 0; }
</style>
