<script lang="ts">
  export let id: string;
  export let label: string;
  export let min: number;
  export let max: number;
  export let level: number;
  export let readout: (level: number) => string = (value) => value.toLocaleString('en-US');
  export let valueText: ((level: number) => string) | undefined = undefined;
  /** Called with each level that the reader selects, for a level that the slider does not own. */
  export let onSelect: ((level: number) => void) | undefined = undefined;

  function select(value: number): void {
    if (!Number.isFinite(value)) return;
    level = Math.min(max, Math.max(min, Math.trunc(value)));
    onSelect?.(level);
  }
</script>

<div class="level-slider">
  <label for={id}>{label}: {readout(level)}</label>
  <div class="controls">
    <input {id} type="range" {min} {max} step="1" value={level} aria-valuetext={valueText?.(level)} on:input={(event) => select(event.currentTarget.valueAsNumber)} />
    <input class="level-number" type="number" {min} {max} step="1" value={level} aria-label={`${label} number`} on:change={(event) => { select(event.currentTarget.valueAsNumber); event.currentTarget.value = String(level); }} />
  </div>
</div>

<style>
  .level-slider { display: grid; gap: .6rem; min-width: 0; }
  label { color: var(--c-text-strong); font-weight: 600; }
  .controls { display: flex; align-items: center; gap: .75rem; min-width: 0; }
  .controls input[type='range'] { flex: 1; min-width: 0; accent-color: var(--c-accent); }
  .level-number { box-sizing: border-box; width: 5rem; padding: .35rem; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); color: var(--c-text); font: inherit; }
</style>
