<script lang="ts">
  import type { PublicKindEntry, PublicProperty } from '@afallon/contracts/public';
  import EntityLink from './EntityLink.svelte';
  import FactCardFrame from './FactCardFrame.svelte';
  import LocationList from './LocationList.svelte';
  import MissingValue from './MissingValue.svelte';

  export let document: PublicProperty;
  export let registry: PublicKindEntry[];
  export let compact = false;
  export let showRelations = false;
  export let limit: number | undefined = undefined;
  $: facts = document.facts;
</script>

<FactCardFrame name={document.ref.name} description={document.description} art={document.art.artwork ?? document.art.icon ?? document.ref.icon} fallbackIcon={registry.find((entry) => entry.kind === 'properties')?.icon} {compact}>
  <dl class="facts">
    <div><dt>Place</dt><dd>{#if document.place}<EntityLink ref={document.place} {registry} />{:else}<MissingValue explanation="No location is published" />{/if}</dd></div>
    {#if facts.income !== undefined}<div><dt>Income</dt><dd>{facts.income}</dd></div>{/if}
    {#if facts.price}<div><dt>Price</dt><dd>{facts.price.amount} <EntityLink ref={facts.price.currency} {registry} /></dd></div>{/if}
  </dl>
  {#if showRelations}<LocationList locations={document.locations} entityKey={document.ref.key} {limit} />{/if}
</FactCardFrame>
