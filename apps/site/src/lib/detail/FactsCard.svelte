<script lang="ts" context="module">
  import type { EntityRef } from '@afallon/contracts/public';
  /**
   * One fact of an entity. `href` links the value to the section behind it, `note` qualifies it, and `guide` links the
   * guide section that explains how the game computes it.
   */
  export interface Fact { label: string; value: string; note?: string; href?: string; guide?: { guide: EntityRef; section: string } }
</script>

<script lang="ts">
  import FactList from './FactList.svelte';
  import FactRow from './FactRow.svelte';
  import SideCard from './SideCard.svelte';

  // The card at the top of a page's side column: the facts that identify the entity and size it up. Rows that link
  // other entities follow in the slot.
  export let facts: Fact[];
  export let title: string | undefined = undefined;
</script>

{#if facts.length || $$slots.default}
  <SideCard {title}>
    <FactList>
      {#each facts as fact}<FactRow label={fact.label} note={fact.note} guide={fact.guide}>{#if fact.href}<a class="c-link value-link" href={fact.href}>{fact.value}</a>{:else}{fact.value}{/if}</FactRow>{/each}
      <slot />
    </FactList>
    <slot name="after" />
  </SideCard>
{/if}

<style>
  .value-link { color: inherit; text-decoration-color: color-mix(in srgb, currentcolor 40%, transparent); }
  .value-link:hover { color: var(--c-accent); }
</style>
