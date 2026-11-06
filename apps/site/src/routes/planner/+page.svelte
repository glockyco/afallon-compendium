<script lang="ts">
  import { onMount } from 'svelte';
  import { afterNavigate } from '$app/navigation';
  import { base } from '$app/paths';
  import type { StaticPlanner, PlannerNode } from '@afallon/contracts/public';
  import PageShell from '$lib/PageShell.svelte';
  import SeoHead from '$lib/SeoHead.svelte';
  import DetailFrame from '$lib/detail/DetailFrame.svelte';
  import TitleBlock from '$lib/detail/TitleBlock.svelte';
  import SideCard from '$lib/detail/SideCard.svelte';
  import PlannerHelp from '$lib/planner/ui/PlannerHelp.svelte';
  import TabSet from '$lib/detail/TabSet.svelte';
  import RelationTable from '$lib/detail/RelationTable.svelte';
  import LevelControl from '$lib/detail/LevelControl.svelte';
  import TalentWeb from '$lib/detail/sections/TalentWeb.svelte';
  import EntityLink from '$lib/EntityLink.svelte';
  import { clientMapLoader } from '$lib/client-publication';
  import { characters, initializeCharacters } from '$lib/planner/characters-store';
  import { activeCharacter, type CharacterTarget, type MutationResult } from '$lib/planner/characters';
  import type { PlannerBuild, TalentPurchase } from '$lib/planner/build';
  import { createTalentEvaluator, talentNodeKey, type TalentEvaluator } from '$lib/planner/talents';
  import { addTalentRank, removeTalentRank, resetTalentTree, resetTalentBuild, earliestWithBaseTalentPoints } from '$lib/planner/talents-order';
  import { bindPreviewNavigation, createPlannerPreview, type PlannerPreview, type PreviewState, type ReplacementOffer } from '$lib/planner/preview';
  import { encodeBuildLink } from '$lib/planner/build-link';
  import TalentInspector from '$lib/planner/ui/TalentInspector.svelte';
  import CharacterTransfer from '$lib/planner/ui/CharacterTransfer.svelte';
  import { identityRef, newBuild, nodeAnchor, statusText, workspaceWeb } from '$lib/planner/ui/workspace';
  import type { PageData } from './$types';
  export let data: PageData;
  let payload: StaticPlanner | null = null;
  let evaluator: TalentEvaluator | null = null;
  let preview: PlannerPreview | null = null;
  let previewState: PreviewState | null = null;
  let loadError = '';
  let message = '';
  let busy = false;
  let setup = false;
  let setupName = '';
  let setupRace = '';
  let setupClass = '';
  let setupLevel = 1;
  let editName = '';
  let namedCharacter = '';
  let adoptionName = '';
  let selected: TalentPurchase | null = null;
  let selectedTree = '';
  let replacement: ReplacementOffer | null = null;
  let deleteTarget: CharacterTarget | null = null;
  let survivor = '';
  let confirmReset = false;
  let localDraft: { target: CharacterTarget; build: PlannerBuild } | null = null;
  let earliest = false;
  let viewLevel = 1;
  let layoutClass = '';
  let viewportWidth = 1440;
  let drawing: ReturnType<typeof workspaceWeb> | null = null;
  const columns = [
    { id: 'talent', label: 'Talent', value: (row: PlannerNode) => row.target.name },
    { id: 'rank', label: 'Rank', numeric: true, value: (row: PlannerNode) => row.rankLimit ?? undefined },
  ];
  $: active = activeCharacter($characters.collection);
  $: isPreview = previewState?.status === 'ready';
  $: build = isPreview ? previewState!.build : localDraft && localDraft.target.id === active?.id ? localDraft.build : active?.build ?? null;
  $: scope = build && evaluator ? evaluator.scope(build) : null;
  $: evaluation = build && evaluator ? evaluator.evaluate(build, { mode: isPreview || localDraft ? 'preview' : 'committed' }) : null;
  $: levelPlan = build && evaluator ? earliestWithBaseTalentPoints(evaluator, build, viewLevel) : null;
  $: visibleEvaluation = earliest && levelPlan && evaluator && build?.talents.kind === 'ordered'
    ? evaluator.evaluate({ ...build, level: levelPlan.level ?? build.level, points: [], talents: { kind: 'ordered', purchases: levelPlan.prefix } }, { mode: 'preview' }) : evaluation;
  $: race = payload?.races.find(row => row.key === build?.race);
  $: characterClass = payload?.classes.find(row => row.key === build?.class);
  $: offeredClasses = payload?.races.find(row => row.key === setupRace)?.offeredClasses ?? [];
  $: setupBounds = payload?.classes.find(row => row.key === setupClass)?.levels ?? { min: 1, max: 60 };
  $: if (payload && !setupRace) setupRace = payload.races[0]?.key ?? '';
  $: if (offeredClasses.length && !offeredClasses.some(row => row.key === setupClass)) setupClass = offeredClasses[0]?.key ?? '';
  $: if (scope && !scope.trees.some(row => row.key === selectedTree)) selectedTree = scope.trees[0]?.key ?? '';
  $: tree = scope?.trees.find(row => row.key === selectedTree);
  $: if (scope && evaluator && build && layoutClass !== build.class) {
    drawing = workspaceWeb(scope.trees, evaluator, build); layoutClass = build.class; selected = null;
  }
  $: ranks = new Map([
    ...[...(scope?.nodes.values() ?? [])].map(({ tree, node }) => [nodeAnchor({ tree: tree.key!, node: node.index }), String(node.defaultRank ?? '?')] as const),
    ...(visibleEvaluation?.allocations ?? []).map(row => [nodeAnchor(row), String(row.rank ?? '?')] as const),
  ]);
  $: highlighted = build && evaluator && selected ? new Set(evaluator.dependencyChain(build, selected).nodes.map(nodeAnchor)) : undefined;
  $: if (active && namedCharacter !== active.id) { namedCharacter = active.id; editName = active.name; }
  function startSetup() { setup = true; setupName = ''; setupLevel = $characters.collection.draft?.level ?? 1; replacement = null; message = ''; }
  function selectNode(row: TalentPurchase) { selected = row; selectedTree = row.tree; }
  function selectAnchor(anchor: string) {
    const row = scope && [...scope.nodes.values()].find(entry => nodeAnchor({ tree: entry.tree.key!, node: entry.node.index }) === anchor);
    if (row) selectNode({ tree: row.tree.key!, node: row.node.index });
  }
  async function action(operation: () => Promise<MutationResult>, success: string) {
    if (busy) return; busy = true;
    try { const result = await operation(); message = result.reason ?? (result.ok ? `${success}${result.persisted ? '' : ' Not saved in this browser. Export to keep your characters.'}` : 'This change was not applied.'); }
    catch (cause) { message = cause instanceof Error ? cause.message : 'This change could not be applied.'; }
    finally { busy = false; }
  }
  async function edit(next: PlannerBuild) {
    if (busy || !build) return;
    if (isPreview) { preview!.edit(next); message = 'Preview updated. Saved characters are unchanged.'; return; }
    if (!active) return;
    const target = localDraft?.target ?? characters.capture(active.id, true);
    localDraft = { target, build: next }; busy = true;
    try { const result = await characters.replaceBuild(target, next); if (result.ok) localDraft = null; message = result.reason ?? 'Build updated.'; }
    catch (cause) { message = (cause as Error).message; }
    finally { busy = false; }
  }
  function rankEdit(direction: 'add' | 'remove') {
    if (!build || !evaluator || !selected) return;
    const result = direction === 'add' ? addTalentRank(evaluator, build, selected) : removeTalentRank(evaluator, build, selected);
    if (result.changed) void edit(result.build); else message = result.check.reasons.map(reason => reason.message).join(' ') || 'There is no purchased rank to remove.';
  }
  async function copyLink() {
    if (!build) return;
    if (isPreview) { const result = await preview!.copyLink(); message = result.message; return; }
    try { const result = await encodeBuildLink(build); if (result.status !== 'ok') { message = result.message; return; } await navigator.clipboard.writeText(new URL(`${base}${result.value}`, window.location.origin).href); message = 'Build link copied. Includes the complete build; names are not included.'; }
    catch { message = 'The link could not be copied. Check clipboard permissions and try again.'; }
  }
  function closePreview() {
    const url = new URL(window.location.href); url.hash = ''; url.searchParams.delete('build'); url.searchParams.delete('class');
    window.history.pushState(window.history.state, '', url); void preview?.navigate(url); setup = false; replacement = null;
  }
  afterNavigate(({ to }) => { if (preview && to) void preview.navigate(to.url); });
  onMount(() => {
    let disposed = false; let cleanup: (() => void) | undefined; let unsubscribe: (() => void) | undefined;
    void (async () => {
      try {
        const facts = await clientMapLoader()!.loadPlanner(data.identity);
        if (disposed) return; payload = facts; evaluator = createTalentEvaluator(facts);
        await initializeCharacters(); if (disposed) return;
        preview = createPlannerPreview(characters, { origin: window.location.origin, clipboard: () => navigator.clipboard, resolve: candidate => {
          const current = evaluator!.evaluate(candidate);
          return {
            catalogChanged: candidate.catalog !== facts.catalogId,
            unresolved: [
              ...(!facts.classes.some(row => row.key === candidate.class) ? [{ key: candidate.class, description: 'The unavailable class' }] : []),
              ...(!facts.races.some(row => row.key === candidate.race) ? [{ key: candidate.race, description: 'The unavailable race' }] : []),
              ...candidate.points.filter(point => !facts.pointTypes.some(row => row.key === point.type)).map(point => ({ key: point.type, description: 'An unavailable point total' })),
              ...current.unresolved.map(row => ({ key: talentNodeKey(row), description: 'An unavailable talent selection' })),
            ],
            unevaluated: [...(candidate.gear.length ? ['Gear choices are retained but not evaluated.'] : []), ...(candidate.party.members.length || candidate.party.role ? ['Party choices are retained but not evaluated.'] : [])],
          };
        } });
        unsubscribe = preview.subscribe(value => previewState = value); cleanup = bindPreviewNavigation(preview, window);
        await preview.navigate(new URL(window.location.href)); if (disposed) return;
        const url = new URL(window.location.href);
        const requested = facts.classes.find(row => row.key === url.searchParams.get('class'));
        if (requested && preview.snapshot().status === 'none') {
          const offer = facts.races.find(row => row.offeredClasses.some(choice => choice.key === requested.key));
          setupRace = offer?.key ?? ''; setupClass = requested.key!; setupLevel = $characters.collection.draft?.level ?? 1; setup = true;
        } else if (url.searchParams.has('new') || (!activeCharacter(characters.snapshot().collection) && preview.snapshot().status === 'none')) startSetup();
      } catch (cause) { loadError = `${cause instanceof Error ? cause.message : 'Planner data could not be loaded.'} Reload this page to use the current game data. Your characters are unchanged.`; }
    })();
    return () => { disposed = true; cleanup?.(); unsubscribe?.(); preview?.cancelNavigation(); };
  });
</script>
<svelte:window bind:innerWidth={viewportWidth} />

<SeoHead title="Character Planner | Afallon Compendium" description="Keep named characters in this browser, plan talent purchases in your own order, and share complete build previews." />
<PageShell registry={data.registry} release={data.release} crumbs={[{ label: 'Character Planner' }]} wide>
  <article class="planner">
    <DetailFrame answer={false} side={false}>
      <div slot="head"><TitleBlock name="Character Planner" typeLine="Character and Talent Planning" registry={data.registry} /></div>
      <p class="intro">Plan your own talent choices. Characters stay in this browser; shared builds open separately as previews.</p>
      <div class="feedback" role="status" aria-live="polite">{message || loadError || (payload ? '' : 'Opening the planner…')}</div>
      {#if previewState?.status === 'invalid' || previewState?.status === 'unsupported'}<SideCard title="Build Link Could Not Be Opened"><p>{previewState.message}</p><p>Saved characters and the active character have not changed. You can still edit locally and export a backup.</p><button type="button" on:click={closePreview}>Dismiss Link</button></SideCard>{/if}
      {#if payload && evaluator}
        <div class="top-actions"><button type="button" on:click={startSetup}>New Character</button><button type="button" disabled={!build} on:click={copyLink}>Copy Link</button><button type="button" aria-disabled={busy} on:click={() => { if (busy) return; if (isPreview) { preview?.undo(); message = 'Preview edit undone.'; } else void action(() => characters.undo(), 'Last character edit undone.'); }}>Undo</button><a class="c-link" href="#help">Planner Help</a></div>
        {#if setup}
          <SideCard title="New Character">
            <p>Choose a name, race, class and level. Creating a character makes it active; browsing this setup changes nothing.</p>
            <form class="setup" on:submit|preventDefault={() => void action(async () => { const result = await characters.newCharacter(setupName, newBuild(payload!, setupRace, setupClass, setupLevel)); if (result.ok) { setup = false; editName = ''; closePreview(); } return result; }, 'Character created.')}>
              <label>Name<input required maxlength="80" bind:value={setupName} autocomplete="off" /></label>
              <label>Race<select aria-label="Race" bind:value={setupRace}>{#each payload.races as option}<option value={option.key}>{option.name}</option>{/each}</select></label>
              <label>Class<select aria-label="Class" bind:value={setupClass}>{#each offeredClasses as option}<option value={option.key}>{option.name}</option>{/each}</select></label>
              <LevelControl id="setup-level" label="Character Level" min={setupBounds.min} max={setupBounds.max} level={setupLevel} onSelect={value => setupLevel = value ?? setupBounds.min} />
              <div class="form-actions"><button type="submit" disabled={busy}>Create Character</button>{#if build}<button type="button" on:click={() => setup = false}>Cancel Setup</button>{/if}</div>
            </form>
          </SideCard>
        {/if}
        {#if build && evaluation && scope}
          <div class="workspace">
            <aside class="summary">
              <SideCard title={isPreview ? 'Build Preview' : active?.name ?? 'Character'}>
                <p class="identity">{#if characterClass}<EntityLink ref={identityRef(characterClass)} registry={data.registry} />{:else}Class not available{/if} · {race?.name ?? 'Race not available'} · Level {build.level}</p>
                {#if isPreview}<p>This preview is separate from your characters. Editing or copying it saves nothing.</p><button type="button" on:click={closePreview}>Return to Active Character</button>{:else}<p class="persistence">{$characters.persistence.message}</p>{/if}
                {#if isPreview && ($characters.persistence.kind === 'not-saved' || $characters.persistence.kind === 'conflict')}<p class="persistence">{$characters.persistence.message}</p>{/if}
                {#if build.catalog !== payload.catalogId}<p>This build uses different game data. Checks use current data; unavailable choices and source data are kept.</p>{/if}
                {#each evaluation.balances as balance}
                  <div class="balance"><h3>{balance.name}</h3><p>{balance.total ?? 'Not Verified'} total · {balance.provenance === 'entered' ? 'Entered by you' : balance.provenance === 'base-level' ? 'From your level' : 'Source not verified'}</p><p>{balance.spent ?? 'Not Verified'} spent · {balance.remaining === null ? 'Remaining not verified' : `${balance.remaining} remaining`}</p>{#if balance.shortfall}<p>{balance.shortfall} {balance.name} shortfall. Selected ranks are kept.</p>{/if}</div>
                {/each}
                <p>Level grants are a base plan budget, not all points earned in the game.</p>
                {#if evaluation.status !== 'verified'}<p>{statusText(evaluation.status)}: inspect selected ranks for missing evidence or blocked requirements.</p>{/if}
                {#if localDraft}<p>Your conflicting draft is still open and included in export. Other tabs' saved edits have not been overwritten.</p>{/if}
              </SideCard>
            </aside>
            <div class="editor">
              <TabSet tabs={[{ key: 'character', label: 'Character', anchors: [] }, { key: 'talents', label: 'Talents', anchors: [] }]} label="Planner Views" idPrefix="planner" param="workspace" let:key>
                {#if key === 'character'}
                  <div class="character-view">
                    <SideCard title="Character">
                      <LevelControl id="build-level" label="Character Level" min={characterClass?.levels?.min ?? 1} max={characterClass?.levels?.max ?? 60} level={build.level} onSelect={value => { if (value !== build?.level) void edit({ ...build!, level: value ?? 1 }); }} />
                      <div class="identity-edit"><label>Race<select aria-label="Race" value={build.race} on:change={event => void edit({ ...build!, race: event.currentTarget.value })}>{#each payload.races.filter(row => row.offeredClasses.some(offer => offer.key === build?.class)) as option}<option value={option.key}>{option.name}</option>{/each}</select></label><p>Class: {characterClass?.name ?? 'Not available'}. Use New Character for another class so this plan stays intact.</p></div>
                      <h3>Entered Point Totals</h3><p>Enter a complete total for one point type, not an amount to add. Leave it blank to use a verified base level grant where available; other totals remain Not Verified.</p>
                      {#each evaluation.balances.filter(row => row.type !== null) as balance}<label>{balance.name}<input type="number" min="0" step="1" inputmode="numeric" value={build.points.find(row => row.type === balance.type)?.total ?? ''} placeholder="Not entered" on:change={event => { const text = event.currentTarget.value; const total = Number(text); if (text && (!Number.isSafeInteger(total) || total < 0)) { message = 'Enter a nonnegative whole point total.'; return; } void edit({ ...build!, points: [...build!.points.filter(row => row.type !== balance.type), ...(text ? [{ type: balance.type!, total }] : [])] }); }} /></label>{/each}
                      {#if build.gear.length || build.party.members.length || build.party.role}<p>Gear and party choices are kept in this build and its links but are not evaluated here.</p>{/if}
                    </SideCard>
                    {#if !isPreview && active}<SideCard title="Manage Characters">
                      <label>Active Character<select aria-label="Active Character" value={active.id} on:change={event => { localDraft = null; editName = ''; void action(() => characters.switchActive(event.currentTarget.value), 'Active character changed. Builds are unchanged.'); }}>{#each $characters.collection.characters as character}<option value={character.id}>{character.name} · Level {character.build.level}</option>{/each}</select></label>
                      <label>Name<input bind:value={editName} maxlength="80" /></label>
                      <div class="form-actions">
                        <button type="button" aria-disabled={busy} on:click={() => void action(() => characters.rename(characters.capture(active!.id), editName), 'Character renamed.')}>Rename</button>
                        <button type="button" aria-disabled={busy} on:click={() => void action(() => characters.duplicate(characters.capture(active!.id), `${active!.name} Copy`), 'Complete build duplicated. The copy is now active.')}>Duplicate</button>
                        <button type="button" aria-disabled={busy} on:click={() => { if (busy) return; deleteTarget = characters.capture(active!.id); survivor = ''; }}>Delete Character</button>
                      </div>
                      {#if deleteTarget}<p>Delete {deleteTarget.character.name}? Undo can restore this character and the previous active selection.</p>{#if $characters.collection.characters.length > 1}<label>Surviving Active Character<select aria-label="Surviving Active Character" bind:value={survivor}><option value="">Choose a surviving character</option>{#each $characters.collection.characters.filter(row => row.id !== deleteTarget?.id) as character}<option value={character.id}>{character.name}</option>{/each}</select></label>{/if}<div class="form-actions"><button type="button" disabled={busy || ($characters.collection.characters.length > 1 && !survivor)} on:click={() => void action(async () => { const result = await characters.deleteCharacter(deleteTarget!, survivor || null); if (result.ok) { deleteTarget = null; editName = ''; } return result; }, 'Character deleted. Undo restores it.')}>Confirm Delete</button><button type="button" on:click={() => deleteTarget = null}>Cancel Delete</button></div>{/if}
                    </SideCard>{/if}
                    <CharacterTransfer {payload} onMessage={value => message = value} />
                  </div>
                {:else}
                  <div class="talent-view">
                    <div class="talent-controls">
                      <label>Tree<select aria-label="Tree" bind:value={selectedTree}>{#each scope.trees as option}<option value={option.key}>{option.name}</option>{/each}</select></label>
                      <button type="button" aria-disabled={busy || !selectedTree} on:click={() => { if (selectedTree) void edit(resetTalentTree(evaluator!, build!, selectedTree).build); }}>Reset Tree</button>
                      <button type="button" on:click={() => confirmReset = true}>Reset Build</button>
                    </div>
                    {#if tree}<p class="tree-balance">{tree.name} spends {payload.pointTypes.find(row => row.key === tree?.pointType)?.name ?? 'a point type not verified'}. {evaluation.balances.find(row => row.type === tree?.pointType)?.remaining === null ? 'Remaining not verified.' : `${evaluation.balances.find(row => row.type === tree?.pointType)?.remaining ?? 'Not Verified'} remaining.`}</p>{/if}
                    {#if confirmReset}<SideCard title="Reset This Build?">
                      <p>Remove purchased talents, entered point totals and retained gear and party choices. Name, race, class, level and source data stay. Undo restores the previous build.</p>
                      <div class="form-actions">
                        <button type="button" aria-disabled={busy} on:click={() => void edit(resetTalentBuild(evaluator!, build!).build)}>Confirm Reset Build</button>
                        <button type="button" on:click={() => confirmReset = false}>Close Confirmation</button>
                      </div>
                    </SideCard>{/if}
                    <details class="level-view"><summary>Earliest With Base Talent Points</summary><label class="check"><input type="checkbox" bind:checked={earliest} /> Show the ordered prefix at this level</label><LevelControl id="earliest-level" label="Projection Level" min={characterClass?.levels?.min ?? 1} max={characterClass?.levels?.max ?? 60} level={viewLevel} onSelect={value => viewLevel = value ?? 1} /><p>This is the earliest affordable prefix of your chosen order using base Talent Points, free starting ranks and purchase requirements. A blocked or unknown earlier choice stops later purchases. Entered totals are not projected backwards. Heroic ranks have no purchase level. This is not your character's history.</p>{#if build.talents.kind === 'unknown-order'}<p>Order is unknown for this snapshot. Final ranks stay visible; no level history is invented.</p>{/if}</details>
                    <div class="talent-centre">
                      <div class="tree-view"><TabSet tabs={[{ key: 'web', label: 'Web', anchors: [] }, { key: 'list', label: 'List', anchors: [] }]} label="Talent View" idPrefix="planner-tree" param="talent-view" let:key={treeView}>
                        {#if treeView === 'web' && drawing?.web.wedges.length}<TalentWeb web={drawing.web} trees={drawing.trees} registry={data.registry} selectedAnchor={selected ? nodeAnchor(selected) : ''} onSelect={selectAnchor} rankLabels={ranks} {highlighted} showDetail={false} />
                        {:else if tree}<RelationTable {columns} rows={tree.nodes} label={tree.name}><svelte:fragment slot="cell" let:row let:column>{#if column === 'talent'}<button type="button" class="talent-name" class:related={highlighted?.has(nodeAnchor({ tree: tree!.key!, node: row.index }))} on:click={() => selectNode({ tree: tree!.key!, node: row.index })}>{row.target.name}</button>{:else}{ranks.get(nodeAnchor({ tree: tree!.key!, node: row.index })) ?? row.defaultRank ?? 'Not Verified'} / {row.rankLimit ?? 'Not Verified'}{/if}</svelte:fragment></RelationTable>{/if}
                      </TabSet></div>
                      {#if viewportWidth <= 1000}<div class="inspector inline"><TalentInspector {evaluator} {build} {selected} registry={data.registry} {busy} previewMode={Boolean(isPreview || localDraft)} add={() => rankEdit('add')} remove={() => rankEdit('remove')} /></div>{/if}
                      <div class="ledger"><SideCard title="Allocation Order">
                        {#if build.talents.kind === 'ordered'}
                          <p>Talent Point purchases stay in the order you chose, including zero-cost ranks. Free starting ranks are not purchases.</p>
                          <ol>{#each levelPlan?.purchases ?? [] as purchase}
                            <li>
                              <button type="button" on:click={() => selectNode(purchase)}>{scope.nodes.get(talentNodeKey(purchase))?.node.target.name ?? 'Unavailable talent'}</button>
                              <small>Rank {purchase.rank ?? 'not verified'} · {purchase.cost === null ? 'Cost not verified' : `${purchase.cost} ${purchase.cost === 1 ? 'point' : 'points'}`} · {purchase.earliestLevel === null ? statusText(purchase.status) : `Earliest level ${purchase.earliestLevel}`}{purchase.stoppedByOrdinal !== null ? ' · Earlier choice stops this purchase' : ''}</small>
                            </li>
                          {/each}</ol>
                          {#if !build.talents.purchases.length}<p>No purchases yet. Select a talent to add its next verified rank.</p>{/if}
                        {:else}
                          <p>Purchase order is unknown. This snapshot retains final ranks without invented history.</p>
                          <ul>{#each build.talents.ranks as row}<li><button type="button" on:click={() => selectNode(row)}>{scope.nodes.get(talentNodeKey(row))?.node.target.name ?? 'Unavailable talent'}</button> · Rank {row.rank}</li>{/each}</ul>
                        {/if}
                        {#if build.heroic.length}<h3>Heroic Final Ranks</h3><ul>{#each build.heroic as row}<li><button type="button" on:click={() => selectNode(row)}>{scope.nodes.get(talentNodeKey(row))?.node.target.name ?? 'Unavailable talent'}</button> · Rank {row.rank}</li>{/each}</ul><p>Heroic Essence is not earned from character levels.</p>{/if}
                      </SideCard></div>
                    </div>
                  </div>
                {/if}
              </TabSet>
            </div>
            {#if viewportWidth > 1000}<aside class="inspector"><TalentInspector {evaluator} {build} {selected} registry={data.registry} {busy} previewMode={Boolean(isPreview || localDraft)} add={() => rankEdit('add')} remove={() => rankEdit('remove')} /></aside>{/if}
          </div>
          {#if isPreview}<div class="adoption"><SideCard title="Keep This Preview">
            {#if previewState?.message}<p>{previewState.message}</p>{/if}{#each previewState?.resolution?.unevaluated ?? [] as line}<p>{line}</p>{/each}{#if previewState?.resolution?.unresolved.length}<p>Unavailable selections are kept when saving and copying. The complete link omits nothing; removing a choice deliberately changes the build.</p>{/if}
            <label>New Character Name<input bind:value={adoptionName} maxlength="80" /></label><div class="form-actions"><button type="button" disabled={busy || !adoptionName.trim()} on:click={() => void action(() => preview!.saveAsNew(adoptionName), 'Preview added as a new character. The existing active selection is unchanged.')}>Save as New Character</button><button type="button" disabled={busy} on:click={() => void action(() => preview!.undoAdoption(), 'Preview adoption undone.')}>Undo Adoption</button></div>
            {#if $characters.collection.characters.length}<label>Character to Replace<select aria-label="Character to Replace" value={replacement?.target.id ?? ''} on:change={event => replacement = event.currentTarget.value ? preview!.captureReplacement(event.currentTarget.value) : null}><option value="">Choose a character</option>{#each $characters.collection.characters as character}<option value={character.id}>{character.name}</option>{/each}</select></label>{#if replacement}<p>This replaces {replacement.target.character.name}'s complete build, even if the active character changes later. Undo Adoption restores it.</p><div class="form-actions"><button type="button" disabled={busy} on:click={() => void action(() => preview!.replace(replacement!.target), `${replacement!.target.character.name}'s build replaced.`)}>{replacement.label}</button><button type="button" on:click={() => replacement = null}>Cancel Replacement</button></div>{/if}{/if}
          </SideCard></div>{/if}
        {:else if !setup}<p>Choose New Character to begin, or open a shared build link.</p><CharacterTransfer {payload} onMessage={value => message = value} />{/if}
      {/if}
      <PlannerHelp />
    </DetailFrame>
  </article>
</PageShell>

<style>
  .planner { min-width: 0; overflow-anchor: none; } .intro { margin: 0; color: var(--c-text-dim); line-height: 1.6; }
  .feedback { min-height: 3rem; padding: .5rem 0; color: var(--c-text-dim); line-height: 1.5; }
  .top-actions, .form-actions, .talent-controls { display: flex; flex-wrap: wrap; align-items: center; gap: .6rem; }
  .top-actions { margin-bottom: 1.25rem; } .top-actions a { margin-left: auto; }
  button { min-height: 44px; padding: .5rem .75rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-2); color: var(--c-text-strong); font: inherit; cursor: pointer; }
  button:hover { border-color: var(--c-accent); } button:disabled { opacity: .5; cursor: default; }
  label { display: grid; gap: .4rem; color: var(--c-text-strong); font-size: var(--c-text-body); }
  input:not([type='checkbox']), select { min-width: 0; max-width: 100%; width: 100%; min-height: 44px; padding: .5rem .65rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text-strong); font: inherit; }
  input[type='number'] { appearance: textfield; } input::-webkit-inner-spin-button { appearance: none; }
  .setup { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; } .setup :global(.level-control), .setup .form-actions { grid-column: 1 / -1; }
  .workspace { display: grid; grid-template-columns: minmax(11rem, .85fr) minmax(0, 3.5fr) minmax(14rem, 1.1fr); gap: 1.25rem; align-items: start; margin-top: 1.25rem; }
  .workspace > * { min-width: 0; } .summary { position: sticky; top: 6rem; }
  .identity { color: var(--c-text-strong); } h3 { margin: 0; font: 600 1rem/1.4 var(--c-serif); color: var(--c-text-strong); }
  .balance { display: grid; gap: .3rem; padding-top: .8rem; border-top: 1px solid var(--c-line-soft); font-variant-numeric: tabular-nums; }
  .character-view, .talent-view { display: grid; gap: 1rem; } .identity-edit { display: grid; gap: .8rem; }
  .talent-controls label { flex: 1 1 10rem; } .tree-balance { color: var(--c-text-dim); margin: 0; line-height: 1.5; }
  .talent-centre { display: grid; grid-template-columns: minmax(0, 1fr) minmax(10rem, .42fr); gap: 1rem; align-items: start; }
  .tree-view, .ledger { min-width: 0; } .ledger ol, .ledger ul { margin: 0; padding-left: 1.2rem; display: grid; gap: .6rem; }
  .ledger li { padding-left: .1rem; } .ledger button, .talent-name { min-height: 44px; padding: .2rem 0; border: 0; background: none; color: var(--c-accent-strong); text-align: left; }
  .ledger small { display: block; color: var(--c-text-dim); font-size: var(--c-text-small); line-height: 1.5; }
  .talent-name.related { color: var(--c-accent-strong); background: var(--c-tint-hover); }
  .level-view { padding: .8rem 1rem; border: 1px solid var(--c-line-soft); border-radius: var(--c-radius); background: var(--c-surface-1); }
  summary { cursor: pointer; color: var(--c-text-strong); font-weight: 600; } .level-view p { line-height: 1.6; color: var(--c-text-dim); }
  .check { display: flex; align-items: center; gap: .6rem; min-height: 44px; margin: .6rem 0; }
  .adoption { margin-top: 1.5rem; max-width: 48rem; margin-left: auto; margin-right: auto; }
  @media (max-width: 1190px) { .workspace { grid-template-columns: 11rem minmax(0, 1fr) 14rem; gap: 1rem; } .talent-centre { grid-template-columns: minmax(0, 1fr) 10rem; gap: .7rem; } }
  @media (max-width: 1000px) { .workspace, .talent-centre { grid-template-columns: minmax(0, 1fr); } .summary { position: static; } .summary :global(.side-card) { grid-template-columns: repeat(2, minmax(0, 1fr)); } .summary :global(.side-card > h2), .summary :global(.side-card > p), .summary :global(.side-card > button) { grid-column: 1 / -1; } }
  @media (max-width: 600px) { .setup { grid-template-columns: minmax(0, 1fr); } .top-actions a { margin-left: 0; } .workspace { gap: 1rem; } }
</style>
