<script lang="ts">
  import type { PublicDetailSection, PublicEntity } from '../../../pipeline/public-contracts';

  export let sections: PublicDetailSection[];
  export let entities: ReadonlyMap<string, PublicEntity>;
  export let onEntity: (entityKey: string, origin: HTMLElement) => void;
  export let onPlacement: (placementId: string, origin: HTMLElement) => void;
</script>

{#each sections as section}
  <section class="detail-section">
    <h3>{section.title}</h3>
    <dl>
      {#each section.rows as row}
        <div>
          <dt>{row.label}</dt>
          <dd>
            {#if row.value.trim()}{row.value}{/if}
            {#if row.entityKey}
              <button type="button" on:click={(event) => onEntity(row.entityKey!, event.currentTarget)}>
                {entities.get(row.entityKey)?.name ?? row.entityKey}
              </button>
            {/if}
            {#each row.placementIds ?? [] as placementId}
              <button type="button" on:click={(event) => onPlacement(placementId, event.currentTarget)}>Open linked location</button>
            {/each}
          </dd>
        </div>
      {/each}
    </dl>
  </section>
{/each}

<style>
  .detail-section { margin: .8rem 0; }
  h3 { margin: 0 0 .4rem; color: #d7d2c6; font-size: .75rem; letter-spacing: .04em; }
  dl { margin: 0; border-top: 1px solid #353633; }
  dl > div { display: grid; grid-template-columns: minmax(80px, .7fr) minmax(0, 1.3fr); gap: .6rem; padding: .43rem 0; border-bottom: 1px solid #30312f; font-size: .73rem; line-height: 1.35; }
  dt { color: #918f87; }
  dd { margin: 0; color: #e2ded4; overflow-wrap: anywhere; }
  button { border: 0; padding: 0; margin-left: .35rem; background: none; color: #d5b978; font-size: .7rem; text-decoration: underline; text-underline-offset: 2px; }
  button:focus-visible { outline: 2px solid #d5b978; outline-offset: 2px; }
</style>
