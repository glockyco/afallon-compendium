<script lang="ts">
  import type { PublicKindEntry, PublicProperty } from '@afallon/contracts/public';
  import Card from './Card.svelte';
  import EntityHeader, { type HeaderFact } from './EntityHeader.svelte';
  import EntityLink from './EntityLink.svelte';
  import Fact from './Fact.svelte';
  import FactGrid from './FactGrid.svelte';
  import LocationList from './LocationList.svelte';
  import MissingValue from './MissingValue.svelte';
  import Price from './Price.svelte';
  import { formatNumber } from './format';

  export let document: PublicProperty;
  export let registry: PublicKindEntry[];
  export let showRelations = false;
  export let limit: number | undefined = undefined;

  $: facts = document.facts;
  $: headerFacts = [
    ...(document.place && document.place.key !== null ? [{ label: 'Place', value: document.place.name }] : []),
    ...(facts.income !== undefined ? [{ label: 'Income', value: formatNumber(facts.income) }] : []),
  ] satisfies HeaderFact[];
</script>

<article class="document">
  <EntityHeader
    name={document.ref.name}
    art={document.art.artwork ?? document.art.icon ?? document.ref.icon}
    fallbackIcon={registry.find((entry) => entry.kind === 'properties')?.icon}
    facts={headerFacts}
    description={document.description}
  />

  <div class="c-stack">
    <div class="c-card-grid">
      <Card title="Facts">
        <FactGrid>
          <Fact label="Place">{#if document.place}<EntityLink ref={document.place} {registry} />{:else}<MissingValue explanation="No place is published" />{/if}</Fact>
          {#if facts.price}<Fact label="Price"><Price price={facts.price} showName /></Fact>{/if}
        </FactGrid>
      </Card>
    </div>
    {#if showRelations}<LocationList locations={document.locations} entityKey={document.ref.key} {limit} />{/if}
  </div>
</article>
