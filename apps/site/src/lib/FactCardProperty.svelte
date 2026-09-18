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
    <div><dt>Income</dt><dd>{#if facts.income !== undefined}{facts.income}{:else}<MissingValue explanation="No income is published" />{/if}</dd></div>
    <div><dt>Price</dt><dd>{#if facts.price}{facts.price.amount} <EntityLink ref={facts.price.currency} {registry} />{:else}<MissingValue explanation="No price is published" />{/if}</dd></div>
  </dl>
  {#if showRelations}<LocationList locations={document.locations} entityKey={document.ref.key} {limit} />{/if}
</FactCardFrame>
