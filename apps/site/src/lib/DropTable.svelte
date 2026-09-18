<script lang="ts">
  import type { DropRow, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';
  import Requirements from './Requirements.svelte';

  export let rows: DropRow[];
  export let registry: PublicKindEntry[];
  export let heading = 'Drops';
  export let counterpartLabel = 'Entity';
  export let limit: number | undefined = undefined;

  $: visible = limit === undefined ? rows : rows.slice(0, limit);
  const quantity = (row: DropRow) => row.min === undefined && row.max === undefined ? null : row.min === row.max || row.max === undefined ? String(row.min) : `${row.min ?? 0}–${row.max}`;
</script>

{#if visible.length > 0}
  <section><h2>{heading}</h2><div class="scroll"><table><thead><tr><th>{counterpartLabel}</th><th>Quantity</th><th>Chance</th><th>Level</th><th>Requirements</th></tr></thead><tbody>{#each visible as row}<tr><td><EntityLink ref={row.counterpart} {registry} /></td><td>{#if quantity(row) === null}<MissingValue explanation="No quantity is published" />{:else}{quantity(row)}{/if}</td><td>{#if row.chance === undefined}<MissingValue explanation="Not measured for this build" />{:else}{row.chance}%{/if}</td><td>{#if row.levelBand}{row.levelBand.min}–{row.levelBand.max}{:else}<MissingValue explanation="No level range is published" />{/if}</td><td><Requirements requirements={row.requirements} {registry} /></td></tr>{/each}</tbody></table></div></section>
{/if}

<style>
  section { margin-top: 1.25rem; }
  h2 { margin: 0 0 .55rem; color: #eee9dd; font: 600 1rem/1.3 Georgia, serif; }
  .scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: .82rem; }
  th, td { padding: .55rem; border-bottom: 1px solid #3b3c38; text-align: left; vertical-align: top; }
  th { color: #bdb8ad; font-size: .68rem; letter-spacing: .06em; text-transform: uppercase; }
</style>
