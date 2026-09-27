<script lang="ts">
  import { base } from '$app/paths';
  import type { AbilityVersion } from '@afallon/contracts/public';
  import NativeText from '../../NativeText.svelte';
  import { planColumns, type RelationColumn } from '../relation-table';
  import RelationTable from '../RelationTable.svelte';
  import Section from '../Section.svelte';

  export let versions: AbilityVersion[];

  type VersionRow = { version: AbilityVersion; index: number };
  const columns: RelationColumn<VersionRow>[] = [
    { id: 'version', label: 'Version', value: (row) => `Version ${row.index + 1}` },
    { id: 'text', label: 'Text', value: (row) => row.version.ranks.flatMap((rank) => rank.lines.flatMap((line) => line.spans.map((span) => span.text))).join(' ') },
    { id: 'users', label: 'Users', numeric: true, value: (row) => row.version.usedBy.length },
  ];

  $: rows = versions.map((version, index) => ({ version, index }));
  $: plan = planColumns(columns, rows);
</script>

{#if versions.length > 1}
  <Section id="versions" title="Versions" icon="variants" count={rows.length}>
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
        {:else if column === 'users'}{row.version.usedBy.length}{/if}
      </svelte:fragment>
    </RelationTable>
  </Section>
{/if}

<style>
  /* The icon sits inline and centers on the letters, so the name keeps the text baseline that the other cells align to. */
  .version { white-space: nowrap; }
  img { width: 2rem; height: 2rem; margin-right: .5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); object-fit: cover; vertical-align: middle; }
  .ranks { display: grid; gap: .75rem; }
  h3 { margin: 0 0 .2rem; color: var(--c-accent-strong); font: 600 .82rem/1.3 var(--c-serif); }
</style>
