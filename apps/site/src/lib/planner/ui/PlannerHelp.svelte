<script lang="ts">
  import Section from '../../detail/Section.svelte';
  import { BUILD_LINK_CONTENTS } from '../preview';
</script>
<div class="help">
  <Section id="help" title="Planner Help">
    <div class="help-grid">
      <div>
        <h3>Characters in This Browser</h3>
        <p>New Character makes a separate named build and selects it. Duplicate copies the complete build so edits to the copy do not change the original. Rename changes only the name. Delete asks which surviving character should be active; Undo restores the deleted character and previous selection.</p>
        <p>The header chooses the active character for reference comparisons. Switching edits neither build. Reference pages use the active level; without a character they use a classless comparison level. Skill levels remain independent.</p>
        <p>A previously remembered comparison level becomes the starting level for setup. Opening pages or shared links only reads it. The first explicit character change attempts to save the new state; the old comparison setting is removed only after saving succeeds.</p>
      </div>
      <div>
        <h3>Saving and Backups</h3>
        <p>“Saved in this browser” means that revision was successfully written. If storage or safe cross-tab saving is unavailable, edits remain usable in this tab but are not saved. Export includes those edits. Conflicts preserve your draft rather than overwrite another tab.</p>
        <p>Export before clearing browser data. Import previews the whole file and requires replacement and active-character choices. Files are read in this browser, not uploaded or executed.</p>
      </div>
      <div>
        <h3>Talents and Evidence</h3>
        <p>Selected ranks and next-rank previews are separate. Blocked means a known check failed; Not Verified means evidence or an input is missing. Point types never share balances. Lower levels, lower totals and removed prerequisites keep your choices visible with their reasons.</p>
        <p>Undo reverses the last edit. Reset Tree affects only that tree, while Reset Build asks for confirmation. These actions edit your plan; they do not simulate in-game refunds.</p>
        <p>Allocation Order is your chosen plan, not a game history. Earliest With Base Talent Points uses only verified base level grants and stops at the first blocked or unknown purchase. Heroic allocations stay as final ranks without levels.</p>
      </div>
      <div>
        <h3>Previews and Links</h3>
        <p>Opening, editing or copying a preview changes no saved character. Save as New Character does not change an existing active selection. Replacement names and captures its target and can be undone. Unavailable selections and old data provenance stay in the build.</p>
        <p>{BUILD_LINK_CONTENTS}</p>
        <p>Links use <code>/planner/#build=…</code>. Browsers without raw-deflate support can still edit and export; an explained error replaces unsupported sharing.</p>
      </div>
      <div>
        <h3>Reference Context</h3>
        <p>Weapon cues use only published class weapon types; armor has no class restriction. An ability's class learning relation does not prove your character knows it. Heroic Gear Score stays unavailable until equipment inputs are verified. The planner gives no rankings or recommendations.</p>
      </div>
    </div>
  </Section>
</div>
<style>
  .help { margin-top: 2.5rem; }
  .help-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem 2rem; }
  h3 { margin: 0; color: var(--c-text-strong); font: 600 1rem/1.4 var(--c-serif); }
  p { color: var(--c-text-dim); line-height: 1.65; margin: .65rem 0 0; }
  @media (max-width: 600px) { .help-grid { grid-template-columns: minmax(0, 1fr); } }
</style>
