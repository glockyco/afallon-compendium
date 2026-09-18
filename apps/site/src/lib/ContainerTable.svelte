<script lang="ts">
  import { base } from '$app/paths';
  import type { ContainerRow, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import MissingValue from './MissingValue.svelte';
  import Requirements from './Requirements.svelte';

  export let rows: ContainerRow[];
  export let registry: PublicKindEntry[];
  export let heading = 'Containers';
  export let itemKey: string;
  export let limit: number | undefined = undefined;
  $: visible = limit === undefined ? rows : rows.slice(0, limit);
  const quantity = (row: ContainerRow) => row.min === undefined && row.max === undefined ? null : row.min === row.max || row.max === undefined ? String(row.min) : `${row.min ?? 0}–${row.max}`;
</script>

{#if visible.length > 0}
  <section><h2>{heading}</h2><div class="scroll"><table><thead><tr><th>Container</th><th>Quantity</th><th>Chance</th><th>Requirements</th><th>Locations</th></tr></thead><tbody>{#each visible as row}<tr><td>{#if row.counterpart}<EntityLink ref={row.counterpart} {registry} />{:else}{row.label}{/if}</td><td>{#if quantity(row) === null}<MissingValue explanation="No quantity is published" />{:else}{quantity(row)}{/if}</td><td>{#if row.chance === undefined}<MissingValue explanation="Not measured for this build" />{:else}{row.chance}%{/if}</td><td><Requirements requirements={row.requirements} {registry} /></td><td>{#if row.placementCount > 0}<a href={`${base}/?item=${encodeURIComponent(itemKey)}`}>{row.placementCount} {row.placementCount === 1 ? 'location' : 'locations'}</a>{:else}<MissingValue explanation="No location is published" />{/if}</td></tr>{/each}</tbody></table></div></section>
{/if}

<style>
  section { margin-top: 1.25rem; } h2 { margin: 0 0 .55rem; color: #eee9dd; font: 600 1rem/1.3 Georgia, serif; } .scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: .82rem; } th, td { padding: .55rem; border-bottom: 1px solid #3b3c38; text-align: left; vertical-align: top; }
  th { color: #bdb8ad; font-size: .68rem; letter-spacing: .06em; text-transform: uppercase; }
  a { color: #d9bd79; text-underline-offset: .18em; }
</style>
