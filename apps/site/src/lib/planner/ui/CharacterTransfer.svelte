<script lang="ts">
  import type { StaticPlanner } from '@afallon/contracts/public';
  import { characters } from '../characters-store';
  import { CHARACTER_EXPORT_FILENAME, createCharacterImport, exportCharacters, type CharacterImport, type ImportActiveChoice, type ImportChoice, type ImportPlan } from '../export';
  import SideCard from '../../detail/SideCard.svelte';
  export let onMessage: (message: string) => void;
  export let payload: StaticPlanner;
  let session: CharacterImport | null = null;
  let choices: ImportChoice[] = [];
  let active = '';
  let plan: ImportPlan | null = null;
  let error = '';
  let busy = false;
  function download() {
    const url = URL.createObjectURL(new Blob([exportCharacters(characters.snapshot())], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = CHARACTER_EXPORT_FILENAME; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    onMessage('All characters exported, including unsaved edits and preserved conflicting drafts.');
  }
  async function openFile(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0]; if (!file) return;
    session?.cancel(); session = null; error = ''; plan = null; active = '';
    try { session = createCharacterImport(await file.text(), characters); choices = session.preview.rows.map(row => ({ id: row.incoming.id, action: 'skip' })); }
    catch (cause) { error = cause instanceof Error ? cause.message : 'This character file could not be read.'; }
    input.value = '';
  }
  function activeChoice(): ImportActiveChoice {
    if (active === 'none') return { kind: 'none' };
    const [kind, ...id] = active.split(':');
    if (kind !== 'local' && kind !== 'incoming') throw new Error('Choose the resulting active character.');
    return { kind, id: id.join(':') };
  }
  function review() {
    plan = null; error = '';
    try { plan = session!.plan(choices, activeChoice()); } catch (cause) { error = (cause as Error).message; }
  }
  async function apply() {
    busy = true;
    try { const result = await session!.apply(choices, activeChoice()); onMessage(result.reason ?? `Character import applied. Undo restores the previous collection.${result.persisted ? '' : ' Not saved in this browser. Export to keep your characters.'}`); session = null; plan = null; }
    catch (cause) { error = (cause as Error).message; }
    finally { busy = false; }
  }
</script>
<SideCard title="Backup and Import">
  <p>Characters live in this browser only. Export keeps all characters, names, complete builds and unsaved drafts. Keep a backup before clearing browser data.</p>
  <div class="actions"><button type="button" on:click={download}>Export All Characters</button><label class="file">Import Characters<input type="file" accept="application/json,.json" on:change={openFile} /></label></div>
  <p>The file is read here, not uploaded or executed. Nothing changes until you review and confirm the import.</p>
  {#if error}<p role="alert">{error}</p>{/if}
  {#if session}
    <h3>Import Preview</h3>
    <div class="rows">{#each session.preview.rows as row, index}
      <div class="row"><strong>{row.incoming.name}</strong><p>{payload.classes.find(option => option.key === row.incoming.build.class)?.name ?? 'Class not available'} · {payload.races.find(option => option.key === row.incoming.build.race)?.name ?? 'Race not available'} · Level {row.incoming.build.level} · {row.kind === 'collision' ? `Matches ${row.local?.name} in this browser` : 'New character'}</p>
        <label>Action<select aria-label="Action" bind:value={choices[index]!.action} on:change={() => plan = null}><option value="skip">Skip</option>{#if row.local}<option value="duplicate">Add as a Separate Character</option><option value="replace">Replace {row.local.name}</option>{:else}<option value="add">Add Character</option>{/if}</select></label>
        {#if row.local}
          <p>Replacement changes the complete build. Level {row.local.build.level} → {row.incoming.build.level}.</p>
          <ul>{#each [{ key: 'catalog', label: 'Source game data' }, { key: 'class', label: 'Class' }, { key: 'race', label: 'Race' }, { key: 'points', label: 'Entered point totals' }, { key: 'talents', label: 'Talent ranks and order' }, { key: 'heroic', label: 'Heroic ranks' }, { key: 'gear', label: 'Gear choices' }, { key: 'party', label: 'Party choices' }] as field}
            <li>{field.label}: {JSON.stringify(row.local.build[field.key as keyof typeof row.local.build]) === JSON.stringify(row.incoming.build[field.key as keyof typeof row.incoming.build]) ? 'unchanged' : 'changed'}</li>
          {/each}</ul>
          {#if row.local.name !== row.incoming.name}<p>Name: {row.local.name} → {row.incoming.name}.</p>{/if}
        {/if}
      </div>
    {/each}</div>
    <label>Active Character After Import<select aria-label="Active Character After Import" bind:value={active} on:change={() => plan = null}><option value="">Choose a character</option>{#each $characters.collection.characters as character}<option value={`local:${character.id}`}>Keep {character.name}</option>{/each}{#each session.preview.rows as row}<option value={`incoming:${row.incoming.id}`}>Use {row.incoming.name} from the file</option>{/each}{#if !$characters.collection.characters.length && choices.every(choice => choice.action === 'skip')}<option value="none">No Characters</option>{/if}</select></label>
    {#if session.preview.preserved.length}<p>{session.preview.preserved.length} preserved draft collections will remain in backups, not become active characters.</p>{/if}
    <div class="actions"><button type="button" on:click={review}>Review Changes</button><button type="button" on:click={() => { session?.cancel(); session = null; plan = null; }}>Cancel Import</button></div>
    {#if plan}<p>{plan.additions.length} additions · {plan.replacements.length} replacements · {plan.skipped.length} skipped. Active character: {plan.activeName ?? 'none'}.</p><button type="button" disabled={busy} on:click={apply}>Confirm Import</button>{/if}
  {/if}
</SideCard>
<style>
  .actions { display: flex; flex-wrap: wrap; gap: .6rem; }
  button, .file { min-height: 44px; padding: .5rem .75rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); color: var(--c-text-strong); background: var(--c-surface-2); font: inherit; cursor: pointer; display: inline-flex; align-items: center; }
  .file { position: relative; } .file input { position: absolute; inset: 0; width: 100%; opacity: 0; cursor: pointer; }
  .file:focus-within { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  label { display: grid; gap: .4rem; color: var(--c-text-strong); }
  select { width: 100%; max-width: 100%; min-height: 44px; padding: .5rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text-strong); font: inherit; }
  h3 { margin: 0; font: 600 1.1rem var(--c-serif); }
  .rows { display: grid; gap: .75rem; } .row { display: grid; gap: .5rem; padding: .75rem 0; border-bottom: 1px solid var(--c-line-soft); }
</style>
