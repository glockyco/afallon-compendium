<script lang="ts">
  import type { PublicKindEntry } from '@afallon/contracts/public';
  import type { PlannerBuild, TalentPurchase } from '../build';
  import type { TalentEvaluator } from '../talents';
  import SideCard from '../../detail/SideCard.svelte';
  import EntityLink from '../../EntityLink.svelte';
  import { identityRef, requirementLabel, statusText } from './workspace';
  export let evaluator: TalentEvaluator;
  export let build: PlannerBuild;
  export let selected: TalentPurchase | null;
  export let registry: PublicKindEntry[];
  export let busy = false;
  export let previewMode = false;
  export let add: () => void;
  export let remove: () => void;
  $: scope = evaluator.scope(build);
  $: entry = selected ? scope.nodes.get(`${selected.tree}/${selected.node}`) : undefined;
  $: allocation = selected ? evaluator.evaluate(build, { mode: previewMode ? 'preview' : 'committed' }).allocations.find(row => row.tree === selected?.tree && row.node === selected.node) : undefined;
  $: next = selected ? evaluator.inspectNextRank(build, selected) : null;
  $: nextPointName = evaluator.payload.pointTypes.find(row => row.key === next?.pointType)?.name;
  $: selectedRank = allocation?.rank ?? entry?.node.defaultRank;
  $: rank = entry?.node.ranks.find(row => row.rank === (selectedRank || 1));
</script>

<SideCard title="Talent Inspector">
  {#if entry && next}
    <h3><EntityLink ref={identityRef(entry.node.target)} {registry} /></h3>
    <p>{entry.tree.name} · Selected rank {selectedRank ?? 'not verified'} of {entry.node.rankLimit ?? 'not verified'}</p>
    <p class="status">{allocation ? statusText(allocation.status) : 'No purchased ranks'} · {allocation?.mode === 'preview' ? 'Preview' : 'Selected ranks'}</p>
    {#if rank?.text.length}<div class="rank-text">{#each rank.text.filter(Boolean) as line}<p>{line}</p>{/each}</div>{/if}
    <div class="purchase">
      <h4>Next Rank</h4>
      <p>{next.rank ?? 'Rank not verified'} · {next.cost === null ? 'Cost not verified' : `${next.cost} ${next.cost === 1 && nextPointName === 'Talent Points' ? 'Talent Point' : nextPointName ?? 'points (type not verified)'}`}</p>
      <p class="status">Preview · {statusText(next.status)}</p>
      <h4>Purchase Requirements</h4>
      {#if next.requirements.length}
        <ul class="requirements">{#each next.requirements as row}
          <li><span>{requirementLabel(row.raw, row.target ? scope.targets.get(row.target)?.[0]?.node : undefined)}</span><small>{row.optional ? 'Optional alternative' : 'Required'} · {statusText(row.status)}</small></li>
        {/each}</ul>
      {:else}<p>{entry.node.purchaseCondition.groups === null ? 'Purchase requirements are not recorded.' : 'No purchase requirements.'}</p>{/if}
      {#each next.reasons as reason}<p class="reason">{reason.message}</p>{/each}
    </div>
    {#if allocation?.reasons.length}<div><h4>Selected Rank Checks</h4>{#each allocation.reasons as reason}<p class="reason">{reason.message}</p>{/each}</div>{/if}
    {#if rank?.useEffectCondition.groups?.some(group => group?.requirements.length)}
      <div><h4>Use and Effect Conditions</h4><p>These conditions apply when using the ability or effect, not when purchasing a rank.</p>
        <ul class="requirements">{#each rank.useEffectCondition.groups ?? [] as group}{#each group?.requirements ?? [] as condition}<li>{condition?.requirementType ?? 'Condition not recorded'} · Not Verified</li>{/each}{/each}</ul>
      </div>
    {/if}
    <!-- Keep action elements focusable as checks change; aria-disabled preserves keyboard focus through a write. -->
    <div class="actions"><button type="button" aria-label={`Remove a rank of ${entry.node.target.name}`} aria-disabled={busy || !allocation?.selectedIncrements} on:click={() => { if (!busy && allocation?.selectedIncrements) remove(); }}>− Remove Rank</button><button type="button" aria-label={`Add a rank of ${entry.node.target.name}`} aria-disabled={busy || next.status !== 'verified'} on:click={() => { if (!busy && next?.status === 'verified') add(); }}>+ Add Rank</button></div>
    <p>Removing a rank edits this plan, not an in-game refund. Later choices stay visible and are checked again.</p>
  {:else if selected && next}
    <h3>Unavailable Talent</h3>
    <p>Its original selection is kept, but the current class data does not resolve it. Copy Link retains it without omission.</p>
    <p>{allocation?.selectedIncrements ?? 'Not Verified'} selected increments · {statusText(next.status)}</p>
    {#each next.reasons as reason}<p>{reason.message}</p>{/each}
    <button type="button" aria-disabled={busy || !allocation?.selectedIncrements} on:click={() => { if (!busy && allocation?.selectedIncrements) remove(); }}>− Remove Rank</button>
    <p>Removing it deliberately changes the plan. Undo restores it.</p>
  {:else}<p>Select a talent in the web, list or allocation order. Its ranks and requirements appear here.</p>{/if}
</SideCard>
<style>
  h3 { margin: 0; font: 600 1.1rem/1.4 var(--c-serif); color: var(--c-text-strong); }
  h4 { margin: 0 0 .4rem; font-size: var(--c-text-label); color: var(--c-text-strong); }
  .purchase { border-top: 1px solid var(--c-line-soft); padding-top: .85rem; display: grid; gap: .6rem; }
  .status, small { font-size: var(--c-text-small); color: var(--c-text-mute); }
  .requirements { margin: 0; padding: 0; list-style: none; display: grid; gap: .55rem; }
  .requirements li { display: grid; gap: .2rem; padding-bottom: .45rem; border-bottom: 1px solid var(--c-line-soft); line-height: 1.5; }
  .rank-text { display: grid; gap: .35rem; }
  .reason { color: var(--c-text-dim); font-size: var(--c-text-small); }
  .actions { display: flex; flex-wrap: wrap; gap: .5rem; }
  button { min-height: 44px; padding: .5rem .7rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-2); color: var(--c-text-strong); font: inherit; cursor: pointer; }
  button:hover { border-color: var(--c-accent); } button[aria-disabled='true'] { opacity: .5; cursor: default; }
</style>
