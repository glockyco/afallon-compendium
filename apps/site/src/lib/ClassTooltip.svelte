<script lang="ts">
  import type { PublicClass, PublicKindEntry } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import TalentEffect from './TalentEffect.svelte';
  import TooltipRequirements from './TooltipRequirements.svelte';

  export let document: PublicClass;
  export let registry: PublicKindEntry[];
  /** The anchor of a talent row. With it, the tooltip shows that talent instead of the class. */
  export let variant: string | undefined = undefined;

  $: found = variant === undefined ? undefined : document.trees.flatMap((tree) => tree.rows.map((row) => ({ tree, row }))).find(({ row }) => row.anchor === variant);
  $: classFacts = [
    ...(document.facts.races.length ? [{ label: 'Races', value: document.facts.races.join(', ') }] : []),
    { label: 'Talent trees', value: String(document.trees.length) },
  ] satisfies HeaderFact[];
</script>

<article>
  {#if found}
    <EntityHeader name={found.row.name} facts={[{ label: 'Talent', value: `${found.tree.name}, tier ${found.row.tier}` }, { label: 'Class', value: document.ref.name }, { label: 'Ranks', value: String(found.row.ranks) }]} compact />
    <div class="effect"><TalentEffect row={found.row} /></div>
    {#if found.row.requirements.length}<TooltipRequirements requirements={found.row.requirements} {registry} />{/if}
  {:else}
    <EntityHeader name={document.ref.name} art={document.ref.icon} facts={classFacts} description={document.description} compact />
  {/if}
</article>

<style>
  .effect { margin-top: .5rem; font-size: .82rem; }
</style>
