<script lang="ts">
  import { base } from '$app/paths';
  import type { AbilityVersion, ArtRef, PublicKindEntry } from '@afallon/contracts/public';
  import EntityLink from '../../EntityLink.svelte';
  import { formatNumber } from '../../format';
  import NativeText from '../../NativeText.svelte';
  import Requirements from '../../Requirements.svelte';
  import CompareTable from '../CompareTable.svelte';
  import LinkGrid from '../LinkGrid.svelte';
  import Section from '../Section.svelte';
  import AppliedEffects from './AppliedEffects.svelte';

  // The versions of an ability compared side by side: one column per version and one row per fact. Requirements and
  // learners get a row only when the versions differ in them, because the page header already states a shared value.
  // Effects and users get a row when any version has them.
  export let versions: AbilityVersion[];
  export let registry: PublicKindEntry[];
  /** Shows every user of every version, for the Show all link of the page answer. */
  export let showAllUsers = false;
  /** The ability's own icon, which stands for a version without an icon when another version has one. */
  export let icon: ArtRef | undefined = undefined;

  type Version = { version: AbilityVersion; index: number };
  const differ = (values: string[]) => new Set(values).size > 1;
  const users = (version: AbilityVersion) => [...version.usedBy, ...version.usedByItems];

  $: rows = versions.map((version, index): Version => ({ version, index }));
  $: facts = [
    { id: 'text', label: 'What It Does' },
    ...(versions.some((version) => version.appliedEffects.length) ? [{ id: 'effects', label: 'Applies' }] : []),
    ...(differ(versions.map((version) => JSON.stringify(version.useRequirements))) ? [{ id: 'requirements', label: 'Requirements' }] : []),
    ...(differ(versions.map((version) => version.learnedBy.map((entry) => entry.class.key).join())) ? [{ id: 'learnedBy', label: 'Learned By' }] : []),
    ...(versions.some((version) => users(version).length) ? [{ id: 'users', label: 'Used By' }] : []),
  ];
  $: icons = versions.some((version) => version.icon);
</script>

{#if versions.length > 1}
  <Section id="versions" title="Versions" count={versions.length} line={`The game has ${formatNumber(versions.length)} versions of this ability. They differ in these facts.`}>
    <CompareTable items={rows} {facts} has={() => true} anchor={(row) => row.version.anchor} label="Versions" minColumn={190} align="start">
      <svelte:fragment slot="head" let:item>
        {@const art = item.version.icon ?? icon}
        {#if icons && art}<img src={`${base}/data/${art.url}`} width={art.width} height={art.height} alt="" loading="lazy" />{/if}Version {item.index + 1}
      </svelte:fragment>
      <svelte:fragment slot="cell" let:item let:fact>
        {@const version = item.version}
        {#if fact === 'text'}
          <div class="ranks">
            {#each version.ranks as rank}
              <div>{#if version.ranks.length > 1}<h3>Rank {rank.rankIndex + 1}</h3>{/if}<NativeText lines={rank.lines} /></div>
            {/each}
          </div>
        {:else if fact === 'effects'}
          {#if version.appliedEffects.length}<AppliedEffects rows={version.appliedEffects} {registry} heading={false} />{:else}<span class="none">None</span>{/if}
        {:else if fact === 'requirements'}
          {#if version.useRequirements.length}<Requirements requirements={version.useRequirements} {registry} kindLabels={false} />{:else}<span class="none">None</span>{/if}
        {:else if fact === 'learnedBy'}
          {#if version.learnedBy.length}<ul>{#each version.learnedBy as entry}<li><EntityLink ref={entry.class} {registry} /></li>{/each}</ul>{:else}<span class="none">None</span>{/if}
        {:else if fact === 'users'}
          {#if users(version).length}<LinkGrid refs={users(version)} {registry} expanded={showAllUsers} />{:else}<span class="none">None</span>{/if}
        {/if}
      </svelte:fragment>
    </CompareTable>
  </Section>
{/if}

<style>
  /* The icon sits inline and centers on the label's letters. */
  img { width: 2rem; height: 2rem; margin-right: .5rem; border: 1px solid var(--c-line); border-radius: var(--c-radius-sm); object-fit: cover; vertical-align: middle; }
  .ranks { display: grid; gap: .75rem; }
  h3 { margin: 0 0 .2rem; color: var(--c-accent-strong); font: 600 var(--c-text-body)/1.3 var(--c-serif); }
  ul { display: grid; gap: .3rem; margin: 0; padding: 0; list-style: none; }
  .none { color: var(--c-text-mute); }
</style>
