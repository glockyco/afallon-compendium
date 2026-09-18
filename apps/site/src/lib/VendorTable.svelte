<script lang="ts">
  import type { PublicKindEntry, VendorRow } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import Requirements from './Requirements.svelte';

  export let rows: VendorRow[];
  export let registry: PublicKindEntry[];
  export let heading = 'Vendor stock';
  export let counterpartLabel = 'Entity';
  export let limit: number | undefined = undefined;
  $: visible = compactRows(rows, limit);

  function compactRows(allRows: VendorRow[], maximum: number | undefined): VendorRow[] {
    if (maximum === undefined) return allRows;
    const compact = allRows.slice(0, maximum);
    if (compact.some((row) => row.requirements.length > 0)) return compact;
    const conditional = allRows.find((row) => row.requirements.length > 0);
    if (conditional && compact.length === maximum) compact[compact.length - 1] = conditional;
    return compact;
  }
</script>

{#if visible.length > 0}
  <section><h2>{heading}</h2><div class="scroll"><table><thead><tr><th>{counterpartLabel}</th><th>Price</th><th>Unlock requirement</th></tr></thead><tbody>{#each visible as row}<tr><td><EntityLink ref={row.counterpart} {registry} /></td><td>{row.price.amount} <EntityLink ref={row.price.currency} {registry} /></td><td><Requirements requirements={row.requirements} {registry} emptyExplanation="Unlock requirement unknown" /></td></tr>{/each}</tbody></table></div></section>
{/if}

<style>
  section { margin-top: 1.25rem; } h2 { margin: 0 0 .55rem; color: #eee9dd; font: 600 1rem/1.3 Georgia, serif; } .scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: .82rem; } th, td { padding: .55rem; border-bottom: 1px solid #3b3c38; text-align: left; vertical-align: top; }
  th { color: #bdb8ad; font-size: .68rem; letter-spacing: .06em; text-transform: uppercase; }
</style>
