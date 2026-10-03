<script lang="ts">
  import { onDestroy } from 'svelte';
  import { clearReaderLevel, readerLevels, setReaderLevel } from '../reader-levels';

  export let id: string;
  export let label: string;
  export let min: number;
  export let max: number;
  export let level: number | undefined = undefined;
  export let fallback: number | undefined = undefined;
  export let readerId: string | undefined = undefined;
  export let slider = true;
  export let sliderMax: number | undefined = undefined;
  export let optional = false;
  export let allowFraction = false;
  export let suffix: string | undefined = undefined;
  export let onSelect: ((value: number | undefined) => void) | undefined = undefined;
  export let valueText: ((value: number) => string) | undefined = undefined;

  let numberInput: HTMLInputElement;
  let repeatDelay: ReturnType<typeof setTimeout> | undefined;
  let repeatTimer: ReturnType<typeof setInterval> | undefined;
  let pointerHandled = false;

  function bounded(value: number): number {
    const safe = Number.isNaN(value) ? (Number.isFinite(level) ? level! : Number.isFinite(fallback) ? fallback! : min) : value;
    return Math.max(min, Math.min(max, allowFraction ? safe : Math.round(safe)));
  }

  $: if (readerId) level = optional && $readerLevels[readerId] === undefined ? undefined : bounded($readerLevels[readerId] ?? fallback ?? min);
  $: shown = level === undefined ? undefined : bounded(level);

  function select(value: number | undefined): void {
    if (value === undefined && optional) {
      level = undefined;
      if (readerId) clearReaderLevel(readerId);
      onSelect?.(undefined);
      return;
    }
    const next = bounded(value ?? fallback ?? min);
    level = next;
    if (readerId) setReaderLevel(readerId, next);
    onSelect?.(next);
  }

  function commitInput(): void {
    const text = numberInput.value.trim();
    select(text === '' && optional ? undefined : bounded(Number(text === '' ? NaN : text)));
    numberInput.value = String(level ?? '');
  }

  function typeInput(): void {
    const text = numberInput.value.trim();
    if (text === '' && optional) { select(undefined); return; }
    if (/^\d+(?:\.\d+)?$/.test(text)) {
      const next = Number(text);
      if (next >= min && next <= max && (allowFraction || Number.isInteger(next))) select(next);
    }
  }

  function keydown(event: KeyboardEvent): void {
    const current = shown ?? min;
    const next = event.key === 'ArrowUp' || event.key === 'ArrowRight' ? current + 1
      : event.key === 'ArrowDown' || event.key === 'ArrowLeft' ? current - 1
      : event.key === 'PageUp' ? current + 10 : event.key === 'PageDown' ? current - 10
      : event.key === 'Home' ? min : event.key === 'End' ? max : undefined;
    if (next !== undefined) {
      event.preventDefault();
      select(next);
      if (event.currentTarget === numberInput) numberInput.value = String(level);
    } else if (event.key === 'Enter' && event.currentTarget === numberInput) {
      event.preventDefault();
      commitInput();
    }
  }

  function stopRepeat(): void {
    if (repeatDelay) clearTimeout(repeatDelay);
    if (repeatTimer) clearInterval(repeatTimer);
    repeatDelay = undefined;
    repeatTimer = undefined;
  }

  function press(event: PointerEvent, delta: number): void {
    if (event.button !== 0) return;
    pointerHandled = true;
    select((shown ?? (delta > 0 ? min - 1 : max + 1)) + delta);
    stopRepeat();
    repeatDelay = setTimeout(() => { repeatTimer = setInterval(() => select((level ?? min) + delta), 85); }, 380);
  }
  function buttonSubject(label: string): string {
    if (label === 'From') return 'starting corruption level';
    if (label === 'To') return 'target corruption level';
    const subject = label.startsWith('Your ') ? label.slice(5) : label;
    return /^(Character|Creature|Corruption|Living|Experience|Skill) /.test(subject)
      ? subject[0]!.toLowerCase() + subject.slice(1) : subject;
  }

  $: buttonNoun = buttonSubject(label);
  onDestroy(stopRepeat);
</script>

<div class="level-control" class:compact={!slider}>
  <label for={id}>{label}</label>
  <div class="stepper">
    <button type="button" aria-label={`Lower ${buttonNoun}`} disabled={shown !== undefined && shown <= min} on:pointerdown={(event) => press(event, -1)} on:pointerup={stopRepeat} on:pointercancel={stopRepeat} on:pointerleave={stopRepeat} on:click={() => { if (!pointerHandled) select((shown ?? max + 1) - 1); pointerHandled = false; }}>−</button>
    {#if shown !== undefined && valueText?.(shown).startsWith('+')}<span class="prefix" aria-hidden="true">+</span>{/if}
    <input bind:this={numberInput} {id} type="number" inputmode={allowFraction ? 'decimal' : 'numeric'} {min} {max} step={allowFraction ? 'any' : '1'} value={shown ?? ''} placeholder={optional ? 'Any' : undefined} aria-label={label} aria-valuetext={shown === undefined ? undefined : valueText?.(shown) ?? (suffix ? `${shown}${suffix}` : undefined)} class:suffixed={suffix !== undefined} on:input={typeInput} on:change={commitInput} on:blur={commitInput} on:keydown={keydown} />
    {#if suffix}<span class="suffix" aria-hidden="true">{suffix}</span>{/if}
    <button type="button" aria-label={`Raise ${buttonNoun}`} disabled={shown !== undefined && shown >= max} on:pointerdown={(event) => press(event, 1)} on:pointerup={stopRepeat} on:pointercancel={stopRepeat} on:pointerleave={stopRepeat} on:click={() => { if (!pointerHandled) select((shown ?? min - 1) + 1); pointerHandled = false; }}>+</button>
  </div>
  {#if slider}
    <input class="slider" type="range" {min} max={sliderMax === undefined ? max : Math.max(sliderMax, shown ?? min)} step="1" value={shown ?? min} aria-label={`${label} slider`} aria-valuetext={shown === undefined ? undefined : valueText?.(shown) ?? (suffix ? `${shown}${suffix}` : undefined)} on:input={(event) => select(event.currentTarget.valueAsNumber)} on:keydown={keydown} />
  {/if}
</div>

<style>
  .level-control { display: grid; align-content: start; gap: .5rem; min-width: 0; max-width: 28rem; }
  label { color: var(--c-text-strong); font-weight: 600; }
  .stepper { display: flex; align-items: stretch; width: max-content; max-width: 100%; border: 1px solid var(--c-frame); border-radius: var(--c-radius-sm); background: var(--c-surface-sunken); overflow: hidden; }
  button { display: grid; place-items: center; flex: none; width: 2rem; min-height: 2rem; padding: 0; border: 0; background: transparent; color: var(--c-accent-strong); font: 600 1.2rem/1 var(--c-sans); cursor: pointer; touch-action: none; }
  button:hover:not(:disabled) { background: var(--c-accent-surface); }
  button:disabled { color: var(--c-text-mute); cursor: default; }
  button:focus-visible, input[type='number']:focus-visible { outline: 2px solid var(--c-accent); outline-offset: -2px; position: relative; z-index: 1; }
  input[type='number'] { box-sizing: border-box; width: 4.2rem; min-width: 0; padding: .3rem .2rem; border: 0; border-right: 1px solid var(--c-frame); border-left: 1px solid var(--c-frame); border-radius: 0; background: transparent; color: var(--c-text); font: inherit; font-variant-numeric: tabular-nums; text-align: center; appearance: textfield; -moz-appearance: textfield; }
  input[type='number'].suffixed { border-right: 0; }
  .suffix { display: grid; place-items: center; padding: 0 .3rem; border-right: 1px solid var(--c-frame); color: var(--c-text-dim); }
  .prefix { display: grid; place-items: center; padding-left: .55rem; border-left: 1px solid var(--c-frame); color: var(--c-text); }
  .prefix + input[type='number'] { width: 3.15rem; padding-left: 0; border-left: 0; text-align: left; }
  input[type='number']::-webkit-inner-spin-button, input[type='number']::-webkit-outer-spin-button { appearance: none; margin: 0; }
  .slider { box-sizing: border-box; width: 100%; min-width: 0; height: 1.5rem; margin: 0; accent-color: var(--c-accent); cursor: pointer; }
  .slider:focus-visible { outline: none; }
  .slider:focus-visible::-webkit-slider-thumb { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .slider:focus-visible::-moz-range-thumb { outline: 2px solid var(--c-accent); outline-offset: 2px; }
  .compact { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; font-size: var(--c-text-small); }
  @media (max-width: 600px) { button { width: 2.75rem; min-height: 2.75rem; } }
</style>
