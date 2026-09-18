<script lang="ts">
  import type { PublicKindEntry, RecipeRow } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';

  export let rows: RecipeRow[];
  export let registry: PublicKindEntry[];
  export let heading = 'Recipes';
  export let counterpartLabel = 'Entity';
  export let limit: number | undefined = undefined;
  $: visible = limit === undefined ? rows : rows.slice(0, limit);
</script>

{#if visible.length > 0}
  <section><h2>{heading}</h2><div class="scroll"><table><thead><tr><th>{counterpartLabel}</th><th>Quantity</th></tr></thead><tbody>{#each visible as row}<tr><td><EntityLink ref={row.counterpart} {registry} /></td><td>{row.count}</td></tr>{/each}</tbody></table></div></section>
{/if}

<style>
  section { margin-top: 1.25rem; } h2 { margin: 0 0 .55rem; color: #eee9dd; font: 600 1rem/1.3 Georgia, serif; } .scroll { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: .82rem; } th, td { padding: .55rem; border-bottom: 1px solid #3b3c38; text-align: left; vertical-align: top; }
  th { color: #bdb8ad; font-size: .68rem; letter-spacing: .06em; text-transform: uppercase; }
</style>
