<script lang="ts">
  import type { PublicClass } from '@afallon/contracts/public';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import { nameOf } from './format';

  export let document: PublicClass;
  /** The anchor of a talent row. With it, the tooltip shows that talent instead of the class. */
  export let variant: string | undefined = undefined;

  $: found = variant === undefined ? undefined : document.trees.flatMap((tree) => tree.rows.map((row) => ({ tree, row }))).find(({ row }) => row.anchor === variant);
  $: classFacts = [
    ...(document.facts.races.length ? [{ label: 'Races', value: document.facts.races.map(nameOf).join(', ') }] : []),
    ...(document.trees.length ? [{ label: 'Talent trees', value: document.trees.map((tree) => tree.name).join(', ') }] : []),
    ...(document.facts.weapons.length ? [{ label: 'Weapons', value: document.facts.weapons.join(', ') }] : []),
  ] satisfies HeaderFact[];
</script>

<article>
  {#if found}
    <EntityHeader name={found.row.name} facts={[{ label: 'Talent', value: `${found.tree.name}, tier ${found.row.tier}` }, { label: 'Class', value: document.ref.name }, { label: 'Ranks', value: String(found.row.ranks) }]} compact />
  {:else}
    <EntityHeader name={document.ref.name} art={document.ref.icon} facts={classFacts} description={document.description} compact />
  {/if}
</article>

